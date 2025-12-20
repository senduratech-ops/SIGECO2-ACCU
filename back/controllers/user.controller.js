import { pool } from '../config/db.js';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

export const verificarUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.query(
      'SELECT * FROM usuario WHERE correo = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Usuario no registrado" });
    }

    const user = rows[0];
    console.log(user)
    if (password !== user.contraseña) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    res.json({ message: "Login exitoso" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor xd" });
  }
}

export const obtenerRol = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT r.nombre AS rol
       FROM usuarioRol ur
       INNER JOIN rol r ON ur.id_rol = r.id_rol
       WHERE ur.id_usuario = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Rol no encontrado para este usuario' });
    }

    // Como cada usuario tiene un solo rol, devolvemos la primera fila
    res.json({ rol: rows[0].rol });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor xd' });
  }
}

const SECRET_TOKEN = process.env.SECRET_TOKEN

async function loginWithRole(req, res, expectedRole) {
  const { email, password } = req.body;

  try {
    // 1. Buscar usuario
    console.log('Login attempt:', email, 'for role:', expectedRole);
    const [userRows] = await pool.query(
      "SELECT id_usuario, contraseña FROM usuario WHERE correo = ?",
      [email]
    );

    console.log('User found:', userRows.length > 0 ? 'Yes' : 'No');
    if (userRows.length === 0) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    const user = userRows[0];

    // 2. Validar contraseña en texto plano
    if (user.contraseña !== password) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }


    // 3. Obtener rol real del usuario
    const [roleRows] = await pool.query(
      `SELECT r.nombre 
       FROM usuariorol ur
       JOIN rol r ON ur.id_rol = r.id_rol
       WHERE ur.id_usuario = ?`,
      [user.id_usuario]
    );

    if (roleRows.length === 0) {
      return res.status(403).json({ message: "Usuario sin rol asignado" });
    }

    const userRole = roleRows[0].nombre;

    // 4. Comparar con el rol esperado según endpoint
    if (userRole !== expectedRole) {
      return res.status(403).json({ message: "Rol no autorizado" });
    }

    // 5. Generar token
    const token = jwt.sign(
      { id: user.id_usuario, email, role: userRole },
      SECRET_TOKEN,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax"
    });

    res.json({ role: userRole });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor" });
  }
}

// Controladores específicos
export const loginAdmin = (req, res) => loginWithRole(req, res, "admin");
export const loginJefe = (req, res) => loginWithRole(req, res, "jefe");
export const loginOperativo = (req, res) => loginWithRole(req, res, "operativo");

// Get current user data from token
export const getCurrentUser = async (req, res) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      // If no token, return default admin for demo
      return res.json({
        id_usuario: 1,
        nombre: 'Administrador',
        apellido: 'Sistema',
        correo: 'admin@accuboss.com',
        rol: 'admin'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, SECRET_TOKEN);

    // Get user data
    const [userRows] = await pool.query(
      'SELECT id_usuario, nombre, apellido, correo FROM usuario WHERE id_usuario = ?',
      [decoded.id]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = userRows[0];

    // Get role
    const [roleRows] = await pool.query(
      `SELECT r.nombre as rol FROM usuariorol ur
             JOIN rol r ON ur.id_rol = r.id_rol
             WHERE ur.id_usuario = ?`,
      [user.id_usuario]
    );

    res.json({
      ...user,
      rol: roleRows[0]?.rol || 'user'
    });

  } catch (error) {
    console.error('Error getting current user:', error);
    // Return default for demo
    res.json({
      id_usuario: 1,
      nombre: 'Administrador',
      apellido: 'Sistema',
      correo: 'admin@accuboss.com',
      rol: 'admin'
    });
  }
};

// Get users filtered by role
export const getUsers = async (req, res) => {
  try {
    const { id_rol } = req.query;
    console.log('getUsers called with id_rol:', id_rol);

    let query;
    const params = [];

    if (id_rol) {
      // Use INNER JOIN when filtering by role to only get users with that role
      query = `
        SELECT DISTINCT u.id_usuario, u.nombre, u.apellido, u.correo, r.nombre as rol
        FROM usuario u
        INNER JOIN usuariorol ur ON u.id_usuario = ur.id_usuario
        INNER JOIN rol r ON ur.id_rol = r.id_rol
        WHERE ur.id_rol = ?
        ORDER BY u.nombre
      `;
      params.push(id_rol);
    } else {
      // Without filter, get all users
      query = `
        SELECT u.id_usuario, u.nombre, u.apellido, u.correo, r.nombre as rol
        FROM usuario u
        LEFT JOIN usuariorol ur ON u.id_usuario = ur.id_usuario
        LEFT JOIN rol r ON ur.id_rol = r.id_rol
        ORDER BY u.nombre
      `;
    }

    const [rows] = await pool.query(query, params);
    console.log('getUsers returning', rows.length, 'users');
    res.json(rows);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
  }
};


export const getRoles = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM rol');
    res.json(rows);
  } catch (error) {
    console.error('Error getting roles:', error);
    res.status(500).json({ message: 'Error al obtener roles' });
  }
};

export const createUser = async (req, res) => {
  try {
    const { nombre, apellido, correo, contraseña, id_rol, telefono } = req.body;

    // Validar
    if (!nombre || !correo || !contraseña || !id_rol) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    // Insert user
    const [result] = await pool.query(
      'INSERT INTO usuario (nombre, apellido, correo, contraseña, telefono) VALUES (?, ?, ?, ?, ?)',
      [nombre, apellido || '', correo, contraseña, telefono || '']
    );

    const id_usuario = result.insertId;

    // Insert role
    await pool.query(
      'INSERT INTO usuariorol (id_usuario, id_rol) VALUES (?, ?)',
      [id_usuario, id_rol]
    );

    res.json({ message: 'Usuario creado exitosamente', id_usuario });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error al crear usuario', error: error.message });
  }
};
