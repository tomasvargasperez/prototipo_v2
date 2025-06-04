document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
      })
    });
    const data = await response.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('userName', data.user?.name || 'Usuario');
      localStorage.setItem('userId', data.user?.userId); // 🔥 esta línea es la clave
      window.location.href = '/chat'; // Redirección explícita
    } else {
    alert(data.message || 'Error en el login');
	}
  });