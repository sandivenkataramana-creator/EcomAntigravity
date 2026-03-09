import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models import Product, CartItem, OrderItem, Review, WishlistItem

def clear_products():
    db = SessionLocal()
    try:
        print("🗑️ Removing all products and associated data...")
        
        # Delete related items first to avoid foreign key constraints
        db.query(CartItem).delete()
        db.query(OrderItem).delete()
        db.query(Review).delete()
        db.query(WishlistItem).delete()
        
        # Now delete products
        num_deleted = db.query(Product).delete()
        
        db.commit()
        print(f"✅ Successfully removed {num_deleted} products.")
    except Exception as e:
        print(f"❌ Error clearing products: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    clear_products()
