// public/assets/js/reportes.js

// Importar utilidades de autenticación
import { getToken, removeToken, getIp } from './utils/authorizarion.js';

// --- Helper Functions ---
function toAmPm(time) {
  if (!time) return '--';
  let [h, m] = time.split(':');
  h = Number(h);
  let ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
}

function getDiffHours(start, end) {
  if (!start || !end) return '--';

  const toMinutes = (t) => {
    const [h, m, s] = t.split(':').map(Number);
    return h * 60 + m + (s || 0) / 60;
  };

  let startMinutes = toMinutes(start);
  let endMinutes = toMinutes(end);

  // Si la hora de salida es menor que la de entrada, asumimos que es el día siguiente
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }

  const diffMinutes = Math.max(0, endMinutes - startMinutes);
  const hours = Math.floor(diffMinutes / 60);
  const minutes = Math.round(diffMinutes % 60);

  return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
}

function isToday(dateObj) {
  const now = new Date();
  return (
    dateObj.getDate() === now.getDate() &&
    dateObj.getMonth() === now.getMonth() &&
    dateObj.getFullYear() === now.getFullYear()
  );
}

function formatDate(dateString) {
  const dateObj = new Date(dateString);
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
}

function isDateInRange(dateString, startDate, endDate) {
  if (!startDate || !endDate) return true;

  const date = new Date(dateString);
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Ajustar las fechas para incluir todo el día
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  date.setHours(0, 0, 0, 0);

  return date >= start && date <= end;
}

function validateDateRange(startDate, endDate) {
  if (!startDate || !endDate) return { valid: true };

  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();

  if (start > end) {
    return {
      valid: false,
      message: 'La fecha de inicio no puede ser mayor a la fecha de fin',
    };
  }

  if (start > today) {
    return {
      valid: false,
      message: 'La fecha de inicio no puede ser mayor a hoy',
    };
  }

  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 365) {
    return {
      valid: false,
      message: 'El rango de fechas no puede exceder un año',
    };
  }

  return { valid: true };
}

function showAlert(message, type = 'error') {
  // Crear o actualizar el elemento de alerta
  let alertElement = document.getElementById('filterAlert');
  if (!alertElement) {
    alertElement = document.createElement('div');
    alertElement.id = 'filterAlert';
    alertElement.className = 'alert';
    document.querySelector('.filters-section').appendChild(alertElement);
  }

  alertElement.className = `alert alert-${type}`;
  alertElement.textContent = message;
  alertElement.style.display = 'block';

  // Ocultar después de 5 segundos
  setTimeout(() => {
    alertElement.style.display = 'none';
  }, 5000);
}

// --- Elementos del DOM ---
const userName = document.getElementById('userName');
const userAvatar = document.getElementById('userAvatar');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const searchUserInput = document.getElementById('searchUser');
const departmentFilterSelect = document.getElementById('departmentFilter');
const applyFiltersBtn = document.getElementById('applyFiltersBtn');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const attendanceChart = document.getElementById('attendanceChart');
const reportTableBody = document.getElementById('reportTableBody');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const currentPageInfoSpan = document.getElementById('currentPageInfo');

// --- Variables de Estado ---
let currentPage = 1;
const itemsPerPage = 10;
let totalRecords = 0;
let currentData = [];
let allData = []; // Para almacenar todos los datos sin filtrar
let chartInstance = null;
let currentUser = null;
let currentFilters = {};

// --- Funciones de Renderizado ---

/**
 * Renderiza el nombre del usuario y el avatar en la cabecera.
 */
function renderHeaderUserInfo(user) {
  if (userName) {
    userName.innerHTML = '';
    if (user) {
      userName.className = 'user-name';
      userName.textContent = `${user.name} ${user.lastName}`;
    } else {
      userName.className = 'skeleton skeleton-text';
    }
  }

  if (userAvatar) {
    userAvatar.innerHTML = '';
    if (user) {
      userAvatar.className = 'user-avatar';
      const icon = document.createElement('i');
      icon.className = 'fa-regular fa-user';
      userAvatar.appendChild(icon);
    } else {
      userAvatar.className = 'skeleton skeleton-avatar';
    }
  }
}

/**
 * Obtiene el perfil del usuario actual
 */
async function getProfileForReportes() {
  const token = getToken();
  if (!token) {
    window.location.href = '/login.html';
    return null;
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
      return data;
    } else {
      if (response.status === 401) {
        removeToken();
        window.location.href = '/login.html';
      }
      return null;
    }
  } catch (error) {
    console.error('Error al obtener información del usuario:', error);
    return null;
  }
}

