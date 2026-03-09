from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.review import Review
from app.models.product import Product
from app.models.user import User
from app.schemas.review import ReviewCreate
from typing import List

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])


@router.get("/product/{product_id}")
def get_product_reviews(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    reviews = db.query(Review).filter(Review.product_id == product_id).order_by(Review.created_at.desc()).all()
    result = []
    for r in reviews:
        result.append({
            "id": r.id,
            "product_id": r.product_id,
            "user_id": r.user_id,
            "rating": r.rating,
            "title": r.title,
            "comment": r.comment,
            "user_name": r.user.name if r.user else "Anonymous",
            "created_at": r.created_at,
        })
    return result


@router.post("/product/{product_id}")
def create_review(product_id: int, data: ReviewCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    existing = db.query(Review).filter(Review.product_id == product_id, Review.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this product")

    review = Review(
        product_id=product_id,
        user_id=current_user.id,
        rating=data.rating,
        title=data.title,
        comment=data.comment,
    )
    db.add(review)
    db.flush()

    # Recalculate product rating
    avg = db.query(func.avg(Review.rating)).filter(Review.product_id == product_id).scalar()
    count = db.query(func.count(Review.id)).filter(Review.product_id == product_id).scalar()
    product.rating_avg = round(float(avg), 2)
    product.rating_count = count

    db.commit()
    db.refresh(review)

    return {
        "id": review.id,
        "product_id": review.product_id,
        "user_id": review.user_id,
        "rating": review.rating,
        "title": review.title,
        "comment": review.comment,
        "user_name": current_user.name,
        "created_at": review.created_at,
    }


@router.delete("/{review_id}")
def delete_review(review_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    review = db.query(Review).filter(Review.id == review_id, Review.user_id == current_user.id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    product_id = review.product_id
    db.delete(review)
    db.flush()

    product = db.query(Product).filter(Product.id == product_id).first()
    if product:
        avg = db.query(func.avg(Review.rating)).filter(Review.product_id == product_id).scalar()
        count = db.query(func.count(Review.id)).filter(Review.product_id == product_id).scalar()
        product.rating_avg = round(float(avg), 2) if avg else 0.0
        product.rating_count = count or 0

    db.commit()
    return {"message": "Review deleted"}
