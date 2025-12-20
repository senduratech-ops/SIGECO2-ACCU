import { pool } from '../config/db.js';
import 'dotenv/config';

// =============================================
// NOTIFICACIONES / AVISOS
// =============================================

// Obtener todas las notificaciones
export const getNotifications = async (req, res) => {
    try {
        const userId = req.query.userId || null;

        let query = `
            SELECT 
                n.*,
                CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre
            FROM notificacion n
            LEFT JOIN usuario u ON n.id_usuario = u.id_usuario
        `;

        if (userId) {
            query += ` WHERE n.id_usuario = ${userId}`;
        }

        query += ` ORDER BY n.fecha DESC`;

        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener notificaciones", error: err.message });
    }
};

// Obtener notificaciones no leídas
export const getUnreadNotifications = async (req, res) => {
    try {
        const userId = req.query.userId || null;

        let query = `
            SELECT 
                n.*,
                CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre
            FROM notificacion n
            LEFT JOIN usuario u ON n.id_usuario = u.id_usuario
            WHERE n.leido = FALSE
        `;

        if (userId) {
            query += ` AND n.id_usuario = ${userId}`;
        }

        query += ` ORDER BY n.fecha DESC`;

        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener notificaciones no leídas", error: err.message });
    }
};

// Obtener conteo de notificaciones no leídas
export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.query.userId || null;

        let query = 'SELECT COUNT(*) as count FROM notificacion WHERE leido = FALSE';

        if (userId) {
            query += ` AND id_usuario = ${userId}`;
        }

        const [rows] = await pool.query(query);
        res.json({ count: rows[0].count });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener conteo", error: err.message });
    }
};

// Crear notificación
export const createNotification = async (req, res) => {
    try {
        const { id_usuario, mensaje, tipo } = req.body;

        if (!mensaje || !tipo) {
            return res.status(400).json({ message: "Mensaje y tipo son requeridos" });
        }

        const [result] = await pool.query(`
            INSERT INTO notificacion (id_usuario, mensaje, tipo)
            VALUES (?, ?, ?)
        `, [id_usuario || null, mensaje, tipo]);

        res.status(201).json({
            message: "Notificación creada",
            id_notificacion: result.insertId
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al crear notificación", error: err.message });
    }
};

// Marcar notificación como leída
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query(
            'UPDATE notificacion SET leido = TRUE WHERE id_notificacion = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Notificación no encontrada" });
        }

        res.json({ message: "Notificación marcada como leída" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al actualizar notificación", error: err.message });
    }
};

// Marcar todas como leídas
export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.query.userId || null;

        let query = 'UPDATE notificacion SET leido = TRUE WHERE leido = FALSE';

        if (userId) {
            query += ` AND id_usuario = ${userId}`;
        }

        await pool.query(query);

        res.json({ message: "Todas las notificaciones marcadas como leídas" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al actualizar notificaciones", error: err.message });
    }
};

// Eliminar notificación
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query(
            'DELETE FROM notificacion WHERE id_notificacion = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Notificación no encontrada" });
        }

        res.json({ message: "Notificación eliminada" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al eliminar notificación", error: err.message });
    }
};

// Obtener notificaciones por tipo (alertas)
export const getNotificationsByType = async (req, res) => {
    try {
        const { tipo } = req.params;

        const [rows] = await pool.query(`
            SELECT 
                n.*,
                CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre
            FROM notificacion n
            LEFT JOIN usuario u ON n.id_usuario = u.id_usuario
            WHERE n.tipo = ?
            ORDER BY n.fecha DESC
        `, [tipo]);

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener notificaciones por tipo", error: err.message });
    }
};