/**
 * Inicializa la cabecera con información del usuario
 */
async function initializeHeader() {
  renderHeaderUserInfo(null);
  const user = await getProfileForReportes();
  document.querySelectorAll('[data-role]').forEach((el) => {
    const roles = el.dataset.role.split(',').map((r) => r.trim().toUpperCase());
    if (roles.includes(user.role.toUpperCase())) {
      el.style.display = 'flex';
    }
  });
  if (user) {
    currentUser = user;
    renderHeaderUserInfo(user);
  } else {
    renderHeaderUserInfo(null);
  }
}

/**
 * Carga los departamentos para el filtro
 */
async function loadDepartments() {
  const token = getToken();
  if (!token) return;

  const ip = await getIp();

  try {
    const response = await fetch('/api/user?page=1&limit=100', {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-forwarded-for': ip,
      },
    });

    const data = await response.json();

    if (response.ok && data.users) {
      const departments = [
        ...new Set(
          data.users.map((user) => user.department).filter((dep) => dep),
        ),
      ];

      departmentFilterSelect.innerHTML =
        '<option value="">Todos los Departamentos</option>';
      departments.forEach((dept) => {
        const option = document.createElement('option');
        option.value = dept;
        option.textContent = dept;
        departmentFilterSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error al cargar departamentos:', error);
  }
}

/**
 * Renderiza la tabla de reportes
 */
function renderReportTable(records) {
  if (!reportTableBody) return;

  reportTableBody.innerHTML = '';
  const numberOfColumns = 10;

  if (records === null) {
    // Estado de carga
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="${numberOfColumns}" class="loading-row"><i class="fas fa-spinner fa-spin"></i> Cargando reportes...</td>`;
    reportTableBody.appendChild(tr);
    return;
  }

  if (!records || records.length === 0) {
    // Sin resultados
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="${numberOfColumns}" class="no-results-row">
            <div class="no-results-content">
                <i class="fas fa-search"></i>
                <p>No se encontraron registros que coincidan con los filtros seleccionados.</p>
                <small>Intenta ajustar los filtros o el rango de fechas.</small>
            </div>
        </td>`;
    reportTableBody.appendChild(tr);
    return;
  }

  // Renderizar registros
  records.forEach((item) => {
    const fecha = formatDate(item.createdAt);
    const dateObj = new Date(item.createdAt);
    const hoy = isToday(dateObj);

    // Estado
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

    if (hoy && !item.checkOut && item.checkIn) {
      salida = '<span class="status-en-curso">En curso</span>';
    }

    // Calcular horas trabajadas
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
      const currentHours = getDiffHours(item.checkIn, nowStr);
      horas = `<span class="hours-current">${currentHours}</span>`;
    }

    // Modalidad
    let modality = 'Presencial';
    if (item.modality === 'REMOTE' || item.modality === 'REMOTO')
      modality = 'Remoto';
    if (item.modality === 'PRESENTIAL') modality = 'Presencial';

    // Información del usuario
    const userInfo = item.user || {};
    const fullName =
      `${userInfo.name || 'N/A'} ${userInfo.lastName || ''}`.trim();
    const email = userInfo.email || 'N/A';
    const department = userInfo.department || 'N/A';
    const ip = item.ip || 'N/A';

    const row = document.createElement('tr');
    row.innerHTML = `
            <td class="date-cell">${fecha}</td>
            <td class="user-cell">${fullName}</td>
            <td class="email-cell">${email}</td>
            <td class="department-cell">${department}</td>
            <td class="status-cell"><span class="attendance-status ${estadoClass}">${estadoText}</span></td>
            <td class="time-cell">${entrada}</td>
            <td class="time-cell">${salida}</td>
            <td class="hours-cell">${horas}</td>
            <td class="modality-cell">${modality}</td>
            <td class="ip-cell">${ip}</td>
        `;
    reportTableBody.appendChild(row);
  });
}

/**
 * Actualiza los botones de paginación
 */
function updatePaginationButtons() {
  const totalPages = Math.ceil(totalRecords / itemsPerPage);
  if (currentPageInfoSpan) {
    currentPageInfoSpan.textContent = `Página ${currentPage} de ${totalPages || 1} (${totalRecords} registros)`;
  }

  if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
  if (nextPageBtn)
    nextPageBtn.disabled = currentPage >= totalPages || totalRecords === 0;
}

/**
 * Crea o actualiza el gráfico de asistencia
 */
function renderAttendanceChart(data) {
  if (!attendanceChart) return;

  const ctx = attendanceChart.getContext('2d');

  // Destruir gráfico existente
  if (chartInstance) {
    chartInstance.destroy();
  }

  // Procesar datos para el gráfico
  const statusCounts = {
    PRESENT: 0,
    LATE: 0,
    ABSENT: 0,
  };

  data.forEach((item) => {
    if (statusCounts.hasOwnProperty(item.status)) {
      statusCounts[item.status]++;
    }
  });

  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  // Crear nuevo gráfico
  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Presente', 'Tarde', 'Ausente'],
      datasets: [
        {
          data: [statusCounts.PRESENT, statusCounts.LATE, statusCounts.ABSENT],
          backgroundColor: [
            '#28a745', // Verde para presente
            '#ffc107', // Amarillo para tarde
            '#dc3545', // Rojo para ausente
          ],
          borderWidth: 2,
          borderColor: '#fff',
          hoverBackgroundColor: ['#218838', '#e0a800', '#c82333'],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
            generateLabels: function (chart) {
              const data = chart.data;
              if (data.labels.length && data.datasets.length) {
                return data.labels.map((label, i) => {
                  const value = data.datasets[0].data[i];
                  const percentage =
                    total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                  return {
                    text: `${label}: ${value} (${percentage}%)`,
                    fillStyle: data.datasets[0].backgroundColor[i],
                    strokeStyle: data.datasets[0].borderColor,
                    lineWidth: data.datasets[0].borderWidth,
                    pointStyle: 'circle',
                    hidden: false,
                    index: i,
                  };
                });
              }
              return [];
            },
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const percentage =
                total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: ${value} registros (${percentage}%)`;
            },
          },
        },
      },
    },
  });
}

/**
 * Aplica filtros del lado del cliente
 */
function applyClientSideFilters(data, filters) {
  let filteredData = [...data];

  // Filtrar por rango de fechas
  if (filters.startDate || filters.endDate) {
    filteredData = filteredData.filter((item) =>
      isDateInRange(item.createdAt, filters.startDate, filters.endDate),
    );
  }

  // Filtrar por departamento
  if (filters.department) {
    filteredData = filteredData.filter(
      (item) => item.user && item.user.department === filters.department,
    );
  }

  // Filtrar por búsqueda de usuario
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filteredData = filteredData.filter((item) => {
      const userInfo = item.user || {};
      const fullName =
        `${userInfo.name || ''} ${userInfo.lastName || ''}`.toLowerCase();
      const email = (userInfo.email || '').toLowerCase();
      return fullName.includes(searchTerm) || email.includes(searchTerm);
    });
  }

  return filteredData;
}

/**
 * Obtiene los reportes de asistencia
 */
async function fetchAttendanceReports(
  filters = {},
  page = 1,
  limit = itemsPerPage,
) {
  renderReportTable(null);

  const token = getToken();
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  const ip = await getIp();

  try {
    // Determinar cuántos días hacia atrás obtener
    let daysAgo = 30; // Por defecto 30 días

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      const today = new Date();
      const diffTime = today - startDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      daysAgo = Math.max(diffDays, 1);
    }

    // Construir parámetros de consulta
    const queryParams = new URLSearchParams({
      page: 1,
      limit: 1000, // Obtener más registros para filtrar del lado del cliente
      sort: 'createdAt-desc',
      daysAgo: daysAgo.toString(),
    });

    // Verificar si el usuario es admin para usar el endpoint correcto
    const endpoint =
      currentUser && currentUser.role === 'ADMIN'
        ? '/api/attendance/users'
        : '/api/attendance/user';

    const response = await fetch(`${endpoint}?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-forwarded-for': ip,
      },
    });

    const data = await response.json();

    if (response.ok) {
      allData = data.attendances || [];

      // Aplicar filtros del lado del cliente
      const filteredData = applyClientSideFilters(allData, filters);

      // Paginación del lado del cliente
      totalRecords = filteredData.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      currentData = filteredData.slice(startIndex, endIndex);

      renderReportTable(currentData);
      renderAttendanceChart(filteredData); // Usar todos los datos filtrados para el gráfico
      updatePaginationButtons();
    } else {
      if (response.status === 401) {
        removeToken();
        window.location.href = '/login.html';
      } else {
        console.error(
          'Error al cargar reportes:',
          data.message || response.statusText,
        );
        showAlert('Error al cargar los reportes. Intenta nuevamente.');
      }
      renderReportTable([]);
      updatePaginationButtons();
    }
  } catch (error) {
    console.error('Error de red al cargar reportes:', error);
    showAlert('Error de conexión. Verifica tu conexión a internet.');
    renderReportTable([]);
    updatePaginationButtons();
  }
}

