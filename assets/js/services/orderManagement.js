class OrderManagement {
    constructor() {
        this.init();
    }

    init() {
        this.loadOrders();
        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('statusFilter')?.addEventListener('change', e => {
            this.loadOrders({ status: e.target.value });
        });

        document.getElementById('searchOrders')?.addEventListener('input', e => {
            this.loadOrders({ search: e.target.value });
        });
    }

    async loadOrders(filters = {}) {
        try {
            const response = await fetch('/api/pedidos?' + new URLSearchParams(filters));
            const orders = await response.json();
            this.renderOrders(orders);
        } catch (error) {
            alert('Error al cargar pedidos');
        }
    }

    renderOrders(orders) {
        const tbody = document.getElementById('ordersTable');
        if (!tbody) return;

        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>#${order.pedido_id}</td>
                <td>${order.usuario.nombre} ${order.usuario.apellido}</td>
                <td>${new Date(order.fecha_creacion).toLocaleDateString()}</td>
                <td>$${order.monto_total.toLocaleString()}</td>
                <td>
                    <span class="status-badge ${order.estado.toLowerCase()}">
                        ${order.estado}
                    </span>
                </td>
                <td>
                    <button onclick="orderManager.viewOrder(${order.pedido_id})" 
                            class="btn-action">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="orderManager.updateStatus(${order.pedido_id})"
                            class="btn-action">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async updateStatus(orderId) {
        const status = prompt('Nuevo estado (PENDIENTE/CONFIRMADO/ENVIADO/ENTREGADO/CANCELADO):');
        if (!status) return;

        try {
            await fetch(`/api/pedidos/${orderId}/estado`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: status.toUpperCase() })
            });
            this.loadOrders();
        } catch (error) {
            alert('Error al actualizar estado');
        }
    }

    async viewOrder(orderId) {
        try {
            const response = await fetch(`/api/pedidos/${orderId}`);
            const order = await response.json();
            this.showOrderDetails(order);
        } catch (error) {
            alert('Error al cargar detalles');
        }
    }

    showOrderDetails(order) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Pedido #${order.pedido_id}</h2>
                    <button onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="order-info">
                        <div class="info-section">
                            <h3>Cliente</h3>
                            <p>${order.usuario.nombre} ${order.usuario.apellido}</p>
                            <p>${order.usuario.email}</p>
                        </div>
                        <div class="info-section">
                            <h3>Envío</h3>
                            <p>${order.direccion.calle}</p>
                            <p>${order.direccion.municipio}, ${order.direccion.departamento}</p>
                        </div>
                        <div class="info-section">
                            <h3>Productos</h3>
                            ${order.detalles.map(item => `
                                <div class="product-item">
                                    <span>${item.producto.nombre}</span>
                                    <span>${item.cantidad} x $${item.precio_unitario}</span>
                                </div>
                            `).join('')}
                        </div>
                        <div class="info-section">
                            <h3>Total</h3>
                            <p class="total">$${order.monto_total.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

const orderManager = new OrderManagement();