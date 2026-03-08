import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth
export const createSession = (sessionId) => api.post('/auth/session', { session_id: sessionId });
export const getMe = () => api.get('/auth/me');
export const logout = () => api.post('/auth/logout');

// Designs
export const uploadDesignImage = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload/design', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const createDesign = (data) => api.post('/designs', data);
export const getDesigns = () => api.get('/designs');
export const getDesign = (id) => api.get(`/designs/${id}`);
export const deleteDesign = (id) => api.delete(`/designs/${id}`);

// Products
export const createProduct = (data) => api.post('/products', data);
export const getProducts = (skip = 0, limit = 50) => api.get(`/products?skip=${skip}&limit=${limit}`);
export const getProduct = (id) => api.get(`/products/${id}`);

// Cart
export const getCart = () => api.get('/cart');
export const addToCart = (data) => api.post('/cart', data);
export const updateCartItem = (id, data) => api.put(`/cart/${id}`, data);
export const removeFromCart = (id) => api.delete(`/cart/${id}`);

// Orders
export const createOrder = (data) => api.post('/orders', data);
export const getOrders = () => api.get('/orders');
export const getOrder = (id) => api.get(`/orders/${id}`);

// Admin
export const getPendingProducts = () => api.get('/admin/products/pending');
export const approveProduct = (id) => api.post(`/admin/products/${id}/approve`);
export const rejectProduct = (id) => api.post(`/admin/products/${id}/reject`);
export const getMyProducts = () => api.get('/products/my-products');

// Enhanced Admin - Creator Management
export const getPendingCreators = () => api.get('/admin/creators/pending');
export const approveCreator = (userId) => api.post(`/admin/creators/${userId}/approve`);
export const suspendCreator = (userId) => api.post(`/admin/creators/${userId}/suspend`);
export const rejectCreator = (userId, reason) => api.post(`/admin/creators/${userId}/reject`, { reason });

// Enhanced Admin - Design Management
export const getPendingDesigns = () => api.get('/admin/designs/pending');
export const approveDesign = (designId, blueprintId, featured) => api.post(`/admin/designs/${designId}/approve`, { blueprint_id: blueprintId, featured });
export const rejectDesign = (designId, reason) => api.post(`/admin/designs/${designId}/reject`, { reason });

// Enhanced Admin - Printify & Analytics (legacy)
export const getPrintifyBlueprints = () => api.get('/admin/printify/blueprints');
export const getAdminAnalytics = () => api.get('/admin/analytics');
export const getAdminOrders = () => api.get('/admin/orders');
export const getLiveProducts = () => api.get('/admin/products/live');
export const updateProductStatus = (productId, status) => api.put(`/admin/products/${productId}/status`, { status });

// Printrove Integration
export const getPrintroveCategories = () => api.get('/admin/printrove/categories');
export const getPrintroveCategoryProducts = (categoryId) => api.get(`/admin/printrove/categories/${categoryId}`);
export const getPrintroveDesigns = () => api.get('/admin/printrove/designs');
export const getPrintroveOrders = () => api.get('/admin/printrove/orders');
export const getPrintroveOrder = (orderId) => api.get(`/admin/printrove/orders/${orderId}`);
export const checkServiceability = (pincode, country = 'IN') => api.get(`/api/serviceability?country=${country}&pincode=${pincode}`);

// Creator Earnings
export const getCreatorEarnings = () => api.get('/creator/earnings');

// Payments
export const createPaymentOrder = (data) => api.post('/payments/create-order', data);
export const verifyPayment = (data) => api.post('/payments/verify', data);

export default api;