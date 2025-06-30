import { getToken, removeToken } from './utils/authorizarion.js';
import { getProfile } from './main.js';
function updateCurrentTime() {
  const now = new Date();
  const opciones = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  const fecha = now.toLocaleDateString('es-ES', opciones);
  const hora = now.toLocaleTimeString('es-ES');
  document.getElementById('currentTime').innerHTML =
    `<i class="far fa-clock"></i> ${fecha} | ${hora}`;
}

window.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('logoutBtn').addEventListener('click', () => {
    removeToken();
    window.location.href = '/login.html';
  });
  const token = getToken();
  if (!token) {
    window.location.href = '/login.html';
  }
  // updateCurrentTime();
  // setInterval(updateCurrentTime, 1000);
  getProfile();
});
