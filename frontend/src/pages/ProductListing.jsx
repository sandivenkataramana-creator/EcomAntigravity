import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { SlidersHorizontal, Search, ChevronDown } from 'lucide-react'
import { productsAPI, categoriesAPI } from '../api'
import ProductCard from '../components/ProductCard'
import './ProductListing.css'

let showToastFn = null

export default function ProductListing() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [products, setProducts] = useState([])
    const [total, setTotal] = useState(0)
    const [pages, setPages] = useState(1)
    const [loading, setLoading] = useState(true)
    const [categories, setCategories] = useState([])
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [toasts, setToasts] = useState([])

    const toast = (msg, type = 'info') => {
        const id = Date.now()
        setToasts(prev => [...prev, { id, msg, type }])
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
    }

    const page = parseInt(searchParams.get('page') || '1')
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('category_id') || ''
    const sort = searchParams.get('sort') || 'created_at'
    const minPrice = searchParams.get('min_price') || ''
    const maxPrice = searchParams.get('max_price') || ''

    useEffect(() => {
        categoriesAPI.list().then(r => setCategories(r.data))
    }, [])

    useEffect(() => {
        setLoading(true)
        const params = { page, per_page: 20, sort_by: sort }
        if (search) params.search = search
        if (categoryId) params.category_id = categoryId
        if (minPrice) params.min_price = minPrice
        if (maxPrice) params.max_price = maxPrice

        productsAPI.list(params)
            .then(r => {
                setProducts(r.data.products)
                setTotal(r.data.total)
                setPages(r.data.pages)
            })
            .finally(() => setLoading(false))
    }, [page, search, categoryId, sort, minPrice, maxPrice])

    const updateParam = (key, value) => {
        const p = new URLSearchParams(searchParams)
        if (value) p.set(key, value); else p.delete(key)
        p.set('page', '1')
        setSearchParams(p)
    }

    const SORT_OPTIONS = [
        { value: 'created_at', label: 'Newest First' },
        { value: 'price_asc', label: 'Price: Low to High' },
        { value: 'price_desc', label: 'Price: High to Low' },
        { value: 'rating', label: 'Top Rated' },
    ]

    const parentCategories = categories.filter(c => !c.parent_id)
    const getSubcategories = (pid) => categories.filter(c => c.parent_id === pid)
    const activeCategory = categories.find(c => c.id === parseInt(categoryId))

    return (
        <div className="listing-page">
            <div className="toast-container">
                {toasts.map(t => <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>)}
            </div>

            <div className="container listing-layout">
                {/* Sidebar Filters */}
                <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                    <div className="sidebar-header">
                        <h3>Filters</h3>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setSearchParams(new URLSearchParams()); setSidebarOpen(false) }}>Clear All</button>
                    </div>

                    <div className="filter-group">
                        <h4>Category</h4>
                        <label className="filter-label">
                            <input type="radio" name="cat" value="" checked={!categoryId}
                                onChange={() => updateParam('category_id', '')} />
                            All Categories
                        </label>
                        {parentCategories.map(cat => (
                            <React.Fragment key={cat.id}>
                                <label className="filter-label" style={{ fontWeight: 600 }}>
                                    <input type="radio" name="cat" value={cat.id} checked={parseInt(categoryId) === cat.id}
                                        onChange={() => updateParam('category_id', cat.id)} />
                                    {cat.name}
                                </label>
                                {getSubcategories(cat.id).map(sub => (
                                    <label key={sub.id} className="filter-label" style={{ paddingLeft: 20, fontSize: 13 }}>
                                        <input type="radio" name="cat" value={sub.id} checked={parseInt(categoryId) === sub.id}
                                            onChange={() => updateParam('category_id', sub.id)} />
                                        {sub.name}
                                    </label>
                                ))}
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="filter-group">
                        <h4>Price Range</h4>
                        <input className="form-control" type="number" placeholder="Min ₹" value={minPrice}
                            onChange={(e) => updateParam('min_price', e.target.value)} />
                        <input className="form-control" type="number" placeholder="Max ₹" value={maxPrice}
                            style={{ marginTop: 8 }}
                            onChange={(e) => updateParam('max_price', e.target.value)} />
                    </div>

                    <div className="filter-group">
                        <h4>Rating</h4>
                        {[4, 3, 2].map(r => (
                            <label key={r} className="filter-label">
                                <input type="radio" name="rating" value={r}
                                    onChange={() => updateParam('min_rating', r)} />
                                {'⭐'.repeat(r)} & above
                            </label>
                        ))}
                    </div>
                </aside>

                {/* Main Content */}
                <main className="listing-main">
                    <div className="listing-toolbar">
                        <div className="listing-info">
                            <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                                <SlidersHorizontal size={18} /> Filters
                            </button>
                            <span className="result-count">
                                {activeCategory ? `Category: ${activeCategory.name}` : search ? `Results for "${search}"` : 'All Products'} <span className="count-num">({total} items)</span>
                            </span>
                        </div>
                        <div className="sort-select">
                            <ChevronDown size={16} />
                            <select value={sort} onChange={(e) => updateParam('sort', e.target.value)}>
                                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-4">
                            {[...Array(12)].map((_, i) => <div key={i} className="skeleton" style={{ height: 320 }} />)}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="empty-state">
                            <Search size={64} />
                            <h3>No products found</h3>
                            <p>Try adjusting your search or filters</p>
                            <Link to="/products" className="btn btn-primary">Browse All Products</Link>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-4">
                                {products.map(p => <ProductCard key={p.id} product={p} showToast={toast} />)}
                            </div>
                            {pages > 1 && (
                                <div className="pagination">
                                    <button className="page-btn" disabled={page === 1} onClick={() => updateParam('page', page - 1)}>‹</button>
                                    {[...Array(pages)].map((_, i) => (
                                        <button key={i} className={`page-btn ${page === i + 1 ? 'active' : ''}`}
                                            onClick={() => updateParam('page', i + 1)}>{i + 1}</button>
                                    ))}
                                    <button className="page-btn" disabled={page === pages} onClick={() => updateParam('page', page + 1)}>›</button>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    )
}
