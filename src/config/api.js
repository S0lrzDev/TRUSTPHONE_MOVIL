// URL del backend desplegado en Render
export const BACKEND_URL = 'https://trustphone-backend.onrender.com';

// Render (plan gratuito) apaga el servidor cuando no se usa y tarda ~50 s en
// despertar, por eso el tiempo de espera de las peticiones es amplio.
export const REQUEST_TIMEOUT = 60000;

// Obtiene la URL base del backend
export const getBaseHost = () => BACKEND_URL;
