// backend/utils/sanitize.js
// Utilidades para sanitización de datos en el backend

/**
 * Sanitiza un string para prevenir ataques XSS
 * Escapa caracteres HTML peligrosos
 * 
 * @param {string} input - String a sanitizar
 * @returns {string} - String sanitizado
 */
function sanitizeString(input) {
    if (typeof input !== 'string') {
        return input;
    }
    
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Sanitiza un objeto recursivamente
 * 
 * @param {object} obj - Objeto a sanitizar
 * @returns {object} - Objeto sanitizado
 */
function sanitizeObject(obj) {
    if (obj === null || obj === undefined) {
        return obj;
    }
    
    if (typeof obj === 'string') {
        return sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }
    
    if (typeof obj === 'object') {
        const sanitized = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                sanitized[key] = sanitizeObject(obj[key]);
            }
        }
        return sanitized;
    }
    
    return obj;
}

/**
 * Sanitiza el texto de un mensaje antes de guardarlo
 * 
 * @param {string} text - Texto del mensaje
 * @returns {string} - Texto sanitizado
 */
function sanitizeMessage(text) {
    if (!text || typeof text !== 'string') {
        return text;
    }
    
    return sanitizeString(text);
}

/**
 * Desanitiza texto HTML (revierte el escape)
 * Usado para mostrar texto legible en el frontend
 * 
 * @param {string} text - Texto sanitizado
 * @returns {string} - Texto desanitizado
 */
function desanitizeMessage(text) {
    if (!text || typeof text !== 'string') {
        return text;
    }
    
    return text
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/')
        .replace(/&amp;/g, '&');
}

module.exports = {
    sanitizeString,
    sanitizeObject,
    sanitizeMessage,
    desanitizeMessage
};

