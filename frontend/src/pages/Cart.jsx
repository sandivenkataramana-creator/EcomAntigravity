import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, ShoppingCart, ArrowRight, Shield } from 'lucide-react'
import { useCart } from '../context/CartContext'
import './Cart.css'

export default function CartPage() {
    const { cart, loading, updateItem, removeItem, clearCart } = useCart()
    const navigate = useNavigate()

    if (loading) return <div className="loading-center"><div className="spinner" /></div>

    if (!cart || cart.items.length === 0) {
        return (
            <div className="container cart-empty">
                <ShoppingCart size={80} style={{ color: 'var(--text-muted)' }} />
                <h2>Your Cart is Empty!</h2>
                <p>Looks like you haven't added anything to your cart yet.</p>
                <Link to="/products" className="btn btn-primary btn-lg mt-4">Start Shopping</Link>
            </div>
        )
    }

    return (
        <div className="cart-page">
            <div className="container cart-layout">
                <div className="cart-items-section">
                    <div className="cart-header">
                        <h2>My Cart ({cart.total_items})</h2>
                        <button className="btn btn-danger btn-sm" onClick={clearCart}>Clear Cart</button>
                    </div>

                    <div className="cart-list">
                        {cart.items.map(item => (
                            <div key={item.id} className="cart-item card">
                                <Link to={`/product/${item.product.slug}`} className="item-img">
                                    <img src={item.product.images[0] || 'https://via.placeholder.com/100'} alt={item.product.name} />
                                </Link>
                                <div className="item-details">
                                    <Link to={`/product/${item.product.slug}`} className="item-name">{item.product.name}</Link>
                                    <p className="item-seller">Seller: Free Delivery eligible</p>
                                    <div className="item-price-row">
                                        <span className="price-big">₹{item.product.discounted_price?.toLocaleString('en-IN')}</span>
                                        {item.product.discount_pct > 0 && (
                                            <>
                                                <span className="price-orig">₹{item.product.price?.toLocaleString('en-IN')}</span>
                                                <span className="price-save">{Math.round(item.product.discount_pct)}% Off</span>
                                            </>
                                        )}
                                    </div>

                                    <div className="item-actions">
                                        <div className="qty-control">
                                            <button onClick={() => updateItem(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>−</button>
                                            <input type="number" readOnly value={item.quantity} />
                                            <button onClick={() => updateItem(item.id, item.quantity + 1)} disabled={item.quantity >= item.product.stock}>+</button>
                                        </div>
                                        <button className="btn-remove" onClick={() => removeItem(item.id)}>
                                            <Trash2 size={16} /> Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="cart-summary-section">
                    <div className="summary-card card">
                        <h3 className="summary-title">Price Details</h3>
                        <hr className="divider" />

                        <div className="summary-row">
                            <span>Price ({cart.total_items} items)</span>
                            <span>₹{cart.subtotal.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="summary-row text-success">
                            <span>Discount</span>
                            <span>− ₹{cart.total_discount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="summary-row">
                            <span>Delivery Charges</span>
                            <span className={cart.subtotal - cart.total_discount >= 500 ? 'text-success' : ''}>
                                {cart.subtotal - cart.total_discount >= 500 ? 'Free' : '₹40'}
                            </span>
                        </div>

                        <hr className="divider" style={{ borderStyle: 'dashed' }} />
                        <div className="summary-total">
                            <span>Total Amount</span>
                            <span>₹{cart.total_amount.toLocaleString('en-IN')}</span>
                        </div>
                        <hr className="divider" style={{ borderStyle: 'dashed' }} />

                        {cart.total_discount > 0 && (
                            <div className="savings-msg">
                                You will save ₹{cart.total_discount.toLocaleString('en-IN')} on this order
                            </div>
                        )}

                        <button className="btn btn-accent btn-lg btn-full place-order-btn" onClick={() => navigate('/checkout')}>
                            Place Order <ArrowRight size={18} />
                        </button>
                    </div>

                    <div className="trust-stamp">
                        <Shield size={24} style={{ color: 'var(--text-muted)' }} />
                        <span>Safe and Secure Payments. Easy returns. 100% Authentic products.</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
