const bcrypt = require('bcrypt'); 
const User = require('../models/User'); 
const jwt = require('jsonwebtoken');

class UserController 
    { constructor(){} 
	
// método logeo usuario mediante correo y password
	async login(email, password) { 
		try { 
			// Buscar al usuario por correo electrónico 
			const user = await User.findOne({ email }); 
			if (!user) {
				console.log('❌ Login fallido - Usuario no encontrado');
				return { 
					status: "error", 
					message: "Credenciales incorrectas",
					errorType: "USER_NOT_FOUND"
				}; 
			}   
			
			// Verificar si el usuario está activo
			if (!user.active) {
				console.log('❌ Login fallido - Usuario inactivo');
				return { 
					status: "error", 
					message: "Usuario inactivo. Contacte al administrador.",
					errorType: "USER_INACTIVE"
				};
			}
			
			// Comparar la contraseña proporcionada con la contraseña almacenada
			const passwordMatch = await bcrypt.compare(password, user.password); 
			if (!passwordMatch) { 
				console.log('❌ Login fallido - Contraseña incorrecta');
				return { 
					status: "error", 
					message: "Credenciales incorrectas",
					errorType: "INVALID_PASSWORD"
				}; 
			} 
			
			// Generar un token JWT para el usuario 
			const token = jwt.sign(
				{ userId: user._id }, 
				process.env.JWT_SECRET || 'tu_clave_secreta', 
				{ expiresIn: '24h' }
			); 
			
			console.log('✅ Login exitoso -', user.name);
			
			return { 
				status: "success", 
				token: token,
				user: {
					userId: user._id,
					name: user.name,
					email: user.email,
					role: user.role || 'user',
					active: user.active
				}
			};		  
		} catch (error) { 
			console.error('❌ Error en login:', error);
			return { 
				status: "error", 
				message: "Error en el servidor",
				errorType: "SERVER_ERROR"
			};
		} 
	}    

// método validateToken que estás usando en las rutas
    async validateToken(req, res, next) {
        try {
            // Verificar el token del header
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({ status: "error", message: "Token no proporcionado" });
            }
            
            // Verificar y decodificar el token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            return res.status(401).json({ status: "error", message: "Token inválido" });
        }
    }
}
module.exports = UserController;