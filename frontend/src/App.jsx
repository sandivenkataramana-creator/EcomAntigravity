import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { ChevronUp } from 'lucide-react'

// Pages
import HomePage from './pages/Home'
import ProductListing from './pages/ProductListing'
import ProductDetail from './pages/ProductDetail'
import CartPage from './pages/Cart'
import CheckoutPage from './pages/Checkout'
import AuthPage from './pages/Auth'
import ProfilePage from './pages/Profile'
import OrdersPage from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import OrderSuccess from './pages/OrderSuccess'
import AdminDashboard from './pages/AdminDashboard'

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth()
    if (loading) return <div className="loading-center"><div className="spinner" /></div>
    if (!user) return <Navigate to="/login" replace />
    return children
}

export default function App() {
    const [showScroll, setShowScroll] = React.useState(false)

    React.useEffect(() => {
        const checkScroll = () => {
            setShowScroll(window.scrollY > 400)
        }
        window.addEventListener('scroll', checkScroll)
        return () => window.removeEventListener('scroll', checkScroll)
    }, [])

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <BrowserRouter>
            <AuthProvider>
                <CartProvider>
                    <div className="app">
                        <Navbar />
                        <main className="main-content">
                            <Routes>
                                {/* Public Routes */}
                                <Route path="/" element={<HomePage />} />
                                <Route path="/products" element={<ProductListing />} />
                                <Route path="/product/:slug" element={<ProductDetail />} />
                                <Route path="/login" element={<AuthPage />} />
                                <Route path="/register" element={<AuthPage />} />

                                {/* Protected Routes */}
                                <Route path="/cart" element={<CartPage />} />
                                <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
                                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                                <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
                                <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
                                <Route path="/order-success/:id" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />

                                {/* Admin Route */}
                                <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />

                                {/* Fallback */}
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </main>
                        <Footer />
                        <button
                            className={`scroll-to-top ${showScroll ? 'visible' : ''}`}
                            onClick={scrollToTop}
                            title="Back to Top"
                        >
                            <ChevronUp size={24} />
                        </button>
                    </div>
                </CartProvider>
            </AuthProvider>
        </BrowserRouter>
    )
}
