import React from 'react'
import { Link } from 'react-router-dom'
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react'
import './Footer.css'

export default function Footer() {
    return (
        <footer className="footer-premium">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <Link to="/" className="footer-logo">
                            <span className="logo-icon">🛒</span>
                            <span className="logo-text">Ecom<span>Antigravity</span></span>
                        </Link>
                        <p className="brand-desc">
                            India's most loved fashion and electronics destination.
                            We bring you the latest trends and tech at the best prices.
                        </p>
                        <div className="social-links">
                            <a href="#" className="social-icon"><Facebook size={18} /></a>
                            <a href="#" className="social-icon"><Twitter size={18} /></a>
                            <a href="#" className="social-icon"><Instagram size={18} /></a>
                            <a href="#" className="social-icon"><Youtube size={18} /></a>
                        </div>
                    </div>

                    <div className="footer-links-col">
                        <h4>Shop</h4>
                        <ul>
                            <li><Link to="/products?category_id=1">Electronics</Link></li>
                            <li><Link to="/products?category_id=2">Fashion</Link></li>
                            <li><Link to="/products?category_id=3">Home & Kitchen</Link></li>
                            <li><Link to="/products?category_id=4">Sports</Link></li>
                            <li><Link to="/products?category_id=5">Beauty</Link></li>
                        </ul>
                    </div>

                    <div className="footer-links-col">
                        <h4>Account</h4>
                        <ul>
                            <li><Link to="/profile">My Profile</Link></li>
                            <li><Link to="/orders">My Orders</Link></li>
                            <li><Link to="/wishlist">Wishlist</Link></li>
                            <li><Link to="/cart">My Cart</Link></li>
                        </ul>
                    </div>

                    <div className="footer-links-col">
                        <h4>Contact Us</h4>
                        <ul className="contact-list">
                            <li><Mail size={16} /> support@ecomantigravity.in</li>
                            <li><Phone size={16} /> +91 1800 123 4567</li>
                            <li><MapPin size={16} /> Bangalore, Karnataka, India</li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; 2026 EcomAntigravity. All rights reserved.</p>
                    <div className="footer-payment">
                        <span>We Accept:</span>
                        <img src="https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-cp-zion/img/payment-method_69e7ec.svg" alt="Payments" />
                    </div>
                </div>
            </div>
        </footer>
    )
}
