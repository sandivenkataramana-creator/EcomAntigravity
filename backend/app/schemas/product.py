from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class ProductCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    price: float
    discount_pct: Optional[float] = 0.0
    stock: Optional[int] = 0
    brand: Optional[str] = None
    images: Optional[List[str]] = []
    specifications: Optional[Dict[str, Any]] = {}
    category_id: int
    is_featured: Optional[bool] = False


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    discount_pct: Optional[float] = None
    stock: Optional[int] = None
    brand: Optional[str] = None
    images: Optional[List[str]] = None
    specifications: Optional[Dict[str, Any]] = None
    category_id: Optional[int] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None


class ProductResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str]
    price: float
    discount_pct: float
    discounted_price: float
    stock: int
    brand: Optional[str]
    images: List[str]
    specifications: Dict[str, Any]
    category_id: int
    rating_avg: float
    rating_count: int
    is_active: bool
    is_featured: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    products: List[ProductResponse]
    total: int
    page: int
    per_page: int
    pages: int


class BulkProductCreate(BaseModel):
    products: List[ProductCreate]
