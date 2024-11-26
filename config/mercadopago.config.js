import { apiService } from '../assets/js/api.js';

class MercadoPagoService {
    constructor() {
        this.mp = null;
    }

    async init(publicKey) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://sdk.mercadopago.com/js/v2';
            script.onload = () => {
                this.mp = new MercadoPago(publicKey);
                resolve();
            };
            script.onerror = () => {
                reject(new Error('No se pudo cargar el SDK de MercadoPago'));
            };
            document.body.appendChild(script);
        });
    }

    async createPaymentButton(orderId) {
        try {
            const preferenceData = await apiService.createPaymentPreference(orderId);
            
            if (!this.mp) {
                throw new Error('MercadoPago no está inicializado');
            }

            const bricksBuilder = this.mp.bricks();

            const renderComponent = async () => {
                await bricksBuilder.create("wallet", "mercadopago-button", {
                    initialization: {
                        preferenceId: preferenceData.id
                    },
                    callbacks: {
                        onReady: () => {
                            document.getElementById('loading-payment').style.display = 'none';
                        },
                        onSubmit: () => {
                            document.getElementById('payment-status').innerHTML = 'Procesando pago...';
                        },
                        onError: (error) => {
                            console.error('Error de MercadoPago:', error);
                            document.getElementById('payment-status').innerHTML = 
                                'Error al procesar el pago. Por favor, intente nuevamente.';
                        }
                    }
                });
            };

            await renderComponent();
            return preferenceData;

        } catch (error) {
            console.error('Error al crear el botón de pago:', error);
            document.getElementById('payment-status').innerHTML = 
                'Error al inicializar el pago. Por favor, intente nuevamente.';
            throw error;
        }
    }

    async checkPaymentStatus(orderId) {
        try {
            const orderStatus = await apiService.getOrderStatus(orderId);
            return orderStatus.estadoPago;
        } catch (error) {
            console.error('Error al verificar el estado del pago:', error);
            throw error;
        }
    }
}

export const mercadoPagoService = new MercadoPagoService();

const MP_PUBLIC_KEY = 'TEST-46ad626d-6261-473d-bd31-f959124689bc'; 
mercadoPagoService.init(MP_PUBLIC_KEY).catch(console.error);