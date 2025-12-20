import { pool } from '../config/db.js';
import { generateBudgetPDF } from '../utils/pdfGenerator.js';

// =============================================
// PRESUPUESTOS - CRUD PRINCIPAL
// =============================================

// Obtener presupuestos por proyecto
export const getBudgetsByProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const [rows] = await pool.query(`
            SELECT p.*, 
                COALESCE((SELECT SUM(total) FROM presupuesto_materiales WHERE id_presupuesto = p.id_presupuesto), 0) as total_materiales,
                COALESCE((SELECT SUM(total) FROM presupuesto_mano_obra WHERE id_presupuesto = p.id_presupuesto), 0) * COALESCE(p.factor_mano_obra, 1.1) as total_mano_obra,
                COALESCE((SELECT SUM(costo) FROM presupuesto_terceros WHERE id_presupuesto = p.id_presupuesto), 0) as total_terceros,
                COALESCE((SELECT SUM(total) FROM presupuesto_viaticos WHERE id_presupuesto = p.id_presupuesto), 0) as total_viaticos,
                COALESCE((SELECT SUM(total) FROM presupuesto_impresiones WHERE id_presupuesto = p.id_presupuesto), 0) as total_impresiones
            FROM presupuesto p
            WHERE p.id_proyecto = ?
            ORDER BY p.fecha_creacion DESC
        `, [projectId]);

        // Calcular total general
        rows.forEach(r => {
            r.total_general = parseFloat(r.total_materiales || 0) +
                parseFloat(r.total_mano_obra || 0) +
                parseFloat(r.total_terceros || 0) +
                parseFloat(r.total_viaticos || 0) +
                parseFloat(r.total_impresiones || 0);
        });

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener presupuestos", error: error.message });
    }
};

