import { Router } from "express";
import { verificarUser, obtenerRol, loginAdmin, loginJefe, loginOperativo, getCurrentUser, getUsers, getRoles, createUser } from "../controllers/user.controller.js";

const router = Router();

// Login endpoints con rol
router.post("/login/admin", loginAdmin);
router.post("/login/jefe", loginJefe);
router.post("/login/operativo", loginOperativo);

// Rutas generales de login
router.post('/login', verificarUser);
router.get('/user/rol/:id', obtenerRol);

// Get current user
router.get("/users/me", getCurrentUser);

// Get users (filterable by id_rol)
router.get("/users", getUsers);
router.post("/users", createUser);

// Roles
router.get("/roles", getRoles);

export default router;
