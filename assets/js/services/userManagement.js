import { apiService } from '../api.js';
import { i18n } from './i18n.js';
import { notificationService } from './notification.js';

class UserManagementService {
    constructor() {
        this.currentPage = 0;
        this.pageSize = 10;
        this.totalPages = 0;
        this.users = [];
    }

    async loadUsers(filters = {}) {
        try {
            const response = await apiService.getUsers({
                page: this.currentPage,
                size: this.pageSize,
                ...filters
            });

            this.users = response.content;
            this.totalPages = response.totalPages;
            this.renderUsersTable();
            this.updatePagination();
        } catch (error) {
            this.showError(i18n.t('admin.users.loadError'));
        }
    }

    renderUsersTable() {
        const tableBody = document.querySelector('#usersTable tbody');
        if (!tableBody) return;

        tableBody.innerHTML = this.users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>
                    <div class="user-info">
                        <div class="user-avatar">
                            ${this.getInitials(user.nombre, user.apellido)}
                        </div>
                        <div class="user-details">
                            <h4>${user.nombre} ${user.apellido}</h4>
                            <span class="user-email">${user.email}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="role-badge ${user.rol.toLowerCase()}">
                        ${i18n.t(`admin.users.roles.${user.rol}`)}
                    </span>
                </td>
                <td>${i18n.formatDate(new Date(user.fechaCreacion))}</td>
                <td>
                    <span class="status-badge ${user.activo ? 'active' : 'inactive'}">
                        ${user.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button onclick="viewUser(${user.id})" class="btn-view">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="editUser(${user.id})" class="btn-edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="toggleUserStatus(${user.id})" class="btn-toggle">
                            <i class="fas fa-power-off"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getInitials(nombre, apellido) {
        return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
    }

    updatePagination() {
        const pagination = document.querySelector('.pagination');
        if (!pagination) return;

        let paginationHtml = '';

        paginationHtml += `
            <button class="pagination-btn prev" 
                    ${this.currentPage === 0 ? 'disabled' : ''}
                    onclick="changePage(${this.currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        for (let i = 0; i < this.totalPages; i++) {
            paginationHtml += `
                <button class="pagination-btn number ${i === this.currentPage ? 'active' : ''}"
                        onclick="changePage(${i})">
                    ${i + 1}
                </button>
            `;
        }

        paginationHtml += `
            <button class="pagination-btn next"
                    ${this.currentPage === this.totalPages - 1 ? 'disabled' : ''}
                    onclick="changePage(${this.currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        pagination.innerHTML = paginationHtml;
    }

    async viewUser(userId) {
        try {
            const user = await apiService.getUserDetails(userId);
            this.showUserDetailsModal(user);
        } catch (error) {
            this.showError(i18n.t('admin.users.loadDetailsError'));
        }
    }

    showUserDetailsModal(user) {
    }

    async updateUser(userId, userData) {
        try {
            await apiService.updateUser(userId, userData);
            this.showSuccess(i18n.t('admin.users.updateSuccess'));
            this.loadUsers();
        } catch (error) {
            this.showError(i18n.t('admin.users.updateError'));
        }
    }

    async toggleUserStatus(userId) {
        try {
            await apiService.toggleUserStatus(userId);
            this.showSuccess(i18n.t('admin.users.statusToggleSuccess'));
            this.loadUsers();
        } catch (error) {
            this.showError(i18n.t('admin.users.statusToggleError'));
        }
    }

    showError(message) {
        notificationService.show({
            type: 'error',
            message,
            duration: 3000
        });
    }

    showSuccess(message) {
        notificationService.show({
            type: 'success',
            message,
            duration: 3000
        });
    }
}

export const userManagement = new UserManagementService();