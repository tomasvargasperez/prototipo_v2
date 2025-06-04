// backend/models/Message.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  text: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true },
  createdAt: { type: Date, default: Date.now }
}, {
  // Configuración del esquema
  timestamps: true,
  // Deshabilitar la creación automática de índices
  autoIndex: false
});

// Crear índices manualmente
MessageSchema.index({ channel: 1, createdAt: 1 });
MessageSchema.index({ userId: 1 });

module.exports = mongoose.model('Message', MessageSchema);