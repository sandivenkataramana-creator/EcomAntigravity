from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class OrderStatusEnum(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    processing = "processing"
    shipped = "shipped"
    out_for_delivery = "out_for_delivery"
    delivered = "delivered"
    cancelled = "cancelled"
    returned = "returned"


class PaymentMethodEnum(str, Enum):
    cod = "cod"
    card = "card"
    upi = "upi"
    netbanking = "netbanking"


class OrderCreate(BaseModel):
    address_id: int
    payment_method: PaymentMethodEnum = PaymentMethodEnum.cod
    notes: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatusEnum


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    discount_pct: float
    product_snapshot: Optional[Dict[str, Any]]

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    user_id: int
    status: OrderStatusEnum
    payment_method: PaymentMethodEnum
    payment_status: str
    total_amount: float
    discount_amount: float
    delivery_charge: float
    address_snapshot: Dict[str, Any]
    notes: Optional[str]
    items: List[OrderItemResponse]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    orders: List[OrderResponse]
    total: int
    page: int
    per_page: int
