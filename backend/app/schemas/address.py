from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AddressCreate(BaseModel):
    full_name: str
    phone: str
    street: str
    city: str
    state: str
    pincode: str
    address_type: Optional[str] = "home"
    is_default: Optional[bool] = False


class AddressUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    address_type: Optional[str] = None
    is_default: Optional[bool] = None


class AddressResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    phone: str
    street: str
    city: str
    state: str
    pincode: str
    address_type: str
    is_default: bool
    created_at: datetime

    class Config:
        from_attributes = True
