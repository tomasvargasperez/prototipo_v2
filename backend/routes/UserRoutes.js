const express = require('express'); 
const router = express.Router();
const bcrypt = require('bcrypt'); 
const UserSchema = require('../models/User'); 
const UserController = require('../controllers/UserController'); 
const jwt = require('jsonwebtoken');
//Importando el controllador 
const userController = new UserController(); // creando una instancia de ese controlador

// Middleware de autenticación
const authenticateToken = async (req, res, next) => {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) {
		return res.status(401).json({ message: 'No se proporcionó token de acceso' });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_clave_secreta');
		
		// Verificar si el usuario sigue activo
		const user = await UserSchema.findById(decoded.userId);
		if (!user || !user.active) {
			return res.status(403).json({ message: 'Usuario inactivo o no encontrado' });
		}

		req.user = decoded;
		next();
	} catch (err) {
		return res.status(403).json({ message: 'Token inválido' });
	}
};

// Middleware para verificar si es administrador
const isAdmin = async (req, res, next) => {
	try {
		const user = await UserSchema.findById(req.user.userId);
		if (user && user.role === 'admin') {
			next();
		} else {
			res.status(403).json({ message: 'Acceso denegado: se requieren privilegios de administrador' });
		}
	} catch (error) {
		res.status(500).json({ message: 'Error al verificar privilegios de administrador' });
	}
};

// Ruta para obtener todos los usuarios (solo admin)
router.get('/api/users', authenticateToken, isAdmin, async (req, res) => {
	try {
		const users = await UserSchema.find({}, '-password'); // Excluye el campo password
		res.json(users);
	} catch (error) {
		res.status(500).json({ message: 'Error al obtener usuarios' });
	}
});

//Obtener todos los usuarios.
router.get('/user', userController.validateToken, async (req, res) => {
     //Traer todos los usuarios 
     //Esta ruta obtiene todos los usuarios de la base de datos 
     //Usando el método find() del modelo UserSchema. 
	try {
		let users = await UserSchema.find();
		res.json(users);
	} catch (error) {
		res.status(500).json({"status": "error", "message": "Error al obtener usuarios"});
	}
});

//Obtener un usuario por su ID
router.get('/user/:id', async (req, res) => {
	try {	
    //Traer un usuario especifico pasando el ID 
    //Esta ruta obtiene un usuario específico de la base de datos 
    //usando el método findById() del modelo UserSchema. 
		var id = req.params.id; 
		let user = await UserSchema.findById(id); 
		res.json(user);
	} catch (error) {
		res.status(500).json({"status": "error", "message": "Error al obtener usuarios"});
	}
});
//Obtener un usuario mediante mail
router.get('/user/email/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const query = UserSchema.where({ email: email });
        const user = await query.findOne();
        res.json(user);
    } catch (error) {
        res.status(500).json({"status": "error", "message": "Error al buscar usuario por email"});
    }
});

//Crear un nuevo usuario
router.post('/user', async (req, res) => { 
    //Crear un usuario
    //Esta ruta crea un nuevo usuario en la base de datos. 
    //Primero se cifra la contraseña usando bcrypt. 
    const hashedPassword = await bcrypt.hash(req.body.password, 10); 
    //Se crea un nuevo objeto usuario utilizando los datos recibidos en la solicitud. 
    let user = UserSchema({
        name: req.body.name, 
        lastname: req.body.lastname, 
        email: req.body.email, 
        id: req.body.id, 
        password: hashedPassword 
    }); 
    // Se guarda el usuario en la base de datos. 
    user.save().then((result) => { 
        res.send(result);
     }).catch((err) => { 
    // Se manejan los errores que pueden ocurrir al guardar el usuario. 
            // Si el correo electrónico ya está registrado, se envía un mensaje de error. 
        if(err.code == 11000){ 
            res.send({"status" : "error", "message" :"El correo ya fue registrado"}); 
        } else { 
            // Si ocurre algún otro error, se envía un mensaje de error genérico. 
            res.send({"status" : "error", "message" :err.message}); 
        } 
    }); 
});

//Actualizar un usuario.
router.patch('/user/:id', (req, res) => {
    //Actualizar un usuario 
    //Esta ruta actualiza un usuario existente en la base de datos. 
    //Se obtiene el ID del usuario de los parámetros de la URL.
	var id = req.params.id;
   //Se crea un objeto con los datos actualizados del usuario.
	var updateUser = { 
        name: req.body.name, 
        lastname: req.body.lastname, 
        email: req.body.email, 
        id: req.body.id
    };
    // Se actualiza el usuario en la base de datos utilizando findByIdAndUpdate(). 
    UserSchema.findByIdAndUpdate(id, updateUser, {new: true}).then((result) =>   { 
        res.send(result);
        }).catch((error) => {
     // Se maneja cualquier error que pueda ocurrir al actualizar el usuario. 
        console.log(error); 
        res.send("Error actualizando el registro"); 
    }); 
});

//Eliminar un usuario.
router.delete('/user/:id', (req, res) => { 
    //Eliminar un usuario 
    // Esta ruta elimina un usuario de la base de datos.
    // Se obtiene el ID del usuario de los parámetros de la URL. 
    var id = req.params.id; 
    // Se elimina el usuario de la base de datos utilizando deleteOne(). 
    UserSchema.deleteOne({_id: id}).then(() => { 
        res.json({"status": "success", "message": "Usuario eliminado correctamente"});
         }).catch((error) => { 
        // Se maneja cualquier error que pueda ocurrir al eliminar el usuario. 
        console.log(error); 
        res.json({"status": "failed", "message": "Error al eliminar usuario"}); 
    }); 
});

// Ruta de login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await UserSchema.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }

        // Verificar si el usuario está activo
        if (!user.active) {
            return res.status(403).json({ message: 'Usuario inactivo. Contacte al administrador.' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'tu_clave_secreta',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                userId: user._id,
                name: user.name,
                email: user.email,
                role: user.role || 'user',
                active: user.active
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Ruta para actualizar usuario (solo admin)
router.patch('/api/users/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const updateData = {
            name: req.body.name,
            email: req.body.email,
            role: req.body.role,
            active: req.body.active
        };

        // Si se proporciona una nueva contraseña, encriptarla
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(req.body.password, salt);
        }

        const updatedUser = await UserSchema.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json(updatedUser);
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ message: 'Error al actualizar usuario' });
    }
});

// Ruta para eliminar usuario (solo admin)
router.delete('/api/users/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const deletedUser = await UserSchema.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ message: 'Error al eliminar usuario' });
    }
});

// Ruta para crear usuario (solo admin)
router.post('/api/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, email, password, role, active } = req.body;

        // Verificar si el email ya existe
        const existingUser = await UserSchema.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'El email ya está registrado' });
        }

        // Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Crear el nuevo usuario
        const newUser = new UserSchema({
            name,
            email,
            password: hashedPassword,
            role,
            active
        });

        const savedUser = await newUser.save();
        
        // Devolver el usuario creado sin la contraseña
        const userResponse = savedUser.toObject();
        delete userResponse.password;
        
        res.status(201).json(userResponse);
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ message: 'Error al crear usuario' });
    }
});

// Ruta para verificar estado del usuario
router.get('/api/check-status', authenticateToken, async (req, res) => {
    try {
        const user = await UserSchema.findById(req.user.userId);
        if (!user || !user.active) {
            return res.status(403).json({ message: 'Usuario inactivo o no encontrado' });
        }
        res.json({ status: 'active' });
    } catch (error) {
        res.status(500).json({ message: 'Error al verificar estado del usuario' });
    }
});

module.exports = router;