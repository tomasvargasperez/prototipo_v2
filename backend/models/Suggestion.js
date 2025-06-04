const mongoose = require('mongoose');

const SuggestionSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        maxLength: 10000 // Establecer un límite razonable para el contenido encriptado
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'implemented'],
        default: 'pending'
    }
}, {
    timestamps: true // Agregar timestamps automáticos
});

// Middleware para validar el contenido antes de guardar
SuggestionSchema.pre('save', function(next) {
    if (this.content && this.content.length > 10000) {
        next(new Error('El contenido de la sugerencia es demasiado largo'));
    } else {
        next();
    }
});

module.exports = mongoose.model('Suggestion', SuggestionSchema); 