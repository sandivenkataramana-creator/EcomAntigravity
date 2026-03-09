from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(300), nullable=False, index=True)
    slug = Column(String(350), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    discount_pct = Column(Float, default=0.0)  # percentage e.g. 20 = 20%
    stock = Column(Integer, default=0)
    brand = Column(String(100), nullable=True)
    images = Column(JSON, default=list)  # list of image URLs
    specifications = Column(JSON, default=dict)  # key-value pairs
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    rating_avg = Column(Float, default=0.0)
    rating_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("Category", back_populates="products")
    cart_items = relationship("CartItem", back_populates="product")
    order_items = relationship("OrderItem", back_populates="product")
    reviews = relationship("Review", back_populates="product")
    wishlist_items = relationship("WishlistItem", back_populates="product")

    @property
    def discounted_price(self):
        return round(self.price * (1 - self.discount_pct / 100), 2)
