import { setToken, getIp } from './utils/authorizarion.js';
document
  .getElementById('loginForm')
  .addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const ip = await getIp();
      const response = await fetch('/api/auth/signIn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': ip,
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok && data.accessToken) {
        setToken(data.accessToken);
        window.location.href = 'main.html';
      } else if (response.status === 401 || response.status === 400) {
        // Error típico de credenciales inválidas
        alert('Error en login: Credenciales incorrectas');
      } else {
        // Otros errores devueltos por el backend
        alert('Error en login: ' + (data.message || 'Error desconocido'));
      }
    } catch (error) {
      // Error de conexión o fallo en fetch
      alert('Error de conexión con el servidor');
      console.error('Error de conexión:', error);
    }
  });
