// public/assets/js/historial.js

// Importar utilidades de autenticación desde la ruta y nombre de archivo proporcionados.
import { getToken, removeToken, getIp } from './utils/authorizarion.js';

// --- Helper Functions (Duplicadas de main.js ya que no están exportadas) ---
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

// --- Elementos del DOM ---
const historialTableBody = document.getElementById('historialTableBody');
const tableStatus = document.getElementById('tableStatus');
const filterDaysAgoInput = document.getElementById('filterDaysAgo');
const filterCurrentWeekCheckbox = document.getElementById('filterCurrentWeek');
const filterCurrentDayCheckbox = document.getElementById('filterCurrentDay');
const applyFiltersBtn = document.getElementById('applyFiltersBtn');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const currentPageInfoSpan = document.getElementById('currentPageInfo');

// ELEMENTOS DE CABECERA (APUNTANDO A IDs como en main.html)
const userName = document.getElementById('userName');
const userAvatar = document.getElementById('userAvatar');


// --- Variables de Estado ---
let currentPage = 1;
const itemsPerPage = 10;
let totalRecords = 0;

// --- Funciones de Renderizado y Lógica ---

/**
 * Renderiza el nombre del usuario y el avatar en la cabecera.
 * Adapta la lógica de renderUserAvatar de main.js para historial.html.
 * @param {Object} user - Objeto de usuario con name y lastName.
 */
function renderHeaderUserInfo(user) {
    if (userName) {
        userName.innerHTML = ''; // Limpiar previo
        if (user) {
            userName.className = 'user-name'; // Clase para estilos
            userName.textContent = `${user.name} ${user.lastName}`;
        } else {
            userName.className = 'skeleton skeleton-text'; // Estilo de carga/error
        }
    }

    if (userAvatar) {
        userAvatar.innerHTML = ''; // Limpiar previo
        if (user) {
            userAvatar.className = 'user-avatar'; // Clase para estilos
            const icon = document.createElement('i');
            icon.className = 'fa-regular fa-user'; // Icono por defecto
            userAvatar.appendChild(icon);
        } else {
            userAvatar.className = 'skeleton skeleton-avatar'; // Estilo de carga/error
        }
    }
}


/**
 * Función para obtener los datos del perfil del usuario.
 * Versión local para historial.js, no renderiza elementos del dashboard.
 */
async function getProfileForHistorial() {
    const token = getToken();
    if (!token) {
        window.location.href = '/login.html';
        return null;
    }
    const ip = await getIp(); // Se usa para el encabezado 'x-forwarded-for'

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
        console.error('Error al obtener información del usuario para historial:', error);
        return null;
    }
}

/**
 * Función para inicializar la cabecera con el nombre del usuario.
 * Llamada al cargar el DOM.
 */
async function initializeHeader() {
    renderHeaderUserInfo(null); // Mostrar estado de carga inicial
    const user = await getProfileForHistorial();
    if (user) {
        renderHeaderUserInfo(user); // Renderizar con datos del usuario
    } else {
        renderHeaderUserInfo(null); // Mantener estado de error o default
    }
}


/**
 * Renderiza los registros de asistencia en la tabla de historial.
 * @param {Array|null} records - Array de registros de asistencia o null para estado de carga.
 */
