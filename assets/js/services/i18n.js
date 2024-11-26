class I18nService {
    constructor() {
        this.currentLocale = 'es';
        this.translations = {};
        this.observers = new Set();
    }

    async init() {
        const savedLocale = localStorage.getItem('velu_locale');
        this.currentLocale = savedLocale || navigator.language.split('-')[0] || 'es';
        await this.loadTranslations(this.currentLocale);
        this.translatePage();
    }

    async loadTranslations(locale) {
        try {
            const response = await fetch(`/i18n/${locale}.json`);
            this.translations = await response.json();
        } catch (error) {
            console.error(`Error loading translations for ${locale}:`, error);
            if (locale !== 'es') {
                await this.loadTranslations('es');
            }
        }
    }

    async setLocale(locale) {
        if (this.currentLocale === locale) return;
        
        this.currentLocale = locale;
        localStorage.setItem('velu_locale', locale);
        await this.loadTranslations(locale);
        this.translatePage();
        this.notifyObservers();
    }

    translate(key, params = {}) {
        const translation = this.getNestedTranslation(key);
        if (!translation) return key;

        return this.interpolateParams(translation, params);
    }

    getNestedTranslation(key) {
        return key.split('.').reduce((obj, k) => obj && obj[k], this.translations);
    }

    interpolateParams(text, params) {
        return text.replace(/{(\w+)}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }

    translatePage() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.translate(key);
            
            if (element.tagName === 'INPUT' && element.type === 'placeholder') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });
    }

    addObserver(callback) {
        this.observers.add(callback);
        return () => this.observers.delete(callback);
    }

    notifyObservers() {
        this.observers.forEach(callback => callback(this.currentLocale));
    }

    formatCurrency(amount, currency = 'COP') {
        return new Intl.NumberFormat(this.currentLocale, {
            style: 'currency',
            currency
        }).format(amount);
    }

    formatDate(date, options = {}) {
        return new Intl.DateTimeFormat(this.currentLocale, options).format(date);
    }

    formatNumber(number, options = {}) {
        return new Intl.NumberFormat(this.currentLocale, options).format(number);
    }
}

export const i18n = new I18nService();

const exampleUsage = {
    product: {
        price: i18n.formatCurrency(19900),
        date: i18n.formatDate(new Date()),
        stock: i18n.formatNumber(1234)
    }
};