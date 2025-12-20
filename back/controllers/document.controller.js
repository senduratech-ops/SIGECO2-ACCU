import { pool } from '../config/db.js';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================
// DOCUMENTOS
// =============================================

// Obtener todos los documentos con información relacionada
export const getDocuments = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                d.id_documento,
                d.titulo,
                d.descripcion,
                d.fecha_registro,
                d.updated_at,
                td.id_tipo,
                td.nombre AS tipo_nombre,
                td.icono AS tipo_icono,
                ed.id_estado,
                ed.nombre AS estado_nombre,
                ed.color AS estado_color,
                p.id_proyecto,
                p.nombre AS proyecto_nombre,
                u.id_usuario,
                CONCAT(u.nombre, ' ', u.apellido) AS usuario_nombre,
                (SELECT COUNT(*) FROM archivoDocumento WHERE id_documento = d.id_documento) AS num_archivos,
                (SELECT SUM(tamaño) FROM archivoDocumento WHERE id_documento = d.id_documento) AS tamaño_total
            FROM documento d
            LEFT JOIN tipoDocumento td ON d.id_tipo = td.id_tipo
            LEFT JOIN estadoDocumento ed ON d.id_estado = ed.id_estado
            LEFT JOIN proyecto p ON d.id_proyecto = p.id_proyecto
            LEFT JOIN usuario u ON d.id_usuario_registro = u.id_usuario
            ORDER BY d.fecha_registro DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener documentos", error: err.message });
    }
};

// Obtener documento por ID con sus archivos
export const getDocumentById = async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener documento
        const [docRows] = await pool.query(`
            SELECT 
                d.*,
                td.nombre AS tipo_nombre,
                td.icono AS tipo_icono,
                ed.nombre AS estado_nombre,
                ed.color AS estado_color,
                p.nombre AS proyecto_nombre,
                CONCAT(u.nombre, ' ', u.apellido) AS usuario_nombre
            FROM documento d
            LEFT JOIN tipoDocumento td ON d.id_tipo = td.id_tipo
            LEFT JOIN estadoDocumento ed ON d.id_estado = ed.id_estado
            LEFT JOIN proyecto p ON d.id_proyecto = p.id_proyecto
            LEFT JOIN usuario u ON d.id_usuario_registro = u.id_usuario
            WHERE d.id_documento = ?
        `, [id]);

        if (docRows.length === 0) {
            return res.status(404).json({ message: "Documento no encontrado" });
        }

        // Obtener archivos del documento
        const [archivos] = await pool.query(`
            SELECT 
                a.*,
                CONCAT(u.nombre, ' ', u.apellido) AS usuario_subida_nombre
            FROM archivoDocumento a
            LEFT JOIN usuario u ON a.id_usuario_subida = u.id_usuario
            WHERE a.id_documento = ?
            ORDER BY a.fecha_subida DESC
        `, [id]);

        // Obtener historial del documento
        const [historial] = await pool.query(`
            SELECT 
                h.*,
                CONCAT(u.nombre, ' ', u.apellido) AS usuario_nombre
            FROM historiaDocumento h
            LEFT JOIN usuario u ON h.id_usuario = u.id_usuario
            WHERE h.id_documento = ?
            ORDER BY h.fecha DESC
        `, [id]);

        res.json({
            ...docRows[0],
            archivos,
            historial
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener documento", error: err.message });
    }
};

// Obtener documentos por proyecto
export const getDocumentsByProject = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(`
            SELECT 
                d.*,
                td.nombre AS tipo_nombre,
                td.icono AS tipo_icono,
                ed.nombre AS estado_nombre,
                ed.color AS estado_color,
                CONCAT(u.nombre, ' ', u.apellido) AS usuario_nombre,
                (SELECT SUM(tamaño) FROM archivoDocumento WHERE id_documento = d.id_documento) AS tamaño_total
            FROM documento d
            LEFT JOIN tipoDocumento td ON d.id_tipo = td.id_tipo
            LEFT JOIN estadoDocumento ed ON d.id_estado = ed.id_estado
            LEFT JOIN usuario u ON d.id_usuario_registro = u.id_usuario
            WHERE d.id_proyecto = ?
            ORDER BY d.fecha_registro DESC
        `, [id]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener documentos del proyecto", error: err.message });
    }
};

