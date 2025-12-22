import { pool } from '../config/db.js';
import 'dotenv/config';

// =============================================
// ESTADÍSTICAS DEL DASHBOARD
// =============================================

// Obtener estadísticas generales del dashboard
export const getDashboardStats = async (req, res) => {
    try {
        // Total proyectos
        const [projectCount] = await pool.query('SELECT COUNT(*) as total FROM proyecto');

        // Proyectos activos (en progreso)
        const [activeProjects] = await pool.query(
            'SELECT COUNT(*) as total FROM proyecto WHERE id_estado = 2'
        );

        // Total documentos
        const [docCount] = await pool.query('SELECT COUNT(*) as total FROM documento');

        // Total usuarios
        // Total usuarios activos (últimos 10 min)
        const [userCount] = await pool.query('SELECT COUNT(*) as total FROM usuario WHERE ultimo_acceso >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)');

        // Presupuesto total (suma de todos los presupuestos aprobados)
        const [budgetTotal] = await pool.query(
            "SELECT COALESCE(SUM(total), 0) as total FROM presupuesto WHERE estado = 'Aprobado'"
        );

        // Documentos pendientes
        const [pendingDocs] = await pool.query(
            'SELECT COUNT(*) as total FROM documento WHERE id_estado = 2'
        );

        res.json({
            totalProyectos: projectCount[0].total,
            proyectosActivos: activeProjects[0].total,
            totalDocumentos: docCount[0].total,
            totalUsuarios: userCount[0].total,
            presupuestoTotal: budgetTotal[0].total,
            documentosPendientes: pendingDocs[0].total
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener estadísticas", error: err.message });
    }
};

// Documentos por mes para gráfico de barras
export const getDocumentsByMonth = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                DATE_FORMAT(fecha_registro, '%Y-%m') as mes,
                MONTHNAME(fecha_registro) as nombre_mes,
                COUNT(*) as cantidad
            FROM documento
            WHERE fecha_registro >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(fecha_registro, '%Y-%m'), MONTHNAME(fecha_registro)
            ORDER BY mes ASC
        `);

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener datos mensuales", error: err.message });
    }
};

// Distribución de documentos por tipo para gráfico pie
export const getDocumentsByTypePie = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                td.nombre,
                td.icono,
                COUNT(d.id_documento) as cantidad
            FROM tipodocumento td
            LEFT JOIN documento d ON td.id_tipo = d.id_tipo
            GROUP BY td.id_tipo
            HAVING cantidad > 0
            ORDER BY cantidad DESC
        `);

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener distribución", error: err.message });
    }
};

// Documentos recientes
export const getRecentDocuments = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;

        const [rows] = await pool.query(`
            SELECT 
                d.id_documento,
                d.titulo,
                d.fecha_registro,
                td.nombre AS tipo_nombre,
                ed.nombre AS estado_nombre,
                ed.color AS estado_color,
                p.nombre AS proyecto_nombre
            FROM documento d
            LEFT JOIN tipodocumento td ON d.id_tipo = td.id_tipo
            LEFT JOIN estadodocumento ed ON d.id_estado = ed.id_estado
            LEFT JOIN proyecto p ON d.id_proyecto = p.id_proyecto
            ORDER BY d.fecha_registro DESC
            LIMIT ?
        `, [limit]);

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener documentos recientes", error: err.message });
    }
};

// Actividad reciente del sistema
export const getRecentActivity = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                ra.id_registro,
                ra.accion,
                ra.descripcion,
                ra.tabla_afectada,
                ra.fecha,
                CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre
            FROM registro_actividades ra
            LEFT JOIN usuario u ON ra.id_usuario = u.id_usuario
            ORDER BY ra.fecha DESC
            LIMIT 10
        `);

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener actividad reciente", error: err.message });
    }
};
