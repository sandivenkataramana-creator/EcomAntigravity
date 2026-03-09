import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Activity, ShoppingBag, Users, Package, TrendingUp, Plus, Trash2, Edit2, ExternalLink, Image, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { adminAPI, productsAPI, categoriesAPI } from '../api'

export default function AdminDashboard() {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState('orders')
    const [stats, setStats] = useState(null)
    const [orders, setOrders] = useState([])
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)

    // Product/Category form state
    const [showProductModal, setShowProductModal] = useState(false)
    const [showBulkModal, setShowBulkModal] = useState(false)
    const [showBulkImageMatchModal, setShowBulkImageMatchModal] = useState(false)
    const [showCategoryModal, setShowCategoryModal] = useState(false)
    const [productForm, setProductForm] = useState({
        name: '', slug: '', description: '', price: '',
        discount_pct: 0, stock: 10, brand: '', category_id: '',
        images: [''], is_featured: false
    })
    const [categoryForm, setCategoryForm] = useState({
        name: '', slug: '', description: '', parent_id: '', image_url: ''
    })
    const [submitting, setSubmitting] = useState(false)

    // Protect route
    if (!user || user.role !== 'admin') {
        return <Navigate to="/" replace />
    }

    const fetchAll = async () => {
        try {
            const [statsRes, ordersRes, productsRes, catsRes] = await Promise.all([
                adminAPI.stats(),
                adminAPI.orders({ page: 1, per_page: 20 }),
                productsAPI.list({ per_page: 50 }),
                categoriesAPI.list(),
                usersAPI.adminListUsers()
            ])
            setStats(statsRes.data)
            setOrders(ordersRes.data.orders)
            setProducts(productsRes.data.products)
            setCategories(catsRes.data)
            setUsers(usersRes.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setLoading(true)
        fetchAll()
    }, [])

    const updateOrderStatus = async (id, status) => {
        try {
            await adminAPI.updateOrderStatus(id, status)
            setOrders(orders.map(o => o.id === id ? { ...o, status } : o))
        } catch (e) {
            alert('Failed to update status')
        }
    }

    const toggleUserActive = async (userId) => {
        try {
            await usersAPI.adminToggleUser(userId)
            setUsers(users.map(u => u.id === userId ? { ...u, is_active: !u.is_active } : u))
        } catch (e) {
            alert('Failed to toggle user status')
        }
    }

    const handleAddProduct = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            // Slugify name if slug is empty
            const finalForm = { ...productForm }
            if (!finalForm.slug) finalForm.slug = finalForm.name.toLowerCase().replace(/ /g, '-')

            const { data } = await productsAPI.create(finalForm)
            setProducts([data, ...products])
            setShowProductModal(false)
            setProductForm({
                name: '', slug: '', description: '', price: '',
                discount_pct: 0, stock: 10, brand: '', category_id: '',
                images: [''], is_featured: false
            })
            alert('Product added successfully!')
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to add product')
        } finally {
            setSubmitting(false)
        }
    }

    const handleAddCategory = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const finalForm = { ...categoryForm }
            if (!finalForm.slug) finalForm.slug = finalForm.name.toLowerCase().replace(/ /g, '-')
            if (finalForm.parent_id === '') delete finalForm.parent_id

            const { data } = await categoriesAPI.create(finalForm)
            setCategories([...categories, data])
            setShowCategoryModal(false)
            setCategoryForm({ name: '', slug: '', description: '', parent_id: '', image_url: '' })
            alert('Category added successfully!')
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to add category')
        } finally {
            setSubmitting(false)
        }
    }

    const handleBulkUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target.result)
                setSubmitting(true)
                const { data } = await productsAPI.bulkCreate({ products: json })
                alert(`Bulk upload complete! Added: ${data.added}, Skipped: ${data.skipped}`)
                if (data.errors?.length) console.warn('Bulk upload errors:', data.errors)
                setShowBulkModal(false)
                fetchAll()
            } catch (err) {
                alert('Invalid JSON file format or upload failed')
                console.error(err)
            } finally {
                setSubmitting(false)
                e.target.value = '' // Reset input
            }
        }
        reader.readAsText(file)
    }

    const handleProductImageUpload = async (e) => {
        const files = Array.from(e.target.files)
        if (!files.length) return

        const formData = new FormData()
        files.forEach(file => formData.append('files', file))

        setSubmitting(true)
        try {
            const { data } = await adminAPI.uploadImages(formData)
            setProductForm(prev => ({
                ...prev,
                images: [...prev.images.filter(img => img), ...data.urls]
            }))
        } catch (err) {
            alert('Failed to upload images')
        } finally {
            setSubmitting(false)
            e.target.value = ''
        }
    }

    const handleBulkImageMatch = async (e) => {
        const files = Array.from(e.target.files)
        if (!files.length) return

        const formData = new FormData()
        files.forEach(file => formData.append('files', file))

        setSubmitting(true)
        try {
            const { data } = await adminAPI.bulkImageMatch(formData)
            alert(`Smart Matching complete! Matched: ${data.matched}, Skipped: ${data.skipped}`)
            if (data.details?.length) console.log('Match details:', data.details)
            setShowBulkImageMatchModal(false)
            fetchAll()
        } catch (err) {
            alert('Bulk image matching failed')
        } finally {
            setSubmitting(false)
            e.target.value = ''
        }
    }

    const removeProductImage = (index) => {
        setProductForm(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }))
    }

    const handleDeleteProduct = async (id) => {
        if (!window.confirm('Are you sure you want to deactivate this product?')) return
        try {
            await productsAPI.delete(id)
            setProducts(products.filter(p => p.id !== id))
        } catch {
            alert('Failed to delete product')
        }
    }

    if (loading) return <div className="loading-center"><div className="spinner" /></div>

    // Group categories for hierarchy
    const parentCategories = categories.filter(c => !c.parent_id)
    const getSubcategories = (pid) => categories.filter(c => c.parent_id === pid)

    return (
        <div className="container" style={{ paddingTop: 100, paddingBottom: 60 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Activity size={28} color="var(--primary-light)" />
                    <h1 style={{ fontSize: 24, margin: 0 }}>Admin Dashboard</h1>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    {activeTab === 'products' && (
                        <>
                            <button className="btn btn-secondary" onClick={() => setShowBulkModal(true)}>
                                <Package size={18} /> Bulk Upload
                            </button>
                            <button className="btn btn-secondary" onClick={() => setShowBulkImageMatchModal(true)}>
                                <Image size={18} /> Smart Image Match
                            </button>
                            <button className="btn btn-primary" onClick={() => setShowProductModal(true)}>
                                <Plus size={18} /> Add Product
                            </button>
                        </>
                    )}
                    {activeTab === 'categories' && (
                        <button className="btn btn-primary" onClick={() => setShowCategoryModal(true)}>
                            <Plus size={18} /> Add Category
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            {stats && (
                <div className="grid-4" style={{ marginBottom: 40 }}>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ padding: 16, background: 'rgba(40,116,240,0.1)', borderRadius: '50%', color: 'var(--primary-light)' }}><TrendingUp size={24} /></div>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 13, textTransform: 'uppercase', marginBottom: 4 }}>Total Revenue</p>
                            <h3 style={{ fontSize: 24 }}>₹{stats.total_revenue.toLocaleString()}</h3>
                        </div>
                    </div>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ padding: 16, background: 'rgba(38,165,65,0.1)', borderRadius: '50%', color: 'var(--success)' }}><ShoppingBag size={24} /></div>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 13, textTransform: 'uppercase', marginBottom: 4 }}>Total Orders</p>
                            <h3 style={{ fontSize: 24 }}>{stats.total_orders}</h3>
                        </div>
                    </div>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ padding: 16, background: 'rgba(255,194,51,0.1)', borderRadius: '50%', color: '#ffc233' }}><Package size={24} /></div>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 13, textTransform: 'uppercase', marginBottom: 4 }}>Total Products</p>
                            <h3 style={{ fontSize: 24 }}>{stats.total_products}</h3>
                        </div>
                    </div>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ padding: 16, background: 'rgba(255,97,97,0.1)', borderRadius: '50%', color: 'var(--danger)' }}><Users size={24} /></div>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 13, textTransform: 'uppercase', marginBottom: 4 }}>Total Users</p>
                            <h3 style={{ fontSize: 24 }}>{stats.total_users}</h3>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 20, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
                {['orders', 'products', 'categories', 'users'].map(t => (
                    <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        style={{
                            padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer',
                            color: activeTab === t ? 'var(--primary-light)' : 'var(--text-secondary)',
                            borderBottom: activeTab === t ? '2px solid var(--primary-light)' : 'none',
                            fontWeight: 600, textTransform: 'capitalize'
                        }}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Tab Panes */}
            {activeTab === 'orders' && (
                <div className="card">
                    <h2 style={{ fontSize: 18, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>Recent Orders</h2>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 14 }}>
                                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Order ID</th>
                                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Date</th>
                                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Customer</th>
                                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Amount</th>
                                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length === 0 ? (
                                    <tr><td colSpan="6" style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>No recent orders</td></tr>
                                ) : orders.map(order => (
                                    <tr key={order.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '16px' }}>#{order.id}</td>
                                        <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: 14 }}>{new Date(order.created_at).toLocaleDateString()}</td>
                                        <td style={{ padding: '16px' }}>{order.address_snapshot.full_name}</td>
                                        <td style={{ padding: '16px', fontWeight: 600 }}>₹{order.total_amount.toLocaleString()}</td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{
                                                fontSize: 12, fontWeight: 700, padding: '4px 8px', borderRadius: 4, textTransform: 'uppercase',
                                                background: order.status === 'delivered' ? 'rgba(38,165,65,0.1)' : order.status === 'cancelled' ? 'rgba(255,97,97,0.1)' : 'rgba(255,194,51,0.1)',
                                                color: order.status === 'delivered' ? 'var(--success)' : order.status === 'cancelled' ? 'var(--danger)' : '#fbbf24'
                                            }}>
                                                {order.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <select
                                                value={order.status}
                                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                                style={{ background: 'var(--dark-3)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: 4 }}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="confirmed">Confirmed</option>
                                                <option value="shipped">Shipped</option>
                                                <option value="delivered">Delivered</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'products' && (
                <div className="card">
                    <h2 style={{ fontSize: 18, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>Manage Products</h2>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 14 }}>
                                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Product</th>
                                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Price</th>
                                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Stock</th>
                                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(p => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <img src={p.images[0] || 'https://via.placeholder.com/40'} alt="" style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 4, background: 'white' }} />
                                                <div>
                                                    <div style={{ fontWeight: 500 }}>{p.name}</div>
                                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.brand}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px', fontWeight: 600 }}>₹{p.discounted_price.toLocaleString()}</td>
                                        <td style={{ padding: '16px' }}>{p.stock}</td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{ fontSize: 12, color: p.is_active ? 'var(--success)' : 'var(--danger)' }}>
                                                {p.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', gap: 12 }}>
                                                <a href={`/product/${p.slug}`} target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)' }}><ExternalLink size={18} /></a>
                                                <button onClick={() => handleDeleteProduct(p.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'categories' && (
                <div className="card">
                    <h2 style={{ fontSize: 18, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>Manage Categories</h2>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 14 }}>
                                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Category Name</th>
                                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Type</th>
                                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parentCategories.map(parent => (
                                    <React.Fragment key={parent.id}>
                                        <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                                            <td style={{ padding: '16px', fontWeight: 600 }}>{parent.name}</td>
                                            <td style={{ padding: '16px' }}><span style={{ fontSize: 12, color: 'var(--primary-light)' }}>Parent</span></td>
                                            <td style={{ padding: '16px' }}>
                                                <button className="text-danger" onClick={() => {
                                                    if (window.confirm('Delete this category?')) categoriesAPI.delete(parent.id).then(fetchAll)
                                                }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                        {getSubcategories(parent.id).map(sub => (
                                            <tr key={sub.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                <td style={{ padding: '12px 16px 12px 40px', color: 'var(--text-secondary)' }}>— {sub.name}</td>
                                                <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Subcategory</span></td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <button className="text-danger" onClick={() => {
                                                        if (window.confirm('Delete this subcategory?')) categoriesAPI.delete(sub.id).then(fetchAll)
                                                    }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="card">
                    <h2 style={{ fontSize: 18, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>Manage Users</h2>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 14 }}>
                                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Name</th>
                                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Email</th>
                                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Role</th>
                                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '16px' }}>{u.name}</td>
                                        <td style={{ padding: '16px' }}>{u.email}</td>
                                        <td style={{ padding: '16px', textTransform: 'capitalize' }}>{u.role}</td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{
                                                fontSize: 12, fontWeight: 700, padding: '4px 8px', borderRadius: 4,
                                                background: u.is_active ? 'rgba(38,165,65,0.1)' : 'rgba(255,97,97,0.1)',
                                                color: u.is_active ? 'var(--success)' : 'var(--danger)'
                                            }}>
                                                {u.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            {u.id !== user.id && (
                                                <button
                                                    onClick={() => toggleUserActive(u.id)}
                                                    className={`btn btn-sm ${u.is_active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                                                    style={{ padding: '4px 8px', fontSize: 12 }}
                                                >
                                                    {u.is_active ? 'Deactivate' : 'Activate'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create Product Modal */}
            {showProductModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
                    <div className="card" style={{ maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ marginBottom: 20 }}>Add New Product</h2>
                        <form onSubmit={handleAddProduct}>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label>Product Name</label>
                                    <input className="form-control" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Brand</label>
                                    <input className="form-control" value={productForm.brand} onChange={e => setProductForm({ ...productForm, brand: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginTop: 12 }}>
                                <label>Description</label>
                                <textarea className="form-control" rows={3} value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} />
                            </div>
                            <div className="grid-3" style={{ marginTop: 12 }}>
                                <div className="form-group">
                                    <label>Original Price (₹)</label>
                                    <input type="number" className="form-control" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Discount %</label>
                                    <input type="number" className="form-control" value={productForm.discount_pct} onChange={e => setProductForm({ ...productForm, discount_pct: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Initial Stock</label>
                                    <input type="number" className="form-control" value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginTop: 12 }}>
                                <label>Category / Subcategory</label>
                                <select className="form-control" value={productForm.category_id} onChange={e => setProductForm({ ...productForm, category_id: e.target.value })} required>
                                    <option value="">Select Category</option>
                                    {parentCategories.map(parent => (
                                        <React.Fragment key={parent.id}>
                                            <option value={parent.id}>{parent.name}</option>
                                            {getSubcategories(parent.id).map(sub => (
                                                <option key={sub.id} value={sub.id}>&nbsp;&nbsp;&nbsp;— {sub.name}</option>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group" style={{ marginTop: 12 }}>
                                <label>Product Images</label>
                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                                    {productForm.images.filter(img => img).map((url, idx) => (
                                        <div key={idx} style={{ position: 'relative', width: 80, height: 80, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                                            <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <button
                                                type="button"
                                                onClick={() => removeProductImage(idx)}
                                                style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer', padding: 2, display: 'flex' }}
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    <label style={{
                                        width: 80, height: 80, border: '2px dashed var(--border)', borderRadius: 8,
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12
                                    }}>
                                        <Image size={24} style={{ marginBottom: 4 }} />
                                        <span>Upload</span>
                                        <input type="file" multiple accept="image/*" onChange={handleProductImageUpload} style={{ display: 'none' }} disabled={submitting} />
                                    </label>
                                </div>
                            </div>
                            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowProductModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Adding...' : 'Add Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Category Modal */}
            {showCategoryModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
                    <div className="card" style={{ maxWidth: 500, width: '100%' }}>
                        <h2 style={{ marginBottom: 20 }}>Add New Category</h2>
                        <form onSubmit={handleAddCategory}>
                            <div className="form-group">
                                <label>Category Name</label>
                                <input className="form-control" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} required />
                            </div>
                            <div className="form-group" style={{ marginTop: 12 }}>
                                <label>Parent Category (Leave empty for root category)</label>
                                <select className="form-control" value={categoryForm.parent_id} onChange={e => setCategoryForm({ ...categoryForm, parent_id: e.target.value })}>
                                    <option value="">None (Root Category)</option>
                                    {parentCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{ marginTop: 12 }}>
                                <label>Description</label>
                                <textarea className="form-control" rows={2} value={categoryForm.description} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} />
                            </div>
                            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowCategoryModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Adding...' : 'Add Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Bulk Image Match Modal */}
            {showBulkImageMatchModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
                    <div className="card" style={{ maxWidth: 500, width: '100%' }}>
                        <h2 style={{ marginBottom: 20 }}>Smart Bulk Image Match</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
                            Upload a batch of images. The system will automatically link them to products by matching the
                            <strong> filename</strong> (e.g. <code>iphone-13.jpg</code>) to the
                            <strong> product slug</strong> (e.g. <code>iphone-13</code>).
                        </p>
                        <div className="form-group" style={{ border: '2px dashed var(--border)', padding: 30, borderRadius: 'var(--radius)', textAlign: 'center' }}>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleBulkImageMatch}
                                style={{ display: 'none' }}
                                id="bulk-match-input"
                                disabled={submitting}
                            />
                            <label htmlFor="bulk-match-input" className="btn btn-primary" style={{ cursor: 'pointer' }}>
                                {submitting ? 'Matching...' : 'Select Images to Match'}
                            </label>
                        </div>
                        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowBulkImageMatchModal(false)} disabled={submitting}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}



