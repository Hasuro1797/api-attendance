import { getIp, getToken, removeToken } from './utils/authorizarion.js';

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

function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m.toString().padStart(2, '0')}min`;
}

function getTotalScheduledHours(startTime, endTime) {
  let start = timeToMinutes(startTime);
  let end = timeToMinutes(endTime);
  let diff = end - start;
  if (diff < 0) diff = 0;

  return formatMinutes(diff);
}

function getWorkedTimeToday(attendance, config) {
  if (!attendance || attendance.length === 0) return '0h 00min';
  const registro = attendance[0];
  const { checkIn, checkOut } = registro;

  if (!checkIn) return '0h 00min';

  let start = timeToMinutes(checkIn);
  let end;

  if (checkOut) {
    end = timeToMinutes(checkOut);
  } else {
    // If checkOut is not provided, use current time but limited by endTime
    const nowDate = new Date();
    const nowMinutes = nowDate.getHours() * 60 + nowDate.getMinutes();
    const endTimeMinutes = timeToMinutes(config.endTime);

    end = Math.min(nowMinutes, endTimeMinutes);
  }

  let diff = Math.max(0, end - start);
  return formatMinutes(diff);
}

function persentageForMonth(amount) {
  return `${((amount / 21) * 100).toFixed(2)}%`;
}

function renderAttendanceTable(attendances) {
  const tbody = document.getElementById('attendanceTableBody');
  tbody.innerHTML = '';

  if (attendances === null) {
    // Loader
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="6" class="table-loader"><i class="fas fa-spinner fa-spin"></i> Cargando datos...</td>`;
    tbody.appendChild(tr);
    return;
  }

  if (!attendances || attendances.length === 0) {
    // No results
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="6" class="table-result">No hay resultados de asistencia para mostrar.</td>`;
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

    let estadoClass = '',
      estadoText = '';
    switch (item.status) {
      case 'PRESENT':
        estadoClass = 'status-presente';
        estadoText = 'Presente';
        break;
      case 'LATE':
        estadoClass = 'status-tarde';
        estadoText = 'Tarde';
        break;
      case 'ABSENT':
        estadoClass = 'status-ausente';
        estadoText = 'Ausente';
        break;
      default:
        estadoClass = 'status-presente';
        estadoText = item.status;
        break;
    }

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
      <td><span class="${estadoClass}">${estadoText}</span></td>
      <td>${entrada}</td>
      <td>${salida}</td>
      <td>${horas}</td>
      <td>${modalidad}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Helpers
function toAmPm(time) {
  if (!time) return '--';
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

function renderAllUsersAttendance(attendances) {
  const tbody = document.getElementById('attendanceTableBodyAdmin');
  tbody.innerHTML = '';

  if (attendances === null) {
    // Loader
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="6" class="table-loader"><i class="fas fa-spinner fa-spin"></i> Cargando datos...</td>`;
    tbody.appendChild(tr);
    return;
  }

  if (!attendances || attendances.length === 0) {
    // No results
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="6" class="table-result">No hay resultados de asistencia para mostrar.</td>`;
    tbody.appendChild(tr);
    return;
  }
  attendances.forEach((attendance) => {
    let statusClass = '';
    let statusText = '';
    switch (attendance.status) {
      case 'PRESENT':
        statusClass = 'status-presente';
        statusText = 'Presente';
        break;
      case 'LATE':
        statusClass = 'status-tarde';
        statusText = 'Tarde';
        break;
      case 'ABSENT':
        statusClass = 'status-ausente';
        statusText = 'Ausente';
        break;
      default:
        statusClass = 'status-presente';
        statusText = attendance.status;
        break;
    }

    const checkIn = attendance.checkIn ? toAmPm(attendance.checkIn) : '--';
    let modality = 'Presencial';
    if (attendance.modality === 'REMOTE' || attendance.modality === 'REMOTO')
      modality = 'Remoto';
    if (attendance.modality === 'PRESENTIAL') modality = 'Presencial';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${attendance.user.name} ${attendance.user.lastName}</td>
      <td><span class="${statusClass}">${statusText}</span></td>
      <td>${checkIn}</td>
      <td>${modality}</td>
      <td>${attendance.user.department}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderUserAvatar(user) {
  const avatar = document.getElementById('userAvatar');
  const userName = document.getElementById('userName');
  const welcomeMessage = document.getElementById('welcomeMessage');
  const connectionStatus = document.getElementById('connectionStatus');
  const connectionStatusText = document.getElementById('connectionStatusText');

  avatar.innerHTML = '';
  userName.innerHTML = '';
  welcomeMessage.innerHTML = '';
  connectionStatus.innerHTML = '';
  connectionStatusText.innerHTML = '';

  if (user === null) {
    avatar.className = 'skeleton skeleton-avatar';
    userName.className = 'skeleton skeleton-text';
    welcomeMessage.className = 'skeleton skeleton-text';
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
  welcomeMessage.className = 'page-subtitle';
  welcomeMessage.textContent = `Bienvenido ${user.name} ${user.lastName}, aquí esta tu resumen de asistencia`;
  connectionStatus.className = 'status-indicator indicator-online';
  connectionStatusText.textContent = `Conectado a Red Corporativa (${user.modality === 'PRESENTIAL' ? 'Oficina' : 'Remoto'})`;
  connectionStatusText.className = '';
}

function renderDashboardInfo(data) {
  const estadoActual = document.getElementById('estadoActual');
  const modalidadActual = document.getElementById('modalidadActual');
  const horasTrabajadas = document.getElementById('horasTrabajadas');
  const horasTrabajadasFooter = document.getElementById(
    'horasTrabajadasFooter',
  );
  const asistenciaMensual = document.getElementById('asistenciaMensual');
  const diasAsistidos = document.getElementById('diasAsistidos');
  const companerosEnLinea = document.getElementById('companerosEnLinea');
  const companerosDetalle = document.getElementById('companerosDetalle');

  estadoActual.innerHTML = '';
  modalidadActual.innerHTML = '';
  horasTrabajadas.innerHTML = '';
  horasTrabajadasFooter.innerHTML = '';
  asistenciaMensual.innerHTML = '';
  diasAsistidos.innerHTML = '';
  companerosEnLinea.innerHTML = '';
  companerosDetalle.innerHTML = '';

  if (data === null) {
    estadoActual.className = 'skeleton skeleton-status';
    modalidadActual.className = 'skeleton skeleton-text';
    horasTrabajadas.className = 'skeleton skeleton-status';
    horasTrabajadasFooter.className = 'skeleton skeleton-text';
    asistenciaMensual.className = 'skeleton skeleton-status';
    diasAsistidos.className = 'skeleton skeleton-text';
    companerosEnLinea.className = 'skeleton skeleton-status';
    companerosDetalle.className = 'skeleton skeleton-text';
    return;
  }

  let status = '';
  if (data.attendanceToday.attendance.length === 0) {
    status = 'Ausente';
  } else {
    status =
      data.attendanceToday.attendance[0].status === 'PRESENT'
        ? 'Presente'
        : 'Tarde';
  }

  estadoActual.className = 'card-content';
  modalidadActual.className = 'card-footer';
  horasTrabajadas.className = 'card-content';
  horasTrabajadasFooter.className = 'card-footer';
  asistenciaMensual.className = 'card-content';
  diasAsistidos.className = 'card-footer';
  companerosEnLinea.className = 'card-content';
  companerosDetalle.className = 'card-footer';

  estadoActual.textContent = status;
  modalidadActual.textContent = `Modalidad: ${data.modality === 'PRESENTIAL' ? 'Presencial(Oficina)' : 'Remoto(Home Office)'}`;
  horasTrabajadas.textContent = getWorkedTimeToday(
    data.attendanceToday.attendance,
    data.attendanceToday.config,
  );
  horasTrabajadasFooter.textContent = `De ${getTotalScheduledHours(
    data.attendanceToday.config.startTime,
    data.attendanceToday.config.endTime,
  )} programadas`;
  asistenciaMensual.textContent = persentageForMonth(data.attendanceByMonth);
  diasAsistidos.textContent = `${data.attendanceByMonth}/21 dias asistidos`;
  companerosEnLinea.textContent = `${data.attendanceToday.countOnline.countPresentialOnline + data.attendanceToday.countOnline.countRemoteOnline}/${data.attendanceToday.countOnline.totalUsers}`;
  companerosDetalle.textContent = `${data.attendanceToday.countOnline.countPresentialOnline} presenciales | ${data.attendanceToday.countOnline.countRemoteOnline} remotos`;
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

async function findUserByDashboard() {
  const token = getToken();
  if (!token) {
    window.location.href = '/login.html';
  }
  try {
    const ip = await getIp();
    const response = await fetch('/api/attendance/dashboard', {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-forwarded-for': ip,
      },
    });
    const data = await response.json();

    if (response.ok) {
      renderDashboardInfo(data);
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

  try {
    const ip = await getIp();
    const response = await fetch(
      '/api/attendance/user?daysAgo=5&sort=createdAt-desc',
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

async function getAllUsersAttendanceToday() {
  const token = getToken();
  if (!token) {
    window.location.href = '/login.html';
  }

  try {
    const ip = await getIp();
    const response = await fetch(
      '/api/attendance/users?currentDay=true&sort=checkIn-desc',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-forwarded-for': ip,
        },
      },
    );
    const data = await response.json();

    if (response.ok) {
      renderAllUsersAttendance(data.attendances);
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

window.addEventListener('DOMContentLoaded', async () => {
  renderUserAvatar(null);
  renderAttendanceTable(null);
  renderAllUsersAttendance(null);
  renderDashboardInfo(null);
  document.getElementById('logoutBtn').addEventListener('click', () => {
    removeToken();
    window.location.href = '/login.html';
  });
  const token = getToken();
  if (!token) {
    window.location.href = '/login.html';
  }
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);
  const user = await getProfile();
  findUserByDashboard();
  getMyAttendance();

  //Roles Components
  const userTable = document.getElementById('usersTable');
  if (user.role === 'ADMIN') {
    getAllUsersAttendanceToday();
  } else {
    userTable.innerHTML = '';
    userTable.className = '';
    userTable.style.display = 'none';
  }
});
