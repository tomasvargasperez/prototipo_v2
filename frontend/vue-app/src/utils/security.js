// frontend/vue-app/src/utils/security.js
// Utilidades de seguridad para sanitización de datos

// Variable global para guardar la función original de getItem
let originalGetItemFunction = null;

/**
 * Sanitiza datos antes de almacenar en localStorage
 * Escapa caracteres peligrosos que podrían causar XSS
 * 
 * @param {string|object} data - Datos a sanitizar
 * @returns {string|object} - Datos sanitizados
 */
export function sanitizeForStorage(data) {
    if (typeof data === 'string') {
        // Escapar caracteres peligrosos
        return data
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }
    
    // Si es un objeto, sanitizar recursivamente
    if (typeof data === 'object' && data !== null) {
        if (Array.isArray(data)) {
            return data.map(item => sanitizeForStorage(item));
        }
        
        const sanitized = {};
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                sanitized[key] = sanitizeForStorage(data[key]);
            }
        }
        return sanitized;
    }
    
    return data;
}

/**
 * Función segura para obtener datos de localStorage
 * Desanitiza los datos al leerlos (revierte el escape)
 * 
 * @param {string} key - Clave del localStorage
 * @returns {string|null} - Datos desanitizados o null
 */
export function getSafeData(key) {
    const data = localStorage.getItem(key);
    if (data) {
        try {
            // Si es JSON, parsearlo primero
            const parsed = JSON.parse(data);
            return desanitizeForStorage(parsed);
        } catch (e) {
            // Si no es JSON, desanitizar como string
            return desanitizeForStorage(data);
        }
    }
    return null;
}

/**
 * Desanitiza datos al leer de localStorage
 * Revierte el escape de caracteres HTML
 * 
 * @param {string|object} data - Datos a desanitizar
 * @returns {string|object} - Datos desanitizados
 */
function desanitizeForStorage(data) {
    if (typeof data === 'string') {
        return data
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#x27;/g, "'")
            .replace(/&#x2F;/g, '/');
    }
    
    // Si es un objeto, desanitizar recursivamente
    if (typeof data === 'object' && data !== null) {
        if (Array.isArray(data)) {
            return data.map(item => desanitizeForStorage(item));
        }
        
        const desanitized = {};
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                desanitized[key] = desanitizeForStorage(data[key]);
            }
        }
        return desanitized;
    }
    
    return data;
}

/**
 * Interceptor global para localStorage.setItem
 * Automáticamente sanitiza todos los datos antes de guardarlos
 * 
 * IMPORTANTE: Esta función debe llamarse al inicio de la aplicación
 * para interceptar todas las llamadas a localStorage.setItem
 */
export function setupLocalStorageInterceptor() {
    // Guardar la función original
    const originalGetItem = Storage.prototype.getItem;
    const originalSetItem = Storage.prototype.setItem;
    
    // Guardar referencia a la función original para acceso directo
    originalGetItemFunction = originalGetItem.bind(localStorage);
    
    // Exponer la función en window para acceso desde consola
    if (typeof window !== 'undefined') {
        window._getRawItem = originalGetItem.bind(localStorage);
    }
    
    // Sobrescribir setItem en Storage.prototype
    Storage.prototype.setItem = function(key, value) {
        let sanitizedValue = value;
        
        // Si el valor es un string que parece JSON, intentar parsearlo
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                // Si es un objeto, sanitizar recursivamente
                sanitizedValue = JSON.stringify(sanitizeForStorage(parsed));
            } catch (e) {
                // Si no es JSON, sanitizar como string
                sanitizedValue = sanitizeForStorage(value);
            }
        } else {
            // Si no es string, convertir a string y sanitizar
            sanitizedValue = sanitizeForStorage(String(value));
        }
        
        // Debug: verificar que se está sanitizando
        if (key === 'test_xss') {
            console.log('🔍 Debug - Valor original:', value);
            console.log('🔍 Debug - Valor sanitizado:', sanitizedValue);
        }
        
        // Llamar a la función original con el valor sanitizado
        return originalSetItem.call(this, key, sanitizedValue);
    };
    
    // Sobrescribir getItem en Storage.prototype
    Storage.prototype.getItem = function(key) {
        const value = originalGetItem.call(this, key);
        
        if (value === null) {
            return null;
        }
        
        // Intentar desanitizar
        try {
            const parsed = JSON.parse(value);
            return JSON.stringify(desanitizeForStorage(parsed));
        } catch (e) {
            // Si no es JSON, desanitizar como string
            return desanitizeForStorage(value);
        }
    };
    
    // Verificar que setItem fue sobrescrito
    console.log('✅ Interceptor de seguridad de localStorage activado');
    console.log('🔍 Verificando interceptor...');
    console.log('setItem es función personalizada?', localStorage.setItem.toString().includes('sanitizedValue'));
    console.log('getItem es función personalizada?', localStorage.getItem.toString().includes('desanitizeForStorage'));
}

