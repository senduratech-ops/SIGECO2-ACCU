import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tipos de archivo permitidos
const ALLOWED_TYPES = {
    // Documentos
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'text/plain': 'txt',
    'text/csv': 'csv',
    // Imágenes
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    // Comprimidos
    'application/zip': 'zip',
    'application/x-rar-compressed': 'rar',
    'application/x-7z-compressed': '7z',
    // CAD/Planos
    'application/acad': 'dwg',
    'application/x-autocad': 'dwg',
    'image/vnd.dwg': 'dwg',
    'application/dxf': 'dxf'
};

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Ruta relativa al directorio raíz del proyecto
        const uploadPath = path.join(__dirname, '../../uploads');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generar nombre único: timestamp-random-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext)
            .replace(/[^a-zA-Z0-9]/g, '_') // Limpiar caracteres especiales
            .substring(0, 50); // Limitar longitud
        cb(null, `${uniqueSuffix}-${baseName}${ext}`);
    }
});

// Filtro de archivos
const fileFilter = (req, file, cb) => {
    // Verificar si el tipo MIME está permitido
    if (ALLOWED_TYPES[file.mimetype]) {
        cb(null, true);
    } else {
        cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Tipos permitidos: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, JPG, PNG, GIF, WEBP, SVG, ZIP, RAR, 7Z, DWG, DXF`), false);
    }
};

// Configuración de multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB máximo
        files: 5 // Máximo 5 archivos por petición
    }
});

// Middleware para manejar errores de multer
export const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                message: 'El archivo es demasiado grande. Tamaño máximo: 50MB' 
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ 
                message: 'Demasiados archivos. Máximo: 5 archivos' 
            });
        }
        return res.status(400).json({ message: err.message });
    } else if (err) {
        return res.status(400).json({ message: err.message });
    }
    next();
};

// Exportar el middleware de upload
export const uploadSingle = upload.single('archivo');
export const uploadMultiple = upload.array('archivos', 5);
export default upload;
