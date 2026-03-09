from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ReviewCreate(BaseModel):
    rating: float = Field(..., ge=1, le=5)
    title: Optional[str] = None
    comment: Optional[str] = None


class ReviewResponse(BaseModel):
    id: int
    product_id: int
    user_id: int
    rating: float
    title: Optional[str]
    comment: Optional[str]
    user_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class WishlistItemResponse(BaseModel):
    id: int
    product_id: int
    added_at: datetime
    product: Optional[dict] = None

    class Config:
        from_attributes = True


class WishlistResponse(BaseModel):
    id: int
    user_id: int
    items: List[WishlistItemResponse]

    class Config:
        from_attributes = True
