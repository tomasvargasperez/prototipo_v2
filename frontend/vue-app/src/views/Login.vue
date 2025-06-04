<template>
  <div class="login-page">
    <div class="login-container">
      <h1 class="login-header">LOG IN</h1>
      
      <form @submit.prevent="login">
        <div class="input-group">
          <label for="email">Correo Electrónico</label>
          <div class="input-with-icon">
            <span class="icon">
              <i class="fas fa-envelope"></i>
            </span>
            <input 
              type="email" 
              id="email" 
              v-model="email" 
              placeholder="Tu correo electrónico"
              required
            >
          </div>
        </div>
        
        <div class="input-group">
          <label for="password">Contraseña</label>
          <div class="input-with-icon">
            <span class="icon">
              <i class="fas fa-lock"></i>
            </span>
            <input 
              type="password" 
              id="password" 
              v-model="password" 
              placeholder="Tu contraseña"
              required
            >
          </div>
        </div>       
       
        <button class="login-button" type="submit">
          INICIAR SESIÓN
        </button>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      email: '',
      password: ''
    }
  },
  methods: {
    async login() {
      try {
        const response = await fetch('http://localhost:3000/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: this.email,
            password: this.password
          })
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.message || 'Error al iniciar sesión');
          return;
        }

        if (data.token && data.user) {
          // Verificar si el usuario está activo
          if (!data.user.active) {
            alert('Su cuenta está inactiva. Por favor, contacte al administrador.');
            return;
          }

          // Guardar el token y datos del usuario
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify({
            _id: data.user.userId,
            name: data.user.name,
            role: data.user.role,
            email: data.user.email,
            active: data.user.active
          }));
          
          // Redirigir según el rol del usuario
          if (data.user.role === 'admin') {
            this.$router.push('/admin');
          } else {
            this.$router.push('/chat');
          }
        }
      } catch (error) {
        console.error('Error de login:', error);
        alert('Error al conectar con el servidor');
      }
    }
  }
}
</script>

<style scoped>
.login-page {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f5f7fa;
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-image: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: #2c3e50;
  padding: 10px 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 10;
}

.menu-items {
  display: flex;
  padding: 0 20px;
}

.menu-item {
  color: white;
  margin-right: 20px;
  font-weight: 500;
}

.login-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  width: 400px;
  padding: 40px;
  text-align: center;
}

.login-header {
  color: #2c3e50;
  margin-bottom: 30px;
  font-size: 28px;
  font-weight: 600;
}

.input-group {
  margin-bottom: 20px;
  text-align: left;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  color: #2c3e50;
  font-weight: 500;
}

.input-with-icon {
  position: relative;
}

.icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #95a5a6;
}

.input-group input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 0.3s, box-shadow 0.3s;
  box-sizing: border-box;
}

.input-group input:focus {
  border-color: #3498db;
  outline: none;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
}

.login-button {
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 12px 24px;
  font-size: 16px;
  cursor: pointer;
  width: 100%;
  transition: background-color 0.3s;
  margin-top: 10px;
  font-weight: 600;
}

.login-button:hover {
  background-color: #2980b9;
}

.links {
  margin: 15px 0;
  display: flex;
  justify-content: space-between;
}

.links a {
  color: #3498db;
  text-decoration: none;
  font-size: 14px;
}

.hover-underline:hover {
  text-decoration: underline;
}
</style>