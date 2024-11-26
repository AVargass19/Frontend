import { apiService } from '../api.js';
import { mercadoPagoService } from '../../config/mercadopago.config.js';
import { handleError } from '../main.js';
import { initLocationSelectors } from './services/locationData.js';

class CheckoutManager {
    constructor() {
        this.currentStep = 1;
        this.orderId = null;
        this.cart = null;
        this.init();
    }

    async init() {
        try {
            await this.loadCartSummary();
            this.bindEvents();
            this.updateStepIndicators(this.currentStep);
            await initLocationSelectors();
        } catch (error) {
            handleError(error);
        }
    }

    bindEvents() {
        const continueButton = document.getElementById('continue-payment');
        if (continueButton) {
            continueButton.addEventListener('click', async (e) => {
                e.preventDefault();
                if (await this.handleShippingSubmit()) {
                    this.navigateStep('next');
                }
            });
        }

        const backButton = document.querySelector('.back-button');
        if (backButton) {
            backButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateStep('prev');
            });
        }

        document.getElementById('municipio')?.addEventListener('change', () => {
            this.updateShippingCost();
        });
    }

    async handleShippingSubmit() {
        try {
            const form = document.getElementById('shipping-form');
            if (!form) return false;

            const formData = new FormData(form);
            const shippingData = Object.fromEntries(formData);

            if (!this.validateShippingForm(shippingData)) {
                return false;
            }

            const continueButton = document.getElementById('continue-payment');
            if (continueButton) {
                continueButton.disabled = true;
                continueButton.textContent = 'Procesando...';
            }

            const orderData = {
                direccion: shippingData,
                items: await this.getCartItems()
            };

            const response = await apiService.createOrder(orderData);
            this.orderId = response.id;

            await this.initializePayment();
            return true;

        } catch (error) {
            handleError(error);
            return false;
        } finally {
            const continueButton = document.getElementById('continue-payment');
            if (continueButton) {
                continueButton.disabled = false;
                continueButton.textContent = 'Continuar al pago';
            }
        }
    }

    validateShippingForm(data) {
        const form = document.getElementById('shipping-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            alert('Por favor ingresa un correo electrónico válido');
            return false;
        }

        if (!/^\d{10}$/.test(data.telefono)) {
            alert('Por favor ingresa un número de teléfono válido (10 dígitos)');
            return false;
        }

        return true;
    }

    async initializePayment() {
        const paymentOptions = document.querySelector('.payment-options');
        if (!paymentOptions) return;

        paymentOptions.innerHTML = `
            <div id="loading-payment">Cargando opciones de pago...</div>
            <div id="mercadopago-button"></div>
            <div id="payment-status"></div>
        `;

        try {
            await mercadoPagoService.createPaymentButton(this.orderId);
            
            const checkInterval = setInterval(async () => {
                try {
                    const status = await mercadoPagoService.checkPaymentStatus(this.orderId);
                    if (status === 'approved') {
                        clearInterval(checkInterval);
                        this.handlePaymentSuccess();
                    } else if (status === 'rejected') {
                        clearInterval(checkInterval);
                        this.handlePaymentFailure();
                    } else if (status === 'pending') {
                        this.handlePaymentPending();
                    }
                } catch (error) {
                    console.error('Error al verificar estado:', error);
                }
            }, 5000); 

            setTimeout(() => clearInterval(checkInterval), 600000);

        } catch (error) {
            paymentOptions.innerHTML = `
                <div class="error-message">
                    Error al cargar las opciones de pago. 
                    <button onclick="window.location.reload()">Intentar nuevamente</button>
                </div>
            `;
            handleError(error);
        }
    }

    handlePaymentSuccess() {
        this.navigateStep('next');
        this.showConfirmation({
            status: 'success',
            message: '¡Tu pago ha sido procesado con éxito!'
        });
    }

    handlePaymentFailure() {
        const paymentStatus = document.getElementById('payment-status');
        if (paymentStatus) {
            paymentStatus.innerHTML = `
                <div class="error-message">
                    El pago no pudo ser procesado. Por favor, intenta nuevamente.
                </div>
            `;
        }
    }

    handlePaymentPending() {
        this.navigateStep('next');
        this.showConfirmation({
            status: 'pending',
            message: 'Tu pago está en proceso de confirmación.'
        });
    }

    showConfirmation(result) {
        const confirmationSection = document.querySelector('.confirmation-section');
        const orderDetails = confirmationSection?.querySelector('.order-details');

        if (orderDetails) {
            orderDetails.innerHTML = `
                <h3>Detalles de tu pedido</h3>
                <p>Número de orden: #${this.orderId}</p>
                <p>Estado: ${result.status === 'success' ? 'Confirmado' : 'Pendiente'}</p>
                <p>${result.message}</p>
                <p>Recibirás un correo electrónico con los detalles de tu compra.</p>
            `;
        }
    }

    navigateStep(direction) {
        const currentSection = document.querySelector(`.checkout-section[data-section="${this.currentStep}"]`);
        if (currentSection) {
            currentSection.classList.remove('active');
        }

        if (direction === 'next') {
            this.currentStep = Math.min(this.currentStep + 1, 3);
        } else if (direction === 'prev') {
            this.currentStep = Math.max(this.currentStep - 1, 1);
        }

        const nextSection = document.querySelector(`.checkout-section[data-section="${this.currentStep}"]`);
        if (nextSection) {
            nextSection.classList.add('active');
        }

        this.updateStepIndicators(this.currentStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    updateStepIndicators(currentStep) {
        document.querySelectorAll('.step').forEach((step, index) => {
            const stepNumber = index + 1;
            step.classList.toggle('active', stepNumber === currentStep);
            step.classList.toggle('completed', stepNumber < currentStep);
        });
    }

    async loadCartSummary() {
        try {
            const cart = await apiService.getOrCreateCart();
            this.updateSummary(cart);
        } catch (error) {
            handleError(error);
        }
    }

    updateSummary(cart) {
        const summaryContainer = document.querySelector('.order-summary');
        if (!summaryContainer) return;

        const itemsContainer = summaryContainer.querySelector('.cart-items');
        if (!itemsContainer) return;

        const itemsHtml = cart.items.map(item => `
            <div class="summary-item">
                <span class="item-name">${item.producto.nombre}</span>
                <span class="item-quantity">x${item.cantidad}</span>
                <span class="item-price">$${(item.producto.precio * item.cantidad).toLocaleString('es-CO')}</span>
            </div>
        `).join('');

        itemsContainer.innerHTML = itemsHtml;

        const subtotal = cart.total;
        const shipping = this.calculateShipping(subtotal);
        const total = subtotal + shipping;

        summaryContainer.querySelector('.subtotal .amount').textContent = `$${subtotal.toLocaleString('es-CO')}`;
        summaryContainer.querySelector('.shipping .amount').textContent = 
            shipping === 0 ? 'Gratis' : `$${shipping.toLocaleString('es-CO')}`;
        summaryContainer.querySelector('.total .amount').textContent = `$${total.toLocaleString('es-CO')}`;
    }

    calculateShipping(subtotal) {
        if (subtotal >= 250000) return 0;
        const isBogota = document.getElementById('municipio')?.value === 'Bogotá';
        return isBogota ? 12000 : 15000;
    }

    async getCartItems() {
        const cart = await apiService.getOrCreateCart();
        return cart.items.map(item => ({
            productoId: item.producto.id,
            cantidad: item.cantidad
        }));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CheckoutManager();
});