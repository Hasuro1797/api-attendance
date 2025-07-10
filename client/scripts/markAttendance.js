import { getToken, removeToken, getIp } from './utils/authorizarion.js';
function updateCurrentTime() {
  const now = new Date();
  const hora = now.toLocaleTimeString('es-ES');
  document.getElementById('currentTime').innerText = `${hora}`;
}
function getCurrentDate() {
  const now = new Date();
  const opciones = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  const fecha = now.toLocaleDateString('es-ES', opciones);
  document.getElementById('currentDate').innerText = `${fecha}`;
}

function renderAttendanceCard(data) {
  const timeContainer = document.getElementById('currentTime');
  const dateContainer = document.getElementById('currentDate');
  if (data === null) {
    timeContainer.className = 'skeleton skeleton-time';
    dateContainer.className = 'skeleton skeleton-date';
    return;
  }
  timeContainer.className = 'current-time-display';
  dateContainer.className = 'current-date';
  getCurrentDate();
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);
}
export function renderUserAvatar(user) {
  const avatar = document.getElementById('userAvatar');
  const userName = document.getElementById('userName');
  const connectionStatus = document.getElementById('connectionStatus');
  const connectionStatusText = document.getElementById('connectionStatusText');

  avatar.innerHTML = '';
  userName.innerHTML = '';
  connectionStatus.innerHTML = '';
  connectionStatusText.innerHTML = '';

  if (user === null) {
    avatar.className = 'skeleton skeleton-avatar';
    userName.className = 'skeleton skeleton-text';
    connectionStatus.className = 'skeleton skeleton-indicator';
    connectionStatusText.className = 'skeleton skeleton-text';
    return;
  }

  avatar.className = 'user-avatar';
  const icon = document.createElement('i');
  icon.className = 'fa-regular fa-user';
  avatar.appendChild(icon);
  userName.className = 'user-name';
  userName.textContent = `${user.name} ${user.lastName}`;
  connectionStatus.className = 'status-indicator indicator-online';
  connectionStatusText.textContent = `Conectado a Red Corporativa (${user.modality === 'PRESENTIAL' ? 'Oficina' : 'Remoto'})`;
  connectionStatusText.className = '';
}

function toAmPm(time) {
  if (!time) return 'Pendiente';
  let [h, m] = time.split(':');
  h = Number(h);
  let ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
}

