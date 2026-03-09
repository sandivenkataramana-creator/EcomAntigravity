import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { authAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true)
    const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const { login } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const from = location.state?.from?.pathname || '/'

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            if (isLogin) {
                const { data } = await authAPI.login({ email: formData.email, password: formData.password })
                login(data)
                navigate(from, { replace: true })
            } else {
                const { data } = await authAPI.register(formData)
                login(data)
                navigate(from, { replace: true })
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Authentication failed')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

    return (
        <div className="auth-page">
            <div className="auth-container card">
                <div className="auth-left">
                    <h2>{isLogin ? 'Login' : 'Looks like you\'re new here!'}</h2>
                    <p>{isLogin ? 'Get access to your Orders, Wishlist and Recommendations' : 'Sign up with your mobile number to get started'}</p>
                    <img src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&q=80" alt="Shopping" className="auth-img" />
                </div>

                <div className="auth-right">
                    <form className="auth-form" onSubmit={handleSubmit}>
                        {error && <div className="alert-danger">{error}</div>}

                        {!isLogin && (
                            <div className="form-group">
                                <input className="auth-input" type="text" name="name" placeholder="Full Name" required value={formData.name} onChange={handleChange} />
                            </div>
                        )}

                        <div className="form-group">
                            <input className="auth-input" type="email" name="email" placeholder="Email Address" required value={formData.email} onChange={handleChange} />
                        </div>

                        <div className="form-group">
                            <input className="auth-input" type="password" name="password" placeholder="Password" required minLength={6} value={formData.password} onChange={handleChange} />
                        </div>

                        {!isLogin && (
                            <div className="form-group">
                                <input className="auth-input" type="tel" name="phone" placeholder="Mobile Number (Optional)" value={formData.phone} onChange={handleChange} />
                            </div>
                        )}

                        <p className="auth-terms">By continuing, you agree to EcomAntigravity's Terms of Use and Privacy Policy.</p>

                        <button type="submit" className="btn btn-accent btn-lg btn-full" disabled={loading}>
                            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Continue')}
                        </button>

                        <div className="auth-switch">
                            <button type="button" onClick={() => { setIsLogin(!isLogin); setError('') }}>
                                {isLogin ? 'New to EcomAntigravity? Create an account' : 'Existing User? Log in'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
