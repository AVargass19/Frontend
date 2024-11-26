document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/categorias/count');
        const counts = await response.json();
        
        document.querySelectorAll('.product-count').forEach(span => {
            const category = span.previousElementSibling.textContent;
            span.textContent = counts[category] || 0;
        });
    } catch (error) {
        console.error('Error cargando conteos:', error);
    }
});