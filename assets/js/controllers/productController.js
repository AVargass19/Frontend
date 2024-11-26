import { apiService } from '../api.js';
import { createProductCard, createProductDetail } from '../templates/productTemplate.js';
import { handleError } from '../main.js';

class ProductController {
    constructor() {
        this.currentPage = 0;
        this.pageSize = 12;
        this.filters = {};
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadProducts();
        this.initializeFilters();
    }

    bindEvents() {
        window.addEventListener('scroll', this.handleInfiniteScroll.bind(this));

        const filterForm = document.getElementById('filter-form');
        if (filterForm) {
            filterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFilterSubmit(e);
            });
        }

        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => this.handleSort());
        }

        document.addEventListener('click', (e) => {
            if (e.target.matches('.quantity-btn')) {
                this.handleQuantityChange(e);
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.matches('.add-to-cart-btn')) {
                this.handleAddToCart(e);
            }
        });
    }

    async loadProducts(append = false) {
        try {
            const productsContainer = document.getElementById('products-container');
            if (!productsContainer) return;

            const loading = document.createElement('div');
            loading.className = 'loading';
            loading.textContent = 'Cargando productos...';
            productsContainer.appendChild(loading);

            const response = await apiService.getProducts(this.filters, {
                page: this.currentPage,
                size: this.pageSize
            });

            loading.remove();

            if (!append) {
                productsContainer.innerHTML = '';
            }

            response.content.forEach(product => {
                const productHtml = createProductCard(product);
                productsContainer.insertAdjacentHTML('beforeend', productHtml);
            });

            this.hasMorePages = !response.last;
            this.currentPage = response.number;

        } catch (error) {
            handleError(error);
        }
    }

    async loadProductDetail(productId) {
        try {
            const product = await apiService.getProductById(productId);
            const detailContainer = document.getElementById('product-detail-container');
            if (detailContainer) {
                detailContainer.innerHTML = createProductDetail(product);
                this.initializeProductGallery();
            }
        } catch (error) {
            handleError(error);
        }
    }

    handleInfiniteScroll() {
        if (this.isLoading || !this.hasMorePages) return;

        const threshold = 100;
        if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - threshold) {
            this.currentPage++;
            this.loadProducts(true);
        }
    }

    async handleFilterSubmit(e) {
        const formData = new FormData(e.target);
        this.filters = Object.fromEntries(formData);
        this.currentPage = 0;
        await this.loadProducts();
    }

    handleSort() {
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            this.filters.sort = sortSelect.value;
            this.currentPage = 0;
            this.loadProducts();
        }
    }

    handleQuantityChange(e) {
        const isIncrease = e.target.classList.contains('plus');
        const input = e.target.parentElement.querySelector('.quantity-input');
        const currentValue = parseInt(input.value);
        const maxValue = parseInt(input.getAttribute('max'));

        if (isIncrease && currentValue < maxValue) {
            input.value = currentValue + 1;
        } else if (!isIncrease && currentValue > 1) {
            input.value = currentValue - 1;
        }
    }

    async handleAddToCart(e) {
        try {
            const productId = e.target.dataset.productId;
            const quantityInput = e.target.parentElement.querySelector('.quantity-input');
            const quantity = parseInt(quantityInput?.value || 1);

            await apiService.addToCart(productId, quantity);
            
            const notification = document.createElement('div');
            notification.className = 'notification success';
            notification.textContent = 'Producto agregado al carrito';
            document.body.appendChild(notification);

            setTimeout(() => notification.remove(), 3000);

        } catch (error) {
            handleError(error);
        }
    }

    initializeFilters() {
        const priceRange = document.getElementById('price-range');
        if (priceRange) {
            noUiSlider.create(priceRange, {
                start: [0, 500000],
                connect: true,
                range: {
                    'min': 0,
                    'max': 500000
                },
                format: {
                    to: value => Math.round(value),
                    from: value => parseInt(value)
                }
            });

            priceRange.noUiSlider.on('change', (values) => {
                this.filters.precioMin = values[0];
                this.filters.precioMax = values[1];
                this.loadProducts();
            });
        }
    }

    initializeProductGallery() {
        const mainImage = document.getElementById('main-product-image');
        const thumbnails = document.querySelectorAll('.thumbnail');

        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', () => {
                mainImage.src = thumb.src;
                thumbnails.forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            });
        });
    }
}

export default ProductController;