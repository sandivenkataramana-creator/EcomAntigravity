import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('access_token')
        if (token) {
            authAPI.me()
                .then(({ data }) => setUser(data))
                .catch(() => { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token') })
                .finally(() => setLoading(false))
        } else {
            setLoading(false)
        }
    }, [])

    const login = (tokenData) => {
        localStorage.setItem('access_token', tokenData.access_token)
        localStorage.setItem('refresh_token', tokenData.refresh_token)
        setUser(tokenData.user)
    }

    const logout = () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
            {!loading && children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
