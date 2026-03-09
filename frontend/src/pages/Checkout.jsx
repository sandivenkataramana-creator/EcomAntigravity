import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, ShieldCheck } from 'lucide-react'
import { usersAPI, ordersAPI } from '../api'
import { useCart } from '../context/CartContext'
import './Checkout.css'

export default function CheckoutPage() {
    const navigate = useNavigate()
    const { cart, loading: cartLoading, refreshCart } = useCart()

    const [addresses, setAddresses] = useState([])
    const [selectedAddress, setSelectedAddress] = useState(null)
    const [paymentMethod, setPaymentMethod] = useState('cod')
    const [placingOrder, setPlacingOrder] = useState(false)
    const [newAddressOpen, setNewAddressOpen] = useState(false)
    const [addrForm, setAddrForm] = useState({ full_name: '', phone: '', street: '', city: '', state: '', pincode: '', address_type: 'home' })
    const [error, setError] = useState('')

    useEffect(() => {
        usersAPI.addresses().then(r => {
            setAddresses(r.data)
            const def = r.data.find(a => a.is_default) || r.data[0]
            if (def) setSelectedAddress(def.id)
        })
    }, [])

    if (cartLoading) return <div className="loading-center"><div className="spinner" /></div>
    if (!cart || cart.items.length === 0) { navigate('/cart'); return null }

    const handleAddAddress = async (e) => {
        e.preventDefault()
        try {
            const { data } = await usersAPI.addAddress(addrForm)
            setAddresses([...addresses, data])
            setSelectedAddress(data.id)
            setNewAddressOpen(false)
        } catch (err) { setError('Failed to add address') }
    }

    const handlePlaceOrder = async () => {
        if (!selectedAddress) { setError('Please select an address'); return }
        setError('')
        try {
            setPlacingOrder(true)
            const { data } = await ordersAPI.place({ address_id: selectedAddress, payment_method: paymentMethod })
            await refreshCart()
            navigate(`/order-success/${data.id}`)
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to place order')
            setPlacingOrder(false)
        }
    }

    return (
        <div className="checkout-page bg-light">
            <div className="container checkout-layout">
                <div className="checkout-steps">

                    {/* Address Step */}
                    <div className="checkout-step card">
                        <div className="step-header">
                            <span className="step-num">1</span>
                            <h3>Delivery Address</h3>
                        </div>
                        <div className="step-body">
                            {addresses.map(addr => (
                                <label key={addr.id} className={`address-card ${selectedAddress === addr.id ? 'selected' : ''}`}>
                                    <input type="radio" name="address" checked={selectedAddress === addr.id} onChange={() => setSelectedAddress(addr.id)} />
                                    <div className="address-info">
                                        <strong>{addr.full_name} <span className="addr-type">{addr.address_type}</span></strong>
                                        <p>{addr.street}, {addr.city}, {addr.state} - <b>{addr.pincode}</b></p>
                                        <p className="addr-phone">Phone: {addr.phone}</p>
                                    </div>
                                    {selectedAddress === addr.id && <CheckCircle className="check-icon" size={20} />}
                                </label>
                            ))}

                            {!newAddressOpen ? (
                                <button className="btn btn-secondary mt-3" onClick={() => setNewAddressOpen(true)}>+ Add a new address</button>
                            ) : (
                                <form className="new-address-form mt-3" onSubmit={handleAddAddress}>
                                    <h4>Add New Address</h4>
                                    <div className="grid-2">
                                        <input className="form-control" placeholder="Name" required value={addrForm.full_name} onChange={e => setAddrForm({ ...addrForm, full_name: e.target.value })} />
                                        <input className="form-control" placeholder="10-digit mobile number" required value={addrForm.phone} onChange={e => setAddrForm({ ...addrForm, phone: e.target.value })} />
                                    </div>
                                    <input className="form-control mt-2" placeholder="Pincode" required value={addrForm.pincode} onChange={e => setAddrForm({ ...addrForm, pincode: e.target.value })} />
                                    <div className="grid-2 mt-2">
                                        <input className="form-control" placeholder="City/District/Town" required value={addrForm.city} onChange={e => setAddrForm({ ...addrForm, city: e.target.value })} />
                                        <input className="form-control" placeholder="State" required value={addrForm.state} onChange={e => setAddrForm({ ...addrForm, state: e.target.value })} />
                                    </div>
                                    <textarea className="form-control mt-2" placeholder="Address (Area and Street)" rows="3" required value={addrForm.street} onChange={e => setAddrForm({ ...addrForm, street: e.target.value })} />
                                    <div className="mt-3">
                                        <button type="submit" className="btn btn-primary">Save and Deliver Here</button>
                                        <button type="button" className="btn btn-danger ml-2" onClick={() => setNewAddressOpen(false)}>Cancel</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Payment Step */}
                    <div className="checkout-step card mt-4">
                        <div className="step-header">
                            <span className="step-num">2</span>
                            <h3>Payment Options</h3>
                        </div>
                        <div className="step-body">
                            <div className="payment-options">
                                {[
                                    { id: 'cod', label: 'Cash on Delivery (COD)' },
                                    { id: 'upi', label: 'UPI (Google Pay, PhonePe)' },
                                    { id: 'card', label: 'Credit / Debit / ATM Card' },
                                    { id: 'netbanking', label: 'Net Banking' },
                                ].map(p => (
                                    <label key={p.id} className={`payment-card ${paymentMethod === p.id ? 'selected' : ''}`}>
                                        <input type="radio" name="payment" checked={paymentMethod === p.id} onChange={() => setPaymentMethod(p.id)} />
                                        <span>{p.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>

                {/* Order Summary Sidebar */}
                <div className="checkout-summary card">
                    <h3>Order Summary</h3>
                    <hr className="divider" />

                    <div className="summary-items">
                        {cart.items.map((item, i) => (
                            <div key={i} className="summary-item">
                                <span>{item.quantity} x {item.product.name}</span>
                                <span>₹{(item.product.discounted_price * item.quantity).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>

                    <hr className="divider" />
                    <div className="summary-row">
                        <span>Price ({cart.total_items} items)</span>
                        <span>₹{cart.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="summary-row text-success">
                        <span>Discount</span>
                        <span>− ₹{cart.total_discount.toLocaleString()}</span>
                    </div>
                    <div className="summary-row">
                        <span>Delivery</span>
                        <span>{cart.subtotal - cart.total_discount >= 500 ? 'Free' : '₹40'}</span>
                    </div>
                    <hr className="divider" style={{ borderStyle: 'dashed' }} />
                    <div className="summary-total">
                        <span>Total Payable</span>
                        <span>₹{cart.total_amount.toLocaleString()}</span>
                    </div>

                    {error && <div className="error-msg alert-danger mt-3">{error}</div>}

                    <button
                        className="btn btn-accent btn-lg btn-full mt-4"
                        onClick={handlePlaceOrder}
                        disabled={placingOrder}
                    >
                        {placingOrder ? 'Processing...' : 'Place Order'}
                    </button>

                    <div className="trust-stamp mt-3">
                        <ShieldCheck size={20} color="var(--success)" />
                        <span>Safe and secure payments</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
