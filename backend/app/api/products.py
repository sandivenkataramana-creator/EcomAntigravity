from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional
from app.core.database import get_db
from app.models.product import Product
from app.models.category import Category
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, ProductListResponse, BulkProductCreate
from app.core.security import get_current_admin
import math

def get_all_category_ids(db: Session, category_id: int) -> list[int]:
    """Recursively get all subcategory IDs for a given category ID."""
    ids = [category_id]
    subcategories = db.query(Category.id).filter(Category.parent_id == category_id).all()
    for sub_id in subcategories:
        ids.extend(get_all_category_ids(db, sub_id[0]))
    return ids

router = APIRouter(prefix="/api/products", tags=["Products"])


def build_product_response(product: Product) -> dict:
    return {
        "id": product.id,
        "name": product.name,
        "slug": product.slug,
        "description": product.description,
        "price": product.price,
        "discount_pct": product.discount_pct,
        "discounted_price": product.discounted_price,
        "stock": product.stock,
        "brand": product.brand,
        "images": product.images or [],
        "specifications": product.specifications or {},
        "category_id": product.category_id,
        "rating_avg": product.rating_avg,
        "rating_count": product.rating_count,
        "is_active": product.is_active,
        "is_featured": product.is_featured,
        "created_at": product.created_at,
    }


@router.get("", response_model=ProductListResponse)
def list_products(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
    brand: Optional[str] = None,
    sort_by: Optional[str] = "created_at",  # price_asc, price_desc, rating, newest
    featured: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Product).filter(Product.is_active == True)

    if search:
        query = query.filter(
            or_(
                Product.name.ilike(f"%{search}%"),
                Product.description.ilike(f"%{search}%"),
                Product.brand.ilike(f"%{search}%"),
            )
        )
    if category_id:
        # Include all products in this category and all its subcategories
        cat_ids = get_all_category_ids(db, category_id)
        query = query.filter(Product.category_id.in_(cat_ids))
    if min_price is not None:
        query = query.filter(Product.price * (1 - Product.discount_pct / 100) >= min_price)
    if max_price is not None:
        query = query.filter(Product.price * (1 - Product.discount_pct / 100) <= max_price)
    if min_rating is not None:
        query = query.filter(Product.rating_avg >= min_rating)
    if brand:
        query = query.filter(Product.brand.ilike(f"%{brand}%"))
    if featured is not None:
        query = query.filter(Product.is_featured == featured)

    # Sorting
    if sort_by == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort_by == "rating":
        query = query.order_by(Product.rating_avg.desc())
    else:
        query = query.order_by(Product.created_at.desc())

    total = query.count()
    pages = math.ceil(total / per_page) if total > 0 else 1
    products = query.offset((page - 1) * per_page).limit(per_page).all()

    return ProductListResponse(
        products=[build_product_response(p) for p in products],
        total=total, page=page, per_page=per_page, pages=pages
    )


@router.get("/featured", response_model=list)
def get_featured_products(limit: int = 10, db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.is_active == True, Product.is_featured == True).limit(limit).all()
    return [build_product_response(p) for p in products]


@router.get("/{slug}", response_model=ProductResponse)
def get_product(slug: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.slug == slug, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return build_product_response(product)


@router.post("", response_model=ProductResponse, status_code=201)
def create_product(data: ProductCreate, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    if db.query(Product).filter(Product.slug == data.slug).first():
        raise HTTPException(status_code=400, detail="Slug already exists")
    product = Product(**data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return build_product_response(product)


@router.post("/bulk", status_code=201)
def bulk_create_products(data: BulkProductCreate, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    results = {"added": 0, "skipped": 0, "errors": []}
    for p_data in data.products:
        if db.query(Product).filter(Product.slug == p_data.slug).first():
            results["skipped"] += 1
            results["errors"].append(f"Slug {p_data.slug} already exists")
            continue
        try:
            product = Product(**p_data.model_dump())
            db.add(product)
            results["added"] += 1
        except Exception as e:
            results["skipped"] += 1
            results["errors"].append(f"Error adding {p_data.slug}: {str(e)}")
    
    db.commit()
    return results


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, data: ProductUpdate, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return build_product_response(product)


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.is_active = False
    db.commit()
    return {"message": "Product deleted successfully"}
