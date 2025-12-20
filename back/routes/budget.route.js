import { Router } from 'express';
import {
    getBudgetsByProject,
    getBudgetById,
    createBudget,
    updateBudget,
    deleteBudget,
    markBudgetAsSolicitado,
    acceptBudget,
    rejectBudget,
    completeBudget,
    addMaterial,
    deleteMaterial,
    addManoObra,
    deleteManoObra,
    addTercero,
    deleteTercero,
    addViatico,
    deleteViatico,
    addImpresion,
    deleteImpresion,
    getBudgetItems,
    createBudgetItem,
    deleteBudgetItem,
    getOperativoStats,
    getAllBudgets,
    updateBudgetSelection
} from '../controllers/budget.controller.js';

const router = Router();

// Estadísticas para Dashboard Operativo
router.get('/api/budgets/operativo-stats', getOperativoStats);
router.get('/api/budgets/all', getAllBudgets); // New route for reports

// Presupuestos por proyecto
router.get('/api/projects/:projectId/budgets', getBudgetsByProject);

// CRUD Presupuesto
router.post('/api/budgets', createBudget);
router.get('/api/budgets/:id', getBudgetById);
router.put('/api/budgets/:id', updateBudget);
router.delete('/api/budgets/:id', deleteBudget);
router.put('/api/budgets/:id/solicitado', markBudgetAsSolicitado);
router.put('/api/budgets/:id/selection', updateBudgetSelection);

// Aceptar/Rechazar/Completar solicitud (Operativo)
router.put('/api/budgets/:id/accept', acceptBudget);
router.put('/api/budgets/:id/reject', rejectBudget);
router.put('/api/budgets/:id/complete', completeBudget);

// === ITEMS POR CATEGORÍA ===

// Materiales
router.post('/api/budgets/materiales', addMaterial);
router.delete('/api/budgets/materiales/:id', deleteMaterial);

// Mano de Obra
router.post('/api/budgets/mano-obra', addManoObra);
router.delete('/api/budgets/mano-obra/:id', deleteManoObra);

// Terceros
router.post('/api/budgets/terceros', addTercero);
router.delete('/api/budgets/terceros/:id', deleteTercero);

// Viáticos
router.post('/api/budgets/viaticos', addViatico);
router.delete('/api/budgets/viaticos/:id', deleteViatico);

// Impresiones
router.post('/api/budgets/impresiones', addImpresion);
router.delete('/api/budgets/impresiones/:id', deleteImpresion);

// Legacy endpoints
router.get('/api/budgets/:budgetId/items', getBudgetItems);
router.post('/api/items', createBudgetItem);
router.delete('/api/items/:id', deleteBudgetItem);

export default router;