/**
 * Aplica filtros y obtiene datos
 */
function applyFiltersAndFetch() {
  // Validar rango de fechas
  const startDate = startDateInput ? startDateInput.value : '';
  const endDate = endDateInput ? endDateInput.value : '';

  const validation = validateDateRange(startDate, endDate);
  if (!validation.valid) {
    showAlert(validation.message);
    return;
  }

  currentPage = 1;
  currentFilters = {
    startDate: startDate,
    endDate: endDate,
    search: searchUserInput ? searchUserInput.value : '',
    department: departmentFilterSelect ? departmentFilterSelect.value : '',
  };

  fetchAttendanceReports(currentFilters, currentPage, itemsPerPage);
}

/**
 * Reinicia los filtros
 */
function resetFilters() {
  if (startDateInput) startDateInput.value = '';
  if (endDateInput) endDateInput.value = '';
  if (searchUserInput) searchUserInput.value = '';
  if (departmentFilterSelect) departmentFilterSelect.value = '';

  // Ocultar alerta si existe
  const alertElement = document.getElementById('filterAlert');
  if (alertElement) {
    alertElement.style.display = 'none';
  }

  currentFilters = {};
  applyFiltersAndFetch();
}

/**
 * Cambia de página
 */
function changePage(newPage) {
  currentPage = newPage;

  // Aplicar filtros del lado del cliente con nueva página
  const filteredData = applyClientSideFilters(allData, currentFilters);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  currentData = filteredData.slice(startIndex, endIndex);

  renderReportTable(currentData);
  updatePaginationButtons();
}

