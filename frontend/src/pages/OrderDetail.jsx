import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Package, Truck, Calendar, MapPin, CreditCard, ChevronLeft } from 'lucide-react'
import { ordersAPI } from '../api'

export default function OrderDetail() {
    const { id } = useParams()
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        ordersAPI.get(id)
            .then(res => setOrder(res.data))
            .catch(err => setError('Failed to load order details'))
            .finally(() => setLoading(false))
    }, [id])

    if (loading) return <div className="loading-center"><div className="spinner" /></div>
    if (error) return <div className="container" style={{ paddingTop: 100 }}><div className="alert-danger">{error}</div></div>
    if (!order) return null

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
        <div className="container" style={{ paddingTop: 100, paddingBottom: 60, maxWidth: 800 }}>
            <Link to="/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)', marginBottom: 20, textDecoration: 'none' }}>
                <ChevronLeft size={16} /> Back to Orders
            </Link>

            <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
                    <div>
                        <h2 style={{ fontSize: 24, marginBottom: 8 }}>Order #{order.id}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 14 }}>
                            <Calendar size={14} />
                            Placed on {new Date(order.created_at).toLocaleString()}
                        </div>
                    </div>
                    <div style={{
                        padding: '6px 16px',
                        borderRadius: 20,
                        fontWeight: 600,
                        fontSize: 14,
                        border: `1px solid ${getStatusColor(order.status)}`,
                        color: getStatusColor(order.status),
                        background: `${getStatusColor(order.status)}10`
                    }}>
                        {order.status.toUpperCase().replace('_', ' ')}
                    </div>
                </div>

                <div className="grid-2" style={{ gap: 20, marginBottom: 30 }}>
                    <div style={{ padding: 16, background: 'var(--dark-3)', borderRadius: 8 }}>
                        <h3 style={{ fontSize: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <MapPin size={18} color="var(--primary-light)" /> Shipping Address
                        </h3>
                        {order.address_snapshot ? (
                            <div style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
                                <strong style={{ color: 'var(--text-primary)' }}>{order.address_snapshot.full_name}</strong><br />
                                {order.address_snapshot.phone_number}<br />
                                {order.address_snapshot.street_address}<br />
                                {order.address_snapshot.city}, {order.address_snapshot.state} {order.address_snapshot.postal_code}<br />
                                {order.address_snapshot.country}
                            </div>
                        ) : (
                            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Address details not available</div>
                        )}
                    </div>

                    <div style={{ padding: 16, background: 'var(--dark-3)', borderRadius: 8 }}>
                        <h3 style={{ fontSize: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CreditCard size={18} color="var(--primary-light)" /> Payment Information
                        </h3>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span>Method:</span>
                                <strong style={{ color: 'var(--text-primary)' }}>{order.payment_method.toUpperCase()}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span>Status:</span>
                                <strong style={{ color: order.payment_status === 'completed' ? 'var(--success)' : '#fbbf24' }}>
                                    {order.payment_status.toUpperCase()}
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>

                <h3 style={{ fontSize: 18, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>Order Items</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 30 }}>
                    {order.items.map(item => (
                        <div key={item.id} style={{ display: 'flex', gap: 16, padding: 16, background: 'var(--dark-3)', borderRadius: 8 }}>
                            <img
                                src={item.product_snapshot.image || 'https://via.placeholder.com/80'}
                                alt={item.product_snapshot.name}
                                style={{ width: 80, height: 80, objectFit: 'contain', background: 'white', borderRadius: 4, padding: 4 }}
                            />
                            <div style={{ flex: 1 }}>
                                <Link to={`/product/${item.product_snapshot.name.toLowerCase().replace(/ /g, '-')}`} style={{ display: 'block', fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', textDecoration: 'none', marginBottom: 8 }}>
                                    {item.product_snapshot.name}
                                </Link>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Qty: {item.quantity}</span>
                                    <strong style={{ fontSize: 16 }}>₹{item.unit_price.toLocaleString()}</strong>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ padding: 20, background: 'var(--dark-3)', borderRadius: 8, marginLeft: 'auto', width: '100%', maxWidth: 350 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: 'var(--text-secondary)', fontSize: 14 }}>
                        <span>Subtotal</span>
                        <span>₹{order.total_amount.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: 'var(--text-secondary)', fontSize: 14 }}>
                        <span>Shipping</span>
                        <span style={{ color: 'var(--success)' }}>Free</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px dashed var(--border)', fontSize: 18, fontWeight: 700 }}>
                        <span>Total Amount</span>
                        <span>₹{order.total_amount.toLocaleString()}</span>
                    </div>
                </div>

                {order.status === 'pending' && (
                    <div style={{ marginTop: 30, display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => {
                            if (window.confirm('Are you sure you want to cancel this order?')) {
                                ordersAPI.cancel(order.id).then(() => window.location.reload()).catch(err => alert('Failed to cancel order'));
                            }
                        }}>
                            Cancel Order
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
