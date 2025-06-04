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
				return { "status": "error", "message": "El usuario no existe" }; 
			}   
			// Comparar la contraseña proporcionada con la contraseña almacenada
			const passwordMatch = await bcrypt.compare(password, user.password); 
			 if (!passwordMatch) { 
				return { "status": "error", "message": "Contraseña incorrecta" }; 
			} 
			// Generar un token JWT para el usuario 
			const token = jwt.sign(
				{ userId: user._id, email: user.email }, 
				process.env.JWT_SECRET, 
				{ expiresIn: '1h' }
			); 
			return { 
				status: "success", 
				token: token,
				user: {
				  userId: user._id,
				  name: user.name
				}
			};		  
		} catch (error) { 
			console.log(error);
			return { "status": "error", "message": "Error al iniciar sesión"};
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