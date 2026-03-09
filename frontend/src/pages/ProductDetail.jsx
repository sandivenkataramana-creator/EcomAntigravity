import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShoppingCart, Heart, Star, ChevronLeft, ChevronRight, Package, Truck, Shield, RotateCcw } from 'lucide-react'
import { productsAPI, reviewsAPI, usersAPI } from '../api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import './ProductDetail.css'

export default function ProductDetail() {
    const { slug } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { addToCart } = useCart()

    const [product, setProduct] = useState(null)
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [imgIdx, setImgIdx] = useState(0)
    const [qty, setQty] = useState(1)
    const [adding, setAdding] = useState(false)
    const [wished, setWished] = useState(false)
    const [toasts, setToasts] = useState([])
    const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' })
    const [submittingReview, setSubmittingReview] = useState(false)
    const [tab, setTab] = useState('description')

    const toast = (msg, type = 'success') => {
        const id = Date.now()
        setToasts(prev => [...prev, { id, msg, type }])
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
    }

    useEffect(() => {
        setLoading(true)
        productsAPI.get(slug)
            .then(r => {
                setProduct(r.data)
                return reviewsAPI.listByProduct(r.data.id)
            })
            .then(r => setReviews(r.data))
            .catch(() => navigate('/products'))
            .finally(() => setLoading(false))
    }, [slug])

    const handleAddToCart = async () => {
        if (!user) { navigate('/login'); return }
        try {
            setAdding(true)
            await addToCart(product.id, qty)
            toast('Added to cart! 🛒', 'success')
        } catch (e) {
            toast(e.response?.data?.detail || 'Failed', 'error')
        } finally { setAdding(false) }
    }

    const handleBuyNow = async () => {
        if (!user) { navigate('/login'); return }
        try {
            setAdding(true)
            await addToCart(product.id, qty)
            navigate('/cart')
        } finally { setAdding(false) }
    }

    const toggleWishlist = async () => {
        if (!user) { navigate('/login'); return }
        try {
            if (wished) { await usersAPI.removeFromWishlist(product.id); setWished(false); toast('Removed from wishlist', 'info') }
            else { await usersAPI.addToWishlist(product.id); setWished(true); toast('Added to wishlist! ❤️', 'success') }
        } catch { }
    }

    const submitReview = async (e) => {
        e.preventDefault()
        if (!user) { navigate('/login'); return }
        try {
            setSubmittingReview(true)
            const { data } = await reviewsAPI.create(product.id, reviewForm)
            setReviews(prev => [data, ...prev])
            setReviewForm({ rating: 5, title: '', comment: '' })
            toast('Review submitted!', 'success')
        } catch (e) {
            toast(e.response?.data?.detail || 'Failed to submit review', 'error')
        } finally { setSubmittingReview(false) }
    }

    if (loading) return <div className="loading-center" style={{ paddingTop: 120 }}><div className="spinner" /></div>
    if (!product) return null

    const images = product.images?.length ? product.images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600']

    return (
        <div className="product-detail-page">
            <div className="toast-container">
                {toasts.map(t => <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>)}
            </div>

            <div className="container detail-layout">
                {/* Image Gallery */}
                <div className="gallery">
                    <div className="gallery-main">
                        <img src={images[imgIdx]} alt={product.name} />
                        {images.length > 1 && (
                            <>
                                <button className="gallery-nav prev" onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}><ChevronLeft size={24} /></button>
                                <button className="gallery-nav next" onClick={() => setImgIdx(i => (i + 1) % images.length)}><ChevronRight size={24} /></button>
                            </>
                        )}
                    </div>
                    {images.length > 1 && (
                        <div className="gallery-thumbs">
                            {images.map((img, i) => (
                                <img key={i} src={img} alt={`thumb ${i}`} className={i === imgIdx ? 'active' : ''} onClick={() => setImgIdx(i)} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="product-info-panel">
                    {product.brand && <span className="detail-brand">{product.brand}</span>}
                    <h1 className="detail-name">{product.name}</h1>

                    <div className="detail-rating">
                        <div className="stars">
                            {[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} fill={s <= Math.round(product.rating_avg) ? '#fbbf24' : 'none'} stroke="#fbbf24" />)}
                        </div>
                        <span className="rating-val">{product.rating_avg?.toFixed(1)}</span>
                        <span className="rating-total">({product.rating_count} reviews)</span>
                    </div>

                    <div className="detail-price">
                        <span className="price-big">₹{product.discounted_price?.toLocaleString('en-IN')}</span>
                        {product.discount_pct > 0 && (
                            <>
                                <span className="price-orig">₹{product.price?.toLocaleString('en-IN')}</span>
                                <span className="price-save">{Math.round(product.discount_pct)}% OFF</span>
                            </>
                        )}
                    </div>

                    <div className="detail-stock">
                        {product.stock > 0 ? (
                            <span className="in-stock">✅ In Stock ({product.stock} available)</span>
                        ) : (
                            <span className="out-stock">❌ Out of Stock</span>
                        )}
                    </div>

                    <div className="qty-row">
                        <span>Quantity:</span>
                        <div className="qty-control">
                            <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                            <span>{qty}</span>
                            <button onClick={() => setQty(q => Math.min(product.stock, q + 1))}>+</button>
                        </div>
                    </div>

                    <div className="detail-actions">
                        <button className="btn btn-accent btn-lg" onClick={handleAddToCart} disabled={adding || product.stock === 0}>
                            <ShoppingCart size={20} /> {adding ? 'Adding…' : 'Add to Cart'}
                        </button>
                        <button className="btn btn-primary btn-lg" onClick={handleBuyNow} disabled={product.stock === 0}>
                            Buy Now
                        </button>
                        <button className={`wishlist-icon-btn ${wished ? 'active' : ''}`} onClick={toggleWishlist}>
                            <Heart size={22} fill={wished ? '#ff6161' : 'none'} />
                        </button>
                    </div>

                    <div className="trust-badges">
                        {[
                            { icon: <Truck size={18} />, text: 'Free delivery on orders above ₹500' },
                            { icon: <Shield size={18} />, text: '100% Authentic Product' },
                            { icon: <RotateCcw size={18} />, text: '7-day easy return policy' },
                            { icon: <Package size={18} />, text: 'Secure packaging guaranteed' },
                        ].map((b, i) => (
                            <div key={i} className="trust-item">{b.icon} <span>{b.text}</span></div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="container tabs-section">
                <div className="tabs">
                    {['description', 'specifications', 'reviews'].map(t => (
                        <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                            {t === 'reviews' && <span className="tab-count">{reviews.length}</span>}
                        </button>
                    ))}
                </div>

                {tab === 'description' && (
                    <div className="tab-content">
                        <p className="description-text">{product.description || 'No description available.'}</p>
                    </div>
                )}

                {tab === 'specifications' && (
                    <div className="tab-content">
                        {Object.keys(product.specifications || {}).length > 0 ? (
                            <table className="spec-table">
                                <tbody>
                                    {Object.entries(product.specifications).map(([k, v]) => (
                                        <tr key={k}><th>{k}</th><td>{v}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <p>No specifications available.</p>}
                    </div>
                )}

                {tab === 'reviews' && (
                    <div className="tab-content">
                        {/* Write review */}
                        {user && (
                            <form className="review-form card" onSubmit={submitReview}>
                                <h4>Write a Review</h4>
                                <div className="rating-picker">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <button key={s} type="button" className="star-pick" onClick={() => setReviewForm(f => ({ ...f, rating: s }))}>
                                            <Star size={28} fill={s <= reviewForm.rating ? '#fbbf24' : 'none'} stroke="#fbbf24" />
                                        </button>
                                    ))}
                                </div>
                                <input className="form-control" placeholder="Review title" value={reviewForm.title} onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))} />
                                <textarea className="form-control" placeholder="Share your experience…" rows={4} value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))} style={{ marginTop: 10, resize: 'vertical' }} />
                                <button type="submit" className="btn btn-primary" disabled={submittingReview} style={{ marginTop: 12 }}>
                                    {submittingReview ? 'Submitting…' : 'Submit Review'}
                                </button>
                            </form>
                        )}

                        {/* Review list */}
                        {reviews.length === 0 ? (
                            <div className="empty-state"><Star size={48} /><p>No reviews yet. Be the first!</p></div>
                        ) : (
                            <div className="reviews-list">
                                {reviews.map(r => (
                                    <div key={r.id} className="review-card card">
                                        <div className="review-header">
                                            <div className="stars">{[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} fill={s <= r.rating ? '#fbbf24' : 'none'} stroke="#fbbf24" />)}</div>
                                            <strong>{r.user_name}</strong>
                                            <span className="review-date">{new Date(r.created_at).toLocaleDateString()}</span>
                                        </div>
                                        {r.title && <p className="review-title">{r.title}</p>}
                                        {r.comment && <p className="review-comment">{r.comment}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
