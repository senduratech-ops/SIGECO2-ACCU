import { Router } from 'express';
import {
    getMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial
} from '../controllers/material.controller.js';

const router = Router();

// Routes
router.get('/api/materials', getMaterials);
router.post('/api/materials', createMaterial);
router.put('/api/materials/:id', updateMaterial);
router.delete('/api/materials/:id', deleteMaterial);

export default router;
