import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, Search, User, Heart, LogOut, Package, LayoutDashboard, Menu, X, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { categoriesAPI } from '../api'
import './Navbar.css'

export default function Navbar() {
    const { user, logout } = useAuth()
    const { itemCount } = useCart()
    const navigate = useNavigate()
    const location = useLocation()
    const [search, setSearch] = useState('')
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [categories, setCategories] = useState([])
    const [isSticky, setIsSticky] = useState(false)
    const dropdownRef = useRef(null)

    useEffect(() => {
        const handleScroll = () => {
            setIsSticky(window.scrollY > 0)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false) }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    useEffect(() => {
        setMobileMenuOpen(false)
        categoriesAPI.tree().then(r => setCategories(r.data))
    }, [location])

    const handleSearch = (e) => {
        e.preventDefault()
        if (search.trim()) navigate(`/products?search=${encodeURIComponent(search.trim())}`)
    }

    const handleLogout = () => {
        logout()
        navigate('/')
        setDropdownOpen(false)
    }

    return (
        <header className={`navbar ${isSticky ? 'sticky' : ''}`}>
            <div className="navbar-inner container">
                <Link to="/" className="navbar-logo">
                    <span className="logo-icon">🛒</span>
                    <span className="logo-text">Ecom<span>Antigravity</span></span>
                </Link>

                <form className="navbar-search" onSubmit={handleSearch}>
                    <Search size={18} className="search-icon" />
                    <input
                        type="text" placeholder="Search for products, brands and more..."
                        value={search} onChange={(e) => setSearch(e.target.value)}
                    />
                    <button type="submit" className="search-btn">Search</button>
                </form>

                <nav className={`navbar-actions ${mobileMenuOpen ? 'open' : ''}`}>
                    {user ? (
                        <div className="user-menu" ref={dropdownRef}>
                            <button className="nav-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
                                <User size={20} />
                                <span>{user.name.split(' ')[0]}</span>
                            </button>
                            {dropdownOpen && (
                                <div className="dropdown">
                                    <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                                        <User size={16} /> My Profile
                                    </Link>
                                    <Link to="/orders" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                                        <Package size={16} /> My Orders
                                    </Link>
                                    <Link to="/wishlist" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                                        <Heart size={16} /> Wishlist
                                    </Link>
                                    {user.role === 'admin' && (
                                        <Link to="/admin" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                                            <LayoutDashboard size={16} /> Admin Panel
                                        </Link>
                                    )}
                                    <hr className="dropdown-divider" />
                                    <button className="dropdown-item danger" onClick={handleLogout}>
                                        <LogOut size={16} /> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link to="/login" className="btn btn-primary btn-sm">Login / Register</Link>
                    )}

                    <Link to="/cart" className="cart-btn">
                        <ShoppingCart size={22} />
                        {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
                    </Link>
                </nav>

                <button className="mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Category bar */}
            <div className="category-bar">
                <div className="container">
                    <nav className="category-nav">
                        {categories.map(cat => (
                            <div key={cat.id} className="cat-item">
                                <Link to={`/products?category_id=${cat.id}`} className="cat-link">
                                    {cat.name}
                                    {cat.children?.length > 0 && <ChevronDown size={14} />}
                                </Link>
                                {cat.children?.length > 0 && (
                                    <div className="cat-dropdown">
                                        {cat.children.map(sub => (
                                            <Link key={sub.id} to={`/products?category_id=${sub.id}`} className="sub-link">
                                                {sub.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}<span className="logo-text">Site <span>Under Maintenance</span></span>
                    </nav>
                </div>
            </div>
        </header>
    )
}
