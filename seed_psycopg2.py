import psycopg2
import sys

DATABASE_URL = "postgresql://postgres:postgres123@localhost:5432/ecomantigravity"

def seed():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        # Root Categories (check if they exist)
        cats = [
            (9, 'Electronics', 'electronics', None),
            (10, 'Fashion', 'fashion', None),
            (11, 'Home & Kitchen', 'home-kitchen', None),
            (12, 'Sports', 'sports', None),
            (13, 'Books', 'books', None),
            (14, 'Beauty', 'beauty', None)
        ]
        for cid, name, slug, pid in cats:
            cur.execute("INSERT INTO categories (id, name, slug, parent_id, created_at) VALUES (%s, %s, %s, %s, NOW()) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug;", (cid, name, slug, pid))

        # Subcategories
        subs = [
            ('Laptops', 'laptops', 9), ('Smartphones', 'smartphones', 9),
            ('Men', 'fashion-men', 10), ('Women', 'fashion-women', 10), ('Kids', 'fashion-kids', 10), ('Accessories', 'fashion-acc', 10),
            ('Decor', 'home-decor', 11), ('Furniture', 'home-furniture', 11), ('Appliances', 'home-appliances', 11),
            ('Fitness', 'sports-fitness', 12), ('Outdoor', 'sports-outdoor', 12), ('Apparel', 'sports-apparel', 12),
            ('Fiction', 'books-fiction', 13), ('Non-Fiction', 'books-nonfiction', 13), ('Educational', 'books-edu', 13),
            ('Skincare', 'beauty-skincare', 14), ('Makeup', 'beauty-makeup', 14), ('Haircare', 'beauty-haircare', 14)
        ]
        for name, slug, pid in subs:
            cur.execute("INSERT INTO categories (name, slug, parent_id, created_at) VALUES (%s, %s, %s, NOW()) ON CONFLICT (slug) DO NOTHING;", (name, slug, pid))
            
        conn.commit()
        print("Seeded successfully.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    seed()
