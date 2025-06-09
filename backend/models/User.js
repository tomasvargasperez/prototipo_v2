const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Eliminar índices existentes
mongoose.connection.on('connected', async () => {
  try {
    await mongoose.connection.db.collection('users').dropIndex('id_1');
  } catch (error) {
    console.log('El índice id_1 no existe o ya fue eliminado');
  }
});

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { 
  // Deshabilitar el campo _id automático de mongoose
  strict: true,
  // Asegurarse de que no se creen índices automáticos
  autoIndex: false
});

// Método para encriptar contraseña antes de guardar
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    console.log('📝 Password no modificado, saltando hasheo');
    return next();
  }
  
  try {
    console.log('🔐 Iniciando hasheo de password...');
    console.log('Password original (length):', this.password.length);
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
    console.log('✅ Password hasheado exitosamente');
    console.log('Password hasheado (length):', this.password.length);
    next();
  } catch (error) {
    console.error('❌ Error al hashear password:', error);
    next(error);
  }
});

// Asegurarse de que no haya índices innecesarios
UserSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.password;
    return ret;
  }
});

// Crear solo los índices necesarios
UserSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', UserSchema);