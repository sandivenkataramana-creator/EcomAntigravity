import sys
import os
from datetime import datetime
from pathlib import Path

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.models import *
from app.core.security import get_password_hash

def seed_db():
    print("⏳ Clearing existing data...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("🌱 Seeding Categories...")
        # Main Categories
        electronics = Category(name="Electronics", slug="electronics", image_url="https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400")
        fashion = Category(name="Fashion", slug="fashion", image_url="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400")
        home = Category(name="Home & Kitchen", slug="home-kitchen", image_url="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400")
        sports = Category(name="Sports", slug="sports", image_url="https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400")
        beauty = Category(name="Beauty", slug="beauty", image_url="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400")
        
        db.add_all([electronics, fashion, home, sports, beauty])
        db.flush()

        # Subcategories
        smartphones = Category(name="Smartphones", slug="smartphones", parent_id=electronics.id)
        laptops = Category(name="Laptops", slug="laptops", parent_id=electronics.id)
        audio = Category(name="Audio", slug="audio", parent_id=electronics.id)
        
        mens_fashion = Category(name="Men's Fashion", slug="mens-fashion", parent_id=fashion.id)
        womens_fashion = Category(name="Women's Fashion", slug="womens-fashion", parent_id=fashion.id)
        
        kitchen = Category(name="Kitchen Appliances", slug="kitchen-appliances", parent_id=home.id)
        decor = Category(name="Home Decor", slug="home-decor", parent_id=home.id)
        
        db.add_all([smartphones, laptops, audio, mens_fashion, womens_fashion, kitchen, decor])
        db.flush()

        print("👤 Creating Admin...")
        admin = User(
            name="Admin User",
            email="admin@shop.com",
            hashed_password=get_password_hash("Admin@123"),
            role="admin",
            is_active=True
        )
        db.add(admin)
        db.flush()
        
        # Initialize Cart and Wishlist for admin
        db.add(Cart(user_id=admin.id))
        db.add(Wishlist(user_id=admin.id))

        print("📦 Seeding Products...")
        products = [
            # Electronics -> Smartphones
            {
                "name": "iPhone 15 Pro", "slug": "iphone-15-pro", "price": 134900, "discount_pct": 5, "stock": 20, 
                "brand": "Apple", "category_id": smartphones.id, "is_featured": True,
                "description": "Titanium design, A17 Pro chip, and advanced camera system.",
                "images": ["https://images.unsplash.com/photo-1696446701796-da61225697cc?w=600"]
            },
            {
                "name": "Samsung Galaxy S24 Ultra", "slug": "samsung-s24-ultra", "price": 129999, "discount_pct": 8, "stock": 15,
                "brand": "Samsung", "category_id": smartphones.id, "is_featured": True,
                "description": "AI-powered camera, S-Pen included, and peak brightness display.",
                "images": ["https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?w=600"]
            },
            # Electronics -> Laptops
            {
                "name": "MacBook Air M3", "slug": "macbook-air-m3", "price": 114900, "discount_pct": 10, "stock": 10,
                "brand": "Apple", "category_id": laptops.id, "is_featured": True,
                "description": "Thin, light, and powerful with the new M3 chip.",
                "images": ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600"]
            },
            {
                "name": "Dell XPS 13", "slug": "dell-xps-13", "price": 95000, "discount_pct": 12, "stock": 8,
                "brand": "Dell", "category_id": laptops.id, "is_featured": False,
                "description": "The ultimate Windows portable laptop.",
                "images": ["https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600"]
            },
            # Fashion -> Men's
            {
                "name": "Casual Cotton Shirt", "slug": "casual-cotton-shirt", "price": 1299, "discount_pct": 30, "stock": 100,
                "brand": "ZARA", "category_id": mens_fashion.id, "is_featured": False,
                "description": "Breathable cotton shirt for daily wear.",
                "images": ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600"]
            },
            {
                "name": "Premium Denim Jeans", "slug": "premium-denim-jeans", "price": 2499, "discount_pct": 20, "stock": 50,
                "brand": "Levi's", "category_id": mens_fashion.id, "is_featured": True,
                "description": "Classic 501 original fit jeans.",
                "images": ["https://images.unsplash.com/photo-1542272604-787c3835535d?w=600"]
            },
            # Fashion -> Women's
            {
                "name": "Summer Floral Dress", "slug": "summer-floral-dress", "price": 1899, "discount_pct": 15, "stock": 40,
                "brand": "H&M", "category_id": womens_fashion.id, "is_featured": True,
                "description": "Lightweight floral dress for summer outings.",
                "images": ["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600"]
            },
            # Home & Kitchen -> Kitchen Appliances
            {
                "name": "Air Fryer 4L", "slug": "air-fryer-4l", "price": 4999, "discount_pct": 40, "stock": 30,
                "brand": "Philips", "category_id": kitchen.id, "is_featured": True,
                "description": "Healthy frying with up to 90% less fat.",
                "images": ["https://images.unsplash.com/photo-1585515320310-259814833e62?w=600"]
            },
            # Sports
            {
                "name": "Yoga Mat Essential", "slug": "yoga-mat-essential", "price": 899, "discount_pct": 10, "stock": 200,
                "brand": "Fitbit", "category_id": sports.id, "is_featured": False,
                "description": "Eco-friendly non-slip yoga mat.",
                "images": ["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600"]
            },
            # Beauty
            {
                "name": "Hydrating Face Serum", "slug": "hydrating-face-serum", "price": 599, "discount_pct": 5, "stock": 150,
                "brand": "The Ordinary", "category_id": beauty.id, "is_featured": False,
                "description": "Pure Hyaluronic Acid for skin hydration.",
                "images": ["https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600"]
            }
        ]
        
        for p_data in products:
            p = Product(**p_data)
            db.add(p)
            
        db.commit()
        print("✅ Database seeded with dummy products!")
        print("   Admin: admin@shop.com / Admin@123")

    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
