
// Utility to format currency
const formatCurrency = (value) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);

// API_BASE, API_ROOT, API_HOST are defined in config.js - must be loaded first

// ========== TOAST NOTIFICATION SYSTEM ==========
// Crear contenedor de toasts si no existe
function getToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 400px;
        `;
        document.body.appendChild(container);
    }
    return container;
}

// Función principal para mostrar toast
function showToast(message, type = 'info', duration = 3000) {
    const container = getToastContainer();

    const toast = document.createElement('div');

    // Colores según tipo
    const styles = {
        success: { bg: '#10b981', icon: '✓', border: '#059669' },
        error: { bg: '#ef4444', icon: '✕', border: '#dc2626' },
        warning: { bg: '#f59e0b', icon: '⚠', border: '#d97706' },
        info: { bg: '#3b82f6', icon: 'ℹ', border: '#2563eb' }
    };

    const style = styles[type] || styles.info;

    toast.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 18px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        border-left: 4px solid ${style.border};
        animation: slideIn 0.3s ease-out;
        font-family: inherit;
    `;

    toast.innerHTML = `
        <span style="
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: ${style.bg};
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: bold;
            flex-shrink: 0;
        ">${style.icon}</span>
        <span style="flex: 1; color: #1f2937; font-size: 14px;">${message}</span>
        <button onclick="this.parentElement.remove()" style="
            background: none;
            border: none;
            cursor: pointer;
            color: #9ca3af;
            font-size: 18px;
            line-height: 1;
            padding: 4px;
        ">&times;</button>
    `;

    // Agregar estilos de animación si no existen
    if (!document.getElementById('toast-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'toast-styles';
        styleSheet.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(styleSheet);
    }

    container.appendChild(toast);

    // Auto-cerrar después de la duración
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Funciones de conveniencia
function showSuccess(message) { showToast(message, 'success'); }
function showError(message) { showToast(message, 'error', 4000); }
function showWarning(message) { showToast(message, 'warning'); }
function showInfo(message) { showToast(message, 'info'); }

// ========== MODAL DE CONFIRMACIÓN ESTILIZADO ==========
function showConfirm(message, options = {}) {
    return new Promise((resolve) => {
        const {
            title = '¿Estás seguro?',
            confirmText = 'Confirmar',
            cancelText = 'Cancelar',
            type = 'danger' // 'danger', 'warning', 'info'
        } = options;

        // Colores según tipo
        const colors = {
            danger: { btn: '#ef4444', hover: '#dc2626', icon: '🗑️' },
            warning: { btn: '#f59e0b', hover: '#d97706', icon: '⚠️' },
            info: { btn: '#3b82f6', hover: '#2563eb', icon: 'ℹ️' },
            success: { btn: '#10b981', hover: '#059669', icon: '✓' }
        };
        const color = colors[type] || colors.danger;

        // Crear overlay
        const overlay = document.createElement('div');
        overlay.id = 'confirm-modal-overlay';
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.5);
            backdrop-filter: blur(4px);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s ease-out;
        `;

        // Crear modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            border-radius: 12px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.25);
            padding: 24px;
            max-width: 400px;
            width: 90%;
            animation: scaleIn 0.2s ease-out;
        `;

        modal.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 48px; margin-bottom: 12px;">${color.icon}</div>
                <h3 style="font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 8px;">${title}</h3>
                <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">${message}</p>
            </div>
            <div style="display: flex; gap: 12px;">
                <button id="confirm-cancel" style="
                    flex: 1;
                    padding: 12px 20px;
                    border-radius: 8px;
                    border: 1px solid #e5e7eb;
                    background: white;
                    color: #374151;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.2s;
                ">${cancelText}</button>
                <button id="confirm-ok" style="
                    flex: 1;
                    padding: 12px 20px;
                    border-radius: 8px;
                    border: none;
                    background: ${color.btn};
                    color: white;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.2s;
                ">${confirmText}</button>
            </div>
        `;

        // Agregar estilos de animación
        if (!document.getElementById('confirm-modal-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'confirm-modal-styles';
            styleSheet.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { transform: scale(0.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                #confirm-cancel:hover { background: #f3f4f6; }
                #confirm-ok:hover { filter: brightness(0.9); }
            `;
            document.head.appendChild(styleSheet);
        }

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Event listeners
        const closeModal = (result) => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 200);
            resolve(result);
        };

        document.getElementById('confirm-cancel').onclick = () => closeModal(false);
        document.getElementById('confirm-ok').onclick = () => closeModal(true);
        overlay.onclick = (e) => { if (e.target === overlay) closeModal(false); };

        // Esc para cerrar
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal(false);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    });
}

