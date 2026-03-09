from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from typing import List
import uuid
import shutil
from pathlib import Path
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.user import User
from app.models.product import Product
from app.models.order import Order
from app.core.security import get_current_admin

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db), admin = Depends(get_current_admin)):
    total_users = db.query(User).count()
    total_products = db.query(Product).filter(Product.is_active == True).count()
    total_orders = db.query(Order).count()
    total_revenue = db.query(func.sum(Order.total_amount)).scalar() or 0
    
    return {
        "total_users": total_users,
        "total_products": total_products,
        "total_orders": total_orders,
        "total_revenue": round(float(total_revenue), 2),
    }

@router.post("/upload-images")
async def upload_images(files: List[UploadFile] = File(...), admin = Depends(get_current_admin)):
    upload_dir = Path("uploads")
    upload_dir.mkdir(exist_ok=True)
    
    urls = []
    for file in files:
        file_ext = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = upload_dir / unique_filename
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        urls.append(f"/uploads/{unique_filename}")
        
    return {"urls": urls}

@router.post("/bulk-image-match")
async def bulk_image_match(files: List[UploadFile] = File(...), db: Session = Depends(get_db), admin = Depends(get_current_admin)):
    upload_dir = Path("uploads")
    upload_dir.mkdir(exist_ok=True)
    
    results = {"matched": 0, "skipped": 0, "details": []}
    
    for file in files:
        # 1. Save File
        file_ext = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = upload_dir / unique_filename
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        url = f"/uploads/{unique_filename}"
        
        # 2. Try to match product by filename stem
        # e.g. "iphone-13-blue.jpg" -> stem is "iphone-13-blue"
        stem = Path(file.filename).stem
        
        # Strategy: find products where slug is a prefix of the stem 
        # (to handle things like iphone-13-1.jpg, iphone-13-2.jpg)
        # or exactly matches the stem.
        
        # We'll try exact match first, then progressively trim the stem from the right
        parts = stem.split('-')
        product = None
        matched_slug = ""
        
        for i in range(len(parts), 0, -1):
            candidate_slug = "-".join(parts[:i])
            product = db.query(Product).filter(Product.slug == candidate_slug).first()
            if product:
                matched_slug = candidate_slug
                break
        
        if product:
            if not product.images:
                product.images = []
            # Append if not already there (though URLs are unique)
            # We must re-assign to trigger SQLAlchemy JSON change detection
            current_images = list(product.images) if product.images else []
            current_images.append(url)
            product.images = current_images
            
            results["matched"] += 1
            results["details"].append(f"Matched {file.filename} -> {matched_slug}")
        else:
            results["skipped"] += 1
            results["details"].append(f"No match for {file.filename}")
            
    db.commit()
    return results