// Obtener documentos por tipo
export const getDocumentsByType = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(`
            SELECT 
                d.*,
                td.nombre AS tipo_nombre,
                td.icono AS tipo_icono,
                ed.nombre AS estado_nombre,
                ed.color AS estado_color,
                p.nombre AS proyecto_nombre,
                CONCAT(u.nombre, ' ', u.apellido) AS usuario_nombre,
                (SELECT SUM(tamaño) FROM archivoDocumento WHERE id_documento = d.id_documento) AS tamaño_total
            FROM documento d
            LEFT JOIN tipoDocumento td ON d.id_tipo = td.id_tipo
            LEFT JOIN estadoDocumento ed ON d.id_estado = ed.id_estado
            LEFT JOIN proyecto p ON d.id_proyecto = p.id_proyecto
            LEFT JOIN usuario u ON d.id_usuario_registro = u.id_usuario
            WHERE d.id_tipo = ?
            ORDER BY d.fecha_registro DESC
        `, [id]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener documentos por tipo", error: err.message });
    }
};

// Buscar documentos
export const searchDocuments = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ message: "Se requiere un término de búsqueda" });
        }

        const searchTerm = `%${q}%`;
        const [rows] = await pool.query(`
            SELECT 
                d.*,
                td.nombre AS tipo_nombre,
                td.icono AS tipo_icono,
                ed.nombre AS estado_nombre,
                ed.color AS estado_color,
                p.nombre AS proyecto_nombre,
                CONCAT(u.nombre, ' ', u.apellido) AS usuario_nombre,
                (SELECT SUM(tamaño) FROM archivoDocumento WHERE id_documento = d.id_documento) AS tamaño_total
            FROM documento d
            LEFT JOIN tipoDocumento td ON d.id_tipo = td.id_tipo
            LEFT JOIN estadoDocumento ed ON d.id_estado = ed.id_estado
            LEFT JOIN proyecto p ON d.id_proyecto = p.id_proyecto
            LEFT JOIN usuario u ON d.id_usuario_registro = u.id_usuario
            WHERE d.titulo LIKE ? OR d.descripcion LIKE ? OR p.nombre LIKE ?
            ORDER BY d.fecha_registro DESC
        `, [searchTerm, searchTerm, searchTerm]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error en la búsqueda", error: err.message });
    }
};

// Crear documento con archivo
export const createDocument = async (req, res) => {
    try {
        const { titulo, descripcion, id_tipo, id_proyecto, id_usuario } = req.body;
        const file = req.file;

        if (!titulo) {
            return res.status(400).json({ message: "El título es requerido" });
        }

        // Estado automático: 1=Sin Asignar si no hay proyecto, 2=En Proyecto si hay proyecto
        const id_estado = id_proyecto ? 2 : 1;

        // Crear documento
        const [result] = await pool.query(`
            INSERT INTO documento (titulo, descripcion, id_tipo, id_estado, id_proyecto, id_usuario_registro)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [titulo, descripcion || null, id_tipo || null, id_estado, id_proyecto || null, id_usuario || 1]);

        const documentoId = result.insertId;

        // Si hay archivo, guardarlo
        if (file) {
            await pool.query(`
                INSERT INTO archivoDocumento 
                (id_documento, nombre_original, nombre_archivo, ruta_almacenamiento, tipo_mime, extension, tamaño, id_usuario_subida)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                documentoId,
                file.originalname,
                file.filename,
                `/uploads/${file.filename}`,
                file.mimetype,
                path.extname(file.originalname).slice(1),
                file.size,
                id_usuario || 1
            ]);
        }

        res.status(201).json({
            message: "Documento creado exitosamente",
            id_documento: documentoId
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al crear documento", error: err.message });
    }
};

// Actualizar documento
export const updateDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, descripcion, id_tipo, id_estado, id_proyecto } = req.body;

        // Verificar que el documento existe
        const [existing] = await pool.query('SELECT * FROM documento WHERE id_documento = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: "Documento no encontrado" });
        }

        const doc = existing[0];

        // Usar valores existentes si no se proporcionan nuevos
        const finalTitulo = titulo !== undefined ? titulo : doc.titulo;
        const finalDescripcion = descripcion !== undefined ? descripcion : doc.descripcion;
        const finalTipo = id_tipo !== undefined ? id_tipo : doc.id_tipo;
        const finalProyecto = id_proyecto !== undefined ? (id_proyecto || null) : doc.id_proyecto;

        // Estado automático basado en proyecto (solo si no se especifica estado manualmente)
        // Si id_estado es 3 (Aprobado), mantenerlo; sino, calcular por proyecto
        let estadoFinal = id_estado;
        if (!id_estado) {
            // Si el estado actual es Aprobado (3), mantenerlo
            if (doc.id_estado === 3) {
                estadoFinal = 3;
            } else {
                // Calcular según proyecto
                estadoFinal = finalProyecto ? 2 : 1; // 2=En Proyecto, 1=Sin Asignar
            }
        }

        await pool.query(`
            UPDATE documento 
            SET titulo = ?, descripcion = ?, id_tipo = ?, id_estado = ?, id_proyecto = ?
            WHERE id_documento = ?
        `, [finalTitulo, finalDescripcion, finalTipo, estadoFinal, finalProyecto, id]);

        res.json({ message: "Documento actualizado exitosamente" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al actualizar documento", error: err.message });
    }
};

