import { pool } from '../config/db.js';

// Obtener todos los materiales
export const getMaterials = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM material ORDER BY nombre ASC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener materiales", error: error.message });
    }
};

// Crear material
export const createMaterial = async (req, res) => {
    try {
        const { nombre, tipo, unidad_medida, stock_actual, precio_unitario } = req.body;

        if (!nombre || !unidad_medida || stock_actual === undefined) {
            return res.status(400).json({ message: "Faltan campos obligatorios (nombre, unidad, stock)" });
        }

        const [result] = await pool.query(
            'INSERT INTO material (nombre, tipo, unidad_medida, stock_actual, precio_unitario, fecha_ultima_actualizacion) VALUES (?, ?, ?, ?, ?, NOW())',
            [nombre, tipo, unidad_medida, stock_actual, precio_unitario || 0]
        );

        res.status(201).json({
            id_material: result.insertId,
            nombre,
            tipo,
            unidad_medida,
            stock_actual,
            precio_unitario,
            message: "Material creado exitosamente"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al crear material", error: error.message });
    }
};

// Actualizar material
export const updateMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, tipo, unidad_medida, stock_actual, precio_unitario } = req.body;

        const [result] = await pool.query(
            'UPDATE material SET nombre = ?, tipo = ?, unidad_medida = ?, stock_actual = ?, precio_unitario = ?, fecha_ultima_actualizacion = NOW() WHERE id_material = ?',
            [nombre, tipo, unidad_medida, stock_actual, precio_unitario, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Material no encontrado" });
        }

        res.json({ message: "Material actualizado correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al actualizar material", error: error.message });
    }
};

// Eliminar material
export const deleteMaterial = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query('DELETE FROM material WHERE id_material = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Material no encontrado" });
        }

        res.json({ message: "Material eliminado correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al eliminar material", error: error.message });
    }
};
