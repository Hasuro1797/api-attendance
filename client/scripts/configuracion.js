import { getIp, getToken, removeToken } from './utils/authorizarion.js';

// Estado global de la aplicación
let currentUser = null;
let currentPage = 1;
let usersData = [];
let networkRules = [];
let currentEditUserId = null;
let currentEditNetworkId = null;
const ITEMS_PER_PAGE = 10;

// Funciones de utilidad para mostrar mensajes
function showAlert(message, type = 'success') {
  const alertContainer = document.getElementById('alertContainer');
  const alertElement = document.createElement('div');
  alertElement.className = `alert alert-${type}`;
  alertElement.innerHTML = `
        <div class="alert-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
            <span class="text-alert">${message}</span>
        </div>
        <button class="alert-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

  alertContainer.appendChild(alertElement);

  setTimeout(() => {
    if (alertElement.parentNode) {
      alertElement.remove();
    }
  }, 5000);
}

// Función para manejar el avatar del usuario
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

// Función para obtener el perfil del usuario
async function getProfile() {
  const token = getToken();
  if (!token) {
    window.location.href = '/login.html';
    return;
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
    showAlert('Error al obtener información del usuario', 'error');
  }
}

// Función para cerrar sesión
async function logOut() {
  const token = getToken();
  if (!token) {
    window.location.href = '/login.html';
    return;
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
    showAlert('Error al cerrar sesión', 'error');
  }
}

// CONFIGURACIÓN GENERAL
async function loadGeneralConfig() {
  const token = getToken();
  const ip = await getIp();

  try {
    const response = await fetch('/api/config', {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-forwarded-for': ip,
      },
    });

    if (response.ok) {
      const configs = await response.json();
      if (configs.length > 0) {
        const config = configs[0];
        document.getElementById('startTime').value = config.startTime || '';
        document.getElementById('endTime').value = config.endTime || '';
        document.getElementById('toleranceMin').value =
          config.toleranceMin || 0;
      }
    } else {
      showAlert('Error al cargar la configuración', 'error');
    }
  } catch (error) {
    console.error('Error al cargar configuración:', error);
    showAlert('Error al cargar la configuración', 'error');
  }
}

async function saveGeneralConfig(configData) {
  const token = getToken();
  const ip = await getIp();

  try {
    const getResponse = await fetch('/api/config', {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-forwarded-for': ip,
      },
    });

    let method = 'POST';
    let url = '/api/config';

    if (getResponse.ok) {
      const configs = await getResponse.json();
      if (configs.length > 0) {
        method = 'PATCH';
        url = `/api/config/${configs[0].id}`;
      }
    }

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-forwarded-for': ip,
      },
      body: JSON.stringify({
        ...configData,
        updateBy: currentUser.id,
      }),
    });

    if (response.ok) {
      showAlert('Configuración guardada exitosamente', 'success');
      return true;
    } else {
      showAlert('Error al guardar la configuración', 'error');
      return false;
    }
  } catch (error) {
    console.error('Error al guardar configuración:', error);
    showAlert('Error al guardar la configuración', 'error');
    return false;
  }
}

// GESTIÓN DE USUARIOS
async function loadUsers(page = 1, search = '') {
  const token = getToken();
  const ip = await getIp();

  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: ITEMS_PER_PAGE.toString(),
    });

    if (search) {
      params.append('search', search);
    }

    const response = await fetch(`/api/user?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-forwarded-for': ip,
      },
    });

    if (response.ok) {
      const data = await response.json();
      usersData = data.users || data;
      renderUsersTable();
      updateUsersPagination(data.totalPages || 1, page);
    } else {
      showAlert('Error al cargar usuarios', 'error');
    }
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
    showAlert('Error al cargar usuarios', 'error');
  }
}

function renderUsersTable() {
  const tbody = document.getElementById('usersTableBody');
  tbody.innerHTML = '';

  if (usersData.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="text-center">No hay usuarios disponibles</td></tr>';
    return;
  }

  usersData.forEach((user) => {
    const row = document.createElement('tr');
    row.innerHTML = `
            <td>${user.name} ${user.lastName}</td>
            <td>${user.email}</td>
            <td>${user.phone || 'N/A'}</td>
            <td>${user.department || 'N/A'}</td>
            <td>
                <span class="badge ${user.modality === 'PRESENTIAL' ? 'badge-primary' : 'badge-secondary'}">
                    ${user.modality === 'PRESENTIAL' ? 'Presencial' : 'Remoto'}
                </span>
            </td>
            <td>
                <span class="badge ${user.role === 'ADMIN' ? 'badge-danger' : 'badge-success'}">
                    ${user.role === 'ADMIN' ? 'Administrador' : 'Usuario'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="editUser('${user.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${
                      user.role !== 'ADMIN'
                        ? `<button class="btn btn-sm btn-danger" onclick="deleteUser('${user.id}')">
                              <i class="fas fa-trash"></i>
                          </button>`
                        : ''
                    }
                </div>
            </td>
        `;
    tbody.appendChild(row);
  });
}

