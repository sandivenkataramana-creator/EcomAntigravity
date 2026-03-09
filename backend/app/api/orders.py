from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin
from app.models.order import Order, OrderItem, OrderStatus
from app.models.cart import Cart, CartItem
from app.models.address import Address
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderCreate, OrderStatusUpdate
import math

router = APIRouter(prefix="/api/orders", tags=["Orders"])


def build_order_response(order: Order) -> dict:
    items = []
    for item in order.items:
        items.append({
            "id": item.id,
            "product_id": item.product_id,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "discount_pct": item.discount_pct,
            "product_snapshot": item.product_snapshot,
        })
    return {
        "id": order.id,
        "user_id": order.user_id,
        "status": order.status,
        "payment_method": order.payment_method,
        "payment_status": order.payment_status,
        "total_amount": order.total_amount,
        "discount_amount": order.discount_amount,
        "delivery_charge": order.delivery_charge,
        "address_snapshot": order.address_snapshot,
        "notes": order.notes,
        "items": items,
        "created_at": order.created_at,
        "updated_at": order.updated_at,
    }


@router.post("", status_code=201)
def place_order(data: OrderCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    address = db.query(Address).filter(Address.id == data.address_id, Address.user_id == current_user.id).first()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    subtotal = 0.0
    total_discount = 0.0

    for item in cart.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product or product.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name if product else 'a product'}")
        subtotal += product.price * item.quantity
        total_discount += (product.price - product.discounted_price) * item.quantity

    delivery_charge = 0.0 if (subtotal - total_discount) >= 500 else 40.0
    total_amount = subtotal - total_discount + delivery_charge

    address_snapshot = {
        "full_name": address.full_name,
        "phone": address.phone,
        "street": address.street,
        "city": address.city,
        "state": address.state,
        "pincode": address.pincode,
        "address_type": address.address_type,
    }

    order = Order(
        user_id=current_user.id,
        payment_method=data.payment_method,
        total_amount=round(total_amount, 2),
        discount_amount=round(total_discount, 2),
        delivery_charge=delivery_charge,
        address_snapshot=address_snapshot,
        notes=data.notes,
        payment_status="paid" if data.payment_method != "cod" else "pending",
    )
    db.add(order)
    db.flush()

    for item in cart.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=item.quantity,
            unit_price=product.price,
            discount_pct=product.discount_pct,
            product_snapshot={"name": product.name, "image": (product.images or [None])[0], "brand": product.brand},
        )
        product.stock -= item.quantity
        db.add(order_item)

    # Clear cart
    for item in cart.items:
        db.delete(item)

    db.commit()
    db.refresh(order)
    return build_order_response(order)


@router.get("")
def list_orders(
    page: int = Query(1, ge=1),
    per_page: int = Query(10),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Order).filter(Order.user_id == current_user.id).order_by(Order.created_at.desc())
    total = query.count()
    orders = query.offset((page - 1) * per_page).limit(per_page).all()
    return {
        "orders": [build_order_response(o) for o in orders],
        "total": total, "page": page, "per_page": per_page,
    }


@router.get("/{order_id}")
def get_order(order_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == current_user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return build_order_response(order)


@router.post("/{order_id}/cancel")
def cancel_order(order_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == current_user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status not in [OrderStatus.pending, OrderStatus.confirmed]:
        raise HTTPException(status_code=400, detail="Order cannot be cancelled at this stage")

    order.status = OrderStatus.cancelled
    # Restore stock
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.stock += item.quantity

    db.commit()
    return build_order_response(order)


# Admin endpoints
@router.get("/admin/all")
def admin_list_orders(
    page: int = Query(1, ge=1),
    per_page: int = Query(20),
    status: str = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin)
):
    query = db.query(Order).order_by(Order.created_at.desc())
    if status:
        query = query.filter(Order.status == status)
    total = query.count()
    orders = query.offset((page - 1) * per_page).limit(per_page).all()
    return {"orders": [build_order_response(o) for o in orders], "total": total, "page": page, "per_page": per_page}


@router.put("/admin/{order_id}/status")
def update_order_status(order_id: int, data: OrderStatusUpdate, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = data.status
    db.commit()
    return build_order_response(order)
