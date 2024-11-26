import { apiService } from '../api.js';
import { handleError } from '../main.js';

class CheckoutStatus {
    constructor() {
        this.init();
    }

    async init() {
        try {
            const params = new URLSearchParams(window.location.search);
            const orderId = params.get('order_id');
            const status = params.get('status');
            
            if (orderId) {
                await this.loadOrderDetails(orderId);
            }

            if (status === 'failure') {
                const errorCode = params.get('error_code');
                const errorMessage = params.get('error_message');
                this.showErrorDetails(errorCode, errorMessage);
            }

        } catch (error) {
            handleError(error);
        }
    }

    async loadOrderDetails(orderId) {
        try {
            const order = await apiService.getOrder(orderId);
            const detailsContainer = document.querySelector('.details-content');
            
            if (detailsContainer) {
                detailsContainer.innerHTML = `
                    <div class="detail-row">
                        <span>Número de orden:</span>
                        <span>#${order.id}</span>
                    </div>
                    <div class="detail-row">
                        <span>Fecha:</span>
                        <span>${new Date(order.fecha_creacion).toLocaleDateString()}</span>
                    </div>
                    <div class="detail-row">
                        <span>Total:</span>
                        <span>$${order.monto_total.toLocaleString('es-CO')}</span>
                    </div>
                    <div class="detail-row">
                        <span>Estado:</span>
                        <span>${this.formatStatus(order.estado)}</span>
                    </div>
                `;
            }
        } catch (error) {
            handleError(error);
        }
    }

    showErrorDetails(errorCode, errorMessage) {
        const detailsContainer = document.querySelector('.details-content');
        if (detailsContainer) {
            detailsContainer.innerHTML = `
                <div class="detail-row">
                    <span>Código de error:</span>
                    <span>${errorCode || 'Desconocido'}</span>
                </div>
                <div class="detail-row">
                    <span>Mensaje:</span>
                    <span>${errorMessage || 'Error al procesar el pago'}</span>
                </div>
            `;
        }
    }

    formatStatus(status) {
        const statusMap = {
            'pendiente': 'Pendiente',
            'confirmado': 'Confirmado',
            'enviado': 'Enviado',
            'entregado': 'Entregado',
            'cancelado': 'Cancelado'
        };
        return statusMap[status] || status;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CheckoutStatus();
});