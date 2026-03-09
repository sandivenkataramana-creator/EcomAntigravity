import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Heart, Star } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { usersAPI } from '../api'
import './ProductCard.css'

export default function ProductCard({ product, showToast }) {
    const { addToCart } = useCart()
    const { user } = useAuth()
    const [adding, setAdding] = useState(false)
    const [wished, setWished] = useState(false)

    const handleAddToCart = async (e) => {
        e.preventDefault()
        if (!user) { showToast?.('Please login to add items to cart', 'error'); return }
        try {
            setAdding(true)
            await addToCart(product.id)
            showToast?.('Added to cart!', 'success')
        } catch (err) {
            showToast?.(err.response?.data?.detail || 'Failed to add to cart', 'error')
        } finally {
            setAdding(false)
        }
    }

    const handleWishlist = async (e) => {
        e.preventDefault()
        if (!user) { showToast?.('Please login', 'error'); return }
        try {
            if (wished) {
                await usersAPI.removeFromWishlist(product.id)
                setWished(false)
                showToast?.('Removed from wishlist', 'info')
            } else {
                await usersAPI.addToWishlist(product.id)
                setWished(true)
                showToast?.('Added to wishlist!', 'success')
            }
        } catch { }
    }

    const discount = product.discount_pct > 0 ? Math.round(product.discount_pct) : null

    return (
        <Link to={`/product/${product.slug}`} className="product-card">
            <div className="product-img-wrap">
                <img
                    src={product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'}
                    alt={product.name}
                    loading="lazy"
                />
                {discount && <span className="discount-badge">{discount}% OFF</span>}
                <button className={`wishlist-btn ${wished ? 'active' : ''}`} onClick={handleWishlist} title="Wishlist">
                    <Heart size={18} fill={wished ? '#ff6161' : 'none'} />
                </button>
            </div>
            <div className="product-info">
                {product.brand && <span className="product-brand">{product.brand}</span>}
                <h3 className="product-name">{product.name}</h3>
                <div className="product-rating">
                    <Star size={13} fill="#fbbf24" stroke="none" />
                    <span>{product.rating_avg?.toFixed(1) || '—'}</span>
                    {product.rating_count > 0 && <span className="rating-count">({product.rating_count})</span>}
                </div>
                <div className="product-price">
                    <span className="price-now">₹{product.discounted_price?.toLocaleString('en-IN')}</span>
                    {discount && <span className="price-was">₹{product.price?.toLocaleString('en-IN')}</span>}
                </div>
                <button
                    className="btn btn-primary btn-sm btn-full add-cart-btn"
                    onClick={handleAddToCart}
                    disabled={adding || product.stock === 0}
                >
                    <ShoppingCart size={15} />
                    {product.stock === 0 ? 'Out of Stock' : adding ? 'Adding...' : 'Add to Cart'}
                </button>
            </div>
        </Link>
    )
}