/**
 * Exporta datos a CSV
 */
function exportToCSV() {
  const filteredData = applyClientSideFilters(allData, currentFilters);

  if (!filteredData || filteredData.length === 0) {
    showAlert('No hay datos para exportar', 'warning');
    return;
  }

  // Quitamos la columna IP del reporte
  const headers = [
    'Fecha',
    'Usuario',
    'Email',
    'Departamento',
    'Estado',
    'Hora Entrada',
    'Hora Salida',
    'Horas Trabajadas',
    'Modalidad',
  ];
  const csvContent = [
    headers.join(','),
    ...filteredData.map((item) => {
      const userInfo = item.user || {};
      const fullName =
        `${userInfo.name || ''} ${userInfo.lastName || ''}`.trim();
      const fecha = formatDate(item.createdAt);
      const entrada = item.checkIn ? toAmPm(item.checkIn) : '--';
      const salida = item.checkOut ? toAmPm(item.checkOut) : '--';

      let horas = '--';
      if (item.checkIn && item.checkOut) {
        horas = getDiffHours(item.checkIn, item.checkOut);
      }

      const modality = item.modality === 'REMOTE' ? 'Remoto' : 'Presencial';
      const status =
        item.status === 'PRESENT'
          ? 'Presente'
          : item.status === 'LATE'
            ? 'Tarde'
            : 'Ausente';

      return [
        fecha,
        `"${fullName}"`,
        userInfo.email || 'N/A',
        `"${userInfo.department || 'N/A'}"`,
        status,
        entrada,
        salida,
        horas,
        modality,
      ].join(',');
    }),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);

  const dateRange =
    currentFilters.startDate || currentFilters.endDate
      ? `_${currentFilters.startDate || 'inicio'}_${currentFilters.endDate || 'fin'}`
      : `_${new Date().toISOString().split('T')[0]}`;

  link.setAttribute('download', `reporte_asistencia${dateRange}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showAlert('Reporte CSV exportado exitosamente', 'success');
}

/**
 * Exporta datos a PDF
 */
function exportToPDF() {
  const filteredData = applyClientSideFilters(allData, currentFilters);

  if (!filteredData || filteredData.length === 0) {
    showAlert('No hay datos para exportar', 'warning');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Título
  doc.setFontSize(16);
  doc.text('Reporte de Asistencia', 20, 20);

  // Información del reporte
  doc.setFontSize(10);
  doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 20, 30);

  if (currentFilters.startDate || currentFilters.endDate) {
    const rangeText = `Rango: ${currentFilters.startDate || 'Inicio'} - ${currentFilters.endDate || 'Fin'}`;
    doc.text(rangeText, 20, 36);
  }

  doc.text(`Total de registros: ${filteredData.length}`, 20, 42);

  // Preparar datos para la tabla
  const tableData = filteredData.map((item) => {
    const userInfo = item.user || {};
    const fullName = `${userInfo.name || ''} ${userInfo.lastName || ''}`.trim();
    const fecha = formatDate(item.createdAt);
    const entrada = item.checkIn ? toAmPm(item.checkIn) : '--';
    const salida = item.checkOut ? toAmPm(item.checkOut) : '--';

    let horas = '--';
    if (item.checkIn && item.checkOut) {
      horas = getDiffHours(item.checkIn, item.checkOut);
    }

    const modality = item.modality === 'REMOTE' ? 'Remoto' : 'Presencial';
    const status =
      item.status === 'PRESENT'
        ? 'Presente'
        : item.status === 'LATE'
          ? 'Tarde'
          : 'Ausente';

    return [
      fecha,
      fullName,
      userInfo.email || 'N/A',
      status,
      entrada,
      salida,
      horas,
      modality,
    ];
  });

  // Crear tabla
  doc.autoTable({
    head: [
      [
        'Fecha',
        'Usuario',
        'Email',
        'Estado',
        'Entrada',
        'Salida',
        'Horas',
        'Modalidad',
      ],
    ],
    body: tableData,
    startY: 50,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [0, 86, 179] },
    alternateRowStyles: { fillColor: [240, 240, 240] },
  });

  // Descargar PDF
  const dateRange =
    currentFilters.startDate || currentFilters.endDate
      ? `_${currentFilters.startDate || 'inicio'}_${currentFilters.endDate || 'fin'}`
      : `_${new Date().toISOString().split('T')[0]}`;

  doc.save(`reporte_asistencia${dateRange}.pdf`);

  showAlert('Reporte PDF exportado exitosamente', 'success');
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

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', async () => {
  // Inicializar cabecera
  await initializeHeader();

  // Cargar departamentos
  await loadDepartments();

  // Establecer fecha por defecto (últimos 7 días)
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  if (endDateInput) {
    endDateInput.value = today.toISOString().split('T')[0];
  }
  if (startDateInput) {
    startDateInput.value = weekAgo.toISOString().split('T')[0];
  }

  // Cargar datos iniciales
  applyFiltersAndFetch();

  // Botones de filtros
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', applyFiltersAndFetch);
  }

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', resetFilters);
  }

  // Botones de exportación
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', exportToCSV);
  }

  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', exportToPDF);
  }

  // Filtros en tiempo real
  if (searchUserInput) {
    searchUserInput.addEventListener('input', function () {
      // Debounce para evitar muchas llamadas
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        applyFiltersAndFetch();
      }, 500);
    });
  }

  if (departmentFilterSelect) {
    departmentFilterSelect.addEventListener('change', applyFiltersAndFetch);
  }

  // Validación de fechas en tiempo real
  if (startDateInput) {
    startDateInput.addEventListener('change', function () {
      const endDate = endDateInput ? endDateInput.value : '';
      const validation = validateDateRange(this.value, endDate);
      if (!validation.valid) {
        showAlert(validation.message);
        this.value = '';
      }
    });
  }

  if (endDateInput) {
    endDateInput.addEventListener('change', function () {
      const startDate = startDateInput ? startDateInput.value : '';
      const validation = validateDateRange(startDate, this.value);
      if (!validation.valid) {
        showAlert(validation.message);
        this.value = '';
      }
    });
  }

  // Paginación
  if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        changePage(currentPage - 1);
      }
    });
  }

  if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(totalRecords / itemsPerPage);
      if (currentPage < totalPages) {
        changePage(currentPage + 1);
      }
    });
  }

  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await logOut();
    });
  }

  // Atajos de teclado
  document.addEventListener('keydown', function (e) {
    // Ctrl + R para resetear filtros
    if (e.ctrlKey && e.key === 'r') {
      e.preventDefault();
      resetFilters();
    }

    // Ctrl + E para exportar CSV
    if (e.ctrlKey && e.key === 'e') {
      e.preventDefault();
      exportToCSV();
    }

    // Enter para aplicar filtros
    if (
      e.key === 'Enter' &&
      (e.target === searchUserInput ||
        e.target === startDateInput ||
        e.target === endDateInput)
    ) {
      e.preventDefault();
      applyFiltersAndFetch();
    }
  });
});
