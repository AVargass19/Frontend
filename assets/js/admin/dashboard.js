import { apiService } from '../api.js';
import { authService } from '../services/auth.js';
import { i18n } from '../i18n/i18n.js';
import { Chart } from 'chart.js';

class DashboardController {
    constructor() {
        this.checkAdminAuth();
        this.init();
    }

    checkAdminAuth() {
        if (!authService.checkAdmin()) {
            window.location.href = '/cuenta/login.html';
            return;
        }
    }

    async init() {
        await i18n.init();
        this.loadNotifications();
        this.initCharts();
        this.loadDashboardData();
        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('logoutBtn').addEventListener('click', () => {
            authService.logout();
        });

        document.querySelector('.menu-toggle').addEventListener('click', () => {
            document.querySelector('.admin-panel').classList.toggle('sidebar-collapsed');
        });
    }

    async loadDashboardData() {
        try {
            const dashboardData = await apiService.getDashboardData();
            this.updateDashboardCards(dashboardData);
            this.updateRecentOrders(dashboardData.recentOrders);
            this.updateLowStockProducts(dashboardData.lowStockProducts);
            this.updateCharts(dashboardData);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    updateDashboardCards(data) {
        document.querySelector('[data-stat="totalSales"]').textContent = 
            new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(data.totalSales);
        document.querySelector('[data-stat="activeUsers"]').textContent = data.activeUsers;
        document.querySelector('[data-stat="lowStock"]').textContent = data.lowStockCount;
        document.querySelector('[data-stat="pendingOrders"]').textContent = data.pendingOrders;
    }

    async loadNotifications() {
        try {
            const notifications = await apiService.getAdminNotifications();
            const container = document.querySelector('.notification-list');
            container.innerHTML = notifications.map(notification => `
                <div class="notification-item ${notification.read ? 'read' : ''}">
                    <div class="notification-icon">
                        <i class="fas ${this.getNotificationIcon(notification.type)}"></i>
                    </div>
                    <div class="notification-content">
                        <p>${notification.message}</p>
                        <span class="notification-time">${this.formatNotificationTime(notification.createdAt)}</span>
                    </div>
                </div>
            `).join('');

            document.querySelector('.notification-count').textContent = 
                notifications.filter(n => !n.read).length;
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    getNotificationIcon(type) {
        const icons = {
            'stock': 'fa-box',
            'order': 'fa-shopping-cart',
            'user': 'fa-user',
            'system': 'fa-cog'
        };
        return icons[type] || 'fa-bell';
    }

    formatNotificationTime(timestamp) {
        return new Intl.RelativeTimeFormat('es').format(
            Math.floor((new Date(timestamp) - new Date()) / 60000),
            'minutes'
        );
    }

    initCharts() {
        const salesCtx = document.getElementById('salesChart').getContext('2d');
        this.salesChart = new Chart(salesCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: i18n.t('admin.sales'),
                    data: [],
                    borderColor: '#c6302c',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });

        const productsCtx = document.getElementById('productsChart').getContext('2d');
        this.productsChart = new Chart(productsCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: i18n.t('admin.sales'),
                    data: [],
                    backgroundColor: '#c6302c'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    updateCharts(data) {
        this.salesChart.data.labels = data.salesChart.labels;
        this.salesChart.data.datasets[0].data = data.salesChart.values;
        this.salesChart.update();

        this.productsChart.data.labels = data.productsChart.labels;
        this.productsChart.data.datasets[0].data = data.productsChart.values;
        this.productsChart.update();
    }

    updateRecentOrders(orders) {
        const tbody = document.getElementById('recentOrdersTable');
        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>#${order.id}</td>
                <td>${order.customerName}</td>
                <td>${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(order.amount)}</td>
                <td><span class="status-badge ${order.status.toLowerCase()}">${i18n.t(`admin.orderStatus.${order.status}`)}</span></td>
                <td>
                    <button class="action-btn view" onclick="viewOrder(${order.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" onclick="editOrder(${order.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    updateLowStockProducts(products) {
        const tbody = document.getElementById('lowStockTable');
        if (!tbody) return;

        tbody.innerHTML = products.map(product => `
            <tr>
                <td>#${product.producto_id}</td>
                <td>
                    <div class="product-info">
                        <img src="${product.imagenes?.[0]?.url_imagen || '/assets/img/no-image.png'}" 
                            alt="${product.nombre}" 
                            class="product-thumb">
                        <span>${product.nombre}</span>
                    </div>
                </td>
                <td>
                    <span class="stock-level ${this.getStockLevelClass(product.stock)}">
                        ${product.stock} unidades
                    </span>
                </td>
                <td class="actions-column">
                    <div class="action-buttons">
                        <button class="action-btn update-stock" 
                                title="Actualizar stock"
                                onclick="dashboardController.handleStockUpdate(${product.producto_id})">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="action-btn edit" 
                                title="Editar producto"
                                onclick="dashboardController.handleProductEdit(${product.producto_id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn view" 
                                title="Ver producto"
                                onclick="dashboardController.handleProductView(${product.producto_id})">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        this.addLowStockStyles();
    }

    getStockLevelClass(stock) {
        if (stock <= 5) return 'critical';
        if (stock <= 10) return 'warning';
        return 'normal';
    }

    addLowStockStyles() {
        if (!document.getElementById('lowStockStyles')) {
            const styles = `
                .product-thumb {
                    width: 40px;
                    height: 40px;
                    object-fit: cover;
                    border-radius: 4px;
                }
                
                .product-info {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .stock-level {
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 500;
                }

                .stock-level.critical {
                    background: #fde8e8;
                    color: #dc3545;
                }

                .stock-level.warning {
                    background: #fff3e0;
                    color: #f57c00;
                }

                .stock-level.normal {
                    background: #e8f5e9;
                    color: #28a745;
                }

                .actions-column {
                    width: 120px;
                }

                .action-buttons {
                    display: flex;
                    gap: 0.5rem;
                }

                .action-btn {
                    width: 32px;
                    height: 32px;
                    border: none;
                    border-radius: 6px;
                    background: #f8f9fa;
                    color: #666;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .action-btn:hover {
                    background: #e9ecef;
                    color: var(--primary-color);
                }

                .action-btn.update-stock {
                    background: #e8f5e9;
                    color: #28a745;
                }

                .action-btn.update-stock:hover {
                    background: #28a745;
                    color: white;
                }
            `;

            const styleSheet = document.createElement('style');
            styleSheet.id = 'lowStockStyles';
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }
    }

    async handleStockUpdate(productId) {
        try {
            const result = await this.showStockUpdateDialog(productId);
            if (result) {
                const response = await apiService.updateProductStock(productId, result.newStock);
                if (response.success) {
                    this.showNotification('Stock actualizado correctamente', 'success');
                    this.loadDashboardData();
                }
            }
        } catch (error) {
            this.showNotification('Error al actualizar el stock', 'error');
            console.error('Error updating stock:', error);
        }
    }

    showStockUpdateDialog(productId) {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'stock-dialog';
            dialog.innerHTML = `
                <div class="stock-dialog-content">
                    <h3>Actualizar Stock</h3>
                    <form id="stockUpdateForm">
                        <div class="form-group">
                            <label for="newStock">Nueva cantidad:</label>
                            <input type="number" id="newStock" name="newStock" min="0" required>
                        </div>
                        <div class="dialog-buttons">
                            <button type="button" class="btn-cancel">Cancelar</button>
                            <button type="submit" class="btn-save">Actualizar</button>
                        </div>
                    </form>
                </div>
            `;

            document.body.appendChild(dialog);

            const form = dialog.querySelector('form');
            const cancelBtn = dialog.querySelector('.btn-cancel');

            form.onsubmit = (e) => {
                e.preventDefault();
                const newStock = parseInt(form.newStock.value);
                dialog.remove();
                resolve({ newStock });
            };

            cancelBtn.onclick = () => {
                dialog.remove();
                resolve(null);
            };
        });
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

export const dashboardController = new DashboardController();

window.dashboardController = dashboardController;