import { apiService } from './api.js';

class CartManager {
    constructor() {
        this.cartItems = [];
        this.total = 0;
        this.init();
    }

    async init() {
        try {
            await this.loadCart();
            this.setupEventListeners();
            this.setupCartObserver();
        } catch (error) {
            console.error('Error al inicializar el carrito:', error);
        }
    }

    setupEventListeners() {
        document.addEventListener('click', async (e) => {
            if (e.target.matches('.quantity-btn')) {
                const itemId = e.target.closest('.cart-item')?.dataset.itemId;
                if (!itemId) return;

                const isIncrease = e.target.classList.contains('plus');
                await this.updateQuantity(itemId, isIncrease);
            }
        });

        document.addEventListener('click', async (e) => {
            if (e.target.matches('.remove-item-btn')) {
                const itemId = e.target.closest('.cart-item')?.dataset.itemId;
                if (itemId) await this.removeItem(itemId);
            }
        });

        document.addEventListener('click', async (e) => {
            if (e.target.matches('.add-to-cart-btn')) {
                const productId = e.target.dataset.productId;
                const quantityInput = e.target.closest('.product-actions')?.querySelector('.quantity-input');
                const quantity = parseInt(quantityInput?.value || '1');
                
                await this.addItem(productId, quantity);
            }
        });
    }

    setupCartObserver() {
        const miniCart = document.querySelector('.mini-cart');
        if (miniCart) {
            const observer = new MutationObserver(() => {
                this.updateMiniCart();
            });
            observer.observe(miniCart, { childList: true, subtree: true });
        }
    }

    async loadCart() {
        try {
            const cartData = await apiService.getOrCreateCart();
            this.cartItems = cartData.items || [];
            this.total = cartData.total || 0;
            this.updateCartUI();
        } catch (error) {
            console.error('Error al cargar el carrito:', error);
            this.showNotification('Error al cargar el carrito', 'error');
        }
    }

    async addItem(productId, quantity) {
        try {
            const result = await apiService.addToCart(productId, quantity);
            await this.loadCart();
            this.showNotification('Producto agregado al carrito', 'success');
            return result;
        } catch (error) {
            console.error('Error al agregar al carrito:', error);
            this.showNotification(error.message || 'Error al agregar al carrito', 'error');
        }
    }

    async updateQuantity(itemId, isIncrease) {
        try {
            const item = this.cartItems.find(i => i.id === parseInt(itemId));
            if (!item) return;

            const newQuantity = isIncrease ? item.cantidad + 1 : item.cantidad - 1;
            if (newQuantity < 1) {
                await this.removeItem(itemId);
                return;
            }

            await apiService.updateCartItem(itemId, newQuantity);
            await this.loadCart();
        } catch (error) {
            console.error('Error al actualizar cantidad:', error);
            this.showNotification(error.message || 'Error al actualizar cantidad', 'error');
        }
    }

    async removeItem(itemId) {
        try {
            await apiService.removeCartItem(itemId);
            await this.loadCart();
            this.showNotification('Producto eliminado del carrito', 'success');
        } catch (error) {
            console.error('Error al eliminar item:', error);
            this.showNotification(error.message || 'Error al eliminar producto', 'error');
        }
    }

