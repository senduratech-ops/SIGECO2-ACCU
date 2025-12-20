import { pool } from '../config/db.js';
import 'dotenv/config';

// =============================================
// HELPER - Registrar actividad del proyecto
// =============================================
async function logActivity(id_proyecto, accion, descripcion, id_usuario = null) {
    try {
        await pool.query(
            'INSERT INTO actividadProyecto (id_proyecto, id_usuario, accion, descripcion) VALUES (?, ?, ?, ?)',
            [id_proyecto, id_usuario, accion, descripcion]
        );
    } catch (error) {
        console.error('Error logging activity:', error);
    }
}

// =============================================
// PROYECTOS - CRUD COMPLETO
// =============================================

// Obtener todos los proyectos
export const getProjects = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                p.*,
                ep.nombre AS estado_nombre,
                pp.nombre AS prioridad_nombre,
                CONCAT(u.nombre, ' ', u.apellido) AS jefe_nombre,
                (SELECT COUNT(*) FROM documento WHERE id_proyecto = p.id_proyecto) AS num_documentos,
                (SELECT COUNT(*) FROM tareaProyecto WHERE id_proyecto = p.id_proyecto) AS num_tareas
            FROM proyecto p
            LEFT JOIN estadoProyecto ep ON p.id_estado = ep.id_estado
            LEFT JOIN prioridadProyecto pp ON p.id_prioridad = pp.id_prioridad
            LEFT JOIN usuario u ON p.id_jefe = u.id_usuario
            ORDER BY p.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener proyectos", error: err.message });
    }
};

// Obtener proyecto por ID con detalles completos
export const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener proyecto
        const [projects] = await pool.query(`
            SELECT 
                p.*,
                ep.nombre AS estado_nombre,
                pp.nombre AS prioridad_nombre,
                CONCAT(u.nombre, ' ', u.apellido) AS jefe_nombre,
                u.correo AS jefe_correo
            FROM proyecto p
            LEFT JOIN estadoProyecto ep ON p.id_estado = ep.id_estado
            LEFT JOIN prioridadProyecto pp ON p.id_prioridad = pp.id_prioridad
            LEFT JOIN usuario u ON p.id_jefe = u.id_usuario
            WHERE p.id_proyecto = ?
        `, [id]);

        if (projects.length === 0) {
            return res.status(404).json({ message: "Proyecto no encontrado" });
        }

        // Obtener documentos del proyecto
        const [documentos] = await pool.query(`
            SELECT 
                d.*,
                td.nombre AS tipo_nombre,
                ed.nombre AS estado_nombre
            FROM documento d
            LEFT JOIN tipoDocumento td ON d.id_tipo = td.id_tipo
            LEFT JOIN estadoDocumento ed ON d.id_estado = ed.id_estado
            WHERE d.id_proyecto = ?
            ORDER BY d.fecha_registro DESC
        `, [id]);

        // Obtener tareas del proyecto
        const [tareas] = await pool.query(`
            SELECT 
                t.*,
                CONCAT(u.nombre, ' ', u.apellido) AS asignado_nombre
            FROM tareaProyecto t
            LEFT JOIN usuario u ON t.id_usuario_asignado = u.id_usuario
            WHERE t.id_proyecto = ?
            ORDER BY t.fecha_limite ASC
        `, [id]);

        // Obtener presupuestos del proyecto
        const [presupuestos] = await pool.query(`
            SELECT * FROM presupuesto WHERE id_proyecto = ?
            ORDER BY fecha_creacion DESC
        `, [id]);

        // Obtener actividades recientes
        const [actividades] = await pool.query(`
            SELECT a.*, CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre
            FROM actividadProyecto a
            LEFT JOIN usuario u ON a.id_usuario = u.id_usuario
            WHERE a.id_proyecto = ?
            ORDER BY a.fecha DESC LIMIT 10
        `, [id]);

        // Obtener secciones del proyecto
        const [secciones] = await pool.query(`
            SELECT * FROM seccionproyecto WHERE id_proyecto = ?
            ORDER BY orden ASC, id_seccion ASC
        `, [id]);

        // Obtener elementos de cada sección
        for (let seccion of secciones) {
            const [elementos] = await pool.query(`
                SELECT e.*, d.titulo as documento_titulo, a.ruta_almacenamiento as documento_ruta
                FROM elementoseccion e
                LEFT JOIN documento d ON e.id_documento = d.id_documento
                LEFT JOIN archivoDocumento a ON d.id_documento = a.id_documento
                WHERE e.id_seccion = ?
                ORDER BY e.orden ASC, e.id_elemento ASC
            `, [seccion.id_seccion]);
            seccion.elementos = elementos;
        }

        res.json({
            ...projects[0],
            documentos,
            tareas,
            presupuestos,
            actividades,
            secciones
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener proyecto", error: err.message });
    }
};