function updateUsersPagination(totalPages, currentPage) {
  const pageInfo = document.getElementById('usersPageInfo');
  const prevBtn = document.getElementById('prevUsersBtn');
  const nextBtn = document.getElementById('nextUsersBtn');

  pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;
}

async function createUser(userData) {
  const token = getToken();
  const ip = await getIp();

  try {
    const response = await fetch('/api/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-forwarded-for': ip,
      },
      body: JSON.stringify({
        ...userData,
      }),
    });

    if (response.ok) {
      showAlert('Usuario creado exitosamente', 'success');
      closeUserModal();
      loadUsers(currentPage);
    } else {
      const errorData = await response.json();
      showAlert(errorData.message || 'Error al crear usuario', 'error');
    }
  } catch (error) {
    console.error('Error al crear usuario:', error);
    showAlert('Error al crear usuario', 'error');
  }
}

async function updateUser(userId, userData) {
  const token = getToken();
  const ip = await getIp();

  try {
    const response = await fetch(`/api/user/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-forwarded-for': ip,
      },
      body: JSON.stringify({
        ...userData,
      }),
    });

    if (response.ok) {
      showAlert('Usuario actualizado exitosamente', 'success');
      closeUserModal();
      loadUsers(currentPage);
    } else {
      const errorData = await response.json();
      showAlert(errorData.message || 'Error al actualizar usuario', 'error');
    }
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    showAlert('Error al actualizar usuario', 'error');
  }
}

async function deleteUser(userId) {
  const token = getToken();
  const ip = await getIp();

  try {
    const response = await fetch(`/api/user/${userId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-forwarded-for': ip,
      },
    });

    if (response.ok) {
      showAlert('Usuario eliminado exitosamente', 'success');
      loadUsers(currentPage);
    } else {
      showAlert('Error al eliminar usuario', 'error');
    }
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    showAlert('Error al eliminar usuario', 'error');
  }
}

// GESTIÓN DE REGLAS DE RED
async function loadNetworkRules() {
  const token = getToken();
  const ip = await getIp();

  try {
    const response = await fetch('/api/networkrule', {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-forwarded-for': ip,
      },
    });

    if (response.ok) {
      const data = await response.json();

      if (Array.isArray(data)) {
        networkRules = data;
      } else if (data && Array.isArray(data.networkrules)) {
        networkRules = data.networkrules;
      } else if (data && Array.isArray(data.rules)) {
        networkRules = data.rules;
      } else if (data && Array.isArray(data.data)) {
        networkRules = data.data;
      } else {
        networkRules = [];
        console.warn('Respuesta inesperada para reglas de red:', data);
      }

      renderNetworkRulesTable();
    } else {
      showAlert('Error al cargar reglas de red', 'error');
    }
  } catch (error) {
    console.error('Error al cargar reglas de red:', error);
    showAlert('Error al cargar reglas de red', 'error');
  }
}

function renderNetworkRulesTable() {
  const tbody = document.getElementById('networkRulesTableBody');
  if (!tbody) {
    console.error('Elemento networkRulesTableBody no encontrado');
    return;
  }

  tbody.innerHTML = '';

  if (!Array.isArray(networkRules) || networkRules.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="text-center">No hay reglas de red disponibles</td></tr>';
    return;
  }

  networkRules.forEach((rule) => {
    const row = document.createElement('tr');
    row.innerHTML = `
            <td>${rule.name || 'Sin nombre'}</td>
            <td>${rule.ipStart || 'N/A'} - ${rule.ipEnd || rule.ipStart || 'N/A'}</td>
            <td>
                <span class="badge ${rule.modality === 'PRESENTIAL' ? 'badge-primary' : 'badge-secondary'}">
                    ${rule.modality === 'PRESENTIAL' ? 'Presencial' : 'Remoto'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="editNetworkRule('${rule.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteNetworkRule('${rule.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
    tbody.appendChild(row);
  });
}

async function createNetworkRule(ruleData) {
  const token = getToken();
  const ip = await getIp();

  try {
    const response = await fetch('/api/networkrule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-forwarded-for': ip,
      },
      body: JSON.stringify(ruleData),
    });

    if (response.ok) {
      showAlert('Regla de red creada exitosamente', 'success');
      closeNetworkModal();
      loadNetworkRules();
    } else {
      const errorData = await response.json();
      showAlert(errorData.message || 'Error al crear regla de red', 'error');
    }
  } catch (error) {
    console.error('Error al crear regla de red:', error);
    showAlert('Error al crear regla de red', 'error');
  }
}

async function updateNetworkRule(ruleId, ruleData) {
  const token = getToken();
  const ip = await getIp();

  try {
    const response = await fetch(`/api/networkrule/${ruleId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-forwarded-for': ip,
      },
      body: JSON.stringify(ruleData),
    });

    if (response.ok) {
      showAlert('Regla de red actualizada exitosamente', 'success');
      closeNetworkModal();
      loadNetworkRules();
    } else {
      const errorData = await response.json();
      showAlert(
        errorData.message || 'Error al actualizar regla de red',
        'error',
      );
    }
  } catch (error) {
    console.error('Error al actualizar regla de red:', error);
    showAlert('Error al actualizar regla de red', 'error');
  }
}

