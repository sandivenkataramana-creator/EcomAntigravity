from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base
import enum


class OrderStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    processing = "processing"
    shipped = "shipped"
    out_for_delivery = "out_for_delivery"
    delivered = "delivered"
    cancelled = "cancelled"
    returned = "returned"


class PaymentMethod(str, enum.Enum):
    cod = "cod"
    card = "card"
    upi = "upi"
    netbanking = "netbanking"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.pending)
    payment_method = Column(Enum(PaymentMethod), default=PaymentMethod.cod)
    payment_status = Column(String(20), default="pending")  # pending/paid/failed
    total_amount = Column(Float, nullable=False)
    discount_amount = Column(Float, default=0.0)
    delivery_charge = Column(Float, default=0.0)
    address_snapshot = Column(JSON, nullable=False)  # Snapshot of address at order time
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    delivered_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)   # price at time of order
    discount_pct = Column(Float, default=0.0)
    product_snapshot = Column(JSON, nullable=True)  # name/image snapshot

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
