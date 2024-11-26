import { API_URL } from '../config/api.config.js';

class ApiService {
    constructor() {
        this.baseUrl = API_URL;
        this.headers = {
            'Content-Type': 'application/json'
        };
    }

    setAuthToken(token) {
        if (token) {
            this.headers['Authorization'] = `Bearer ${token}`;
        } else {
            delete this.headers['Authorization'];
        }
    }

    async getProducts(filters = {}, pageable = { page: 0, size: 12 }) {
        const queryParams = new URLSearchParams({
            ...filters,
            page: pageable.page,
            size: pageable.size
        });
        
        if (filters.categoriaId) {
            return this.getProductsByCategory(filters.categoriaId, pageable);
        }
        
        if (filters.precioMin && filters.precioMax) {
            return this.getProductsByPriceRange(filters.precioMin, filters.precioMax, pageable);
        }
        
        if (filters.busqueda) {
            return this.searchProducts(filters.busqueda, pageable);
        }

        const response = await fetch(`${this.baseUrl}/productos?${queryParams}`, {
            headers: this.headers
        });
        if (!response.ok) throw new Error('Error al obtener productos');
        return await response.json();
    }

    async getProductsByCategory(categoryId, pageable) {
        const queryParams = new URLSearchParams({
            page: pageable.page,
            size: pageable.size
        });
        const response = await fetch(`${this.baseUrl}/productos/categoria/${categoryId}?${queryParams}`, {
            headers: this.headers
        });
        if (!response.ok) throw new Error('Error al obtener productos por categoría');
        return await response.json();
    }

    async searchProducts(searchTerm, pageable) {
        const queryParams = new URLSearchParams({
            busqueda: searchTerm,
            page: pageable.page,
            size: pageable.size
        });
        const response = await fetch(`${this.baseUrl}/productos/buscar?${queryParams}`, {
            headers: this.headers
        });
        if (!response.ok) throw new Error('Error en la búsqueda de productos');
        return await response.json();
    }

    async getOrCreateCart() {
        const response = await fetch(`${this.baseUrl}/carrito`, {
            headers: this.headers
        });
        if (!response.ok) throw new Error('Error al obtener el carrito');
        return await response.json();
    }

    async addToCart(productId, quantity) {
        const cart = await this.getOrCreateCart();
        const response = await fetch(`${this.baseUrl}/carrito/${cart.id}/agregar`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({
                productoId: productId,
                cantidad: quantity
            })
        });
        if (!response.ok) throw new Error('Error al agregar al carrito');
        return await response.json();
    }

    async updateCartItem(itemId, quantity) {
        const response = await fetch(`${this.baseUrl}/carrito/items/${itemId}`, {
            method: 'PUT',
            headers: this.headers,
            body: JSON.stringify({ cantidad: quantity })
        });
        if (!response.ok) throw new Error('Error al actualizar el carrito');
        return await response.json();
    }

    async removeCartItem(itemId) {
        const response = await fetch(`${this.baseUrl}/carrito/items/${itemId}`, {
            method: 'DELETE',
            headers: this.headers
        });
        if (!response.ok) throw new Error('Error al eliminar del carrito');
    }

    async createPaymentPreference(orderId) {
        const response = await fetch(`${this.baseUrl}/pagos/crear-preferencia`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({
                pedidoId: orderId,
                successUrl: `${window.location.origin}/checkout/success`,
                failureUrl: `${window.location.origin}/checkout/failure`,
                pendingUrl: `${window.location.origin}/checkout/pending`
            })
        });
        if (!response.ok) throw new Error('Error al crear preferencia de pago');
        return await response.json();
    }

    async createOrder(orderData) {
        const response = await fetch(`${this.baseUrl}/pedidos`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(orderData)
        });
        if (!response.ok) throw new Error('Error al crear el pedido');
        return await response.json();
    }

    async getOrderStatus(orderId) {
        const response = await fetch(`${this.baseUrl}/pedidos/${orderId}`, {
            headers: this.headers
        });
        if (!response.ok) throw new Error('Error al obtener estado del pedido');
        return await response.json();
    }
}

export const apiService = new ApiService();