// ========== MODAL DE INPUT/PROMPT ESTILIZADO ==========
function showPrompt(message, options = {}) {
    return new Promise((resolve) => {
        const {
            title = 'Ingrese información',
            placeholder = '',
            confirmText = 'Confirmar',
            cancelText = 'Cancelar',
            inputType = 'textarea', // 'text' or 'textarea'
            required = false
        } = options;

        // Crear overlay
        const overlay = document.createElement('div');
        overlay.id = 'prompt-modal-overlay';
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.5);
            backdrop-filter: blur(4px);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s ease-out;
        `;

        // Crear modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            border-radius: 12px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.25);
            padding: 24px;
            max-width: 450px;
            width: 90%;
            animation: scaleIn 0.2s ease-out;
        `;

        const inputHtml = inputType === 'textarea'
            ? `<textarea id="prompt-input" rows="3" placeholder="${placeholder}" style="
                width: 100%;
                padding: 12px;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                font-size: 14px;
                resize: vertical;
                font-family: inherit;
                box-sizing: border-box;
            "></textarea>`
            : `<input type="text" id="prompt-input" placeholder="${placeholder}" style="
                width: 100%;
                padding: 12px;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                font-size: 14px;
                font-family: inherit;
                box-sizing: border-box;
            ">`;

        modal.innerHTML = `
            <div style="margin-bottom: 16px;">
                <h3 style="font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 8px;">${title}</h3>
                <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-bottom: 16px;">${message}</p>
                ${inputHtml}
            </div>
            <div style="display: flex; gap: 12px;">
                <button id="prompt-cancel" style="
                    flex: 1;
                    padding: 12px 20px;
                    border-radius: 8px;
                    border: 1px solid #e5e7eb;
                    background: white;
                    color: #374151;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.2s;
                ">${cancelText}</button>
                <button id="prompt-ok" style="
                    flex: 1;
                    padding: 12px 20px;
                    border-radius: 8px;
                    border: none;
                    background: #3b82f6;
                    color: white;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.2s;
                ">${confirmText}</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Focus en el input
        setTimeout(() => document.getElementById('prompt-input').focus(), 100);

        // Event listeners
        const closeModal = (value) => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 200);
            resolve(value);
        };

        document.getElementById('prompt-cancel').onclick = () => closeModal(null);
        document.getElementById('prompt-ok').onclick = () => {
            const value = document.getElementById('prompt-input').value.trim();
            if (required && !value) {
                document.getElementById('prompt-input').style.borderColor = '#ef4444';
                return;
            }
            closeModal(value || null);
        };
        overlay.onclick = (e) => { if (e.target === overlay) closeModal(null); };

        // Enter para confirmar (solo en input type text)
        if (inputType === 'text') {
            document.getElementById('prompt-input').onkeydown = (e) => {
                if (e.key === 'Enter') {
                    document.getElementById('prompt-ok').click();
                }
            };
        }

        // Esc para cerrar
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal(null);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    });
}

// --- Admin Dashboard Logic ---
async function initAdminDashboard() {
    console.log("Initializing Admin Dashboard...");
    lucide.createIcons();

    // Helper to get CSS variable value
    const getHSL = (variable) => `hsl(${getComputedStyle(document.documentElement).getPropertyValue(variable).trim()})`;

    // Cargar estadísticas desde la API
    let stats = [
        { title: "Documentos Totales", value: "--", icon: "file-text", trend: { value: 12, positive: true } },
        { title: "Boletas Registradas", value: "--", icon: "receipt", trend: { value: 8, positive: true } },
        { title: "Proyectos Activos", value: "--", icon: "folder-open" },
        { title: "Usuarios Activos", value: "--", icon: "users" },
    ];

    try {
        const response = await fetch(`${API_BASE}/admin/dashboard`, { credentials: 'include' });
        const data = await response.json();
        stats = [
            { title: "Documentos Totales", value: data.totalDocumentos?.toLocaleString() || "0", icon: "file-text", trend: { value: 12, positive: true } },
            { title: "En Proyecto", value: data.documentosPendientes?.toLocaleString() || "0", icon: "clock", trend: { value: 8, positive: false } },
            { title: "Proyectos Activos", value: data.totalProyectos?.toLocaleString() || "0", icon: "folder-open" },
            { title: "Usuarios Activos", value: data.totalUsuarios?.toLocaleString() || "0", icon: "users" },
        ];
    } catch (error) {
        console.error('Error loading stats:', error);
    }

    // Render Stats (estilo original)
    const statsGrid = document.getElementById('stats-grid');
    if (statsGrid) {
        statsGrid.innerHTML = '';
        stats.forEach(stat => {
            const trendHtml = stat.trend
                ? `<span class="${stat.trend.positive ? 'text-green-500' : 'text-red-500'} text-xs flex items-center">
                    ${stat.trend.positive ? '+' : ''}${stat.trend.value}% 
                    <i data-lucide="${stat.trend.positive ? 'trending-up' : 'trending-down'}" class="w-3 h-3 ml-1"></i>
                </span>`
                : '';

            const card = document.createElement('div');
            card.className = "bg-white p-6 rounded-lg border shadow-sm";
            card.innerHTML = `
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-sm font-medium text-gray-500">${stat.title}</h3>
                    <i data-lucide="${stat.icon}" class="w-4 h-4 text-gray-400"></i>
                </div>
                <div class="flex items-end justify-between">
                    <div class="text-2xl font-bold">${stat.value}</div>
                    ${trendHtml}
                </div>
            `;
            statsGrid.appendChild(card);
        });
    }

    // Cargar datos para gráfico de barras desde API
    let chartData = { months: ["Jul", "Ago", "Sep", "Oct", "Nov", "Dic"], documents: [85, 102, 95, 120, 145, 132] };
    try {
        const response = await fetch(`${API_BASE}/admin/charts/monthly`, { credentials: 'include' });
        const data = await response.json();
        if (data && data.length > 0) {
            chartData.months = data.map(d => d.nombre_mes || d.mes);
            chartData.documents = data.map(d => d.cantidad);
        }
    } catch (error) {
        console.error('Error loading chart data:', error);
    }

    // Render Bar Chart (estilo original)
    const ctxBar = document.getElementById('barChart');
    if (ctxBar) {
        new Chart(ctxBar.getContext('2d'), {
            type: 'bar',
            data: {
                labels: chartData.months,
                datasets: [{
                    label: 'Documentos',
                    data: chartData.documents,
                    backgroundColor: getHSL('--accent'),
                    borderRadius: 4,
                    barPercentage: 0.6,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: getHSL('--card'),
                        titleColor: getHSL('--foreground'),
                        bodyColor: getHSL('--foreground'),
                        borderColor: getHSL('--border'),
                        borderWidth: 1,
                        padding: 10,
                        displayColors: false,
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: getHSL('--muted'),
                            borderDash: [3, 3],
                            drawBorder: false,
                        },
                        ticks: { color: getHSL('--muted-foreground') }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: getHSL('--muted-foreground') }
                    }
                }
            }
        });
    }

    // Cargar datos para gráfico pie desde API
    let pieData = { labels: ["Contratos", "Presupuestos", "Informes", "Facturas", "Otros"], data: [35, 25, 20, 15, 5] };
    try {
        const response = await fetch(`${API_BASE}/admin/charts/types`, { credentials: 'include' });
        const data = await response.json();
        if (data && data.length > 0) {
            pieData.labels = data.map(d => d.nombre);
            pieData.data = data.map(d => d.cantidad);
        }
    } catch (error) {
        console.error('Error loading pie data:', error);
    }

    const ctxPie = document.getElementById('pieChart');
    if (ctxPie) {


        new Chart(ctxPie.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: pieData.labels,
                datasets: [{
                    data: pieData.data,
                    backgroundColor: pieColors,
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: getHSL('--card'),
                        bodyColor: getHSL('--foreground'),
                        borderColor: getHSL('--border'),
                        borderWidth: 1,
                        padding: 10,
                    }
                }
            }
        });

        // Custom Legend Generation (estilo original)
        const legendContainer = document.getElementById('pie-legend');
        if (legendContainer) {
            legendContainer.innerHTML = pieData.labels.map((label, i) => `
                <div class="flex items-center gap-1.5">
                    <div class="w-3 h-3 rounded-full" style="background-color: ${pieColors[i]}"></div>
                    <span class="text-xs text-gray-600">${label}</span>
                </div>
            `).join('');
        }
    }

    // Cargar documentos recientes desde API
    let recentDocuments = [];
    try {
        const response = await fetch(`${API_BASE}/admin/recent?limit=10`, { credentials: 'include' });
        const data = await response.json();
        if (data && data.length > 0) {
            recentDocuments = data.map(doc => ({
                id_real: doc.id_documento,
                id: `DOC-${String(doc.id_documento).padStart(3, '0')}`,
                nombre: doc.titulo,
                tipo: doc.tipo_nombre || 'Documento',
                fecha: new Date(doc.fecha_registro).toISOString().split('T')[0],
                estado: doc.estado_nombre || 'Activo',
                proyecto: doc.proyecto_nombre || '-'
            }));
        }
    } catch (error) {
        console.error('Error loading recent documents:', error);
        // Fallback a datos de ejemplo
        recentDocuments = [
            { id_real: 0, id: "DOC-001", nombre: "Sin documentos", tipo: "-", fecha: "-", estado: "-", proyecto: "-" },
        ];
    }

    // Render Table (estilo original)
    const tableBody = document.getElementById('table-body');
    if (tableBody) {
        tableBody.innerHTML = '';
        recentDocuments.forEach(doc => {
            const row = document.createElement('tr');
            row.className = "border-b transition-colors hover:bg-gray-50/50";

            let badgeClass = "";
            if (doc.estado === "Aprobado" || doc.estado === "Activo") badgeClass = "bg-blue-100 text-blue-800 border-blue-200";
            else if (doc.estado === "Pendiente" || doc.estado === "Sin Asignar") badgeClass = "bg-orange-100 text-orange-800 border-orange-200";
            else if (doc.estado === "En Proyecto") badgeClass = "bg-blue-100 text-blue-800 border-blue-200";
            else badgeClass = "bg-gray-100 text-gray-800";

            row.innerHTML = `
                <td class="p-4 align-middle font-medium">${doc.id}</td>
                <td class="p-4 align-middle">${doc.nombre}</td>
                <td class="p-4 align-middle"><span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-800">${doc.tipo}</span></td>
                <td class="p-4 align-middle">${doc.proyecto}</td>
                <td class="p-4 align-middle">${doc.fecha}</td>
                <td class="p-4 align-middle">
                    <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeClass}">
                        ${doc.estado}
                    </span>
                </td>
                <td class="p-4 align-middle">
                     <div class="flex gap-1">
                        <button onclick="viewDocFromDashboard(${doc.id_real})" class="p-2 hover:bg-gray-100 rounded text-gray-500" title="Ver documento">
                            <i data-lucide="eye" class="w-4 h-4"></i>
                        </button>
                        <button onclick="window.location.href='admin-archivador.html?edit=${doc.id_real}'" class="p-2 hover:bg-gray-100 rounded text-gray-500" title="Editar documento">
                            <i data-lucide="edit" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteDocFromDashboard(${doc.id_real})" class="p-2 hover:bg-gray-100 rounded text-red-500" title="Eliminar documento">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
    lucide.createIcons();
}


