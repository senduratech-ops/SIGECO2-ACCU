import { pool } from '../config/db.js';

// Obtener todos los cargos de mano de obra
export const getLabors = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT * FROM mano_obra 
            WHERE activo = TRUE 
            ORDER BY nombre
        `);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener mano de obra", error: error.message });
    }
};

// Obtener un cargo por ID
export const getLaborById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM mano_obra WHERE id_mano_obra = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "Cargo no encontrado" });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener cargo", error: error.message });
    }
};

// Crear nuevo cargo
export const createLabor = async (req, res) => {
    try {
        const { nombre, descripcion, costo_hora } = req.body;

        if (!nombre || !costo_hora) {
            return res.status(400).json({ message: "Nombre y costo por hora son requeridos" });
        }

        const [result] = await pool.query(
            'INSERT INTO mano_obra (nombre, descripcion, costo_hora) VALUES (?, ?, ?)',
            [nombre, descripcion || null, costo_hora]
        );

        res.status(201).json({
            id_mano_obra: result.insertId,
            message: "Cargo creado correctamente"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al crear cargo", error: error.message });
    }
};

// Actualizar cargo
export const updateLabor = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, costo_hora, activo } = req.body;

        const [result] = await pool.query(
            'UPDATE mano_obra SET nombre = ?, descripcion = ?, costo_hora = ?, activo = ? WHERE id_mano_obra = ?',
            [nombre, descripcion, costo_hora, activo !== undefined ? activo : true, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Cargo no encontrado" });
        }

        res.json({ message: "Cargo actualizado correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al actualizar cargo", error: error.message });
    }
};

// Eliminar cargo (soft delete)
export const deleteLabor = async (req, res) => {
    try {
        const { id } = req.params;

        // Soft delete - marcar como inactivo
        const [result] = await pool.query(
            'UPDATE mano_obra SET activo = FALSE WHERE id_mano_obra = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Cargo no encontrado" });
        }

        res.json({ message: "Cargo eliminado correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al eliminar cargo", error: error.message });
    }
};
