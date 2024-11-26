export const createProductCard = (product) => {
    const template = `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-image">
                ${product.imagenes && product.imagenes.length > 0 
                    ? `<img src="${product.imagenes[0]}" alt="${product.nombre}" loading="lazy">`
                    : '<div class="no-image">Sin imagen</div>'
                }
                ${product.stock < 1 ? '<span class="out-of-stock">Agotado</span>' : ''}
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.nombre}</h3>
                <p class="product-description">${product.descripcion || ''}</p>
                ${product.esAromatico ? `<p class="product-aroma">Aroma: ${product.aroma}</p>` : ''}
                <p class="product-price">$${product.precio.toLocaleString('es-CO')}</p>
                <div class="product-actions">
                    ${product.stock > 0 ? `
                        <div class="quantity-selector">
                            <button class="quantity-btn minus">-</button>
                            <input type="number" class="quantity-input" value="1" min="1" max="${product.stock}">
                            <button class="quantity-btn plus">+</button>
                        </div>
                        <button class="add-to-cart-btn" data-product-id="${product.id}">
                            Agregar al carrito
                        </button>
                    ` : '<button class="notify-stock-btn">Notificar disponibilidad</button>'}
                </div>
            </div>
        </div>
    `;
    return template;
};

export const createProductDetail = (product) => {
    const template = `
        <div class="product-detail">
            <div class="product-gallery">
                <div class="main-image">
                    ${product.imagenes && product.imagenes.length > 0 
                        ? `<img src="${product.imagenes[0]}" alt="${product.nombre}" id="main-product-image">`
                        : '<div class="no-image">Sin imagen</div>'
                    }
                </div>
                ${product.imagenes && product.imagenes.length > 1 ? `
                    <div class="thumbnail-gallery">
                        ${product.imagenes.map((img, index) => `
                            <img src="${img}" alt="Imagen ${index + 1}" 
                                class="thumbnail" onclick="changeMainImage('${img}')">
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="product-info">
                <h1 class="product-name">${product.nombre}</h1>
                <p class="product-category">${product.categoria}</p>
                <p class="product-price">$${product.precio.toLocaleString('es-CO')}</p>
                ${product.esAromatico ? `
                    <div class="product-aroma">
                        <span class="label">Aroma:</span>
                        <span class="value">${product.aroma}</span>
                    </div>
                ` : ''}
                <div class="product-description">
                    <h2>Descripción</h2>
                    <p>${product.descripcion || 'Sin descripción disponible'}</p>
                </div>
                <div class="stock-info">
                    ${product.stock > 0 
                        ? `<span class="in-stock">Stock disponible: ${product.stock} unidades</span>`
                        : '<span class="out-of-stock">Producto agotado</span>'
                    }
                </div>
                ${product.stock > 0 ? `
                    <div class="purchase-options">
                        <div class="quantity-selector">
                            <button class="quantity-btn minus">-</button>
                            <input type="number" class="quantity-input" value="1" min="1" max="${product.stock}">
                            <button class="quantity-btn plus">+</button>
                        </div>
                        <button class="add-to-cart-btn" data-product-id="${product.id}">
                            Agregar al carrito
                        </button>
                    </div>
                ` : `
                    <button class="notify-stock-btn">Notificar cuando esté disponible</button>
                `}
            </div>
        </div>
    `;
    return template;
};