import { Router } from "express";
import {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    searchProjects,
    getProjectsByStatus,
    getProjectStatuses,
    getProjectPriorities,
    getProjectStats,
    createSection,
    updateSection,
    deleteSection,
    createElement,
    updateElement,
    deleteElement,
    getJefeDashboardStats,
    getMyProjects
} from "../controllers/project.controller.js";

const router = Router();

// Rutas de proyectos
router.get('/api/projects/jefe-stats', getJefeDashboardStats);
router.get('/api/projects/my-projects', getMyProjects);
router.get('/api/projects', getProjects);
router.get('/api/projects/search', searchProjects);
router.get('/api/projects/:id', getProjectById);
router.get('/api/projects/:id/stats', getProjectStats);
router.get('/api/projects/status/:id', getProjectsByStatus);
router.post('/api/projects', createProject);
router.put('/api/projects/:id', updateProject);
router.delete('/api/projects/:id', deleteProject);

// Rutas de secciones de proyecto
router.post('/api/projects/:id/sections', createSection);
router.put('/api/projects/:id/sections/:sectionId', updateSection);
router.delete('/api/projects/:id/sections/:sectionId', deleteSection);

// Rutas de elementos de sección
router.post('/api/sections/:sectionId/elements', createElement);
router.put('/api/sections/:sectionId/elements/:elementId', updateElement);
router.delete('/api/sections/:sectionId/elements/:elementId', deleteElement);

// Catálogos
router.get('/api/project-statuses', getProjectStatuses);
router.get('/api/project-priorities', getProjectPriorities);
// Note: /api/users is handled by user.route.js with proper role filtering

// Mantener ruta legacy
router.get('/projects', getProjects);

export default router;