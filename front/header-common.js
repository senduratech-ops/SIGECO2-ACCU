// ===== HEADER NOTIFICATIONS & USER FUNCTIONALITY =====
// This script provides shared functionality for header dropdowns across all pages
// Requires config.js to be loaded first

const HEADER_API = typeof API_ROOT !== 'undefined' ? API_ROOT : '';

// Initialize header functionality
function initHeaderDropdowns() {
    loadCurrentUser();
    loadHeaderNotifications();
    setupDropdownListeners();
}

// ===== NOTIFICATIONS DROPDOWN =====
function toggleNotificationsDropdown() {
    const dropdown = document.getElementById('notifications-dropdown');
    const userDropdown = document.getElementById('user-menu-dropdown');
    if (userDropdown) userDropdown.style.display = 'none';
    if (dropdown) dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

async function loadHeaderNotifications() {
    try {
        const response = await fetch(`${HEADER_API}/api/notifications`);
        const notifications = await response.json();
        const unreadCount = notifications.filter(n => !n.leido).length;

        const badge = document.getElementById('notifications-badge');
        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }

        const listContainer = document.getElementById('notifications-list');
        if (!listContainer) return;

        if (notifications.length === 0) {
            listContainer.innerHTML = '<div class="p-4 text-center text-gray-500 text-sm">No hay notificaciones</div>';
            return;
        }

        const recentNotifications = notifications.slice(0, 5);
        listContainer.innerHTML = recentNotifications.map(n => {
            const typeColors = {
                'info': 'bg-blue-500',
                'alerta': 'bg-red-500',
                'pendiente': 'bg-yellow-500',
                'exito': 'bg-green-500'
            };
            const dotColor = typeColors[n.tipo] || 'bg-gray-500';
            return `
                <div class="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${!n.leido ? 'bg-blue-50' : ''}">
                    <div class="flex items-start gap-3">
                        <div class="w-2 h-2 rounded-full ${dotColor} mt-2 flex-shrink-0"></div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm ${!n.leido ? 'font-semibold' : 'text-gray-600'} truncate">${n.mensaje}</p>
                            <p class="text-xs text-gray-400 mt-1">${formatNotificationDate(n.fecha)}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading header notifications:', error);
        const listContainer = document.getElementById('notifications-list');
        if (listContainer) {
            listContainer.innerHTML = '<div class="p-4 text-center text-gray-500 text-sm">Error al cargar</div>';
        }
    }
}

async function markAllReadFromDropdown() {
    try {
        await fetch(`${HEADER_API}/api/notifications/read-all`, { method: 'PUT' });
        loadHeaderNotifications();
    } catch (error) {
        console.error('Error marking all as read:', error);
    }
}

function formatNotificationDate(dateString) {
    if (!dateString) return 'Ahora';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffMins < 1440) return `Hace ${Math.floor(diffMins / 60)} horas`;
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
}

// ===== USER MENU =====
function toggleUserMenu() {
    const dropdown = document.getElementById('user-menu-dropdown');
    const notifDropdown = document.getElementById('notifications-dropdown');
    if (notifDropdown) notifDropdown.style.display = 'none';
    if (dropdown) dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

async function loadCurrentUser() {
    try {
        const response = await fetch(`${HEADER_API}/api/users/me`, { credentials: 'include' });
        const user = await response.json();

        const initials = (user.nombre?.charAt(0) || 'A') + (user.apellido?.charAt(0) || 'D');

        const initialsEl = document.getElementById('user-initials');
        const shortNameEl = document.getElementById('user-short-name');
        const fullNameEl = document.getElementById('user-full-name');
        const emailEl = document.getElementById('user-email');
        const roleBadgeEl = document.getElementById('user-role-badge');

        if (initialsEl) initialsEl.textContent = initials.toUpperCase();
        if (shortNameEl) shortNameEl.textContent = user.nombre || 'Usuario';
        if (fullNameEl) fullNameEl.textContent = `${user.nombre || ''} ${user.apellido || ''}`.trim();
        if (emailEl) emailEl.textContent = user.correo || '';

        const rolLabels = { 'admin': 'Administrador', 'jefe': 'Jefe de Proyecto', 'operativo': 'Operativo' };
        if (roleBadgeEl) roleBadgeEl.textContent = rolLabels[user.rol] || user.rol || 'Usuario';
    } catch (e) {
        console.error('Error loading user:', e);
    }
}

// ===== DROPDOWN LISTENERS =====
function setupDropdownListeners() {
    document.addEventListener('click', function (e) {
        const userDropdown = document.getElementById('user-menu-dropdown');
        const userBtn = document.getElementById('user-menu-btn');
        const notifDropdown = document.getElementById('notifications-dropdown');
        const notifBtn = document.getElementById('notifications-btn');

        if (userDropdown && userBtn && !userDropdown.contains(e.target) && !userBtn.contains(e.target)) {
            userDropdown.style.display = 'none';
        }
        if (notifDropdown && notifBtn && !notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
            notifDropdown.style.display = 'none';
        }
    });
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initHeaderDropdowns);
