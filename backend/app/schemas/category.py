from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CategoryCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    parent_id: Optional[int] = None


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    parent_id: Optional[int] = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str]
    image_url: Optional[str]
    parent_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class CategoryTreeResponse(CategoryResponse):
    children: List["CategoryTreeResponse"] = []

    class Config:
        from_attributes = True


CategoryTreeResponse.model_rebuild()