function renderHistorialTable(records) {
    if (!historialTableBody) {
        console.error('Elemento historialTableBody no encontrado.');
        return;
    }

    historialTableBody.innerHTML = ''; // Limpiar contenido previo

    // Número de columnas visibles en la tabla (excluyendo "Dirección IP")
    const numberOfVisibleColumns = 6; // FECHA, ESTADO, HORA ENTRADA, HORA SALIDA, HORAS TRABAJADAS, MODALIDAD

    if (records === null) {
        // Estado de carga (loader)
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="${numberOfVisibleColumns}" class="table-loader"><i class="fas fa-spinner fa-spin"></i> Cargando datos...</td>`;
        historialTableBody.appendChild(tr);
        if (tableStatus) tableStatus.style.display = 'none';
        return;
    }

    if (!records || records.length === 0) {
        // Estado sin resultados
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="${numberOfVisibleColumns}" class="table-result">No hay registros de asistencia para los filtros seleccionados.</td>`;
        historialTableBody.appendChild(tr);
        if (tableStatus) tableStatus.style.display = 'none';
        return;
    }

    // Renderizar registros reales
    records.forEach(item => {
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

        if (hoy && !item.checkOut && item.checkIn) {
            salida = 'En curso';
        }

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

        let modality = 'Presencial';
        if (item.modality === 'REMOTE' || item.modality === 'REMOTO') modality = 'Remoto';
        if (item.modality === 'PRESENTIAL') modality = 'Presencial';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${fecha}</td>
            <td><span class="attendance-status ${estadoClass}">${estadoText}</span></td>
            <td>${entrada}</td>
            <td>${salida}</td>
            <td>${horas}</td>
            <td>${modality}</td>
            `;
        historialTableBody.appendChild(row);
    });
}

/**
 * Obtiene el historial de asistencia de la API para el usuario actual.
 * @param {Object} filters - Objeto que contiene los parámetros de filtro.
 * @param {number} page - Número de página actual.
 * @param {number} limit - Límite de elementos por página.
 */
async function fetchAttendanceHistory(filters = {}, page = 1, limit = itemsPerPage) {
    renderHistorialTable(null); // Mostrar loader inmediatamente
    if (tableStatus) {
        tableStatus.textContent = 'Cargando historial...';
        tableStatus.style.display = 'none';
    }

    const token = getToken();
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    const ip = await getIp(); // Necesario para el encabezado 'x-forwarded-for'

    // Construir parámetros de consulta
    const queryParams = new URLSearchParams({
        page: page,
        limit: limit,
        sort: 'createdAt-desc' // Ordenar por fecha de creación descendente por defecto
    });

    // Validar que solo se use un filtro de fecha (solución al error 400 Bad Request)
    let activeFilterCount = 0;
    // Usar una variable para el valor numérico de daysAgo para validación
    let daysAgoValue = null;
    if (filterDaysAgoInput && filterDaysAgoInput.value !== '') {
        const parsed = Number(filterDaysAgoInput.value);
        if (!isNaN(parsed) && parsed >= 1) {
            daysAgoValue = parsed;
            activeFilterCount++;
        } else {
            console.error('El valor para "Días atrás" no es válido (debe ser un número >= 1).');
            if (tableStatus) {
                tableStatus.textContent = 'Error: "Días atrás" debe ser un número mayor o igual a 1.';
                tableStatus.style.display = 'block';
            }
            renderHistorialTable([]);
            updatePaginationButtons();
            return; // Detener la ejecución
        }
    }
    if (filters.currentWeek) activeFilterCount++;
    if (filters.currentDay) activeFilterCount++;

    if (activeFilterCount > 1) {
        console.error('Error de filtros: No se puede usar más de un filtro de fecha a la vez (Días atrás, Semana actual o Día actual).');
        if (tableStatus) {
            tableStatus.textContent = 'Error: Por favor, seleccione solo UN tipo de filtro de fecha (Días atrás, Semana actual, o Día actual).';
            tableStatus.style.display = 'block';
        }
        renderHistorialTable([]);
        updatePaginationButtons();
        return; // Detener la ejecución para evitar la llamada a la API con filtros inválidos
    }

    // Añadir el filtro activo si hay uno
    if (daysAgoValue !== null) { // Usar daysAgoValue que ya está validado
        queryParams.append('daysAgo', daysAgoValue.toString());
    } else if (filters.currentWeek) {
        queryParams.append('currentWeek', 'true');
    } else if (filters.currentDay) {
        queryParams.append('currentDay', 'true');
    }


    try {
        const response = await fetch(`/api/attendance/user?${queryParams.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'x-forwarded-for': ip
            }
        });

        const data = await response.json();

        if (response.ok) {
            totalRecords = data.totalRecords;
            renderHistorialTable(data.attendances);
            updatePaginationButtons();
        } else {
            if (response.status === 401) {
                console.error('No autorizado: Token expirado o inválido. Redirigiendo a login.');
                removeToken();
                window.location.href = '/login.html';
            } else {
                console.error('Error al cargar el historial de asistencia:', data.message || response.statusText);
                if (tableStatus) {
                    // Mostrar mensaje de error de la API si está disponible
                    const errorMessage = Array.isArray(data) && data.length > 0 ? data.join(', ') : (data.message || response.statusText);
                    tableStatus.textContent = `Error: ${errorMessage}.`;
                    tableStatus.style.display = 'block';
                }
            }
            renderHistorialTable([]);
            updatePaginationButtons();
        }
    } catch (error) {
        console.error('Error de red al cargar el historial de asistencia:', error);
        if (tableStatus) {
            tableStatus.textContent = `Error de conexión: ${error.message}. Por favor, intente de nuevo.`;
            tableStatus.style.display = 'block';
        }
        renderHistorialTable([]);
        updatePaginationButtons();
    }
}

/**
 * Actualiza el estado de los botones de paginación y la información de la página.
 */
function updatePaginationButtons() {
    const totalPages = Math.ceil(totalRecords / itemsPerPage);
    if (currentPageInfoSpan) {
        currentPageInfoSpan.textContent = `Página ${currentPage} de ${totalPages || 1}`;
    }

    if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
    if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages || totalRecords === 0;
}