// Obtener presupuesto completo con todos sus items
export const getBudgetById = async (req, res) => {
    try {
        const { id } = req.params;

        // Cabecera
        const [budget] = await pool.query('SELECT * FROM presupuesto WHERE id_presupuesto = ?', [id]);
        if (budget.length === 0) return res.status(404).json({ message: "Presupuesto no encontrado" });

        // Items por categoría
        const [materiales] = await pool.query(`
            SELECT pm.*, m.nombre, m.unidad_medida 
            FROM presupuesto_materiales pm 
            JOIN material m ON pm.id_material = m.id_material 
            WHERE pm.id_presupuesto = ?
        `, [id]);

        const [manoObra] = await pool.query('SELECT * FROM presupuesto_mano_obra WHERE id_presupuesto = ?', [id]);
        const [terceros] = await pool.query('SELECT * FROM presupuesto_terceros WHERE id_presupuesto = ?', [id]);
        const [viaticos] = await pool.query('SELECT * FROM presupuesto_viaticos WHERE id_presupuesto = ?', [id]);
        const [impresiones] = await pool.query('SELECT * FROM presupuesto_impresiones WHERE id_presupuesto = ?', [id]);

        res.json({
            ...budget[0],
            materiales,
            mano_obra: manoObra,
            terceros,
            viaticos,
            impresiones
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener presupuesto", error: error.message });
    }
};

// Crear presupuesto (Cabecera)
export const createBudget = async (req, res) => {
    try {
        const {
            id_proyecto,
            titulo,
            descripcion_alcance,
            id_moneda,
            estado,
            factor_mano_obra,
            id_documento_solicitud,
            id_usuario_asignado
        } = req.body;

        if (!id_proyecto) {
            return res.status(400).json({ message: "Se requiere id_proyecto" });
        }

        const [result] = await pool.query(
            `INSERT INTO presupuesto (id_proyecto, titulo, descripcion_alcance, id_moneda, estado, fecha_creacion, total, factor_mano_obra, id_documento_solicitud, id_usuario_asignado) 
             VALUES (?, ?, ?, ?, ?, NOW(), 0, ?, ?, ?)`,
            [id_proyecto, titulo || null, descripcion_alcance || null, id_moneda || 1, estado || 'Borrador', factor_mano_obra || 1.10, id_documento_solicitud || null, id_usuario_asignado || null]
        );

        res.status(201).json({
            id_presupuesto: result.insertId,
            id_proyecto,
            titulo,
            id_usuario_asignado,
            message: "Presupuesto creado exitosamente"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al crear presupuesto", error: error.message });
    }
};

// Actualizar cabecera del presupuesto
export const updateBudget = async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, descripcion_alcance, estado, factor_mano_obra } = req.body;

        await pool.query(
            `UPDATE presupuesto SET titulo = ?, descripcion_alcance = ?, estado = ?, factor_mano_obra = ? WHERE id_presupuesto = ?`,
            [titulo, descripcion_alcance, estado, factor_mano_obra || 1.10, id]
        );

        res.json({ message: "Presupuesto actualizado" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al actualizar presupuesto", error: error.message });
    }
};

// Eliminar presupuesto (cascada automática por FK)
export const deleteBudget = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM presupuesto WHERE id_presupuesto = ?', [id]);
        res.json({ message: "Presupuesto eliminado" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al eliminar presupuesto", error: error.message });
    }
};

// Marcar presupuesto como "Solicitado" (el oficial del proyecto)
export const markBudgetAsSolicitado = async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener el proyecto del presupuesto
        const [budget] = await pool.query('SELECT id_proyecto FROM presupuesto WHERE id_presupuesto = ?', [id]);
        if (budget.length === 0) return res.status(404).json({ message: "Presupuesto no encontrado" });

        const id_proyecto = budget[0].id_proyecto;

        // Quitar es_solicitado de todos los presupuestos del mismo proyecto
        await pool.query('UPDATE presupuesto SET es_solicitado = 0 WHERE id_proyecto = ?', [id_proyecto]);

        // Marcar este como solicitado y cambiar estado
        await pool.query('UPDATE presupuesto SET es_solicitado = 1, estado = "Solicitado" WHERE id_presupuesto = ?', [id]);

        res.json({ message: "Presupuesto marcado como Solicitado" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al marcar presupuesto", error: error.message });
    }
};

// Operativo acepta la solicitud de presupuesto
export const acceptBudget = async (req, res) => {
    try {
        const { id } = req.params;

        await pool.query(
            `UPDATE presupuesto SET estado = 'Aceptado', fecha_respuesta = NOW() WHERE id_presupuesto = ?`,
            [id]
        );

        res.json({ message: "Solicitud aceptada. Ahora puede completar el presupuesto." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al aceptar solicitud", error: error.message });
    }
};

// Operativo rechaza la solicitud de presupuesto
export const rejectBudget = async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;

        await pool.query(
            `UPDATE presupuesto SET estado = 'Rechazado', motivo_rechazo = ?, fecha_respuesta = NOW() WHERE id_presupuesto = ?`,
            [motivo || 'Sin motivo especificado', id]
        );

        res.json({ message: "Solicitud rechazada." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al rechazar solicitud", error: error.message });
    }
};

// Operativo marca presupuesto como completado y genera PDF
export const completeBudget = async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener presupuesto con todos sus items
        const [budgetRows] = await pool.query('SELECT * FROM presupuesto WHERE id_presupuesto = ?', [id]);
        if (budgetRows.length === 0) {
            return res.status(404).json({ message: "Presupuesto no encontrado" });
        }

        const budget = budgetRows[0];

        // Obtener todos los items del presupuesto
        const [materiales] = await pool.query(`
            SELECT pm.*, m.nombre 
            FROM presupuesto_materiales pm
            LEFT JOIN material m ON pm.id_material = m.id_material
            WHERE pm.id_presupuesto = ?
        `, [id]);

        const [mano_obra] = await pool.query('SELECT * FROM presupuesto_mano_obra WHERE id_presupuesto = ?', [id]);
        const [terceros] = await pool.query('SELECT * FROM presupuesto_terceros WHERE id_presupuesto = ?', [id]);
        const [viaticos] = await pool.query('SELECT * FROM presupuesto_viaticos WHERE id_presupuesto = ?', [id]);
        const [impresiones] = await pool.query('SELECT * FROM presupuesto_impresiones WHERE id_presupuesto = ?', [id]);

        // Construir objeto completo del presupuesto
        const fullBudget = {
            ...budget,
            materiales,
            mano_obra,
            terceros,
            viaticos,
            impresiones
        };

        // Generar PDF
        console.log('Generando PDF para presupuesto:', id);
        const pdfPath = await generateBudgetPDF(fullBudget);
        console.log('PDF generado:', pdfPath);

        // Marcar como completado y guardar ruta del PDF
        await pool.query(
            `UPDATE presupuesto SET estado = 'Completado', ruta_reporte = ?, fecha_respuesta = NOW() WHERE id_presupuesto = ?`,
            [pdfPath, id]
        );

        res.json({
            message: "Presupuesto completado y reporte PDF generado.",
            id_presupuesto: id,
            ruta_reporte: pdfPath
        });
    } catch (error) {
        console.error('Error en completeBudget:', error);
        res.status(500).json({ message: "Error al completar presupuesto", error: error.message });
    }
};

// =============================================
// MATERIALES
// =============================================
export const addMaterial = async (req, res) => {
    try {
        const { id_presupuesto, id_material, cantidad, costo_unitario } = req.body;
        const [result] = await pool.query(
            'INSERT INTO presupuesto_materiales (id_presupuesto, id_material, cantidad, costo_unitario) VALUES (?, ?, ?, ?)',
            [id_presupuesto, id_material, cantidad, costo_unitario]
        );
        res.status(201).json({ id_pm: result.insertId, message: "Material agregado" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al agregar material", error: error.message });
    }
};

export const deleteMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM presupuesto_materiales WHERE id_pm = ?', [id]);
        res.json({ message: "Material eliminado" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al eliminar material", error: error.message });
    }
};

// =============================================
// MANO DE OBRA
// =============================================
export const addManoObra = async (req, res) => {
    try {
        const { id_presupuesto, cargo, descripcion, costo_hora, horas, personas } = req.body;
        const [result] = await pool.query(
            'INSERT INTO presupuesto_mano_obra (id_presupuesto, cargo, descripcion, costo_hora, horas, personas) VALUES (?, ?, ?, ?, ?, ?)',
            [id_presupuesto, cargo, descripcion, costo_hora, horas, personas]
        );
        res.status(201).json({ id_pmo: result.insertId, message: "Mano de obra agregada" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al agregar mano de obra", error: error.message });
    }
};

export const deleteManoObra = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM presupuesto_mano_obra WHERE id_pmo = ?', [id]);
        res.json({ message: "Mano de obra eliminada" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al eliminar mano de obra", error: error.message });
    }
};

// =============================================
// TERCEROS
// =============================================
export const addTercero = async (req, res) => {
    try {
        const { id_presupuesto, servicio, descripcion, costo } = req.body;
        const [result] = await pool.query(
            'INSERT INTO presupuesto_terceros (id_presupuesto, servicio, descripcion, costo) VALUES (?, ?, ?, ?)',
            [id_presupuesto, servicio, descripcion, costo]
        );
        res.status(201).json({ id_pt: result.insertId, message: "Tercero agregado" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al agregar tercero", error: error.message });
    }
};

export const deleteTercero = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM presupuesto_terceros WHERE id_pt = ?', [id]);
        res.json({ message: "Tercero eliminado" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al eliminar tercero", error: error.message });
    }
};

// =============================================
// VIÁTICOS
// =============================================
export const addViatico = async (req, res) => {
    try {
        const { id_presupuesto, descripcion, costo_diario, personas, dias } = req.body;
        const [result] = await pool.query(
            'INSERT INTO presupuesto_viaticos (id_presupuesto, descripcion, costo_diario, personas, dias) VALUES (?, ?, ?, ?, ?)',
            [id_presupuesto, descripcion, costo_diario, personas, dias]
        );
        res.status(201).json({ id_pv: result.insertId, message: "Viático agregado" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al agregar viático", error: error.message });
    }
};

export const deleteViatico = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM presupuesto_viaticos WHERE id_pv = ?', [id]);
        res.json({ message: "Viático eliminado" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al eliminar viático", error: error.message });
    }
};

// =============================================
// IMPRESIONES
// =============================================
export const addImpresion = async (req, res) => {
    try {
        const { id_presupuesto, nombre, ancho, largo, cantidad, costo_m2 } = req.body;
        const [result] = await pool.query(
            'INSERT INTO presupuesto_impresiones (id_presupuesto, nombre, ancho, largo, cantidad, costo_m2) VALUES (?, ?, ?, ?, ?, ?)',
            [id_presupuesto, nombre, ancho, largo, cantidad, costo_m2]
        );
        res.status(201).json({ id_pi: result.insertId, message: "Impresión agregada" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al agregar impresión", error: error.message });
    }
};

export const deleteImpresion = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM presupuesto_impresiones WHERE id_pi = ?', [id]);
        res.json({ message: "Impresión eliminada" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al eliminar impresión", error: error.message });
    }
};

// =============================================
// LEGACY - Mantener compatibilidad
// =============================================
export const getBudgetItems = async (req, res) => {
    try {
        const { budgetId } = req.params;
        const [rows] = await pool.query('SELECT * FROM itempresupuesto WHERE id_presupuesto = ?', [budgetId]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener ítems", error: error.message });
    }
};

export const createBudgetItem = async (req, res) => {
    try {
        const { id_presupuesto, descripcion, cantidad, costo_unitario } = req.body;
        const [result] = await pool.query(
            'INSERT INTO itempresupuesto (id_presupuesto, descripcion, cantidad, costo_unitario, id_material) VALUES (?, ?, ?, ?, NULL)',
            [id_presupuesto, descripcion, cantidad, costo_unitario]
        );
        res.status(201).json({ id_item: result.insertId, message: "Ítem agregado correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al agregar ítem", error: error.message });
    }
};

export const deleteBudgetItem = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM itempresupuesto WHERE id_item = ?', [id]);
        res.json({ message: "Ítem eliminado" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al eliminar ítem", error: error.message });
    }
};

// =============================================
// ESTADÍSTICAS PARA DASHBOARD OPERATIVO
// =============================================
export const getOperativoStats = async (req, res) => {
    try {
        // Conteo de presupuestos activos (no rechazados)
        const [budgetCount] = await pool.query(`
            SELECT COUNT(*) as count FROM presupuesto WHERE estado != 'Rechazado'
        `);

        // Conteo de materiales registrados
        const [materialsCount] = await pool.query(`
            SELECT COUNT(*) as count FROM material
        `);

        // Conteo de tipos de mano de obra
        const [laborCount] = await pool.query(`
            SELECT COUNT(*) as count FROM mano_obra WHERE activo = 1
        `);

        // Costo promedio de presupuestos completados
        const [avgCost] = await pool.query(`
            SELECT AVG(
                COALESCE((SELECT SUM(total) FROM presupuesto_materiales WHERE id_presupuesto = p.id_presupuesto), 0) +
                COALESCE((SELECT SUM(total) FROM presupuesto_mano_obra WHERE id_presupuesto = p.id_presupuesto), 0) * COALESCE(p.factor_mano_obra, 1.1) +
                COALESCE((SELECT SUM(costo) FROM presupuesto_terceros WHERE id_presupuesto = p.id_presupuesto), 0) +
                COALESCE((SELECT SUM(total) FROM presupuesto_viaticos WHERE id_presupuesto = p.id_presupuesto), 0) +
                COALESCE((SELECT SUM(total) FROM presupuesto_impresiones WHERE id_presupuesto = p.id_presupuesto), 0)
            ) as avg_cost
            FROM presupuesto p WHERE estado = 'Completado'
        `);

        // Top 5 materiales más usados en presupuestos
        const [topMaterials] = await pool.query(`
            SELECT m.nombre, m.unidad_medida, 
                   SUM(pm.cantidad) as total_cantidad,
                   SUM(pm.total) as total_costo
            FROM presupuesto_materiales pm
            JOIN material m ON pm.id_material = m.id_material
            GROUP BY pm.id_material
            ORDER BY total_costo DESC
            LIMIT 5
        `);

        // Presupuestos recientes (últimos 5)
        const [recentBudgets] = await pool.query(`
            SELECT p.id_presupuesto, p.titulo, p.estado, pr.nombre as proyecto_nombre,
                COALESCE((SELECT SUM(total) FROM presupuesto_materiales WHERE id_presupuesto = p.id_presupuesto), 0) as total_materiales,
                COALESCE((SELECT SUM(total) FROM presupuesto_mano_obra WHERE id_presupuesto = p.id_presupuesto), 0) * COALESCE(p.factor_mano_obra, 1.1) as total_mano_obra,
                COALESCE((SELECT SUM(costo) FROM presupuesto_terceros WHERE id_presupuesto = p.id_presupuesto), 0) +
                COALESCE((SELECT SUM(total) FROM presupuesto_viaticos WHERE id_presupuesto = p.id_presupuesto), 0) +
                COALESCE((SELECT SUM(total) FROM presupuesto_impresiones WHERE id_presupuesto = p.id_presupuesto), 0) as total_otros
            FROM presupuesto p
            LEFT JOIN proyecto pr ON p.id_proyecto = pr.id_proyecto
            ORDER BY p.fecha_creacion DESC
            LIMIT 5
        `);

        // Distribución de costos totales (materiales, mano obra, otros)
        const [costDistribution] = await pool.query(`
            SELECT 
                COALESCE(SUM((SELECT SUM(total) FROM presupuesto_materiales WHERE id_presupuesto = p.id_presupuesto)), 0) as total_materiales,
                COALESCE(SUM((SELECT SUM(total) FROM presupuesto_mano_obra WHERE id_presupuesto = p.id_presupuesto) * COALESCE(p.factor_mano_obra, 1.1)), 0) as total_mano_obra,
                COALESCE(SUM((SELECT SUM(costo) FROM presupuesto_terceros WHERE id_presupuesto = p.id_presupuesto)), 0) +
                COALESCE(SUM((SELECT SUM(total) FROM presupuesto_viaticos WHERE id_presupuesto = p.id_presupuesto)), 0) +
                COALESCE(SUM((SELECT SUM(total) FROM presupuesto_impresiones WHERE id_presupuesto = p.id_presupuesto)), 0) as total_otros
            FROM presupuesto p
        `);

        res.json({
            stats: {
                presupuestosActivos: budgetCount[0].count,
                materialesRegistrados: materialsCount[0].count,
                tiposManoObra: laborCount[0].count,
                costoPromedio: avgCost[0].avg_cost || 0
            },
            topMaterials: topMaterials,
            recentBudgets: recentBudgets.map(b => ({
                ...b,
                total_general: parseFloat(b.total_materiales || 0) + parseFloat(b.total_mano_obra || 0) + parseFloat(b.total_otros || 0)
            })),
            costDistribution: costDistribution[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener estadísticas", error: error.message });
    }
};

// Obtener TODOS los presupuestos (para reportes)
export const getAllBudgets = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT p.*, pr.nombre as proyecto_nombre,
                COALESCE((SELECT SUM(total) FROM presupuesto_materiales WHERE id_presupuesto = p.id_presupuesto), 0) as total_materiales,
                COALESCE((SELECT SUM(total) FROM presupuesto_mano_obra WHERE id_presupuesto = p.id_presupuesto), 0) * COALESCE(p.factor_mano_obra, 1.1) as total_mano_obra,
                COALESCE((SELECT SUM(costo) FROM presupuesto_terceros WHERE id_presupuesto = p.id_presupuesto), 0) as total_terceros,
                COALESCE((SELECT SUM(total) FROM presupuesto_viaticos WHERE id_presupuesto = p.id_presupuesto), 0) as total_viaticos,
                COALESCE((SELECT SUM(total) FROM presupuesto_impresiones WHERE id_presupuesto = p.id_presupuesto), 0) as total_impresiones
            FROM presupuesto p
            LEFT JOIN proyecto pr ON p.id_proyecto = pr.id_proyecto
            ORDER BY p.fecha_creacion DESC
        `);

        // Calcular total general
        rows.forEach(r => {
            r.total_general = parseFloat(r.total_materiales || 0) +
                parseFloat(r.total_mano_obra || 0) +
                parseFloat(r.total_terceros || 0) +
                parseFloat(r.total_viaticos || 0) +
                parseFloat(r.total_impresiones || 0);
        });

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener presupuestos", error: error.message });
    }
};

export const updateBudgetSelection = async (req, res) => {
    try {
        const { id } = req.params;
        const { seleccionado } = req.body;
        const val = seleccionado ? 1 : 0;
        const [result] = await pool.query('UPDATE presupuesto SET seleccionado = ? WHERE id_presupuesto = ?', [val, id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Presupuesto no encontrado" });
        res.json({ message: "Selección actualizada" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al actualizar selección", error: error.message });
    }
};
