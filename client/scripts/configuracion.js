import { getIp, getToken, removeToken } from './utils/authorizarion.js';

function renderUserAvatar(user) {
  const avatar = document.getElementById('userAvatar');
  const userName = document.getElementById('userName');

  avatar.innerHTML = '';
  userName.innerHTML = '';

  if (user === null) {
    avatar.className = 'skeleton skeleton-avatar';
    userName.className = 'skeleton skeleton-text';
    return;
  }

  avatar.className = 'user-avatar';
  const icon = document.createElement('i');
  icon.className = 'fa-regular fa-user';
  avatar.appendChild(icon);
  userName.className = 'user-name';
  userName.textContent = `${user.name} ${user.lastName}`;
}

async function getProfile() {
  const token = getToken();
  if (!token) {
    window.location.href = '/login.html';
  }
  const ip = await getIp();
  try {
    const response = await fetch('/api/auth/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-forwarded-for': ip,
      },
    });
    const data = await response.json();

    if (response.ok) {
      renderUserAvatar(data);
      return data;
    } else {
      if (response.status === 401) {
        removeToken();
        window.location.href = '/login.html';
      }
    }
  } catch (error) {
    console.error('Error al obtener información del usuario:', error);
  }
}

async function logOut() {
  const token = getToken();
  if (!token) {
    window.location.href = '/login.html';
  }
  try {
    const ip = await getIp();
    const response = await fetch('/api/auth/signOut', {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-forwarded-for': ip,
      },
      method: 'POST',
    });
    if (response.ok) {
      removeToken();
      window.location.href = '/login.html';
    } else {
      if (response.status === 401) {
        removeToken();
        window.location.href = '/login.html';
      }
    }
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  renderUserAvatar(null);

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await logOut();
  });

  const token = getToken();
  if (!token) {
    window.location.href = '/login.html';
  }
  const user = await getProfile();

  //Roles Components
  document.querySelectorAll('[data-role]').forEach((el) => {
    const roles = el.dataset.role.split(',').map((r) => r.trim().toUpperCase());
    if (roles.includes(user.role.toUpperCase())) {
      el.style.display = 'flex';
    }
  });
});
