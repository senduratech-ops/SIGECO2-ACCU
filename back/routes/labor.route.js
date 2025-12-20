import { Router } from 'express';
import {
    getLabors,
    getLaborById,
    createLabor,
    updateLabor,
    deleteLabor
} from '../controllers/labor.controller.js';

const router = Router();

// CRUD Mano de Obra (tipos/cargos)
router.get('/api/labors', getLabors);
router.get('/api/labors/:id', getLaborById);
router.post('/api/labors', createLabor);
router.put('/api/labors/:id', updateLabor);
router.delete('/api/labors/:id', deleteLabor);

export default router;
