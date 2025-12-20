import { Router } from "express";
import {
    getNotifications,
    getUnreadNotifications,
    getUnreadCount,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationsByType
} from "../controllers/notification.controller.js";

const router = Router();

// Listar notificaciones
router.get('/api/notifications', getNotifications);

// Notificaciones no leídas
router.get('/api/notifications/unread', getUnreadNotifications);

// Conteo de no leídas
router.get('/api/notifications/unread/count', getUnreadCount);

// Por tipo
router.get('/api/notifications/type/:tipo', getNotificationsByType);

// Crear notificación
router.post('/api/notifications', createNotification);

// Marcar como leída
router.put('/api/notifications/:id/read', markAsRead);

// Marcar todas como leídas
router.put('/api/notifications/read-all', markAllAsRead);

// Eliminar
router.delete('/api/notifications/:id', deleteNotification);

export default router;