// Eliminar documento
export const deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener archivos antes de eliminar
        const [archivos] = await pool.query('SELECT * FROM archivoDocumento WHERE id_documento = ?', [id]);

        // Eliminar archivos físicos
        const uploadsPath = path.join(__dirname, '../../uploads');
        for (const archivo of archivos) {
            const filePath = path.join(uploadsPath, archivo.nombre_archivo);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Eliminar documento (CASCADE eliminará archivos e historial)
        const [result] = await pool.query('DELETE FROM documento WHERE id_documento = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Documento no encontrado" });
        }

        res.json({ message: "Documento eliminado exitosamente" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al eliminar documento", error: err.message });
    }
};

// Agregar archivo a documento existente
export const addFileToDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_usuario } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: "No se proporcionó ningún archivo" });
        }

        // Verificar que el documento existe
        const [existing] = await pool.query('SELECT * FROM documento WHERE id_documento = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: "Documento no encontrado" });
        }

        await pool.query(`
            INSERT INTO archivoDocumento 
            (id_documento, nombre_original, nombre_archivo, ruta_almacenamiento, tipo_mime, extension, tamaño, id_usuario_subida)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            id,
            file.originalname,
            file.filename,
            `/uploads/${file.filename}`,
            file.mimetype,
            path.extname(file.originalname).slice(1),
            file.size,
            id_usuario || 1
        ]);

        res.status(201).json({ message: "Archivo agregado exitosamente" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al agregar archivo", error: err.message });
    }
};

// Eliminar archivo específico
export const deleteFile = async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener información del archivo
        const [archivos] = await pool.query('SELECT * FROM archivoDocumento WHERE id_archivo = ?', [id]);
        if (archivos.length === 0) {
            return res.status(404).json({ message: "Archivo no encontrado" });
        }

        // Eliminar archivo físico
        const uploadsPath = path.join(__dirname, '../../uploads');
        const filePath = path.join(uploadsPath, archivos[0].nombre_archivo);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Eliminar de la base de datos
        await pool.query('DELETE FROM archivoDocumento WHERE id_archivo = ?', [id]);

        res.json({ message: "Archivo eliminado exitosamente" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al eliminar archivo", error: err.message });
    }
};

// =============================================
// TIPOS DE DOCUMENTO (Categorías)
// =============================================

export const getDocumentTypes = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                td.*,
                (SELECT COUNT(*) FROM documento WHERE id_tipo = td.id_tipo) AS cantidad_documentos
            FROM tipoDocumento td
            ORDER BY td.nombre
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener tipos de documento", error: err.message });
    }
};

// =============================================
// ESTADOS DE DOCUMENTO
// =============================================

export const getDocumentStatuses = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM estadoDocumento ORDER BY id_estado');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener estados de documento", error: err.message });
    }
};

// =============================================
// PROYECTOS (Para selectores)
// =============================================

export const getProjectsForSelect = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id_proyecto, nombre FROM proyecto ORDER BY nombre');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener proyectos", error: err.message });
    }
};

// =============================================
// ESTADÍSTICAS
// =============================================

export const getDocumentStats = async (req, res) => {
    try {
        // Total de documentos
        const [totalDocs] = await pool.query('SELECT COUNT(*) as total FROM documento');

        // Documentos por tipo
        const [byType] = await pool.query(`
            SELECT td.nombre, td.icono, COUNT(d.id_documento) as cantidad
            FROM tipoDocumento td
            LEFT JOIN documento d ON td.id_tipo = d.id_tipo
            GROUP BY td.id_tipo
            ORDER BY cantidad DESC
        `);

        // Documentos por estado
        const [byStatus] = await pool.query(`
            SELECT ed.nombre, ed.color, COUNT(d.id_documento) as cantidad
            FROM estadoDocumento ed
            LEFT JOIN documento d ON ed.id_estado = d.id_estado
            GROUP BY ed.id_estado
        `);

        // Tamaño total de archivos
        const [totalSize] = await pool.query('SELECT COALESCE(SUM(tamaño), 0) as total FROM archivoDocumento');

        // Documentos recientes (últimos 7 días)
        const [recent] = await pool.query(`
            SELECT COUNT(*) as cantidad FROM documento 
            WHERE fecha_registro >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `);

        res.json({
            totalDocumentos: totalDocs[0].total,
            documentosPorTipo: byType,
            documentosPorEstado: byStatus,
            tamañoTotalArchivos: totalSize[0].total,
            documentosRecientes: recent[0].cantidad
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener estadísticas", error: err.message });
    }
};