async function deleteNetworkRule(ruleId) {
  const token = getToken();
  const ip = await getIp();

  try {
    const response = await fetch(`/api/networkrule/${ruleId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-forwarded-for': ip,
      },
    });

    if (response.ok) {
      showAlert('Regla de red eliminada exitosamente', 'success');
      loadNetworkRules();
    } else {
      showAlert('Error al eliminar regla de red', 'error');
    }
  } catch (error) {
    console.error('Error al eliminar regla de red:', error);
    showAlert('Error al eliminar regla de red', 'error');
  }
}

// FUNCIONES DE MODAL
function openUserModal(isEdit = false, userId = null) {
  const modal = document.getElementById('userModal');
  const modalTitle = document.getElementById('userModalTitle');
  const form = document.getElementById('userForm');

  modalTitle.textContent = isEdit ? 'Editar Usuario' : 'Agregar Usuario';
  currentEditUserId = userId;

  if (isEdit && userId) {
    const user = usersData.find((u) => u.id === userId);
    if (user) {
      document.getElementById('userId').value = user.id || '';
      document.getElementById('userFormName').value = user.name || '';
      document.getElementById('userLastName').value = user.lastName || '';
      document.getElementById('userEmail').value = user.email || '';
      document.getElementById('userPhone').value = user.phone || '';
      document.getElementById('userDepartment').value = user.department || '';
      document.getElementById('userModality').value =
        user.modality || 'PRESENTIAL';
      document.getElementById('userPassword').value = '';
    } else {
      console.warn('Usuario no encontrado para edición:', userId);
    }
  } else {
    form.reset();
    document.getElementById('userId').value = '';
    currentEditUserId = null;
  }

  modal.style.display = 'block';
}

function closeUserModal() {
  const modal = document.getElementById('userModal');
  modal.style.display = 'none';
  currentEditUserId = null;
}

function openNetworkModal(isEdit = false, ruleId = null) {
  const modal = document.getElementById('networkModal');
  const modalTitle = document.getElementById('networkModalTitle');
  const form = document.getElementById('networkForm');

  if (!modal || !modalTitle || !form) {
    console.error('Elementos del modal no encontrados');
    return;
  }

  modalTitle.textContent = isEdit
    ? 'Editar Regla de Red'
    : 'Agregar Regla de Red';
  currentEditNetworkId = ruleId;

  if (isEdit && ruleId) {
    if (Array.isArray(networkRules)) {
      const rule = networkRules.find((r) => r.id === +ruleId);
      if (rule) {
        document.getElementById('networkRuleId').value = rule.id || '';
        document.getElementById('networkName').value = rule.name || '';
        document.getElementById('networkIpStart').value = rule.ipStart || '';
        document.getElementById('networkIpEnd').value = rule.ipEnd || '';
        document.getElementById('networkModality').value =
          rule.modality || 'PRESENTIAL';
      } else {
        console.error('Regla no encontrada:', ruleId);
      }
    } else {
      console.error('networkRules no es un array:', networkRules);
    }
  } else {
    form.reset();
    document.getElementById('networkRuleId').value = '';
  }

  modal.style.display = 'block';
}

function closeNetworkModal() {
  const modal = document.getElementById('networkModal');
  modal.style.display = 'none';
  currentEditNetworkId = null;
}

function showConfirmModal(message, onConfirm) {
  const modal = document.getElementById('confirmModal');
  const messageElement = document.getElementById('confirmMessage');
  const confirmBtn = document.getElementById('confirmActionBtn');

  messageElement.textContent = message;

  // Limpiar eventos anteriores
  confirmBtn.replaceWith(confirmBtn.cloneNode(true));
  const newConfirmBtn = document.getElementById('confirmActionBtn');

  newConfirmBtn.addEventListener('click', () => {
    onConfirm();
    modal.style.display = 'none';
  });

  modal.style.display = 'block';
}

// FUNCIONES GLOBALES PARA EVENTOS
window.editUser = function (userId) {
  openUserModal(true, userId);
};

window.deleteUser = function (userId) {
  showConfirmModal('¿Está seguro de que desea eliminar este usuario?', () => {
    deleteUser(userId);
  });
};

window.editNetworkRule = function (ruleId) {
  openNetworkModal(true, ruleId);
};

window.deleteNetworkRule = function (ruleId) {
  showConfirmModal(
    '¿Está seguro de que desea eliminar esta regla de red?',
    () => {
      deleteNetworkRule(ruleId);
    },
  );
};

// INICIALIZACIÓN
window.addEventListener('DOMContentLoaded', async () => {
  renderUserAvatar(null);

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await logOut();
  });

  const token = getToken();
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  const user = await getProfile();
  if (!user) return;

  currentUser = user;

  document.querySelectorAll('[data-role]').forEach((el) => {
    const roles = el.dataset.role.split(',').map((r) => r.trim().toUpperCase());
    if (roles.includes(user.role.toUpperCase())) {
      el.style.display = 'flex';
    }
  });

  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;

      tabBtns.forEach((b) => b.classList.remove('active'));
      tabContents.forEach((c) => c.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(`${tabId}-tab`).classList.add('active');

      if (tabId === 'general') {
        loadGeneralConfig();
      } else if (tabId === 'users') {
        loadUsers();
      } else if (tabId === 'network') {
        loadNetworkRules();
      }
    });
  });

  loadGeneralConfig();

  document
    .getElementById('configForm')
    .addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const configData = {
        startTime: formData.get('startTime'),
        endTime: formData.get('endTime'),
        toleranceMin: parseInt(formData.get('toleranceMin')),
      };
      const saved = await saveGeneralConfig(configData);
      if (saved) {
        showAlert('Configuración guardada exitosamente', 'success');
      }
    });

  document.getElementById('resetConfigBtn').addEventListener('click', () => {
    document.getElementById('configForm').reset();
    loadGeneralConfig();
  });

  // Usuario modal
  document.getElementById('addUserBtn').addEventListener('click', () => {
    openUserModal(false);
  });
  document
    .getElementById('closeUserModal')
    .addEventListener('click', closeUserModal);
  document
    .getElementById('cancelUserBtn')
    .addEventListener('click', closeUserModal);

  document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const userData = {
      name: formData.get('name'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      department: formData.get('department'),
      modality: formData.get('modality'),
      password: formData.get('password'),
    };

    if (!userData.password.trim()) {
      delete userData.password;
    }

    if (currentEditUserId) {
      await updateUser(currentEditUserId, userData);
    } else {
      await createUser(userData);
    }
  });

  // Red modal
  document.getElementById('addNetworkRuleBtn').addEventListener('click', () => {
    openNetworkModal(false);
  });
  document
    .getElementById('closeNetworkModal')
    .addEventListener('click', closeNetworkModal);
  document
    .getElementById('cancelNetworkBtn')
    .addEventListener('click', closeNetworkModal);

  document
    .getElementById('networkForm')
    .addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const ruleData = {
        name: formData.get('name'),
        ipStart: formData.get('ipStart'),
        ipEnd: formData.get('ipEnd'),
        modality: formData.get('modality'),
      };

      if (currentEditNetworkId) {
        await updateNetworkRule(currentEditNetworkId, ruleData);
      } else {
        await createNetworkRule(ruleData);
      }
    });

  // Confirm modal
  document.getElementById('cancelConfirmBtn').addEventListener('click', () => {
    document.getElementById('confirmModal').style.display = 'none';
  });

  // Búsqueda usuarios
  document.getElementById('userSearch').addEventListener('input', (e) => {
    const searchTerm = e.target.value;
    loadUsers(1, searchTerm);
  });

  // Paginación usuarios
  document.getElementById('prevUsersBtn').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadUsers(currentPage);
    }
  });

  document.getElementById('nextUsersBtn').addEventListener('click', () => {
    currentPage++;
    loadUsers(currentPage);
  });
});