// --- Jefe de Proyecto: Projects List ---
async function initJefeProjects() {
    console.log("Initializing Jefe Projects...");
    lucide.createIcons();

    const grid = document.getElementById('projects-full-list');
    if (!grid) return;

    // Load selects for modal
    await loadJefeModalSelects();

    try {
        // Fetch only projects assigned to current jefe
        const response = await fetch(`${API_BASE}/projects/my-projects`, { credentials: 'include' });
        const projects = await response.json();

        grid.innerHTML = '';

        if (projects.length === 0) {
            grid.innerHTML = '<p class="col-span-3 text-center text-muted-foreground py-8">No hay proyectos registrados</p>';
            return;
        }

        projects.forEach(p => {
            // Calculate progress client-side
            let progreso = 0;
            if (p.fecha_inicio && p.fecha_fin) {
                const start = new Date(p.fecha_inicio).getTime();
                const end = new Date(p.fecha_fin).getTime();
                const now = new Date().getTime();
                if (end > start) {
                    const totalDuration = end - start;
                    const elapsed = now - start;
                    progreso = Math.round((elapsed / totalDuration) * 100);
                }
            }
            if (progreso < 0) progreso = 0;
            if (progreso > 100) progreso = 100;

            // Color based on status/progress
            const colorClass = p.estado_nombre === 'Completado' ? 'bg-green-500' : 'bg-primary';

            const card = document.createElement('div');
            card.className = "rounded-lg border bg-card shadow-sm hover:shadow-md transition-all p-6";
            card.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <div class="p-2 bg-muted rounded-lg">
                <i data-lucide="building" class="w-6 h-6 text-muted-foreground"></i>
            </div>
            <span class="text-xs font-semibold px-2 py-1 rounded-full bg-muted text-foreground">${p.estado_nombre || 'Sin Estado'}</span>
        </div>
        <h3 class="font-bold text-lg mb-1">${p.nombre}</h3>
        <p class="text-sm text-muted-foreground mb-4">${p.jefe_nombre ? 'Responsable: ' + p.jefe_nombre : 'Sin Responsable'}</p>
        
        <div class="space-y-2">
            <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">Avance (Tiempo)</span>
                <span class="font-medium">${progreso}%</span>
            </div>
            <div class="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div class="h-full ${colorClass}" style="width: ${progreso}%"></div>
            </div>
        </div>
        
        <div class="mt-4 pt-4 border-t border-primary-foreground/10 flex justify-between items-center">
            <div class="flex gap-2">
                <button onclick="openJefeEditModal(${p.id_proyecto})" class="p-2 hover:bg-gray-100 rounded text-gray-500" title="Editar">
                    <i data-lucide="edit" class="w-4 h-4"></i>
                </button>
                <button onclick="deleteJefeProject(${p.id_proyecto})" class="p-2 hover:bg-red-50 rounded text-red-500" title="Eliminar">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
            <button onclick="window.location.href='jefe-proyecto-detalle.html?id=${p.id_proyecto}'" class="text-sm font-medium text-muted-foreground hover:text-black">Ver detalles</button>
        </div>
    `;
            grid.appendChild(card);
        });
        lucide.createIcons();

    } catch (error) {
        console.error("Error loading projects:", error);
        grid.innerHTML = '<p class="col-span-3 text-center text-red-500 py-8">Error al cargar proyectos</p>';
    }
}

// --- Jefe: Project Modal Functions (Create only, no edit/delete) ---
async function loadJefeModalSelects() {
    try {
        // Load statuses
        const [statusRes, priorityRes, usersRes] = await Promise.all([
            fetch(`${API_BASE}/project-statuses`),
            fetch(`${API_BASE}/project-priorities`),
            fetch(`${API_BASE}/users?id_rol=2`) // Only jefes (id_rol=2)
        ]);

        const statuses = await statusRes.json();
        const priorities = await priorityRes.json();
        const users = await usersRes.json();

        const statusSelect = document.getElementById('project-status');
        const prioritySelect = document.getElementById('project-priority');
        const managerSelect = document.getElementById('project-manager');

        if (statusSelect) {
            statusSelect.innerHTML = statuses.map(s => `<option value="${s.id_estado}">${s.nombre}</option>`).join('');
        }
        if (prioritySelect) {
            prioritySelect.innerHTML = priorities.map(p => `<option value="${p.id_prioridad}">${p.nombre}</option>`).join('');
        }
        if (managerSelect) {
            managerSelect.innerHTML = '<option value="">Sin asignar</option>' +
                users.map(u => `<option value="${u.id_usuario}">${u.nombre} ${u.apellido || ''}</option>`).join('');
        }
    } catch (e) {
        console.error('Error loading modal selects:', e);
    }
}

function openJefeCreateModal() {
    document.getElementById('modal-title').textContent = 'Nuevo Proyecto';
    document.getElementById('project-form').reset();
    document.getElementById('project-id').value = '';
    document.getElementById('project-modal').classList.remove('hidden');
    document.getElementById('project-modal').classList.add('flex');
    lucide.createIcons();
}

function closeJefeModal() {
    document.getElementById('project-modal').classList.add('hidden');
    document.getElementById('project-modal').classList.remove('flex');
}

async function openJefeEditModal(projectId) {
    try {
        const response = await fetch(`${API_BASE}/projects/${projectId}`);
        const project = await response.json();

        document.getElementById('modal-title').textContent = 'Editar Proyecto';
        document.getElementById('project-id').value = project.id_proyecto;
        document.getElementById('project-name').value = project.nombre || '';
        document.getElementById('project-desc').value = project.descripcion || '';
        document.getElementById('project-start').value = project.fecha_inicio ? project.fecha_inicio.split('T')[0] : '';
        document.getElementById('project-end').value = project.fecha_fin ? project.fecha_fin.split('T')[0] : '';
        document.getElementById('project-status').value = project.id_estado || '';
        document.getElementById('project-priority').value = project.id_prioridad || '';
        document.getElementById('project-manager').value = project.id_jefe || '';

        document.getElementById('project-modal').classList.remove('hidden');
        document.getElementById('project-modal').classList.add('flex');
        lucide.createIcons();
    } catch (error) {
        console.error('Error loading project:', error);
        alert('Error al cargar el proyecto');
    }
}

async function deleteJefeProject(projectId) {
    if (!confirm('¿Está seguro de eliminar este proyecto? Esta acción no se puede deshacer.')) return;

    try {
        const response = await fetch(`${API_BASE}/projects/${projectId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Proyecto eliminado exitosamente');
            initJefeProjects(); // Refresh list
        } else {
            const err = await response.json();
            alert('Error al eliminar: ' + (err.message || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

async function handleJefeSubmit(e) {
    e.preventDefault();

    const projectId = document.getElementById('project-id').value;
    const isEdit = projectId && projectId !== '';

    const data = {
        nombre: document.getElementById('project-name').value,
        descripcion: document.getElementById('project-desc').value,
        fecha_inicio: document.getElementById('project-start').value || null,
        fecha_fin: document.getElementById('project-end').value || null,
        id_estado: document.getElementById('project-status').value || 1,
        id_prioridad: document.getElementById('project-priority').value || 2,
        id_jefe: document.getElementById('project-manager').value || null
    };

    try {
        const url = isEdit ? `${API_BASE}/projects/${projectId}` : `${API_BASE}/projects`;
        const method = isEdit ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            closeJefeModal();
            alert(isEdit ? 'Proyecto actualizado exitosamente' : 'Proyecto creado exitosamente');
            initJefeProjects(); // Refresh list
        } else {
            const err = await response.json();
            alert('Error: ' + (err.message || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

// --- Jefe de Proyecto: Create Project ---
async function initJefeCreateProject() {
    console.log("Initializing Jefe Create Project...");
    lucide.createIcons();

    // 1. Load Users for Select
    const jefeSelect = document.getElementById('select-jefe');
    if (jefeSelect) {
        try {
            const response = await fetch(`${API_BASE}/users`);
            const users = await response.json();

            jefeSelect.innerHTML = '<option value="">Seleccionar Jefe...</option>';
            users.forEach(u => {
                const opt = document.createElement('option');
                opt.value = u.id_usuario;
                opt.textContent = u.nombre_completo || u.nombre;
                jefeSelect.appendChild(opt);
            });
        } catch (e) {
            console.error("Error loading users:", e);
            jefeSelect.innerHTML = '<option value="">Error cargando usuarios</option>';
        }
    }

    // 2. Handle Form Submit
    const form = document.getElementById('create-project-form');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = 'Guardando...';
            submitBtn.disabled = true;

            const formData = new FormData(form);
            const data = {
                nombre: formData.get('nombre'),
                // code: formData.get('codigo'), 
                fecha_inicio: formData.get('fecha_inicio'),
                fecha_fin: formData.get('fecha_fin'),
                descripcion: formData.get('descripcion'),
                id_jefe: formData.get('id_jefe'),
                id_estado: 1, // Planificación
                id_prioridad: 2 // Media
            };

            try {
                const res = await fetch(`${API_BASE}/projects`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (res.ok) {
                    const result = await res.json();
                    alert('Proyecto creado exitosamente');
                    window.location.href = 'jefe-proyectos.html';
                } else {
                    const err = await res.json();
                    alert('Error al crear proyecto: ' + (err.message || 'Desconocido'));
                }
            } catch (error) {
                console.error("Error creating project:", error);
                alert('Error de conexión al crear proyecto');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        };
    }
}

// --- Jefe de Proyecto Logic ---
async function initJefeDashboard() {
    console.log("Initializing Jefe Dashboard...");
    lucide.createIcons();

    try {
        const response = await fetch(`${API_BASE}/projects/jefe-stats`, { credentials: 'include' });
        const data = await response.json();

        // 1. Stats Cards
        const stats = [
            { title: "Proyectos Activos", value: data.stats.activeProjects.toString(), icon: "briefcase", trend: { value: 2, positive: true } },
            { title: "Tareas Pendientes", value: data.stats.pendingTasks.toString(), icon: "clock", trend: { value: 5, positive: false } },
            { title: "Hitos Este Mes", value: data.stats.hitos.toString(), icon: "calendar" },
            { title: "Miembros", value: data.stats.members.toString(), icon: "users" },
        ];

        const container = document.getElementById('stats-grid-jefe');
        if (container) {
            container.innerHTML = '';
            stats.forEach(stat => {
                const trendHtml = stat.trend
                    ? `<span class="${stat.trend.positive ? 'text-green-500' : 'text-red-500'} text-xs flex items-center">
                        ${stat.trend.positive ? '+' : ''}${stat.trend.value}% 
                        <i data-lucide="${stat.trend.positive ? 'trending-up' : 'trending-down'}" class="w-3 h-3 ml-1"></i>
                    </span>`
                    : '';

                const card = document.createElement('div');
                card.className = "bg-white p-6 rounded-lg border shadow-sm";
                card.innerHTML = `
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="text-sm font-medium text-gray-500">${stat.title}</h3>
                        <i data-lucide="${stat.icon}" class="w-4 h-4 text-gray-400"></i>
                    </div>
                    <div class="flex items-end justify-between">
                        <div class="text-2xl font-bold">${stat.value}</div>
                        ${trendHtml}
                    </div>
                `;
                container.appendChild(card);
            });
        }

        // 2. Active Projects List with Progress
        const projectsList = document.getElementById('projects-list');
        if (projectsList) {
            projectsList.innerHTML = '';
            if (data.projects && data.projects.length > 0) {
                data.projects.forEach(p => {
                    // Estado badge styles
                    const badgeClass = p.estado === 'Completado' ? 'bg-green-100 text-green-800'
                        : p.estado === 'En Progreso' ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800';

                    const card = document.createElement('div');
                    card.className = "rounded-lg border bg-white p-4 hover:shadow-md transition-shadow";
                    card.innerHTML = `
                        <div class="flex items-start justify-between mb-3">
                            <div>
                                <h3 class="font-semibold">${p.nombre}</h3>
                                <p class="text-sm text-gray-500">${p.cliente}</p>
                            </div>
                            <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeClass}">${p.estado}</span>
                        </div>
                        <div class="space-y-2">
                            <div class="flex justify-between text-sm">
                                <span>Progreso (Tiempo)</span>
                                <span class="font-medium">${p.progreso}%</span>
                            </div>
                            <div class="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div class="h-full bg-green-500 transition-all" style="width: ${p.progreso}%"></div>
                            </div>
                        </div>
                     `;
                    projectsList.appendChild(card);
                });
            } else {
                projectsList.innerHTML = '<p class="text-center text-muted-foreground py-4">No hay proyectos activos</p>';
            }
        }

        // 3. Recent Tasks List
        const tasksList = document.getElementById('tasks-list');
        if (tasksList) {
            tasksList.innerHTML = '';
            if (data.tasks && data.tasks.length > 0) {
                data.tasks.forEach(t => {
                    const row = document.createElement('div');
                    row.className = "flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors";
                    row.innerHTML = `
                         <i data-lucide="${t.prioridad === 'Alta' ? 'alert-triangle' : 'check-circle-2'}" class="w-4 h-4 ${t.prioridad === 'Alta' ? 'text-red-500' : 'text-orange-500'} mt-0.5"></i>
                         <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium truncate">${t.titulo}</p>
                            <p class="text-xs text-gray-500">${t.proyecto}</p>
                         </div>
                         <span class="text-xs border px-2 py-0.5 rounded bg-white text-gray-600">${t.vence}</span>
                    `;
                    tasksList.appendChild(row);
                });
            } else {
                tasksList.innerHTML = '<p class="text-center text-muted-foreground py-2">No hay tareas pendientes</p>';
            }

        }

        lucide.createIcons();

    } catch (error) {
        console.error("Error loading Jefe Dashboard:", error);
        document.getElementById('stats-grid-jefe').innerHTML = '<p class="col-span-4 text-red-500 text-center">Error al cargar estadísticas</p>';
    }

    // Chart - Keep static for layout visual or implement historical endpoint later
    const ctxProgress = document.getElementById('progressChart');
    if (ctxProgress) {
        new Chart(ctxProgress.getContext('2d'), {
            type: 'line',
            data: {
                labels: ["S1", "S2", "S3", "S4", "S5", "S6"],
                datasets: [{
                    label: 'Avance General Est.',
                    data: [15, 28, 42, 55, 68, 75],
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, max: 100 }
                }
            }
        });
    }
}

// --- Operativo Dashboard Logic ---
async function initOperativoDashboard() {
    console.log("Initializing Operativo Dashboard...");
    lucide.createIcons();

    // Helper to get CSS variable value
    const getHSL = (variable) => `hsl(${getComputedStyle(document.documentElement).getPropertyValue(variable).trim()})`;

    try {
        // Fetch stats from API
        const response = await fetch(`${API_BASE}/budgets/operativo-stats`);
        const data = await response.json();

        // Stats Cards
        const stats = [
            { title: "Presupuestos Activos", value: data.stats.presupuestosActivos.toString(), icon: "calculator", trend: { value: 15, positive: true } },
            { title: "Materiales Registrados", value: data.stats.materialesRegistrados.toString(), icon: "building-2" },
            { title: "Tipos de Mano de Obra", value: data.stats.tiposManoObra.toString(), icon: "users" },
            { title: "Costo Promedio", value: `S/ ${Math.round(data.stats.costoPromedio / 1000)}K`, icon: "trending-up", trend: { value: 3, positive: data.stats.costoPromedio > 0 } },
        ];

        const container = document.getElementById('stats-grid-operativo');
        if (container) {
            container.innerHTML = '';
            stats.forEach(stat => {
                const trendHtml = stat.trend
                    ? `<span class="${stat.trend.positive ? 'text-green-500' : 'text-red-500'} text-xs flex items-center">
                        ${stat.trend.positive ? '+' : ''}${stat.trend.value}% 
                        <i data-lucide="${stat.trend.positive ? 'trending-up' : 'trending-down'}" class="w-3 h-3 ml-1"></i>
                    </span>`
                    : '';

                const card = document.createElement('div');
                card.className = "bg-white p-6 rounded-lg border shadow-sm";
                card.innerHTML = `
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="text-sm font-medium text-gray-500">${stat.title}</h3>
                        <i data-lucide="${stat.icon}" class="w-4 h-4 text-gray-400"></i>
                    </div>
                    <div class="flex items-end justify-between">
                        <div class="text-2xl font-bold">${stat.value}</div>
                        ${trendHtml}
                    </div>
                `;
                container.appendChild(card);
            });
        }

        // Cost Trend Chart (keep static data for now, would need monthly aggregation endpoint)
        const ctxTrend = document.getElementById('costTrendChart');
        if (ctxTrend) {
            new Chart(ctxTrend.getContext('2d'), {
                type: 'line',
                data: {
                    labels: ["Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
                    datasets: [
                        {
                            label: 'Materiales',
                            data: [45000, 52000, 48000, 61000, 75000, parseFloat(data.costDistribution.total_materiales) || 68000],
                            borderColor: getHSL('--chart-1'),
                            backgroundColor: 'transparent',
                            pointBackgroundColor: getHSL('--card'),
                            pointBorderColor: getHSL('--chart-1'),
                            pointBorderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 6,
                            tension: 0.4,
                            fill: false
                        },
                        {
                            label: 'Mano de Obra',
                            data: [28000, 32000, 35000, 38000, 42000, parseFloat(data.costDistribution.total_mano_obra) || 45000],
                            borderColor: getHSL('--chart-2'),
                            backgroundColor: 'transparent',
                            pointBackgroundColor: getHSL('--card'),
                            pointBorderColor: getHSL('--chart-2'),
                            pointBorderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 6,
                            tension: 0.4,
                            fill: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 8 } },
                        tooltip: {
                            backgroundColor: getHSL('--card'),
                            titleColor: getHSL('--foreground'),
                            bodyColor: getHSL('--foreground'),
                            borderColor: getHSL('--border'),
                            borderWidth: 1,
                            padding: 10,
                            displayColors: true,
                            usePointStyle: true
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: getHSL('--muted'), borderDash: [3, 3], drawBorder: false },
                            ticks: { color: getHSL('--muted-foreground') }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: getHSL('--muted-foreground') }
                        }
                    }
                }
            });
        }

        // Material List - from API
        const materialsList = document.getElementById('materials-list');
        if (materialsList) {
            materialsList.innerHTML = '';
            if (data.topMaterials && data.topMaterials.length > 0) {
                data.topMaterials.forEach((m, idx) => {
                    const d = document.createElement('div');
                    d.className = "flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors";
                    d.innerHTML = `
                        <div class="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-sm font-medium text-orange-600">${idx + 1}</div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium truncate">${m.nombre}</p>
                            <p class="text-xs text-gray-500">${m.total_cantidad} ${m.unidad_medida}</p>
                        </div>
                        <span class="text-sm font-medium">${formatCurrency(m.total_costo)}</span>
                    `;
                    materialsList.appendChild(d);
                });
            } else {
                materialsList.innerHTML = '<p class="text-center text-muted-foreground py-4">No hay materiales en presupuestos</p>';
            }
        }

        // Budget Table - from API
        const budgetTable = document.getElementById('budget-table-body');
        if (budgetTable) {
            budgetTable.innerHTML = '';
            if (data.recentBudgets && data.recentBudgets.length > 0) {
                data.recentBudgets.forEach(p => {
                    const statusClass = p.estado === 'Completado' ? 'bg-green-100 text-green-700' :
                        p.estado === 'Aceptado' ? 'bg-blue-100 text-blue-700' :
                            p.estado === 'Rechazado' ? 'bg-red-100 text-red-700' :
                                'bg-orange-100 text-orange-700';
                    const tr = document.createElement('tr');
                    tr.className = "border-b hover:bg-gray-50";
                    tr.innerHTML = `
                        <td class="p-4 align-middle">PPTO-${String(p.id_presupuesto).padStart(3, '0')}</td>
                        <td class="p-4 align-middle">${p.proyecto_nombre || p.titulo || 'Sin proyecto'}</td>
                        <td class="p-4 align-middle">${formatCurrency(p.total_materiales || 0)}</td>
                        <td class="p-4 align-middle">${formatCurrency(p.total_mano_obra || 0)}</td>
                        <td class="p-4 align-middle font-semibold">${formatCurrency(p.total_general || 0)}</td>
                        <td class="p-4 align-middle">
                            <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusClass}">
                                ${p.estado}
                            </span>
                        </td>
                    `;
                    budgetTable.appendChild(tr);
                });
            } else {
                budgetTable.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-muted-foreground">No hay presupuestos</td></tr>';
            }
        }

        // Cost Distribution List - from API
        const distList = document.getElementById('cost-distribution-list');
        if (distList) {
            const totalMat = parseFloat(data.costDistribution.total_materiales) || 0;
            const totalMO = parseFloat(data.costDistribution.total_mano_obra) || 0;
            const totalOtros = parseFloat(data.costDistribution.total_otros) || 0;
            const total = totalMat + totalMO + totalOtros;

            const items = [
                { label: "Materiales", value: totalMat, percent: total > 0 ? Math.round((totalMat / total) * 100) : 0, color: getHSL('--chart-1') },
                { label: "Mano de Obra", value: totalMO, percent: total > 0 ? Math.round((totalMO / total) * 100) : 0, color: getHSL('--chart-2') },
                { label: "Otros (Terceros, Viáticos, Imp.)", value: totalOtros, percent: total > 0 ? Math.round((totalOtros / total) * 100) : 0, color: getHSL('--chart-3') }
            ];

            distList.innerHTML = items.map(item => `
                <div class="space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-600">${item.label}</span>
                        <span class="font-medium">${formatCurrency(item.value)}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div class="h-full rounded-full" style="width: ${item.percent}%; background-color: ${item.color}"></div>
                        </div>
                        <span class="text-xs text-gray-500 w-8 text-right">${item.percent}%</span>
                    </div>
                </div>
            `).join('') + `
                <div class="pt-4 mt-2 border-t flex justify-between items-center">
                    <span class="font-semibold text-gray-700">Total General</span>
                    <span class="text-lg font-bold text-foreground">${formatCurrency(total)}</span>
                </div>
            `;
        }

    } catch (error) {
        console.error('Error loading operativo dashboard:', error);
        // Fallback to show error message in stats container
        const container = document.getElementById('stats-grid-operativo');
        if (container) {
            container.innerHTML = '<div class="col-span-4 text-center text-red-500 py-8">Error al cargar datos del dashboard</div>';
        }
    }

    lucide.createIcons();
}

// --- Sidebar Toggle Logic ---
// --- Sidebar Toggle Logic ---
// --- Sidebar Toggle Logic ---
window.toggleSidebar = function () {
    const sidebar = document.getElementById('app-sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');

    if (sidebar) {
        // Desktop Toggle
        const isCollapsed = sidebar.classList.contains('w-16');
        const sidebarTitle = sidebar.querySelector('.sidebar-title');
        const sidebarTexts = sidebar.querySelectorAll('.sidebar-text');
        const menuSectionTitle = sidebar.querySelector('.uppercase.tracking-wider');

        if (window.innerWidth >= 1024) { // Desktop
            if (isCollapsed) {
                sidebar.classList.remove('w-16');
                sidebar.classList.add('w-64');
                if (toggleBtn) toggleBtn.innerHTML = '<i data-lucide="chevron-left" class="h-4 w-4"></i>';
                if (sidebarTitle) sidebarTitle.classList.remove('hidden');
                if (menuSectionTitle) menuSectionTitle.classList.remove('hidden');
                sidebarTexts.forEach(el => el.classList.remove('hidden'));
            } else {
                sidebar.classList.remove('w-64');
                sidebar.classList.add('w-16');
                if (toggleBtn) toggleBtn.innerHTML = '<i data-lucide="chevron-right" class="h-4 w-4"></i>';
                if (sidebarTitle) sidebarTitle.classList.add('hidden');
                if (menuSectionTitle) menuSectionTitle.classList.add('hidden');
                sidebarTexts.forEach(el => el.classList.add('hidden'));
            }
        } else {
            // Mobile Toggle (Simple show/hide)
            sidebar.classList.toggle('hidden');
            sidebar.classList.toggle('fixed');
            sidebar.classList.toggle('inset-y-0');
            sidebar.classList.toggle('left-0');
            sidebar.classList.toggle('z-50');
            sidebar.classList.toggle('w-64');
            // Add overlay handling if we were fancy, but simple toggle is enough for now
        }
        lucide.createIcons();
    }
}

// Mobile Menu Button Listener
document.addEventListener('DOMContentLoaded', () => {
    const mobileBtn = document.getElementById('mobile-menu-btn');
    if (mobileBtn) {
        mobileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSidebar(); // Reuse logic or custom
        });
    }

    // Close on click outside for mobile (optional better UX)
    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('app-sidebar');
        const mobileBtn = document.getElementById('mobile-menu-btn');
        if (window.innerWidth < 1024 && sidebar && !sidebar.classList.contains('hidden') && !sidebar.contains(e.target) && !mobileBtn.contains(e.target)) {
            toggleSidebar();
        }
    });
});

// --- Avisos Logic ---
// --- Avisos Logic ---
async function initAvisos() {
    console.log("Initializing Avisos...");
    const container = document.getElementById('avisos-list');
    if (!container) return;

    let allNotifications = [];
    let currentTab = 'todos';

    // Helper functions exposed to window for inline onclicks in generated HTML
    window.markAsReadAviso = async (id) => {
        try {
            await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'PUT' });
            loadNotifications();
        } catch (e) { console.error(e); }
    };

    window.deleteAviso = async (id) => {
        if (!confirm('¿Eliminar esta notificación?')) return;
        try {
            await fetch(`${API_BASE}/notifications/${id}`, { method: 'DELETE' });
            loadNotifications();
        } catch (e) { console.error(e); }
    };

    window.formatDate = (dateString) => {
        if (!dateString) return 'Ahora';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffMins < 1440) return `Hace ${Math.floor(diffMins / 60)} horas`;
        return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
    };

    async function loadNotifications() {
        container.innerHTML = '<div class="text-center py-8"><i data-lucide="loader-2" class="w-8 h-8 animate-spin text-muted-foreground mx-auto"></i></div>';
        lucide.createIcons();

        try {
            const res = await fetch(`${API_BASE}/notifications`);
            if (!res.ok) throw new Error("Error fetching notifications");
            allNotifications = await res.json();
            filterAndRender();
        } catch (e) {
            console.error(e);
            container.innerHTML = '<div class="text-center py-8 text-red-500">Error al cargar notificaciones</div>';
        }
    }

    function filterAndRender() {
        let filtered = allNotifications;
        if (currentTab === 'no-leidos') {
            filtered = allNotifications.filter(n => !n.leido);
        } else if (currentTab === 'alertas') {
            filtered = allNotifications.filter(n => n.tipo === 'alerta');
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i data-lucide="bell-off" class="w-12 h-12 mx-auto text-muted-foreground mb-4"></i>
                    <h3 class="text-lg font-semibold mb-2">No hay avisos</h3>
                    <p class="text-muted-foreground">No tienes notificaciones en esta categoría</p>
                </div>`;
            lucide.createIcons();
            return;
        }

        const typeIcons = {
            'info': { icon: 'info', color: 'bg-blue-100 text-blue-600' },
            'alerta': { icon: 'alert-triangle', color: 'bg-red-100 text-red-600' },
            'pendiente': { icon: 'clock', color: 'bg-yellow-100 text-yellow-600' },
            'exito': { icon: 'check-circle', color: 'bg-green-100 text-green-600' }
        };

        container.innerHTML = filtered.map(n => {
            const config = typeIcons[n.tipo] || typeIcons.info;
            return `
                <div class="rounded-lg border bg-card p-4 shadow-sm ${!n.leido ? 'border-l-4 border-l-blue-500' : ''}">
                    <div class="flex items-start gap-4">
                        <div class="p-2 rounded-full ${config.color}">
                            <i data-lucide="${config.icon}" class="w-5 h-5"></i>
                        </div>
                        <div class="flex-1">
                            <p class="text-sm ${!n.leido ? 'font-semibold' : ''}">${n.mensaje}</p>
                            <div class="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span><i data-lucide="clock" class="w-3 h-3 inline mr-1"></i>${window.formatDate(n.fecha)}</span>
                                <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs capitalize">${n.tipo}</span>
                            </div>
                        </div>
                        <div class="flex gap-1">
                            ${!n.leido ? `
                                <button onclick="window.markAsReadAviso(${n.id_notificacion})" class="p-2 hover:bg-accent rounded" title="Marcar como leído">
                                    <i data-lucide="check" class="w-4 h-4"></i>
                                </button>
                            ` : ''}
                            <button onclick="window.deleteAviso(${n.id_notificacion})" class="p-2 hover:bg-destructive/20 rounded text-destructive" title="Eliminar">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        lucide.createIcons();
    }

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active', 'bg-background', 'shadow-sm'));
            btn.classList.add('active', 'bg-background', 'shadow-sm');
            currentTab = btn.dataset.tab;
            filterAndRender();
        }
    });

    // Create Modal Binding
    const createBtn = document.getElementById('create-aviso-btn');
    const modal = document.getElementById('aviso-modal');

    if (createBtn && modal) {
        createBtn.onclick = () => {
            document.getElementById('aviso-form').reset();
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        };
    }

    const closeModal = () => {
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    };

    const closeBtn = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-aviso');
    if (closeBtn) closeBtn.onclick = closeModal;
    if (cancelBtn) cancelBtn.onclick = closeModal;

    // Submit Form
    const form = document.getElementById('aviso-form');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) { submitBtn.textContent = 'Guardando...'; submitBtn.disabled = true; }

            const data = {
                mensaje: document.getElementById('aviso-msg').value,
                tipo: document.getElementById('aviso-type').value
            };

            try {
                const res = await fetch(`${API_BASE}/notifications`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (res.ok) {
                    closeModal();
                    loadNotifications();
                    alert('Aviso creado exitosamente');
                } else {
                    alert('Error al crear aviso');
                }
            } catch (error) {
                console.error(error);
                alert('Error de conexión');
            } finally {
                if (submitBtn) { submitBtn.textContent = 'Guardar Aviso'; submitBtn.disabled = false; }
            }
        };
    }

    loadNotifications();
}