function getDiffHours(start, end) {
  const toMinutes = (t) => {
    const [h, m, s] = t.split(':').map(Number);
    return h * 60 + m + (s >= 30 ? 1 : 0);
  };
  let mins = toMinutes(end) - toMinutes(start);
  if (mins < 0) mins = 0;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

function isToday(dateObj) {
  const now = new Date();
  return (
    dateObj.getDate() === now.getDate() &&
    dateObj.getMonth() === now.getMonth() &&
    dateObj.getFullYear() === now.getFullYear()
  );
}

function renderMyAttendance(data) {
  const currentStatus = document.getElementById('estadoActual');
  const checkInTime = document.getElementById('horaEntradaInfo');
  const checkOutTime = document.getElementById('horaSalidaInfo');
  const workedTime = document.getElementById('tiempoTrabajado');
  const checkInBtn = document.getElementById('checkInBtn');
  const checkOutBtn = document.getElementById('checkOutBtn');
  const statusMessage = document.getElementById('statusMessage');
  const statusMessageTime = document.getElementById('statusMessageTime');

  currentStatus.innerHTML = '';
  checkInTime.innerHTML = '';
  checkOutTime.innerHTML = '';
  workedTime.innerHTML = '';

  if (data === null) {
    currentStatus.className = 'skeleton skeleton-text';
    checkInTime.className = 'skeleton skeleton-text';
    checkOutTime.className = 'skeleton skeleton-text';
    workedTime.className = 'skeleton skeleton-text';
    return;
  }

  currentStatus.className = 'status-info-value';
  checkInTime.className = 'status-info-value';
  checkOutTime.className = 'status-info-value';
  workedTime.className = 'status-info-value';

  const now = new Date();
  const nowStr =
    now.getHours().toString().padStart(2, '0') +
    ':' +
    now.getMinutes().toString().padStart(2, '0') +
    ':00';

  const config = data.config;
  if (data.attendanceToday.length === 0) {
    currentStatus.textContent = 'Sin registro';
    checkInTime.textContent = 'Sin registro';
    checkOutTime.textContent = 'Sin registro';
    workedTime.textContent = 'Sin registro';
    checkInBtn.style.display = 'block';
    checkOutBtn.style.display = 'none';

    if (nowStr < config.startTime || nowStr > config.endTime) {
      checkInBtn.disabled = true;
    }
    return;
  } else {
    const attendance = data.attendanceToday[0];
    const status =
      attendance.status === 'PRESENT'
        ? 'Presente'
        : attendance.status === 'LATE'
          ? 'Tarde'
          : 'Ausente';

    const modality =
      attendance.modality === 'PRESENTIAL' ? 'Oficina' : 'Remoto';

    currentStatus.textContent = status + ' (' + modality + ')';

    checkInTime.textContent = toAmPm(attendance.checkIn);
    checkOutTime.textContent = toAmPm(attendance.checkOut);
    workedTime.textContent =
      !attendance.checkOut && !attendance.checkIn
        ? '0hrs 00min'
        : attendance.checkOut && attendance.checkIn
          ? getDiffHours(attendance.checkIn, attendance.checkOut)
          : getDiffHours(attendance.checkIn, nowStr);

    if (attendance.status === 'ABSENT') {
      checkInBtn.style.display = 'block';
      checkOutBtn.style.display = 'none';
      checkInBtn.disabled = true;
    }
    if (attendance.status === 'PRESENT' || attendance.status === 'LATE') {
      checkInBtn.style.display = 'none';
      checkOutBtn.style.display = 'block';
      statusMessage.style.display = 'block';
      statusMessageTime.textContent = toAmPm(attendance.checkIn);
    }
    if (attendance.checkIn && attendance.checkOut) {
      checkInBtn.style.display = 'none';
      checkOutBtn.style.display = 'none';
    }
  }
}

export async function getProfile() {
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

async function getMyAttendance() {
  const token = getToken();
  if (!token) {
    window.location.href = '/login.html';
  }
  const ip = await getIp();
  try {
    const response = await fetch('/api/attendance/my-attendance', {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-forwarded-for': ip,
      },
    });
    const data = await response.json();

    if (response.ok) {
      renderMyAttendance(data);
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

function renderAttendanceTable(attendances) {
  const tbody = document.getElementById('attendanceTableAttendance');
  tbody.innerHTML = '';

  if (attendances === null) {
    // Loader
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="5" class="table-loader"><i class="fas fa-spinner fa-spin"></i> Cargando datos...</td>`;
    tbody.appendChild(tr);
    return;
  }

  if (!attendances || attendances.length === 0) {
    // No results
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="5" class="table-result">No hay resultados de asistencia para mostrar.</td>`;
    tbody.appendChild(tr);
    return;
  }

  // Results
  attendances.forEach((item) => {
    const dateObj = new Date(item.createdAt);
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    const fecha = `${day}/${month}/${year}`;

    const entrada = item.checkIn ? toAmPm(item.checkIn) : '--';
    let salida = item.checkOut ? toAmPm(item.checkOut) : '--';
    const hoy = isToday(dateObj);
    if (hoy && !item.checkOut && item.checkIn) salida = 'En curso';

    let horas = '--';
    if (item.checkIn && item.checkOut) {
      horas = getDiffHours(item.checkIn, item.checkOut);
    } else if (item.checkIn && !item.checkOut && hoy) {
      const now = new Date();
      const nowStr =
        now.getHours().toString().padStart(2, '0') +
        ':' +
        now.getMinutes().toString().padStart(2, '0') +
        ':00';
      horas = getDiffHours(item.checkIn, nowStr);
    }

    let modalidad = 'Presencial';
    if (item.modality === 'REMOTE' || item.modality === 'REMOTO')
      modalidad = 'Remoto';
    if (item.modality === 'PRESENTIAL') modalidad = 'Presencial';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${fecha}</td>
      <td>${entrada}</td>
      <td>${salida}</td>
      <td>${horas}</td>
      <td>${modalidad}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function getMyAttendanceTable() {
  const token = getToken();
  if (!token) {
    window.location.href = '/login.html';
  }

  try {
    const ip = await getIp();
    const response = await fetch(
      '/api/attendance/user?currentWeek=true&sort=createdAt-desc',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-forwarded-for': ip,
        },
      },
    );
    const data = await response.json();

    if (response.ok) {
      renderAttendanceTable(data.attendances);
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
async function checkIn() {
  const token = getToken();
  if (!token) {
    window.location.href = '/login.html';
  }
  const ip = await getIp();
  const checkInButton = document.getElementById('checkInBtn');
  const checkOutButton = document.getElementById('checkOutBtn');
  const now = new Date();
  const nowStr =
    now.getHours().toString().padStart(2, '0') +
    ':' +
    now.getMinutes().toString().padStart(2, '0') +
    ':' +
    now.getSeconds().toString().padStart(2, '0');
  try {
    checkInButton.disabled = true;
    renderMyAttendance(null);
    renderAttendanceTable(null);

    const response = await fetch('/api/attendance/checkin', {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-forwarded-for': ip,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        checkIn: nowStr,
      }),
    });
    await response.json();

    if (response.ok) {
      await Promise.all([getMyAttendance(), getMyAttendanceTable()]);
      checkOutButton.style.display = 'block';
      checkInButton.style.display = 'none';
    } else {
      if (response.status === 401) {
        removeToken();
        window.location.href = '/login.html';
      }
    }
  } catch (error) {
    console.error('Error al obtener información del usuario:', error);
  } finally {
    checkInButton.disabled = false;
    // checkInIcon.classList.remove('fa-regular fa-spinner');
    // checkInIcon.classList.add('fa-regular fa-clock');
  }
}
async function checkOut() {
  const token = getToken();
  if (!token) {
    window.location.href = '/login.html';
  }
  const ip = await getIp();
  const checkOutButton = document.getElementById('checkOutBtn');
  const now = new Date();
  const nowStr =
    now.getHours().toString().padStart(2, '0') +
    ':' +
    now.getMinutes().toString().padStart(2, '0') +
    ':' +
    now.getSeconds().toString().padStart(2, '0');

  try {
    checkOutButton.disabled = true;
    renderMyAttendance(null);
    renderAttendanceTable(null);
    const response = await fetch('/api/attendance/checkout', {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-forwarded-for': ip,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        checkOut: nowStr,
      }),
    });
    await response.json();

    if (response.ok) {
      await Promise.all([getMyAttendance(), getMyAttendanceTable()]);
      checkOutButton.style.display = 'none';
    } else {
      if (response.status === 401) {
        removeToken();
        window.location.href = '/login.html';
      }
    }
  } catch (error) {
    console.error('Error al obtener información del usuario:', error);
  } finally {
    checkOutButton.disabled = false;
  }
}
window.addEventListener('DOMContentLoaded', async () => {
  renderAttendanceCard(null);
  renderUserAvatar(null);
  renderMyAttendance(null);
  renderAttendanceTable(null);
  document.getElementById('logoutBtn').addEventListener('click', () => {
    removeToken();
    window.location.href = '/login.html';
  });
  document.getElementById('checkInBtn').addEventListener('click', async () => {
    await checkIn();
  });
  document.getElementById('checkOutBtn').addEventListener('click', async () => {
    await checkOut();
  });
  const token = getToken();
  if (!token) {
    window.location.href = '/login.html';
  }
  const user = await getProfile();
  renderAttendanceCard(user);
  getMyAttendance();
  getMyAttendanceTable();
});
