const API_BASE_URL = 'http://localhost:8080/api';
const TOKEN_KEY = 'velu_token';

const getHeaders = () => {
    const token = localStorage.getItem(TOKEN_KEY);
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
};

const api = {
    async login(credentials) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem(TOKEN_KEY, data.token);
                return data;
            }
            throw new Error(data.message);
        } catch (error) {
            console.error('Error en login:', error);
            throw error;
        }
    },

    async getProducts(category = null) {
        const url = category 
            ? `${API_BASE_URL}/productos?categoria=${category}`
            : `${API_BASE_URL}/productos`;
        try {
            const response = await fetch(url, {
                headers: getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error obteniendo productos:', error);
            throw error;
        }
    },

    async addToCart(productId, quantity) {
        try {
            const response = await fetch(`${API_BASE_URL}/carrito/agregar`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ productoId: productId, cantidad: quantity })
            });
            return await response.json();
        } catch (error) {
            console.error('Error agregando al carrito:', error);
            throw error;
        }
    },

    async createOrder(orderData) {
        try {
            const response = await fetch(`${API_BASE_URL}/pedidos`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(orderData)
            });
            return await response.json();
        } catch (error) {
            console.error('Error creando pedido:', error);
            throw error;
        }
    }
};

export default api;