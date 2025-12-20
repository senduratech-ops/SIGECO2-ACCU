import { Router } from "express";
import {
    getDashboardStats,
    getDocumentsByMonth,
    getDocumentsByTypePie,
    getRecentDocuments,
    getRecentActivity
} from "../controllers/admin.controller.js";

const router = Router();

// Estadísticas del dashboard
router.get('/api/admin/dashboard', getDashboardStats);

// Datos para gráficos
router.get('/api/admin/charts/monthly', getDocumentsByMonth);
router.get('/api/admin/charts/types', getDocumentsByTypePie);

// Documentos recientes
router.get('/api/admin/recent', getRecentDocuments);

// Actividad reciente
router.get('/api/admin/activity', getRecentActivity);

export default router;
