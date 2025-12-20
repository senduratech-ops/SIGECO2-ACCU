// Configuración dinámica de API - detecta automáticamente el servidor
// Funciona tanto en desarrollo local como en producción con reverse proxy

window.API_HOST = `${window.location.protocol}//${window.location.host}`;
window.API_BASE = `${window.API_HOST}/api`;
window.API_ROOT = window.API_HOST;

// Para compatibilidad con código existente que usa constantes sin window.
const API_BASE = window.API_BASE;
const API_ROOT = window.API_ROOT;
const API_HOST = window.API_HOST;
