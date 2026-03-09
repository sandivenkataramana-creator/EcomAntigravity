from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.cart import Cart, CartItem
from app.models.product import Product
from app.models.user import User
from app.schemas.cart import CartItemCreate, CartItemUpdate

router = APIRouter(prefix="/api/cart", tags=["Cart"])


def compute_cart(cart: Cart) -> dict:
    items_data = []
    subtotal = 0.0
    total_discount = 0.0

    for item in cart.items:
        p = item.product
        orig = p.price * item.quantity
        disc = p.discounted_price * item.quantity
        subtotal += orig
        total_discount += (orig - disc)
        items_data.append({
            "id": item.id,
            "product_id": p.id,
            "quantity": item.quantity,
            "product": {
                "id": p.id, "name": p.name, "slug": p.slug,
                "price": p.price, "discount_pct": p.discount_pct,
                "discounted_price": p.discounted_price,
                "images": p.images or [], "stock": p.stock,
                "brand": p.brand, "description": p.description,
                "specifications": p.specifications or {},
                "category_id": p.category_id, "rating_avg": p.rating_avg,
                "rating_count": p.rating_count, "is_active": p.is_active,
                "is_featured": p.is_featured, "created_at": p.created_at,
            },
            "added_at": item.added_at,
        })

    delivery = 0 if subtotal - total_discount >= 500 else 40
    return {
        "id": cart.id,
        "user_id": cart.user_id,
        "items": items_data,
        "total_items": sum(i.quantity for i in cart.items),
        "subtotal": round(float(subtotal), 2),
        "total_discount": round(float(total_discount), 2),
        "total_amount": round(float(subtotal - total_discount + delivery), 2),
    }


@router.get("")
def get_cart(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart:
        cart = Cart(user_id=current_user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return compute_cart(cart)


@router.post("/add")
def add_to_cart(data: CartItemCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == data.product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.stock < data.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")

    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart:
        cart = Cart(user_id=current_user.id)
        db.add(cart)
        db.flush()

    existing_item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id, CartItem.product_id == data.product_id
    ).first()

    if existing_item:
        existing_item.quantity += data.quantity
        if existing_item.quantity > product.stock:
            existing_item.quantity = product.stock
    else:
        item = CartItem(cart_id=cart.id, product_id=data.product_id, quantity=data.quantity)
        db.add(item)

    db.commit()
    db.refresh(cart)
    return compute_cart(cart)


@router.put("/item/{item_id}")
def update_cart_item(item_id: int, data: CartItemUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.cart_id == cart.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    if data.quantity <= 0:
        db.delete(item)
    else:
        item.quantity = min(data.quantity, item.product.stock)

    db.commit()
    db.refresh(cart)
    return compute_cart(cart)


@router.delete("/item/{item_id}")
def remove_cart_item(item_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.cart_id == cart.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    db.delete(item)
    db.commit()
    db.refresh(cart)
    return compute_cart(cart)


@router.delete("/clear")
def clear_cart(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if cart:
        for item in cart.items:
            db.delete(item)
        db.commit()
    return {"message": "Cart cleared"}
