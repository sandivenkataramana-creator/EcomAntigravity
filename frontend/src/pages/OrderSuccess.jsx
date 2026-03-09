import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle, Package } from 'lucide-react'
import { ordersAPI } from '../api'

export default function OrderSuccess() {
    const { id } = useParams()
    const [order, setOrder] = useState(null)

    useEffect(() => {
        ordersAPI.get(id).then(r => setOrder(r.data)).catch(console.error)
    }, [id])

    return (
        <div className="container" style={{ paddingTop: 120, textAlign: 'center', minHeight: '70vh' }}>
            <CheckCircle size={80} color="var(--success)" style={{ marginBottom: 20 }} />
            <h1 style={{ fontSize: 28, marginBottom: 12 }}>Order Placed Successfully!</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 30 }}>
                Thank you for shopping with EcomAntigravity. Your order ID is <strong>#{id}</strong>.
            </p>

            {order && (
                <div className="card" style={{ maxWidth: 500, margin: '0 auto', textAlign: 'left', padding: 24 }}>
                    <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 16 }}>Order Details</h3>
                    <p><strong>Total Amount:</strong> ₹{order.total_amount.toLocaleString()}</p>
                    <p><strong>Payment Method:</strong> {order.payment_method.toUpperCase()}</p>
                    <p><strong>Delivery To:</strong> {order.address_snapshot.full_name}, {order.address_snapshot.city}</p>
                </div>
            )}

            <div style={{ marginTop: 40, display: 'flex', gap: 16, justifyContent: 'center' }}>
                <Link to="/orders" className="btn btn-secondary"><Package size={18} /> View Orders</Link>
                <Link to="/products" className="btn btn-primary">Continue Shopping</Link>
            </div>
        </div>
    )
}
