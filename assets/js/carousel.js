document.addEventListener('DOMContentLoaded', () => {
    const carousel = {
        container: document.querySelector('.carousel-items'),
        items: document.querySelectorAll('.carousel-item'),
        prevBtn: document.querySelector('.carousel-prev'),
        nextBtn: document.querySelector('.carousel-next'),
        dotsContainer: document.querySelector('.carousel-dots'),
        currentIndex: 0,
        interval: null,
        autoPlayDelay: 5000
    };

    const updateCarousel = () => {
        carousel.container.style.transform = `translateX(-${carousel.currentIndex * 100}%)`;
        carousel.items.forEach((item, index) => item.classList.toggle('active', index === carousel.currentIndex));
        [...carousel.dotsContainer.children].forEach((dot, index) => dot.classList.toggle('active', index === carousel.currentIndex));
    };

    const showSlide = (index) => {
        carousel.currentIndex = (index + carousel.items.length) % carousel.items.length;
        updateCarousel();
    };

    const startAutoPlay = () => {
        if (carousel.interval) return;
        carousel.interval = setInterval(() => showSlide(carousel.currentIndex + 1), carousel.autoPlayDelay);
    };

    const stopAutoPlay = () => {
        clearInterval(carousel.interval);
        carousel.interval = null;
    };

    const createDots = () => {
        carousel.items.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.classList.add('carousel-dot');
            dot.addEventListener('click', () => showSlide(index));
            carousel.dotsContainer.appendChild(dot);
        });
    };

    const handleSwipe = (startX, endX) => {
        const diff = startX - endX;
        if (Math.abs(diff) > 50) showSlide(diff > 0 ? carousel.currentIndex + 1 : carousel.currentIndex - 1);
    };

    const initSwipeDetection = () => {
        let touchStartX = 0;
        carousel.container.addEventListener('touchstart', e => touchStartX = e.changedTouches[0].screenX);
        carousel.container.addEventListener('touchend', e => handleSwipe(touchStartX, e.changedTouches[0].screenX));
    };

    document.addEventListener('visibilitychange', () => document.hidden ? stopAutoPlay() : startAutoPlay());

    setTimeout(() => {
        carousel.container.style.transition = 'transform 0.5s ease-in-out';
        carousel.items.forEach(item => item.style.transition = 'opacity 0.5s ease-in-out');
    }, 100);

    createDots();
    updateCarousel();
    startAutoPlay();

    carousel.prevBtn.addEventListener('click', () => showSlide(carousel.currentIndex - 1));
    carousel.nextBtn.addEventListener('click', () => showSlide(carousel.currentIndex + 1));
    carousel.container.addEventListener('mouseenter', stopAutoPlay);
    carousel.container.addEventListener('mouseleave', startAutoPlay);
    initSwipeDetection();
});