// Auto-init based on page content
window.addEventListener('DOMContentLoaded', () => {
    // Always render icons (for sidebar toggle, etc.)
    lucide.createIcons();

    // Inicializar dashboard automáticamente si existe el elemento stats-grid
    if (document.getElementById('stats-grid') && !window.adminInitDone) {
        initAdminDashboard();
        window.adminInitDone = true;
    }
});



// --- Jefe de Proyecto: Modal Logic ---
async function openJefeCreateModal() {
    document.getElementById('modal-title').textContent = 'Nuevo Proyecto';
    const form = document.getElementById('project-form');
    if (form) form.reset();

    const idField = document.getElementById('project-id');
    if (idField) idField.value = '';

    const modal = document.getElementById('project-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
    lucide.createIcons();

    await loadJefeFormOptions();
}

function closeJefeModal() {
    const modal = document.getElementById('project-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

async function loadJefeFormOptions() {
    try {
        const [statuses, priorities, users] = await Promise.all([
            fetch(`${API_BASE}/project-statuses`).then(r => r.json()),
            fetch(`${API_BASE}/project-priorities`).then(r => r.json()),
            fetch(`${API_BASE}/users?id_rol=2`).then(r => r.json()) // Only jefes
        ]);

        const statusSelect = document.getElementById('project-status');
        if (statusSelect) {
            statusSelect.innerHTML = statuses.map(s => `<option value="${s.id_estado}">${s.nombre}</option>`).join('');
        }

        const prioritySelect = document.getElementById('project-priority');
        if (prioritySelect) {
            prioritySelect.innerHTML = priorities.map(p => `<option value="${p.id_prioridad}">${p.nombre}</option>`).join('');
        }

        const userSelect = document.getElementById('project-manager');
        if (userSelect) {
            userSelect.innerHTML = '<option value="">Sin asignar</option>' +
                users.map(u => `<option value="${u.id_usuario}">${u.nombre} ${u.apellido}</option>`).join('');
        }

    } catch (e) {
        console.error("Error loading options:", e);
    }
}

async function handleJefeSubmit(e) {
    if (e) e.preventDefault();

    const id = document.getElementById('project-id')?.value;
    const data = {
        nombre: document.getElementById('project-name').value,
        descripcion: document.getElementById('project-desc').value,
        fecha_inicio: document.getElementById('project-start').value || null,
        fecha_fin: document.getElementById('project-end').value || null,
        id_estado: document.getElementById('project-status').value || 1,
        id_prioridad: document.getElementById('project-priority').value || 2,
        id_jefe: document.getElementById('project-manager').value || null
    };

    const submitBtn = document.querySelector('#project-form button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = 'Guardando...';
        submitBtn.disabled = true;
    }

    try {
        const url = id ? `${API_BASE}/projects/${id}` : `${API_BASE}/projects`;
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            closeJefeModal();
            if (typeof initJefeProjects === 'function') initJefeProjects(); // Refresh list
        } else {
            const err = await response.json();
            alert('Error al guardar: ' + (err.message || 'Desconocido'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    } finally {
        if (submitBtn) {
            submitBtn.innerHTML = 'Guardar';
            submitBtn.disabled = false;
        }
    }
}

function openBudgetModal(id) {
    if (!id) return;
    window.location.href = `jefe-presupuesto-detalle.html?id=${id}`;
}

// --- Jefe de Proyecto: Presupuestos ---
async function initJefeBudgets() {
    const container = document.getElementById('budget-full-list');
    if (!container) return;

    container.innerHTML = '<div class="flex justify-center p-4"><i data-lucide="loader-2" class="w-8 h-8 animate-spin text-muted-foreground"></i></div>';
    lucide.createIcons();

    try {
        const response = await fetch(`${API_BASE}/budgets/all`);
        if (!response.ok) throw new Error('Error al cargar presupuestos');
        const budgets = await response.json();

        // Group by Project
        const grouped = budgets.reduce((acc, b) => {
            const projName = b.proyecto_nombre || 'Sin Proyecto Asignado';
            if (!acc[projName]) acc[projName] = [];
            acc[projName].push(b);
            return acc;
        }, {});

        container.innerHTML = '';
        const projectNames = Object.keys(grouped).sort();

        if (projectNames.length === 0) {
            container.innerHTML = '<div class="text-center p-8 text-muted-foreground">No hay presupuestos registrados.</div>';
            return;
        }

        projectNames.forEach(projName => {
            const projectBudgets = grouped[projName];

            // Project Header
            const header = document.createElement('div');
            header.className = "flex items-center gap-2 mb-2 mt-6 first:mt-0";
            header.innerHTML = `
                <i data-lucide="folder-kanban" class="w-5 h-5 text-primary"></i>
                <h3 class="text-lg font-semibold text-foreground">${projName}</h3>
                <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">${projectBudgets.length}</span>
            `;
            container.appendChild(header);

            // Budgets List
            projectBudgets.forEach(b => {
                const item = document.createElement('div');
                item.className = "flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors mb-2 bg-card";

                // Determine color based on status
                let statusColor = "bg-gray-100 text-gray-800";
                if (b.estado === 'Aprobado' || b.estado === 'Completado' || b.estado === 'Aceptado') statusColor = "bg-green-100 text-green-800";
                else if (b.estado === 'Rechazado' || b.estado === 'Cancelado') statusColor = "bg-red-100 text-red-800";
                else if (b.estado === 'Solicitado') statusColor = "bg-blue-100 text-blue-800";
                else if (b.estado === 'Borrador') statusColor = "bg-gray-100 text-gray-500";
                else if (b.estado === 'Revisión') statusColor = "bg-orange-100 text-orange-800";

                const dateStr = new Date(b.fecha_creacion).toLocaleDateString();

                item.innerHTML = `
                    <div class="flex items-start gap-4">
                         <div class="mt-1 p-2 bg-muted rounded-full hidden sm:block">
                            <i data-lucide="file-text" class="w-5 h-5 text-gray-500"></i>
                         </div>
                         <div>
                            <h4 class="font-medium text-foreground">${b.titulo || 'Sin Título'}</h4>
                            <div class="flex items-center gap-2 mt-1 flex-wrap">
                                <span class="text-xs font-mono text-muted-foreground">#${b.id_presupuesto}</span>
                                <span class="text-xs text-muted-foreground hidden sm:inline">|</span>
                                <span class="text-xs text-muted-foreground">${dateStr}</span>
                                <span class="text-xs text-muted-foreground hidden sm:inline">|</span>
                                <span class="text-sm font-semibold text-gray-700">S/ ${(b.total_general || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                         </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}">
                            ${b.estado}
                        </span>
                        <div class="flex gap-1">
                             <button onclick="openBudgetModal(${b.id_presupuesto})" class="p-2 hover:bg-gray-100 rounded-full text-gray-500" title="Ver Detalles">
                                <i data-lucide="eye" class="w-4 h-4"></i>
                             </button>
                        </div>
                    </div>
                `;
                container.appendChild(item);
            });
        });

        lucide.createIcons();

    } catch (error) {
        console.error("Error loading budgets:", error);
        container.innerHTML = '<div class="text-center p-4 text-red-500">Error al cargar presupuestos</div>';
    }
}

// --- Jefe de Proyecto: Team Management ---
async function initJefeTeam() {
    const container = document.getElementById('team-grid');
    if (!container) return;

    container.innerHTML = '<div class="col-span-full flex justify-center p-8"><i data-lucide="loader-2" class="w-8 h-8 animate-spin text-muted-foreground"></i></div>';
    lucide.createIcons();

    // Bind Add Button
    const addBtn = document.getElementById('btn-add-member');
    if (addBtn) {
        addBtn.onclick = openMemberModal;
    }

    try {
        const response = await fetch(`${API_BASE}/users`);
        if (!response.ok) throw new Error('Error al cargar equipo');
        const users = await response.json();

        container.innerHTML = '';
        if (users.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center p-8 text-muted-foreground">No hay miembros registrados.</div>';
            return;
        }

        users.forEach(u => {
            const initials = (u.nombre[0] || '') + (u.apellido ? u.apellido[0] : '');
            let roleColor = 'text-primary bg-primary/20';
            if (u.rol === 'admin') roleColor = 'text-purple-600 bg-purple-100';
            else if (u.rol === 'operativo') roleColor = 'text-green-700 bg-green-100';

            const card = document.createElement('div');
            card.className = "rounded-lg border bg-card p-6 shadow-sm flex items-center gap-4 hover:bg-accent/5 transition-colors";
            card.innerHTML = `
                <div class="h-12 w-12 rounded-full ${roleColor} flex items-center justify-center font-bold text-lg uppercase">
                    ${initials}
                </div>
                <div>
                    <h3 class="font-medium text-foreground">${u.nombre} ${u.apellido || ''}</h3>
                    <p class="text-sm text-muted-foreground capitalize">${u.rol || 'Sin Rol'}</p>
                    <p class="text-xs text-muted-foreground/70 truncate max-w-[150px]">${u.correo}</p>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error("Error loading team:", error);
        container.innerHTML = '<div class="col-span-full text-center p-4 text-red-500">Error al cargar equipo</div>';
    }
}

async function openMemberModal() {
    const modal = document.getElementById('member-modal');
    if (!modal) return;

    document.getElementById('member-form').reset();

    // Load roles
    const roleSelect = document.getElementById('mem-role');
    if (roleSelect && roleSelect.options.length <= 1) {
        try {
            const res = await fetch(`${API_BASE}/roles`);
            const roles = await res.json();
            roleSelect.innerHTML = '<option value="">Seleccione un rol...</option>' +
                roles.map(r => `<option value="${r.id_rol}">${r.nombre}</option>`).join('');
        } catch (e) { console.error(e); }
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeMemberModal() {
    const modal = document.getElementById('member-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

async function handleCreateMember(e) {
    e.preventDefault();
    const submitBtn = document.querySelector('#member-form button[type="submit"]');
    if (submitBtn) { submitBtn.textContent = 'Guardando...'; submitBtn.disabled = true; }

    const data = {
        nombre: document.getElementById('mem-name').value,
        apellido: document.getElementById('mem-lastname').value,
        telefono: document.getElementById('mem-phone').value,
        correo: document.getElementById('mem-email').value,
        contraseña: document.getElementById('mem-pass').value,
        id_rol: document.getElementById('mem-role').value
    };

    try {
        const res = await fetch(`${API_BASE}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            closeMemberModal();
            initJefeTeam();
            alert('Miembro creado exitosamente');
        } else {
            const err = await res.json();
            alert('Error: ' + (err.message || 'Desconocido'));
        }
    } catch (error) {
        console.error(error);
        alert('Error de conexión');
    } finally {
        if (submitBtn) { submitBtn.textContent = 'Guardar Miembro'; submitBtn.disabled = false; }
    }
}
