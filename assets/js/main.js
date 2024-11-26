import { initI18n, changeLanguage } from '../config/i18n.config.js';
import { apiService } from './api.js';

class AppManager {
    constructor() {
        this.init();
    }

    async init() {
        this.initializeI18n();
        this.setupEventListeners();
        this.setupGlobalErrorHandling();
        await this.checkAuthStatus();
    }

    initializeI18n() {
        const userLang = localStorage.getItem('userLanguage') || navigator.language.split('-')[0];
        initI18n(userLang);
    }

    setupEventListeners() {
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const mainNav = document.querySelector('.main-nav');
        
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => {
                mainNav.classList.toggle('show');
            });
        }

        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', this.handleSearch.bind(this));
        }

        const langSelector = document.querySelector('.language-selector');
        if (langSelector) {
            langSelector.addEventListener('change', (e) => {
                changeLanguage(e.target.value);
            });
        }

        const scrollTopBtn = document.createElement('button');
        scrollTopBtn.className = 'scroll-top-btn';
        scrollTopBtn.innerHTML = '↑';
        document.body.appendChild(scrollTopBtn);

        window.addEventListener('scroll', () => {
            scrollTopBtn.classList.toggle('show', window.scrollY > 300);
        });

        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        this.setupLazyLoading();
    }

    setupLazyLoading() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });

        lazyImages.forEach(img => imageObserver.observe(img));
    }

    async handleSearch() {
        const searchModal = document.createElement('div');
        searchModal.className = 'search-modal';
        searchModal.innerHTML = `
            <div class="search-content">
                <input type="text" placeholder="Buscar productos..." class="search-input">
                <div class="search-results"></div>
                <button class="close-search">&times;</button>
            </div>
        `;

        document.body.appendChild(searchModal);
        const searchInput = searchModal.querySelector('.search-input');
        const resultsContainer = searchModal.querySelector('.search-results');

        searchInput.focus();

        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(async () => {
                const query = searchInput.value.trim();
                if (query.length < 3) {
                    resultsContainer.innerHTML = '';
                    return;
                }

                try {
                    const results = await apiService.searchProducts(query);
                    this.displaySearchResults(results, resultsContainer);
                } catch (error) {
                    console.error('Error en la búsqueda:', error);
                }
            }, 300);
        });

        searchModal.addEventListener('click', (e) => {
            if (e.target === searchModal || e.target.classList.contains('close-search')) {
                searchModal.remove();
            }
        });
    }

    displaySearchResults(results, container) {
        if (!results.length) {
            container.innerHTML = '<p class="no-results">No se encontraron productos</p>';
            return;
        }

        container.innerHTML = results.map(product => `
            <a href="/productos/detalle/${product.id}" class="search-result-item">
                <img src="${product.imagenes[0]}" alt="${product.nombre}">
                <div class="result-info">
                    <h4>${product.nombre}</h4>
                    <p class="price">$${product.precio.toLocaleString('es-CO')}</p>
                </div>
            </a>
        `).join('');
    }

    async checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const response = await apiService.validateToken();
                if (!response.valid) {
                    localStorage.removeItem('authToken');
                    this.updateAuthUI(false);
                } else {
                    this.updateAuthUI(true);
                }
            } catch (error) {
                console.error('Error al validar token:', error);
                localStorage.removeItem('authToken');
                this.updateAuthUI(false);
            }
        } else {
            this.updateAuthUI(false);
        }
    }

    updateAuthUI(isAuthenticated) {
        const authBtn = document.querySelector('.account-btn');
        if (authBtn) {
            if (isAuthenticated) {
                authBtn.href = '/cuenta/mi-cuenta.html';
            } else {
                authBtn.href = '/cuenta/login.html';
            }
        }
    }

    setupGlobalErrorHandling() {
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Error no manejado:', event.reason);
            this.showErrorNotification('Ha ocurrido un error. Por favor, intenta nuevamente.');
        });
    }

    showErrorNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => notification.remove(), 5000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AppManager();
});