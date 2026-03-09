import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ShoppingBag, Truck, Shield, Headphones, Send } from 'lucide-react'
import { productsAPI, categoriesAPI } from '../api'
import ProductCard from '../components/ProductCard'
import './Home.css'

const TOAST_EVENTS = [] // Simple toast manager
let toastFn = null

export function showToast(message, type = 'info') {
    toastFn?.(message, type)
}

const CATEGORY_ICONS = { Electronics: '📱', Fashion: '👗', 'Home & Kitchen': '🏠', Sports: '⚽', Books: '📚', Beauty: '💄', Smartphones: '📱', Laptops: '💻' }

export default function HomePage() {
    const [featured, setFeatured] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [toasts, setToasts] = useState([])

    toastFn = (message, type) => {
        const id = Date.now()
        setToasts(prev => [...prev, { id, message, type }])
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
    }

    useEffect(() => {
        Promise.all([
            productsAPI.featured(10),
            categoriesAPI.list(),
        ]).then(([featRes, catRes]) => {
            setFeatured(featRes.data)
            setCategories(catRes.data.filter(c => !c.parent_id))
        }).finally(() => setLoading(false))
    }, [])

    const HERO_SLIDES = [
        { gradient: 'linear-gradient(135deg, #1a3a8f, #0f2460)', tag: '🔥 Big Billion Days', title: 'Up to 80% Off Electronics', sub: 'Limited time deals on top brands', cta: 'Shop Now', link: '/products?category_id=1' },
        { gradient: 'linear-gradient(135deg, #6b21a8, #3b0764)', tag: '✨ New Arrivals', title: 'Fashion Trends 2025', sub: 'Latest styles from top brands', cta: 'Explore Fashion', link: '/products?category_id=2' },
        { gradient: 'linear-gradient(135deg, #065f46, #022c22)', tag: '🏠 Home Makeover', title: 'Upgrade Your Kitchen', sub: 'Smart appliances at unbeatable prices', cta: 'Shop Home', link: '/products?category_id=3' },
    ]
    const [slide, setSlide] = useState(0)
    useEffect(() => {
        const t = setInterval(() => setSlide(s => (s + 1) % HERO_SLIDES.length), 4000)
        return () => clearInterval(t)
    }, [])

    return (
        <div className="home-page">
            {/* Toast */}
            <div className="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`toast toast-${t.type}`}>
                        {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'} {t.message}
                    </div>
                ))}
            </div>

            {/* Hero Slider */}
            <section className="hero section-reveal" style={{ background: HERO_SLIDES[slide].gradient }}>
                <div className="container hero-inner">
                    <div className="hero-content">
                        <span className="hero-tag">{HERO_SLIDES[slide].tag}</span>
                        <h1 className="hero-title">{HERO_SLIDES[slide].title}</h1>
                        <p className="hero-sub">{HERO_SLIDES[slide].sub}</p>
                        <div className="hero-actions">
                            <Link to={HERO_SLIDES[slide].link} className="btn btn-primary btn-lg">
                                {HERO_SLIDES[slide].cta} <ArrowRight size={18} />
                            </Link>
                            <Link to="/products" className="btn btn-secondary btn-lg">All Products</Link>
                        </div>
                    </div>
                    <div className="hero-badge-ring">
                        <div className="hero-badge">
                            <ShoppingBag size={48} />
                            <span>50K+</span>
                            <small>Products</small>
                        </div>
                    </div>
                </div>
                <div className="hero-dots">
                    {HERO_SLIDES.map((_, i) => (
                        <button key={i} className={`dot ${i === slide ? 'active' : ''}`} onClick={() => setSlide(i)} />
                    ))}
                </div>
            </section>

            {/* Feature bar */}
            <div className="feature-bar">
                <div className="container">
                    <div className="features-grid">
                        {[
                            { icon: <Truck size={22} />, title: 'Free Shipping', sub: 'Orders above ₹500' },
                            { icon: <Shield size={22} />, title: 'Secure Payment', sub: '100% protected' },
                            { icon: <Headphones size={22} />, title: '24/7 Support', sub: 'Always here to help' },
                            { icon: <ShoppingBag size={22} />, title: 'Easy Returns', sub: '7-day return policy' },
                        ].map((f, i) => (
                            <div key={i} className="feature-item">
                                <div className="feature-icon">{f.icon}</div>
                                <div><strong>{f.title}</strong><p>{f.sub}</p></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Categories */}
            <section className="section container section-reveal">
                <div className="section-header">
                    <h2 className="section-title">Shop by <span>Category</span></h2>
                    <Link to="/products" className="btn btn-secondary btn-sm">View All <ArrowRight size={14} /></Link>
                </div>
                <div className="categories-grid">
                    {categories.map(cat => (
                        <Link key={cat.id} to={`/products?category_id=${cat.id}`} className="category-card">
                            <div className="cat-icon">{CATEGORY_ICONS[cat.name] || '🛍️'}</div>
                            <span>{cat.name}</span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Featured Products */}
            <section className="section container section-reveal" style={{ animationDelay: '0.2s' }}>
                <div className="section-header">
                    <h2 className="section-title"><span>Featured</span> Products</h2>
                    <Link to="/products?featured=true" className="btn btn-secondary btn-sm">See All <ArrowRight size={14} /></Link>
                </div>
                {loading ? (
                    <div className="grid grid-4">
                        {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: 320 }} />)}
                    </div>
                ) : (
                    <div className="grid grid-4">
                        {featured.map(p => <ProductCard key={p.id} product={p} showToast={toastFn} />)}
                    </div>
                )}
            </section>

            {/* Banner */}
            <section className="promo-banner container">
                <div className="promo-inner">
                    <div>
                        <h2>🎉 Special Offer — 50% Off on All Fashion Items!</h2>
                        <p>Limited time only. Use code <strong>FASHION50</strong> at checkout.</p>
                    </div>
                    <Link to="/products?category_id=2" className="btn btn-primary btn-lg">Shop Fashion</Link>
                </div>
            </section>

            {/* Newsletter */}
            <section className="newsletter-section section-reveal">
                <div className="container newsletter-inner">
                    <h2>Weekly Deals to Your Inbox</h2>
                    <p>Subscribe to get updates on new arrivals, special offers and our weekly promotions.</p>
                    <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                        <input type="email" placeholder="Enter your email address" className="form-control" />
                        <button type="submit" className="btn btn-primary">
                            Subscribe <Send size={16} />
                        </button>
                    </form>
                </div>
            </section>
        </div>
    )
}