    updateCartUI() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const totalItems = this.cartItems.reduce((sum, item) => sum + item.cantidad, 0);
            cartCount.textContent = totalItems;
        }

        this.updateMiniCart();

        const cartItemsContainer = document.querySelector('.cart-items');
        if (cartItemsContainer) {
            this.updateCartPage();
        }
    }

    updateMiniCart() {
        const miniCart = document.querySelector('.mini-cart');
        if (!miniCart) return;

        miniCart.innerHTML = this.cartItems.length > 0 ? `
            <div class="mini-cart-items">
                ${this.cartItems.map(item => `
                    <div class="mini-cart-item">
                        <img src="${item.producto.imagenes[0]}" alt="${item.producto.nombre}">
                        <div class="item-info">
                            <p class="item-name">${item.producto.nombre}</p>
                            <p class="item-price">$${item.producto.precio.toLocaleString('es-CO')} x ${item.cantidad}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="mini-cart-footer">
                <p class="mini-cart-total">Total: $${this.total.toLocaleString('es-CO')}</p>
                <a href="/carrito.html" class="view-cart-btn">Ver Carrito</a>
                <a href="/checkout/checkout.html" class="checkout-btn">Finalizar Compra</a>
            </div>
        ` : '<p class="empty-cart">Tu carrito está vacío</p>';
    }

    updateCartPage() {
        const cartItemsContainer = document.querySelector('.cart-items');
        const cartSummary = document.querySelector('.cart-summary');

        if (cartItemsContainer) {
            if (this.cartItems.length === 0) {
                cartItemsContainer.innerHTML = `
                    <div class="empty-cart">
                        <p>Tu carrito está vacío</p>
                        <a href="/productos/todos.html" class="continue-shopping-btn">Ver productos</a>
                    </div>
                `;
                if (cartSummary) cartSummary.style.display = 'none';
                return;
            }

            cartItemsContainer.innerHTML = this.cartItems.map(item => `
                <div class="cart-item" data-item-id="${item.id}">
                    <div class="item-image">
                        <img src="${item.producto.imagenes[0]}" alt="${item.producto.nombre}">
                    </div>
                    <div class="item-details">
                        <div class="item-info">
                            <h3>${item.producto.nombre}</h3>
                            ${item.producto.esAromatico ? 
                                `<p class="item-aroma">Aroma: ${item.producto.aroma}</p>` : 
                                ''}
                            <p class="item-price">$${item.producto.precio.toLocaleString('es-CO')}</p>
                        </div>
                        <div class="item-actions">
                            <div class="quantity-controls">
                                <button class="quantity-btn minus" ${item.cantidad <= 1 ? 'disabled' : ''}>-</button>
                                <span class="quantity">${item.cantidad}</span>
                                <button class="quantity-btn plus" 
                                    ${item.cantidad >= item.producto.stock ? 'disabled' : ''}>+</button>
                            </div>
                            <button class="remove-item-btn" title="Eliminar producto">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="item-subtotal">
                        <p class="subtotal-label">Subtotal:</p>
                        <p class="subtotal-amount">
                            $${(item.producto.precio * item.cantidad).toLocaleString('es-CO')}
                        </p>
                    </div>
                </div>
            `).join('');

            if (cartSummary) {
                cartSummary.style.display = 'block';
                this.updateCartSummary();
            }
        }
    }

    updateCartSummary() {
        const cartSummary = document.querySelector('.cart-summary');
        if (!cartSummary) return;

        const subtotal = this.total;
        const envio = subtotal >= 250000 ? 0 : 12000;
        const total = subtotal + envio;

        cartSummary.innerHTML = `
            <h3>Resumen de la Orden</h3>
            <div class="summary-details">
                <div class="summary-line">
                    <span>Subtotal</span>
                    <span>$${subtotal.toLocaleString('es-CO')}</span>
                </div>
                <div class="summary-line">
                    <span>Envío</span>
                    <span>${envio === 0 ? 'Gratis' : '$' + envio.toLocaleString('es-CO')}</span>
                </div>
                <div class="summary-line total">
                    <span>Total</span>
                    <span>$${total.toLocaleString('es-CO')}</span>
                </div>
            </div>
            <div class="summary-info">
                ${subtotal < 250000 ? `
                    <p class="free-shipping-reminder">
                        ¡Agrega $${(250000 - subtotal).toLocaleString('es-CO')} más a tu compra 
                        para obtener envío gratis!
                    </p>
                ` : ''}
                <p class="tax-info">* Precios incluyen IVA</p>
            </div>
            <div class="summary-actions">
                <a href="/checkout/checkout.html" 
                    class="checkout-btn ${this.cartItems.length === 0 ? 'disabled' : ''}">
                    Proceder al pago
                </a>
                <a href="/productos/todos.html" class="continue-shopping-btn">
                    Continuar comprando
                </a>
            </div>
        `;
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <p>${message}</p>
                <button class="close-notification">&times;</button>
            </div>
        `;

        document.body.appendChild(notification);

        const closeBtn = notification.querySelector('.close-notification');
        closeBtn.addEventListener('click', () => notification.remove());

        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    calculateShipping(subtotal) {
        return subtotal >= 250000 ? 0 : 12000;
    }

    validateStock(productId, quantity) {
        const item = this.cartItems.find(item => item.producto.id === productId);
        return item && quantity <= item.producto.stock;
    }

    async clearCart() {
        try {
            await apiService.clearCart();
            await this.loadCart();
            this.showNotification('Carrito vaciado correctamente', 'success');
        } catch (error) {
            console.error('Error al vaciar el carrito:', error);
            this.showNotification('Error al vaciar el carrito', 'error');
        }
    }

    saveCartToLocalStorage() {
        try {
            localStorage.setItem('cart', JSON.stringify({
                items: this.cartItems,
                total: this.total,
                timestamp: new Date().getTime()
            }));
        } catch (error) {
            console.error('Error al guardar el carrito en localStorage:', error);
        }
    }

    loadCartFromLocalStorage() {
        try {
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
                const parsedCart = JSON.parse(savedCart);
                const timestamp = parsedCart.timestamp;
                if (new Date().getTime() - timestamp < 24 * 60 * 60 * 1000) {
                    return parsedCart;
                }
            }
        } catch (error) {
            console.error('Error al cargar el carrito desde localStorage:', error);
        }
        return null;
    }
}

export const cartManager = new CartManager();