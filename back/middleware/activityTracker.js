import { pool } from '../config/db.js';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const SECRET_TOKEN = process.env.JWT_SECRET || 'secret_key_123';

export const trackActivity = async (req, res, next) => {
    // Intentar obtener token de cookie
    const token = req.cookies?.token;

    if (token) {
        try {
            const decoded = jwt.verify(token, SECRET_TOKEN);
            console.log("Tracking Activity for User:", decoded.id);
            if (decoded && decoded.id) {
                // Actualizar ultimo_acceso sin esperar (fire and forget)
                pool.query('UPDATE usuario SET ultimo_acceso = NOW() WHERE id_usuario = ?', [decoded.id])
                    .catch(err => console.error('Error updating activity:', err.message));
            }
        } catch (error) {
            // Token inválido o expirado, ignorar para este propósito
        }
    }
    next();
};
