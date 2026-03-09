import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { cartAPI } from '../api'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

export function CartProvider({ children }) {
    const { user } = useAuth()
    const [cart, setCart] = useState(null)
    const [loading, setLoading] = useState(false)

    const refreshCart = useCallback(async () => {
        if (!user) { setCart(null); return }
        try {
            setLoading(true)
            const { data } = await cartAPI.get()
            setCart(data)
        } catch { setCart(null) }
        finally { setLoading(false) }
    }, [user])

    useEffect(() => { refreshCart() }, [refreshCart])

    const addToCart = async (productId, quantity = 1) => {
        const { data } = await cartAPI.add({ product_id: productId, quantity })
        setCart(data)
        return data
    }

    const updateItem = async (itemId, quantity) => {
        const { data } = await cartAPI.update(itemId, { quantity })
        setCart(data)
    }

    const removeItem = async (itemId) => {
        const { data } = await cartAPI.remove(itemId)
        setCart(data)
    }

    const clearCart = async () => {
        await cartAPI.clear()
        setCart(prev => prev ? { ...prev, items: [], total_items: 0, subtotal: 0, total_discount: 0, total_amount: 0 } : null)
    }

    const itemCount = cart?.total_items || 0

    return (
        <CartContext.Provider value={{ cart, loading, itemCount, addToCart, updateItem, removeItem, clearCart, refreshCart }}>
            {children}
        </CartContext.Provider>
    )
}

export const useCart = () => useContext(CartContext)
