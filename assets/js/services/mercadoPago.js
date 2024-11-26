import { apiService } from '../api.js';
import { config } from '../../config/mercadopago.config.js';

class MercadoPagoService {
    constructor() {
        this.mp = new MercadoPago(config.PUBLIC_KEY);
        this.orderId = null;
    }

    async initializeCheckout(cartItems, userInfo) {
        try {
            const orderResponse = await this.createOrder(cartItems, userInfo);
            this.orderId = orderResponse.pedidoId;

            const preference = await apiService.createPaymentPreference({
                orderId: this.orderId,
                items: this.formatItems(cartItems),
                payer: this.formatPayer(userInfo),
                backUrls: {
                    success: `${window.location.origin}/checkout/success.html`,
                    failure: `${window.location.origin}/checkout/failure.html`,
                    pending: `${window.location.origin}/checkout/pending.html`
                },
                auto_return: "approved",
                external_reference: this.orderId.toString()
            });
            this.initializePaymentButton(preference.id);

        } catch (error) {
            console.error('Error initializing checkout:', error);
            throw error;
        }
    }

    formatItems(cartItems) {
        return cartItems.map(item => ({
            title: item.nombre,
            unit_price: item.precio,
            quantity: item.cantidad,
            currency_id: "COP",
            picture_url: item.imagenes[0]?.url_imagen || '',
            description: item.descripcion || '',
            category_id: item.categoria_id.toString()
        }));
    }

    formatPayer(userInfo) {
        return {
            name: userInfo.nombre,
            surname: userInfo.apellido,
            email: userInfo.email,
            phone: {
                area_code: "",
                number: userInfo.telefono || ''
            },
            address: {
                street_name: userInfo.direccion.calle,
                street_number: "",
                zip_code: userInfo.direccion.codigo_postal
            }
        };
    }

    async createOrder(cartItems, userInfo) {
        const orderData = {
            direccionId: userInfo.direccionId,
            items: cartItems.map(item => ({
                productoId: item.producto_id,
                cantidad: item.cantidad,
                precioUnitario: item.precio
            })),
            metodoPago: 'MERCADO_PAGO',
            estado: 'PENDIENTE'
        };

        return await apiService.createOrder(orderData);
    }

    initializePaymentButton(preferenceId) {
        const container = document.getElementById('payment-button');
        if (!container) return;

        container.innerHTML = '';

        this.mp.checkout({
            preference: {
                id: preferenceId
            },
            render: {
                container: '#payment-button',
                label: 'Pagar con MercadoPago',
                type: 'wallet'
            },
            theme: {
                elementsColor: '#c6302c',
                headerColor: '#c6302c'
            }
        });
    }

    async handlePaymentResponse(searchParams) {
        const status = searchParams.get('status');
        const paymentId = searchParams.get('payment_id');
        const merchantOrderId = searchParams.get('merchant_order_id');

        await apiService.updateOrderPayment(this.orderId, {
            estado_pago: status,
            transaccion_id: paymentId,
            merchant_order_id: merchantOrderId
        });

        return {
            status,
            paymentId,
            merchantOrderId
        };
    }
}

export const mercadoPagoService = new MercadoPagoService();