import { Router } from "express";
import {
    getDocuments,
    getDocumentById,
    getDocumentsByProject,
    getDocumentsByType,
    searchDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    addFileToDocument,
    deleteFile,
    getDocumentTypes,
    getDocumentStatuses,
    getProjectsForSelect,
    getDocumentStats
} from "../controllers/document.controller.js";
import { uploadSingle, handleMulterError } from "../middleware/upload.middleware.js";

const router = Router();

// =============================================
// RUTAS DE DOCUMENTOS
// =============================================

// Obtener todos los documentos
router.get('/api/documents', getDocuments);

// Buscar documentos (debe ir antes de /:id para evitar conflictos)
router.get('/api/documents/search', searchDocuments);

// Estadísticas de documentos
router.get('/api/documents/stats', getDocumentStats);

// Obtener documento por ID
router.get('/api/documents/:id', getDocumentById);

// Obtener documentos por proyecto
router.get('/api/documents/project/:id', getDocumentsByProject);

// Obtener documentos por tipo
router.get('/api/documents/type/:id', getDocumentsByType);

// Crear documento (con archivo opcional)
router.post('/api/documents', uploadSingle, handleMulterError, createDocument);

// Actualizar documento
router.put('/api/documents/:id', updateDocument);

// Eliminar documento
router.delete('/api/documents/:id', deleteDocument);

// Agregar archivo a documento existente
router.post('/api/documents/:id/files', uploadSingle, handleMulterError, addFileToDocument);

// Eliminar archivo específico
router.delete('/api/files/:id', deleteFile);

// =============================================
// RUTAS DE TIPOS/CATEGORÍAS
// =============================================

// Obtener tipos de documento (categorías)
router.get('/api/document-types', getDocumentTypes);

// =============================================
// RUTAS DE ESTADOS
// =============================================

// Obtener estados de documento
router.get('/api/document-statuses', getDocumentStatuses);

// =============================================
// RUTAS DE PROYECTOS (para selectores)
// =============================================

// Obtener proyectos para select
router.get('/api/projects-select', getProjectsForSelect);

export default router;
