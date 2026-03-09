from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin
from app.core.security import get_password_hash
from app.models.user import User
from app.models.address import Address
from app.models.review import Wishlist, WishlistItem
from app.models.product import Product
from app.schemas.user import UserUpdate, UserResponse
from app.schemas.address import AddressCreate, AddressUpdate
from typing import List

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
def update_profile(data: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


# Addresses
@router.get("/me/addresses")
def get_addresses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Address).filter(Address.user_id == current_user.id).all()


@router.post("/me/addresses", status_code=201)
def add_address(data: AddressCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if data.is_default:
        db.query(Address).filter(Address.user_id == current_user.id).update({"is_default": False})
    address = Address(user_id=current_user.id, **data.model_dump())
    db.add(address)
    db.commit()
    db.refresh(address)
    return address


@router.put("/me/addresses/{address_id}")
def update_address(address_id: int, data: AddressUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    address = db.query(Address).filter(Address.id == address_id, Address.user_id == current_user.id).first()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
    if data.is_default:
        db.query(Address).filter(Address.user_id == current_user.id).update({"is_default": False})
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(address, field, value)
    db.commit()
    db.refresh(address)
    return address


@router.delete("/me/addresses/{address_id}")
def delete_address(address_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    address = db.query(Address).filter(Address.id == address_id, Address.user_id == current_user.id).first()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
    db.delete(address)
    db.commit()
    return {"message": "Address deleted"}


# Wishlist
@router.get("/me/wishlist")
def get_wishlist(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    wishlist = db.query(Wishlist).filter(Wishlist.user_id == current_user.id).first()
    if not wishlist:
        wishlist = Wishlist(user_id=current_user.id)
        db.add(wishlist)
        db.commit()
        db.refresh(wishlist)
    items = []
    for item in wishlist.items:
        p = item.product
        items.append({
            "id": item.id,
            "product_id": p.id,
            "added_at": item.added_at,
            "product": {
                "id": p.id, "name": p.name, "slug": p.slug,
                "price": p.price, "discount_pct": p.discount_pct,
                "discounted_price": p.discounted_price,
                "images": p.images or [], "rating_avg": p.rating_avg,
                "brand": p.brand,
            }
        })
    return {"id": wishlist.id, "user_id": wishlist.user_id, "items": items}


@router.post("/me/wishlist/{product_id}")
def add_to_wishlist(product_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    wishlist = db.query(Wishlist).filter(Wishlist.user_id == current_user.id).first()
    if not wishlist:
        wishlist = Wishlist(user_id=current_user.id)
        db.add(wishlist)
        db.flush()
    existing = db.query(WishlistItem).filter(WishlistItem.wishlist_id == wishlist.id, WishlistItem.product_id == product_id).first()
    if not existing:
        db.add(WishlistItem(wishlist_id=wishlist.id, product_id=product_id))
        db.commit()
    return {"message": "Added to wishlist"}


@router.delete("/me/wishlist/{product_id}")
def remove_from_wishlist(product_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    wishlist = db.query(Wishlist).filter(Wishlist.user_id == current_user.id).first()
    if wishlist:
        item = db.query(WishlistItem).filter(WishlistItem.wishlist_id == wishlist.id, WishlistItem.product_id == product_id).first()
        if item:
            db.delete(item)
            db.commit()
    return {"message": "Removed from wishlist"}


# Admin: manage users
@router.get("/admin/all")
def admin_list_users(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    users = db.query(User).all()
    return users


@router.put("/admin/{user_id}/toggle-active")
def admin_toggle_user(user_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    db.commit()
    return {"message": f"User {'activated' if user.is_active else 'deactivated'}"}
