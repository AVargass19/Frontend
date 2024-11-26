import { apiService } from '../api.js';

class AuthService {
    constructor() {
        this.tokenKey = 'velu_token';
        this.userKey = 'velu_user';
        this.init();
    }

    init() {
        const token = this.getToken();
        if (token) {
            apiService.setAuthToken(token);
        }
    }

    async login(email, password) {
        try {
            const response = await fetch(`${apiService.baseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                throw new Error('Credenciales inválidas');
            }

            const data = await response.json();
            this.setToken(data.token);
            this.setUser(data.user);
            apiService.setAuthToken(data.token);

            if (data.user.rol === 'ROLE_ADMIN') {
                window.location.href = '/admin/dashboard.html';
            } else {
                window.location.href = '/cuenta/mi-cuenta.html';
            }

            return data;
        } catch (error) {
            throw new Error('Error al iniciar sesión: ' + error.message);
        }
    }

    async register(userData) {
        try {
            const response = await fetch(`${apiService.baseUrl}/auth/registro`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error en el registro');
            }

            const data = await response.json();
            this.setToken(data.token);
            this.setUser(data.user);
            apiService.setAuthToken(data.token);

            return data;
        } catch (error) {
            throw new Error('Error en el registro: ' + error.message);
        }
    }

    logout() {
        this.removeToken();
        this.removeUser();
        apiService.setAuthToken(null);
        window.location.href = '/';
    }

    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    setToken(token) {
        localStorage.setItem(this.tokenKey, token);
    }

    removeToken() {
        localStorage.removeItem(this.tokenKey);
    }

    getUser() {
        const user = localStorage.getItem(this.userKey);
        return user ? JSON.parse(user) : null;
    }

    setUser(user) {
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    removeUser() {
        localStorage.removeItem(this.userKey);
    }

    isAuthenticated() {
        return !!this.getToken();
    }

    isAdmin() {
        const user = this.getUser();
        return user && user.rol === 'ROLE_ADMIN';
    }

    checkAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = '/cuenta/login.html';
            return false;
        }
        return true;
    }

    checkAdmin() {
        if (!this.isAdmin()) {
            window.location.href = '/';
            return false;
        }
        return true;
    }
}

export const authService = new AuthService();