// Crear proyecto
export const createProject = async (req, res) => {
    try {
        const { nombre, descripcion, fecha_inicio, fecha_fin, id_jefe, id_estado, id_prioridad } = req.body;

        if (!nombre) {
            return res.status(400).json({ message: "El nombre es requerido" });
        }

        const [result] = await pool.query(`
            INSERT INTO proyecto (nombre, descripcion, fecha_inicio, fecha_fin, id_jefe, id_estado, id_prioridad)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [nombre, descripcion, fecha_inicio, fecha_fin, id_jefe || null, id_estado || 1, id_prioridad || 2]);

        res.status(201).json({
            message: "Proyecto creado exitosamente",
            id_proyecto: result.insertId
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al crear proyecto", error: err.message });
    }
};

// Actualizar proyecto
export const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, fecha_inicio, fecha_fin, id_jefe, id_estado, id_prioridad } = req.body;

        const [result] = await pool.query(`
            UPDATE proyecto 
            SET nombre = ?, descripcion = ?, fecha_inicio = ?, fecha_fin = ?, 
                id_jefe = ?, id_estado = ?, id_prioridad = ?
            WHERE id_proyecto = ?
        `, [nombre, descripcion, fecha_inicio, fecha_fin, id_jefe, id_estado, id_prioridad, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Proyecto no encontrado" });
        }

        res.json({ message: "Proyecto actualizado exitosamente" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al actualizar proyecto", error: err.message });
    }
};

// Eliminar proyecto (Borrado en cascada seguro)
export const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Desvincular documentos (Pasar a "Sin Asignar" y quitar proyecto)
        await pool.query('UPDATE documento SET id_proyecto = NULL, id_estado = 1 WHERE id_proyecto = ?', [id]);

        // 2. Eliminar Elementos de las Secciones
        await pool.query('DELETE FROM elementoseccion WHERE id_seccion IN (SELECT id_seccion FROM seccionproyecto WHERE id_proyecto = ?)', [id]);

        // 3. Eliminar Secciones
        await pool.query('DELETE FROM seccionproyecto WHERE id_proyecto = ?', [id]);

        // 4. Eliminar otras tablas dependientes
        const dependencias = [
            'tareaproyecto', 'presupuesto', 'actividadProyecto',
            'comentario', 'eventoproyecto', 'registrohoras',
            'riesgoproyecto', 'usorecurso', 'contrato'
        ];

        for (const tabla of dependencias) {
            try {
                await pool.query(`DELETE FROM ${tabla} WHERE id_proyecto = ?`, [id]);
            } catch (e) {
                console.log(`Nota: No se pudo limpiar tabla ${tabla} (quizás no existe o ya está limpia)`);
            }
        }

        // 5. Finalmente eliminar el proyecto
        const [result] = await pool.query('DELETE FROM proyecto WHERE id_proyecto = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Proyecto no encontrado" });
        }

        res.json({ message: "Proyecto y datos asociados eliminados correctamente. Documentos preservados." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al eliminar proyecto", error: err.message });
    }
};

// Buscar proyectos
export const searchProjects = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({ message: "Se requiere un término de búsqueda" });
        }

        const searchTerm = `%${q}%`;
        const [rows] = await pool.query(`
            SELECT 
                p.*,
                ep.nombre AS estado_nombre,
                pp.nombre AS prioridad_nombre,
                CONCAT(u.nombre, ' ', u.apellido) AS jefe_nombre
            FROM proyecto p
            LEFT JOIN estadoProyecto ep ON p.id_estado = ep.id_estado
            LEFT JOIN prioridadProyecto pp ON p.id_prioridad = pp.id_prioridad
            LEFT JOIN usuario u ON p.id_jefe = u.id_usuario
            WHERE p.nombre LIKE ? OR p.descripcion LIKE ?
            ORDER BY p.created_at DESC
        `, [searchTerm, searchTerm]);

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error en la búsqueda", error: err.message });
    }
};

// Obtener proyectos por estado
export const getProjectsByStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.query(`
            SELECT 
                p.*,
                ep.nombre AS estado_nombre,
                pp.nombre AS prioridad_nombre,
                CONCAT(u.nombre, ' ', u.apellido) AS jefe_nombre
            FROM proyecto p
            LEFT JOIN estadoProyecto ep ON p.id_estado = ep.id_estado
            LEFT JOIN prioridadProyecto pp ON p.id_prioridad = pp.id_prioridad
            LEFT JOIN usuario u ON p.id_jefe = u.id_usuario
            WHERE p.id_estado = ?
            ORDER BY p.created_at DESC
        `, [id]);

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener proyectos por estado", error: err.message });
    }
};

// Obtener estados de proyecto
export const getProjectStatuses = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM estadoProyecto ORDER BY id_estado');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener estados", error: err.message });
    }
};

// Obtener prioridades de proyecto
export const getProjectPriorities = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM prioridadProyecto ORDER BY id_prioridad');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener prioridades", error: err.message });
    }
};

// Obtener usuarios (jefes) para selector - con filtro por rol
export const getUsers = async (req, res) => {
    try {
        const { role, id_rol } = req.query;

        let query = `
            SELECT DISTINCT u.id_usuario, u.nombre, u.apellido, u.correo, r.nombre as rol
            FROM usuario u
            LEFT JOIN usuariorol ur ON u.id_usuario = ur.id_usuario
            LEFT JOIN rol r ON ur.id_rol = r.id_rol
            WHERE u.activo = TRUE
        `;

        const params = [];
        if (id_rol) {
            query += ' AND ur.id_rol = ?';
            params.push(id_rol);
        } else if (role) {
            query += ' AND r.nombre = ?';
            params.push(role);
        }

        query += ' ORDER BY u.nombre';

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener usuarios", error: err.message });
    }
};

// Obtener proyectos asignados al usuario actual (para jefe)
export const getMyProjects = async (req, res) => {
    try {
        // Get user ID from JWT token
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "No autorizado - Inicie sesión" });
        }

        const jwt = await import('jsonwebtoken');
        let decoded;
        try {
            decoded = jwt.default.verify(token, process.env.SECRET_TOKEN || 'supersecretkey');
        } catch (tokenError) {
            if (tokenError.name === 'TokenExpiredError') {
                return res.status(401).json({ message: "Sesión expirada - Inicie sesión nuevamente" });
            }
            return res.status(401).json({ message: "Token inválido" });
        }

        const userId = decoded.id;

        const [rows] = await pool.query(`
            SELECT 
                p.*,
                ep.nombre AS estado_nombre,
                pp.nombre AS prioridad_nombre,
                CONCAT(u.nombre, ' ', u.apellido) AS jefe_nombre,
                (SELECT COUNT(*) FROM documento WHERE id_proyecto = p.id_proyecto) AS num_documentos,
                (SELECT COUNT(*) FROM tareaProyecto WHERE id_proyecto = p.id_proyecto) AS num_tareas
            FROM proyecto p
            LEFT JOIN estadoProyecto ep ON p.id_estado = ep.id_estado
            LEFT JOIN prioridadProyecto pp ON p.id_prioridad = pp.id_prioridad
            LEFT JOIN usuario u ON p.id_jefe = u.id_usuario
            WHERE p.id_jefe = ?
            ORDER BY p.created_at DESC
        `, [userId]);

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener proyectos", error: err.message });
    }
};

// Estadísticas de un proyecto específico
export const getProjectStats = async (req, res) => {
    try {
        const { id } = req.params;

        // Documentos
        const [docs] = await pool.query(
            'SELECT COUNT(*) as total FROM documento WHERE id_proyecto = ?', [id]
        );

        // Tareas completadas
        const [tasksComplete] = await pool.query(
            "SELECT COUNT(*) as total FROM tareaProyecto WHERE id_proyecto = ? AND estado = 'Completada'", [id]
        );

        // Tareas totales
        const [tasksTotal] = await pool.query(
            'SELECT COUNT(*) as total FROM tareaProyecto WHERE id_proyecto = ?', [id]
        );

        // Presupuesto total
        const [budget] = await pool.query(
            'SELECT COALESCE(SUM(total), 0) as total FROM presupuesto WHERE id_proyecto = ?', [id]
        );

        res.json({
            documentos: docs[0].total,
            tareasCompletadas: tasksComplete[0].total,
            tareasTotal: tasksTotal[0].total,
            presupuestoTotal: budget[0].total,
            avance: tasksTotal[0].total > 0
                ? Math.round((tasksComplete[0].total / tasksTotal[0].total) * 100)
                : 0
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener estadísticas", error: err.message });
    }
};

// =============================================
// SECCIONES DE PROYECTO - CRUD
// =============================================

// Crear sección
export const createSection = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion } = req.body;

        const [result] = await pool.query(
            'INSERT INTO seccionproyecto (id_proyecto, nombre, descripcion) VALUES (?, ?, ?)',
            [id, nombre, descripcion || null]
        );

        // Log activity
        await logActivity(id, 'seccion', `Se creó la sección "${nombre}"`);

        res.status(201).json({
            id_seccion: result.insertId,
            id_proyecto: parseInt(id),
            nombre,
            descripcion,
            elementos: []
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al crear sección", error: err.message });
    }
};

// Actualizar sección
export const updateSection = async (req, res) => {
    try {
        const { id, sectionId } = req.params;
        const { nombre, descripcion } = req.body;

        await pool.query(
            'UPDATE seccionproyecto SET nombre = ?, descripcion = ? WHERE id_seccion = ? AND id_proyecto = ?',
            [nombre, descripcion || null, sectionId, id]
        );

        res.json({ message: "Sección actualizada correctamente" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al actualizar sección", error: err.message });
    }
};

// Eliminar sección
export const deleteSection = async (req, res) => {
    try {
        const { id, sectionId } = req.params;

        await pool.query(
            'DELETE FROM seccionproyecto WHERE id_seccion = ? AND id_proyecto = ?',
            [sectionId, id]
        );

        res.json({ message: "Sección eliminada correctamente" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al eliminar sección", error: err.message });
    }
};

// =============================================
// ELEMENTOS DE SECCIÓN - CRUD
// =============================================

// Crear elemento
export const createElement = async (req, res) => {
    try {
        const { sectionId } = req.params;
        const { tipo, titulo, contenido, id_documento } = req.body;

        // Get project ID from section
        const [sectionData] = await pool.query('SELECT id_proyecto FROM seccionproyecto WHERE id_seccion = ?', [sectionId]);
        if (sectionData.length === 0) {
            return res.status(404).json({ message: "Sección no encontrada" });
        }
        const projectId = sectionData[0].id_proyecto;

        let id_presupuesto = null;

        // If type is 'presupuesto', extract the budget ID from contenido (frontend already created it)
        if (tipo === 'presupuesto' && contenido) {
            try {
                const parsed = JSON.parse(contenido);
                if (parsed.id_presupuesto) {
                    id_presupuesto = parsed.id_presupuesto;
                    console.log('Presupuesto ID extraído del contenido:', id_presupuesto);
                }
            } catch (e) {
                // Not JSON, ignore - old format or error
                console.log('Contenido no es JSON válido, presupuesto no vinculado');
            }
        }

        const [result] = await pool.query(
            'INSERT INTO elementoseccion (id_seccion, tipo, titulo, contenido, id_documento, id_presupuesto) VALUES (?, ?, ?, ?, ?, ?)',
            [sectionId, tipo || 'texto', titulo, contenido || null, id_documento || null, id_presupuesto]
        );

        // Log activity
        await logActivity(projectId, 'elemento', `Se agregó ${tipo === 'documento' ? 'documento' : tipo === 'presupuesto' ? 'solicitud de presupuesto' : 'elemento'} "${titulo || 'sin título'}"`);

        res.status(201).json({
            id_elemento: result.insertId,
            id_seccion: parseInt(sectionId),
            tipo: tipo || 'texto',
            titulo,
            contenido,
            id_documento,
            id_presupuesto
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al crear elemento", error: err.message });
    }
};


// Actualizar elemento
export const updateElement = async (req, res) => {
    try {
        const { sectionId, elementId } = req.params;
        const { tipo, titulo, contenido, id_documento } = req.body;

        await pool.query(
            'UPDATE elementoseccion SET tipo = ?, titulo = ?, contenido = ?, id_documento = ? WHERE id_elemento = ? AND id_seccion = ?',
            [tipo || 'texto', titulo, contenido || null, id_documento || null, elementId, sectionId]
        );

        res.json({ message: "Elemento actualizado correctamente" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al actualizar elemento", error: err.message });
    }
};

// Eliminar elemento
export const deleteElement = async (req, res) => {
    try {
        const { sectionId, elementId } = req.params;

        // Get element details including tipo, titulo and contenido
        const [element] = await pool.query(
            'SELECT e.*, s.id_proyecto FROM elementoseccion e JOIN seccionproyecto s ON e.id_seccion = s.id_seccion WHERE e.id_elemento = ? AND e.id_seccion = ?',
            [elementId, sectionId]
        );

        if (element.length > 0 && element[0].tipo === 'presupuesto') {
            const projectId = element[0].id_proyecto;
            const titulo = element[0].titulo;
            const contenido = element[0].contenido;
            let budgetId = element[0].id_presupuesto; // May be null if column doesn't exist

            // Try to get budget ID from contenido JSON (frontend stores it there)
            if (!budgetId && contenido) {
                try {
                    const parsed = JSON.parse(contenido);
                    if (parsed.id_presupuesto) {
                        budgetId = parsed.id_presupuesto;
                        console.log(`Budget ID encontrado en contenido JSON: ${budgetId}`);
                    }
                } catch (e) {
                    // Not JSON, ignore
                }
            }

            // If still no budgetId, try to find by project and title
            if (!budgetId && titulo) {
                const [matchingBudget] = await pool.query(
                    'SELECT id_presupuesto FROM presupuesto WHERE id_proyecto = ? AND titulo = ? ORDER BY fecha_creacion DESC LIMIT 1',
                    [projectId, titulo]
                );
                if (matchingBudget.length > 0) {
                    budgetId = matchingBudget[0].id_presupuesto;
                    console.log(`Budget ID encontrado por título: ${budgetId}`);
                }
            }

            if (budgetId) {
                // Check budget status
                const [budget] = await pool.query(
                    'SELECT estado FROM presupuesto WHERE id_presupuesto = ?',
                    [budgetId]
                );

                if (budget.length > 0) {
                    const estado = budget[0].estado;
                    console.log(`Verificando presupuesto ${budgetId}, estado: ${estado}`);

                    // Only delete budget if NOT accepted or completed
                    if (estado !== 'Aceptado' && estado !== 'Completado') {
                        await pool.query('DELETE FROM presupuesto WHERE id_presupuesto = ?', [budgetId]);
                        console.log(`✅ Presupuesto ${budgetId} ELIMINADO (estado: ${estado})`);
                    } else {
                        console.log(`🔒 Presupuesto ${budgetId} PRESERVADO (estado protegido: ${estado})`);
                    }
                }
            } else {
                console.log('No se encontró presupuesto vinculado al elemento');
            }
        }

        // Delete the element
        await pool.query(
            'DELETE FROM elementoseccion WHERE id_elemento = ? AND id_seccion = ?',
            [elementId, sectionId]
        );

        res.json({ message: "Elemento eliminado correctamente" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al eliminar elemento", error: err.message });
    }
};

// Estadísticas Dashboard Jefe - Filtrado por usuario actual
export const getJefeDashboardStats = async (req, res) => {
    try {
        // Get user ID from JWT token
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "No autorizado - Inicie sesión" });
        }

        const jwt = await import('jsonwebtoken');
        let decoded;
        try {
            decoded = jwt.default.verify(token, process.env.SECRET_TOKEN || 'supersecretkey');
        } catch (tokenError) {
            if (tokenError.name === 'TokenExpiredError') {
                return res.status(401).json({ message: "Sesión expirada - Inicie sesión nuevamente" });
            }
            return res.status(401).json({ message: "Token inválido" });
        }

        const userId = decoded.id;

        // 1. Stats Cards - Filtrados por proyectos del jefe
        const [activeProjs] = await pool.query(
            'SELECT COUNT(*) as c FROM proyecto WHERE id_estado IN (1, 2) AND id_jefe = ?',
            [userId]
        );

        const [pendingTasks] = await pool.query(
            `SELECT COUNT(*) as c FROM tareaProyecto t
             INNER JOIN proyecto p ON t.id_proyecto = p.id_proyecto
             WHERE (t.estado = 'Pendiente' OR t.estado = 'En Progreso')
             AND p.id_jefe = ?`,
            [userId]
        );

        // Hitos este mes (Tareas de proyectos del jefe con fecha limite en mes actual)
        const [hitos] = await pool.query(`
            SELECT COUNT(*) as c FROM tareaProyecto t
            INNER JOIN proyecto p ON t.id_proyecto = p.id_proyecto
            WHERE MONTH(t.fecha_limite) = MONTH(CURRENT_DATE()) 
            AND YEAR(t.fecha_limite) = YEAR(CURRENT_DATE())
            AND p.id_jefe = ?
        `, [userId]);

        // Miembros: usuarios asignados a tareas de los proyectos del jefe
        const [members] = await pool.query(`
            SELECT COUNT(DISTINCT t.id_usuario_asignado) as c FROM tareaProyecto t
            INNER JOIN proyecto p ON t.id_proyecto = p.id_proyecto
            WHERE p.id_jefe = ? AND t.id_usuario_asignado IS NOT NULL
        `, [userId]);

        // 2. Proyectos En Curso del jefe (con cálculo de tiempo)
        const [projects] = await pool.query(`
            SELECT p.id_proyecto, p.nombre, p.fecha_inicio, p.fecha_fin, ep.nombre as estado
            FROM proyecto p
            LEFT JOIN estadoProyecto ep ON p.id_estado = ep.id_estado
            WHERE p.id_estado IN (1, 2) AND p.id_jefe = ?
            ORDER BY p.fecha_inicio DESC
            LIMIT 5
        `, [userId]);

        // Calcular progreso por tiempo
        const projectsWithProgress = projects.map(p => {
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
            // Clamp
            if (progreso < 0) progreso = 0;
            if (progreso > 100) progreso = 100;

            return {
                id_real: p.id_proyecto,
                id: `PRY-${String(p.id_proyecto).padStart(3, '0')}`,
                nombre: p.nombre,
                cliente: "Cliente General",
                progreso: progreso,
                estado: p.estado || 'En Progreso'
            };
        });

        // 3. Tareas Recientes de proyectos del jefe
        const [tasks] = await pool.query(`
            SELECT t.titulo, p.nombre as proyecto, p.id_prioridad, t.fecha_limite
            FROM tareaProyecto t
            INNER JOIN proyecto p ON t.id_proyecto = p.id_proyecto
            WHERE t.estado != 'Completada' AND p.id_jefe = ?
            ORDER BY t.fecha_limite ASC
            LIMIT 5
        `, [userId]);

        const formatVence = (date) => {
            if (!date) return 'Sin fecha';
            const d = new Date(date);
            const now = new Date();
            const diffTime = d - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays < 0) return 'Vencido';
            if (diffDays === 0) return 'Hoy';
            if (diffDays === 1) return 'Mañana';
            return `${diffDays} días`;
        };

        const processedTasks = tasks.map(t => ({
            titulo: t.titulo,
            proyecto: t.proyecto,
            prioridad: t.id_prioridad === 3 ? 'Alta' : (t.id_prioridad === 2 ? 'Media' : 'Baja'),
            vence: formatVence(t.fecha_limite)
        }));

        res.json({
            stats: {
                activeProjects: activeProjs[0].c,
                pendingTasks: pendingTasks[0].c,
                hitos: hitos[0].c,
                members: members[0].c
            },
            projects: projectsWithProgress,
            tasks: processedTasks
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener dashboard jefe", error: err.message });
    }
};
