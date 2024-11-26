import { userManagement } from '../../assets/js/services/userManagement.js';
        import { i18n } from '../../assets/js/services/i18n.js';

        document.addEventListener('DOMContentLoaded', async () => {
            await i18n.init();
            userManagement.loadUsers();
            
            document.getElementById('searchUsers').addEventListener('input', debounce((e) => {
                userManagement.loadUsers({ search: e.target.value });
            }, 300));

            document.getElementById('roleFilter').addEventListener('change', (e) => {
                userManagement.loadUsers({ rol: e.target.value });
            });

            document.getElementById('statusFilter').addEventListener('change', (e) => {
                userManagement.loadUsers({ activo: e.target.value });
            });
        });

        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }