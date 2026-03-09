import React, { useState, useEffect } from 'react'
import { User, MapPin, Package, Heart, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { usersAPI } from '../api'
import './Profile.css'
import { Link, useNavigate } from 'react-router-dom'

export default function ProfilePage() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('profile')
    const [profileForm, setProfileForm] = useState({ name: '', phone: '' })
    const [addresses, setAddresses] = useState([])
    const [wishlist, setWishlist] = useState([])
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState('')

    useEffect(() => {
        if (user) setProfileForm({ name: user.name || '', phone: user.phone || '' })
        if (activeTab === 'addresses') {
            usersAPI.addresses().then(r => setAddresses(r.data))
        } else if (activeTab === 'wishlist') {
            usersAPI.wishlist().then(r => setWishlist(r.data))
        }
    }, [user, activeTab])

    const handleUpdateProfile = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await usersAPI.updateProfile(profileForm)
            setMsg('Profile updated successfully!')
            setTimeout(() => setMsg(''), 3000)
        } catch {
            setMsg('Failed to update profile.')
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    const removeFromWishlist = async (id) => {
        try {
            await usersAPI.removeFromWishlist(id)
            setWishlist(wishlist.filter(w => w.product_id !== id))
        } catch (e) {
            console.error(e)
        }
    }

    if (!user) return null

    return (
        <div className="profile-page">
            <div className="container profile-layout">
                <aside className="profile-sidebar card">
                    <div className="profile-header">
                        <div className="profile-avatar">{user.name?.charAt(0).toUpperCase() || 'U'}</div>
                        <div className="profile-info">
                            <span className="greeting">Hello,</span>
                            <strong>{user.name}</strong>
                        </div>
                    </div>

                    <nav className="profile-nav">
                        <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>
                            <User size={18} /> Profile Information
                        </button>
                        <Link to="/orders" className="nav-link">
                            <Package size={18} /> My Orders
                        </Link>
                        <button className={activeTab === 'addresses' ? 'active' : ''} onClick={() => setActiveTab('addresses')}>
                            <MapPin size={18} /> Manage Addresses
                        </button>
                        <button className={activeTab === 'wishlist' ? 'active' : ''} onClick={() => setActiveTab('wishlist')}>
                            <Heart size={18} /> My Wishlist
                        </button>
                        <button className="text-danger mt-auto border-top" onClick={handleLogout} style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                            <LogOut size={18} /> Logout
                        </button>
                    </nav>
                </aside>

                <main className="profile-content card">
                    {activeTab === 'profile' && (
                        <div className="tab-pane bg-dark-2">
                            <h2 className="tab-title">Personal Information</h2>
                            {msg && <div className="alert-info">{msg}</div>}
                            <form className="profile-form" onSubmit={handleUpdateProfile}>
                                <div className="form-group grid-2">
                                    <label>
                                        Full Name
                                        <input className="form-control" name="name" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} required />
                                    </label>
                                    <label>
                                        Mobile Number
                                        <input className="form-control" name="phone" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} />
                                    </label>
                                </div>
                                <div className="form-group">
                                    <label>
                                        Email Address <span className="text-muted">(Cannot be changed)</span>
                                        <input className="form-control" name="email" value={user.email} disabled />
                                    </label>
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'addresses' && (
                        <div className="tab-pane">
                            <h2 className="tab-title">Manage Addresses</h2>
                            <div className="addresses-list">
                                {addresses.length === 0 ? <p>No addresses found.</p> : addresses.map(addr => (
                                    <div key={addr.id} className="address-card">
                                        <div className="address-info">
                                            <strong>{addr.full_name} <span className="addr-type">{addr.address_type}</span></strong>
                                            <p>{addr.street}, {addr.city}, {addr.state} - <b>{addr.pincode}</b></p>
                                            <p className="addr-phone">Phone: {addr.phone}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'wishlist' && (
                        <div className="tab-pane">
                            <h2 className="tab-title">My Wishlist ({wishlist.length})</h2>
                            {wishlist.length === 0 ? (
                                <div className="empty-state">
                                    <Heart size={64} color="var(--text-muted)" />
                                    <p>Your wishlist is empty</p>
                                </div>
                            ) : (
                                <div className="wishlist-grid grid-3">
                                    {wishlist.map(item => (
                                        <div key={item.id} className="wishlist-item card">
                                            <button className="remove-btn" onClick={() => removeFromWishlist(item.product_id)}>&times;</button>
                                            <Link to={`/product/${item.product.slug}`}>
                                                <img src={item.product.images[0] || 'https://via.placeholder.com/150'} alt={item.product.name} />
                                                <h4>{item.product.name}</h4>
                                                <div className="price">₹{item.product.discounted_price?.toLocaleString()}</div>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}
