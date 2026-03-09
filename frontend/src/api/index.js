import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
})

// Attach token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// Refresh token on 401
api.interceptors.response.use(
    (res) => res,
    async (err) => {
        const original = err.config
        if (err.response?.status === 401 && !original._retry) {
            original._retry = true
            const rt = localStorage.getItem('refresh_token')
            if (rt) {
                try {
                    const { data } = await axios.post('/api/auth/refresh', { refresh_token: rt })
                    localStorage.setItem('access_token', data.access_token)
                    localStorage.setItem('refresh_token', data.refresh_token)
                    original.headers.Authorization = `Bearer ${data.access_token}`
                    return api(original)
                } catch {
                    localStorage.clear()
                    window.location.href = '/login'
                }
            }
        }
        return Promise.reject(err)
    }
)

export default api

// Auth
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    me: () => api.get('/auth/me'),
}

// Products
export const productsAPI = {
    list: (params) => api.get('/products', { params }),
    get: (slug) => api.get(`/products/${slug}`),
    featured: (limit = 10) => api.get('/products/featured', { params: { limit } }),
    create: (data) => api.post('/products', data),
    bulkCreate: (data) => api.post('/products/bulk', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`),
}

// Categories
export const categoriesAPI = {
    list: () => api.get('/categories'),
    tree: () => api.get('/categories/tree'),
    get: (slug) => api.get(`/categories/${slug}`),
    create: (data) => api.post('/categories', data),
}

// Cart
export const cartAPI = {
    get: () => api.get('/cart'),
    add: (data) => api.post('/cart/add', data),
    update: (itemId, data) => api.put(`/cart/item/${itemId}`, data),
    remove: (itemId) => api.delete(`/cart/item/${itemId}`),
    clear: () => api.delete('/cart/clear'),
}

// Orders
export const ordersAPI = {
    place: (data) => api.post('/orders', data),
    list: (params) => api.get('/orders', { params }),
    get: (id) => api.get(`/orders/${id}`),
    cancel: (id) => api.post(`/orders/${id}/cancel`),
    adminList: (params) => api.get('/orders/admin/all', { params }),
    adminUpdateStatus: (id, status) => api.put(`/orders/admin/${id}/status`, { status }),
}

// Reviews
export const reviewsAPI = {
    listByProduct: (productId) => api.get(`/reviews/product/${productId}`),
    create: (productId, data) => api.post(`/reviews/product/${productId}`, data),
    delete: (reviewId) => api.delete(`/reviews/${reviewId}`),
}

// Users
export const usersAPI = {
    me: () => api.get('/users/me'),
    update: (data) => api.put('/users/me', data),
    addresses: () => api.get('/users/me/addresses'),
    addAddress: (data) => api.post('/users/me/addresses', data),
    updateAddress: (id, data) => api.put(`/users/me/addresses/${id}`, data),
    deleteAddress: (id) => api.delete(`/users/me/addresses/${id}`),
    wishlist: () => api.get('/users/me/wishlist'),
    addToWishlist: (productId) => api.post(`/users/me/wishlist/${productId}`),
    removeFromWishlist: (productId) => api.delete(`/users/me/wishlist/${productId}`),
    adminListUsers: () => api.get('/users/admin/all'),
    adminToggleUser: (userId) => api.put(`/users/admin/${userId}/toggle-active`),
}

// Admin stats
export const adminAPI = {
    stats: () => api.get('/admin/stats'),
    orders: (params) => api.get('/orders/admin/all', { params }),
    updateOrderStatus: (id, status) => api.put(`/orders/admin/${id}/status`, { status }),
    uploadImages: (formData) => api.post('/admin/upload-images', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    bulkImageMatch: (formData) => api.post('/admin/bulk-image-match', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
}
