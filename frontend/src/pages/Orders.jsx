import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, Truck, Info, ChevronRight } from 'lucide-react'
import { ordersAPI } from '../api'
import './Orders.css'

export default function OrdersPage() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        ordersAPI.list({ page: 1, per_page: 20 })
            .then(r => setOrders(r.data.orders))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <div className="loading-center"><div className="spinner" /></div>

    if (orders.length === 0) {
        return (
            <div className="container empty-orders">
                <Package size={80} style={{ color: 'var(--text-muted)' }} />
                <h2>You have no orders</h2>
                <p>Start shopping to see your orders here.</p>
                <Link to="/products" className="btn btn-primary btn-lg mt-4">Start Shopping</Link>
            </div>
        )
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'delivered': return 'var(--success)'
            case 'cancelled': return 'var(--danger)'
            case 'pending': return '#fbbf24'
            case 'confirmed': return 'var(--primary-light)'
            default: return 'var(--text-secondary)'
        }
    }

    return (
        <div className="orders-page">
            <div className="container">
                <div className="orders-header">
                    <h2>My Orders</h2>
                </div>

                <div className="orders-list">
                    {orders.map(order => (
                        <div key={order.id} className="order-card card">
                            <div className="order-card-header">
                                <div>
                                    <span className="order-id">Order #{order.id}</span>
                                    <span className="order-date">Placed on {new Date(order.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="order-status-badge" style={{ color: getStatusColor(order.status), borderColor: getStatusColor(order.status) }}>
                                    {order.status.toUpperCase().replace('_', ' ')}
                                </div>
                            </div>

                            <div className="order-items">
                                {order.items.map(item => (
                                    <div key={item.id} className="order-item">
                                        <img src={item.product_snapshot.image || 'https://via.placeholder.com/60'} alt={item.product_snapshot.name} />
                                        <div className="order-item-info">
                                            <Link to={`/product/${item.product_snapshot.name.toLowerCase().replace(/ /g, '-')}`} className="item-title">
                                                {item.product_snapshot.name}
                                            </Link>
                                            <p className="item-meta">Qty: {item.quantity} × ₹{item.unit_price.toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="order-card-footer">
                                <div className="order-total">
                                    Total: <strong>₹{order.total_amount.toLocaleString()}</strong>
                                    <span className="payment-type">({order.payment_method.toUpperCase()})</span>
                                </div>
                                <Link to={`/orders/${order.id}`} className="view-detail-btn">
                                    View Details <ChevronRight size={16} />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
