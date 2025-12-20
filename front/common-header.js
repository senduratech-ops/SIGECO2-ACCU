// Común Header Logic (Notifications & User Profile)
// Requires config.js to be loaded first - uses API_ROOT and API_BASE from there
// const API_ROOT and API_BASE are defined in config.js

const HEADER_API = typeof API_BASE !== 'undefined' ? API_BASE : '';

// --- Notification Functions ---
let notificationsLoaded = false;

function toggleNotifications() {
    const dropdown = document.getElementById('notification-dropdown');
    if (!dropdown) return;
    const isVisible = dropdown.style.display === 'block';
    dropdown.style.display = isVisible ? 'none' : 'block';

    if (!isVisible && !notificationsLoaded) {
        loadNotifications();
    }
}

async function loadNotifications() {
    const list = document.getElementById('notification-list');
    const badge = document.getElementById('notification-count');
    if (!list || !badge) return;

    list.innerHTML = '<p class="p-4 text-center text-gray-500">Cargando...</p>';

    try {
        const response = await fetch(`${HEADER_API}/notifications?limit=10`);
        const data = await response.json();
        const notifications = Array.isArray(data) ? data : (data.notifications || []);

        // Count only unread
        const unreadCount = notifications.filter(n => !n.leido).length;

        // Update badge
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }

        if (notifications && notifications.length > 0) {
            const toShow = notifications.slice(0, 5); // Show top 5
            list.innerHTML = toShow.map(n => `
                <div class="p-3 border-b hover:bg-gray-50 cursor-pointer">
                    <div class="flex items-start gap-3">
                        <div class="p-1.5 rounded-full ${n.tipo === 'alerta' ? 'bg-red-100 text-red-600' : n.tipo === 'pendiente' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'}">
                            <i data-lucide="${n.tipo === 'alerta' ? 'alert-circle' : n.tipo === 'pendiente' ? 'clock' : 'info'}" class="w-4 h-4"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="font-medium text-sm truncate">${n.titulo || n.mensaje}</p>
                            <p class="text-xs text-gray-500">${n.fecha_creacion ? new Date(n.fecha_creacion).toLocaleDateString('es-PE') : '-'}</p>
                        </div>
                    </div>
                </div>
            `).join('');
            if (window.lucide) lucide.createIcons();
        } else {
            list.innerHTML = '<p class="p-4 text-center text-gray-500">No hay notificaciones</p>';
        }
        notificationsLoaded = true;
    } catch (error) {
        console.error('Error loading notifications:', error);
        list.innerHTML = '<p class="p-4 text-center text-gray-500">Error al cargar</p>';
    }
}

// --- User Profile Functions ---
function toggleUserMenu() {
    const dropdown = document.getElementById('user-menu-dropdown');
    if (!dropdown) return;
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

async function loadCurrentUser() {
    try {
        const response = await fetch(`${HEADER_API}/users/me`, { credentials: 'include' });
        const user = await response.json();

        const initials = (user.nombre?.charAt(0) || 'A') + (user.apellido?.charAt(0) || 'D');

        const initialEl = document.getElementById('user-initials');
        if (initialEl) initialEl.textContent = initials.toUpperCase();

        const shortNameEl = document.getElementById('user-short-name');
        if (shortNameEl) shortNameEl.textContent = user.nombre || 'Usuario';

        const fullNameEl = document.getElementById('user-full-name');
        if (fullNameEl) fullNameEl.textContent = `${user.nombre || 'Usuario'} ${user.apellido || ''}`.trim();

        const emailEl = document.getElementById('user-email');
        if (emailEl) emailEl.textContent = user.correo || 'sin correo';

        const roleEl = document.getElementById('user-role-badge');
        if (roleEl) {
            const rolLabels = { 'admin': 'Administrador', 'jefe': 'Jefe de Proyecto', 'operativo': 'Operativo' };
            roleEl.textContent = rolLabels[user.rol] || user.rol || 'Usuario';
        }

    } catch (error) {
        console.error('Error loading user:', error);
    }
}

// --- Initialize and Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Close dropdowns on outside click
    document.addEventListener('click', function (e) {
        const notifDropdown = document.getElementById('notification-dropdown');
        const notifBtn = document.getElementById('notification-btn');
        if (notifDropdown && notifBtn && !notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
            notifDropdown.style.display = 'none';
        }

        const userDropdown = document.getElementById('user-menu-dropdown');
        const userBtn = document.getElementById('user-menu-btn');
        if (userDropdown && userBtn && !userDropdown.contains(e.target) && !userBtn.contains(e.target)) {
            userDropdown.style.display = 'none';
        }
    });

    loadCurrentUser();
    loadNotifications();
});
