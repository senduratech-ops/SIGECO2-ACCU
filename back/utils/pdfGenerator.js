import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Genera un PDF con el reporte del presupuesto
 * @param {Object} budget - Datos del presupuesto con materiales, mano_obra, terceros, viaticos, impresiones
 * @returns {string} - Ruta relativa del PDF generado
 */
export async function generateBudgetPDF(budget) {
    // Crear directorio si no existe
    const uploadDir = path.join(__dirname, '../../uploads/reportes');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `presupuesto_${budget.id_presupuesto}_${Date.now()}.pdf`;
    const filePath = path.join(uploadDir, fileName);

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // ========== ENCABEZADO ==========
        doc.fontSize(20).font('Helvetica-Bold')
            .text('REPORTE DE PRESUPUESTO', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(14).font('Helvetica')
            .text(`Presupuesto #${budget.id_presupuesto}`, { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(12)
            .text(`Título: ${budget.titulo || 'Sin título'}`, { align: 'center' });
        doc.moveDown();

        // Línea separadora
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // ========== INFORMACIÓN GENERAL ==========
        doc.fontSize(11).font('Helvetica')
            .text(`Fecha de creación: ${new Date(budget.fecha_creacion).toLocaleDateString('es-PE')}`)
            .text(`Estado: ${budget.estado}`);

        if (budget.descripcion_alcance) {
            doc.moveDown(0.5)
                .text(`Descripción: ${budget.descripcion_alcance}`);
        }
        doc.moveDown();

        // ========== FUNCIÓN HELPER PARA TABLAS ==========
        const drawTable = (title, headers, rows, widths) => {
            doc.fontSize(12).font('Helvetica-Bold').text(title);
            doc.moveDown(0.3);

            const startX = 50;
            let currentY = doc.y;

            // Header
            doc.fontSize(9).font('Helvetica-Bold');
            let x = startX;
            headers.forEach((h, i) => {
                doc.text(h, x, currentY, { width: widths[i], align: 'left' });
                x += widths[i];
            });
            currentY += 15;
            doc.moveTo(startX, currentY).lineTo(550, currentY).stroke();
            currentY += 5;

            // Rows
            doc.font('Helvetica').fontSize(9);
            rows.forEach(row => {
                x = startX;
                row.forEach((cell, i) => {
                    doc.text(String(cell), x, currentY, { width: widths[i], align: 'left' });
                    x += widths[i];
                });
                currentY += 14;

                // Nueva página si es necesario
                if (currentY > 700) {
                    doc.addPage();
                    currentY = 50;
                }
            });

            doc.y = currentY + 10;
        };

        // ========== MATERIALES ==========
        if (budget.materiales && budget.materiales.length > 0) {
            const totalMat = budget.materiales.reduce((s, m) => s + parseFloat(m.total || 0), 0);
            const rows = budget.materiales.map(m => [
                m.nombre || 'Material',
                m.cantidad,
                parseFloat(m.costo_unitario || 0).toFixed(2),
                `S/ ${parseFloat(m.total || 0).toFixed(2)}`
            ]);
            rows.push(['', '', 'Subtotal:', `S/ ${totalMat.toFixed(2)}`]);
            drawTable('MATERIALES', ['Material', 'Cant.', 'P.Unit.', 'Total'], rows, [200, 60, 80, 100]);
        }

        // ========== MANO DE OBRA ==========
        if (budget.mano_obra && budget.mano_obra.length > 0) {
            const factor = budget.factor_mano_obra || 1.1;
            const totalMO = budget.mano_obra.reduce((s, m) => s + parseFloat(m.total || 0), 0) * factor;
            const rows = budget.mano_obra.map(m => [
                m.cargo || 'Cargo',
                m.horas,
                m.personas,
                `S/ ${(parseFloat(m.total || 0) * factor).toFixed(2)}`
            ]);
            rows.push(['', '', `Factor: ${factor}x`, `S/ ${totalMO.toFixed(2)}`]);
            drawTable('MANO DE OBRA', ['Cargo', 'Horas', 'Pers.', 'Total'], rows, [200, 60, 60, 120]);
        }

        // ========== TERCEROS ==========
        if (budget.terceros && budget.terceros.length > 0) {
            const totalTer = budget.terceros.reduce((s, t) => s + parseFloat(t.costo || 0), 0);
            const rows = budget.terceros.map(t => [
                t.servicio || 'Servicio',
                t.descripcion || '-',
                `S/ ${parseFloat(t.costo || 0).toFixed(2)}`
            ]);
            rows.push(['', 'Subtotal:', `S/ ${totalTer.toFixed(2)}`]);
            drawTable('SERVICIOS DE TERCEROS', ['Servicio', 'Descripción', 'Costo'], rows, [150, 200, 100]);
        }

        // ========== VIÁTICOS ==========
        if (budget.viaticos && budget.viaticos.length > 0) {
            const totalVia = budget.viaticos.reduce((s, v) => s + parseFloat(v.total || 0), 0);
            const rows = budget.viaticos.map(v => [
                v.descripcion || 'Viático',
                v.personas,
                v.dias,
                `S/ ${parseFloat(v.total || 0).toFixed(2)}`
            ]);
            rows.push(['', '', 'Subtotal:', `S/ ${totalVia.toFixed(2)}`]);
            drawTable('VIÁTICOS', ['Descripción', 'Pers.', 'Días', 'Total'], rows, [200, 60, 60, 120]);
        }

        // ========== IMPRESIONES ==========
        if (budget.impresiones && budget.impresiones.length > 0) {
            const totalImp = budget.impresiones.reduce((s, i) => s + parseFloat(i.total || 0), 0);
            const rows = budget.impresiones.map(i => [
                i.nombre || 'Impresión',
                `${i.ancho}m x ${i.largo}m`,
                i.cantidad,
                `S/ ${parseFloat(i.total || 0).toFixed(2)}`
            ]);
            rows.push(['', '', 'Subtotal:', `S/ ${totalImp.toFixed(2)}`]);
            drawTable('IMPRESIONES', ['Nombre', 'Dimensiones', 'Cant.', 'Total'], rows, [150, 120, 70, 100]);
        }

        // ========== TOTAL GENERAL ==========
        const totalMat = budget.materiales?.reduce((s, m) => s + parseFloat(m.total || 0), 0) || 0;
        const totalMO = (budget.mano_obra?.reduce((s, m) => s + parseFloat(m.total || 0), 0) || 0) * (budget.factor_mano_obra || 1.1);
        const totalTer = budget.terceros?.reduce((s, t) => s + parseFloat(t.costo || 0), 0) || 0;
        const totalVia = budget.viaticos?.reduce((s, v) => s + parseFloat(v.total || 0), 0) || 0;
        const totalImp = budget.impresiones?.reduce((s, i) => s + parseFloat(i.total || 0), 0) || 0;
        const totalGeneral = totalMat + totalMO + totalTer + totalVia + totalImp;

        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);
        doc.fontSize(14).font('Helvetica-Bold')
            .text(`TOTAL GENERAL: S/ ${totalGeneral.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, { align: 'right' });

        // ========== PIE DE PÁGINA ==========
        doc.moveDown(2);
        doc.fontSize(9).font('Helvetica')
            .text(`Generado el ${new Date().toLocaleString('es-PE')}`, { align: 'center' });
        doc.text('Sistema SIGECO-ACCU', { align: 'center' });

        doc.end();

        stream.on('finish', () => {
            resolve(`/uploads/reportes/${fileName}`);
        });

        stream.on('error', reject);
    });
}
