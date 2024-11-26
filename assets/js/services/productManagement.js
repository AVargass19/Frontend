class ProductManagement {
    constructor() {
        this.currentProduct = null;
        this.selectedImages = [];
    }

    init() {
        this.bindEvents();
        this.loadProducts();
    }

    bindEvents() {
        document.querySelector('.add-product-btn').addEventListener('click', () => this.openModal());
        document.querySelector('.close-modal').addEventListener('click', () => this.closeModal());
        document.querySelector('.btn-cancel').addEventListener('click', () => this.closeModal());
        document.querySelector('.btn-save').addEventListener('click', () => this.saveProduct());

        document.getElementById('searchProducts').addEventListener('input', (e) => {
            this.loadProducts({ search: e.target.value });
        });

        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.loadProducts({ categoria: e.target.value });
        });

        document.getElementById('stockFilter').addEventListener('change', (e) => {
            this.loadProducts({ stock: e.target.value });
        });

        const imageUpload = document.querySelector('.image-upload-area input');
        imageUpload.addEventListener('change', (e) => this.handleImageUpload(e));
    }

    async loadProducts(filters = {}) {
        try {
            const response = await fetch('/api/productos?' + new URLSearchParams(filters));
            const products = await response.json();
            this.renderProducts(products);
        } catch (error) {
            alert('Error al cargar productos');
        }
    }

    renderProducts(products) {
        const grid = document.querySelector('.products-grid');
        grid.innerHTML = products.map(product => `
            <div class="product-card">
                <div class="product-image">
                    <img src="${product.imagenes[0]?.url || '../../assets/img/no-image.png'}" 
                        alt="${product.nombre}">
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.nombre}</h3>
                    <p class="product-price">$${product.precio.toLocaleString()}</p>
                    <p class="product-stock">Stock: ${product.stock} unidades</p>
                    <div class="product-actions">
                        <button onclick="productManagement.editProduct(${product.id})" 
                                class="btn-edit">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button onclick="productManagement.toggleProductStatus(${product.id})" 
                                class="btn-toggle">
                            ${product.activo ? 'Desactivar' : 'Activar'}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    openModal(product = null) {
        this.currentProduct = product;
        const modal = document.getElementById('productModal');
        const form = document.getElementById('productForm');

        if (product) {
            form.nombre.value = product.nombre;
            form.precio.value = product.precio;
            form.stock.value = product.stock;
            form.descripcion.value = product.descripcion;
            form.categoria.value = product.categoria_id;
            form.activo.value = product.activo.toString();
            this.renderImagePreviews(product.imagenes);
        } else {
            form.reset();
            this.selectedImages = [];
            this.renderImagePreviews([]);
        }

        modal.classList.add('active');
    }

    closeModal() {
        const modal = document.getElementById('productModal');
        modal.classList.remove('active');
        this.currentProduct = null;
        this.selectedImages = [];
    }

    handleImageUpload(event) {
        const files = Array.from(event.target.files);
        this.selectedImages = [...this.selectedImages, ...files];
        this.renderImagePreviews(
            this.selectedImages.map(file => URL.createObjectURL(file))
        );
    }

    renderImagePreviews(images) {
        const preview = document.querySelector('.image-preview');
        preview.innerHTML = images.map((image, index) => `
            <div class="preview-item">
                <img src="${typeof image === 'string' ? image : URL.createObjectURL(image)}" 
                    alt="Preview">
                <button type="button" onclick="productManagement.removeImage(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    removeImage(index) {
        this.selectedImages.splice(index, 1);
        this.renderImagePreviews(this.selectedImages);
    }

    async saveProduct() {
        const form = document.getElementById('productForm');
        const formData = new FormData(form);

        this.selectedImages.forEach(image => {
            formData.append('imagenes', image);
        });

        try {
            if (this.currentProduct) {
                await fetch(`/api/productos/${this.currentProduct.id}`, {
                    method: 'PUT',
                    body: formData
                });
            } else {
                await fetch('/api/productos', {
                    method: 'POST',
                    body: formData
                });
            }

            this.closeModal();
            this.loadProducts();
            alert('Producto guardado exitosamente');
        } catch (error) {
            alert('Error al guardar el producto');
        }
    }

    async editProduct(id) {
        try {
            const response = await fetch(`/api/productos/${id}`);
            const product = await response.json();
            this.openModal(product);
        } catch (error) {
            alert('Error al cargar el producto');
        }
    }

    async toggleProductStatus(id) {
        try {
            await fetch(`/api/productos/${id}/toggle-status`, {
                method: 'PUT'
            });
            this.loadProducts();
        } catch (error) {
            alert('Error al cambiar el estado del producto');
        }
    }
}

export const productManagement = new ProductManagement();