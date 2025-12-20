import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import userRouters from './routes/user.route.js';
import projectRoutes from './routes/project.route.js';
import materialRoutes from './routes/material.route.js';
import documentRouters from './routes/document.route.js';
import adminRouters from './routes/admin.route.js';
import notificationRouters from './routes/notification.route.js';
import budgetRoutes from './routes/budget.route.js';
import laborRoutes from './routes/labor.route.js';
import { trackActivity } from './middleware/activityTracker.js';
import cors from "cors";

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: true, // Permite cualquier origen (desarrollo)
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true                // habilita cookies
}));

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(express.json());
app.use(cookieParser());
app.use(trackActivity); // Track usage

app.use('/api', userRouters);
app.use(projectRoutes);
app.use(materialRoutes);
app.use(documentRouters);
app.use(adminRouters);
app.use(notificationRouters);
app.use(budgetRoutes);
app.use(laborRoutes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});