/**
 * Reúne los valores de los filtros y dispara la obtención del historial de asistencia.
 * Reinicia a la página 1 cuando se aplican nuevos filtros.
 */
function applyFiltersAndFetch() {
    currentPage = 1; // Reiniciar a la primera página al aplicar nuevos filtros
    const filters = {
        daysAgo: filterDaysAgoInput ? filterDaysAgoInput.value : '',
        currentWeek: filterCurrentWeekCheckbox ? filterCurrentWeekCheckbox.checked : false,
        currentDay: filterCurrentDayCheckbox ? filterCurrentDayCheckbox.checked : false
    };

    // Lógica para desmarcar/vaciar otros filtros si uno es seleccionado
    // Estos listeners ya se encargan de esto en el DOM, solo aseguramos los valores del objeto filters
    if (filterDaysAgoInput && filterDaysAgoInput.value !== '') {
        filters.currentWeek = false;
        filters.currentDay = false;
    } else if (filterCurrentWeekCheckbox && filterCurrentWeekCheckbox.checked) {
        filters.daysAgo = '';
        filters.currentDay = false;
    } else if (filterCurrentDayCheckbox && filterCurrentDayCheckbox.checked) {
        filters.daysAgo = '';
        filters.currentWeek = false;
    }

    fetchAttendanceHistory(filters, currentPage, itemsPerPage);
}


// --- Listeners de Eventos ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicializar la cabecera con el nombre de usuario
    initializeHeader();

    // 2. Mostrar loaders iniciales para la tabla de historial
    renderHistorialTable(null);

    // 3. Obtención inicial del historial de asistencia (con filtros predeterminados o vacíos)
    applyFiltersAndFetch(); // Carga los datos iniciales al cargar la página

    // 4. Adjuntar listener al botón de aplicar filtros
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFiltersAndFetch);
    }

    // 5. Adjuntar listeners a los checkboxes y input para desmarcar otros al seleccionar uno
    // Esto es crucial para la UX y para evitar enviar filtros contradictorios a la API
    if (filterDaysAgoInput) {
        filterDaysAgoInput.addEventListener('input', () => {
            // Si hay un valor en 'Días atrás', desmarcar los checkboxes
            if (filterDaysAgoInput.value !== '') {
                if (filterCurrentWeekCheckbox) filterCurrentWeekCheckbox.checked = false;
                if (filterCurrentDayCheckbox) filterCurrentDayCheckbox.checked = false;
            }
        });
    }

    if (filterCurrentWeekCheckbox) {
        filterCurrentWeekCheckbox.addEventListener('change', () => {
            // Si 'Semana actual' se marca, vaciar 'Días atrás' y desmarcar 'Día actual'
            if (filterCurrentWeekCheckbox.checked) {
                if (filterDaysAgoInput) filterDaysAgoInput.value = '';
                if (filterCurrentDayCheckbox) filterCurrentDayCheckbox.checked = false;
            }
        });
    }

    if (filterCurrentDayCheckbox) {
        filterCurrentDayCheckbox.addEventListener('change', () => {
            // Si 'Día actual' se marca, vaciar 'Días atrás' y desmarcar 'Semana actual'
            if (filterCurrentDayCheckbox.checked) {
                if (filterDaysAgoInput) filterDaysAgoInput.value = '';
                if (filterCurrentWeekCheckbox) filterCurrentWeekCheckbox.checked = false;
            }
        });
    }


    // 6. Adjuntar listeners a los botones de paginación
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                // Recoger los filtros actuales antes de llamar a fetchAttendanceHistory
                const filters = {
                    daysAgo: filterDaysAgoInput ? filterDaysAgoInput.value : '',
                    currentWeek: filterCurrentWeekCheckbox ? filterCurrentWeekCheckbox.checked : false,
                    currentDay: filterCurrentDayCheckbox ? filterCurrentDayCheckbox.checked : false
                };
                fetchAttendanceHistory(filters, currentPage, itemsPerPage);
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(totalRecords / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                const filters = {
                    daysAgo: filterDaysAgoInput ? filterDaysAgoInput.value : '',
                    currentWeek: filterCurrentWeekCheckbox ? filterCurrentWeekCheckbox.checked : false,
                    currentDay: filterCurrentDayCheckbox ? filterCurrentDayCheckbox.checked : false
                };
                fetchAttendanceHistory(filters, currentPage, itemsPerPage);
            }
        });
    }

    // 7. Listener para el botón de cerrar sesión, si existe en historial.html
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            removeToken();
            window.location.href = '/login.html';
        });
    }
});