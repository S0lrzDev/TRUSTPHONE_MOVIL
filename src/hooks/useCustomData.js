import { getBaseHost } from '../config/api';

// Bloque de Endpoints de la API gestionado dentro del custom hook
export const API_ENDPOINTS = {
  LOGIN_CLIENTES: () => `${getBaseHost()}/api/loginClientes`,
  CLIENTES: () => `${getBaseHost()}/api/clientes`,
  REGISTRO_CLIENTES: () => `${getBaseHost()}/api/registroClientes`,
  VERIFICAR_CODIGO: () => `${getBaseHost()}/api/registroClientes/verifyCodeEmail`,
  CELULARES: () => `${getBaseHost()}/api/celulares`,
  PEDIDOS: () => `${getBaseHost()}/api/pedidos`,
  DIRECCIONES: () => `${getBaseHost()}/api/direcciones`,
  METODOS_PAGO: () => `${getBaseHost()}/api/metodosPago`,
  MARCAS: () => `${getBaseHost()}/api/marcas`,
};

// Variable para persistir el token de verificación en React Native
let savedVerificationToken = '';

const useCustomData = () => {

  // Función para autenticar al cliente: POST con correo y contrasena hacia /api/loginClientes
  const loginClient = async (correo, contrasena) => {
    const apiUrl = API_ENDPOINTS.LOGIN_CLIENTES();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          correo: correo.trim(),
          contrasena: contrasena.trim(),
          email: correo.trim(),
          password: contrasena.trim(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      let data = {};
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text };
        }
      }

      if (response.ok) {
        let user = data.cliente || data.user || data.usuario;
        if (!user || (!user.nombre && !user.correo)) {
          user = {
            ...(typeof data === 'object' ? data : {}),
            correo: correo.trim(),
            email: correo.trim(),
            nombre: correo.split('@')[0] || 'Cliente',
          };
        }

        return {
          success: true,
          user,
          token: data.token,
          message: data.message || 'Sesión iniciada con éxito',
        };
      }

      return {
        success: false,
        error: data.message || data.error || 'Credenciales incorrectas.',
      };
    } catch (err) {
      const isTimeout = err.name === 'AbortError';
      return {
        success: false,
        error: isTimeout
          ? `Tiempo de espera agotado al conectar con el servidor (${apiUrl}). Asegúrate de que el teléfono y la PC estén en la misma red Wi-Fi.`
          : `Error al conectar con ${apiUrl}: ${err.message}`,
      };
    }
  };

  // Función para registrar un nuevo cliente hacia /api/registroClientes
  const registerClient = async (clientPayload) => {
    const apiUrl = API_ENDPOINTS.REGISTRO_CLIENTES();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(apiUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      let data = {};
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text };
        }
      }

      // Guardar el token si viene en la respuesta o extraerlo de la cookie
      if (data.token) {
        savedVerificationToken = data.token;
      } else {
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) {
          const match = setCookie.match(/VerificationToken=([^;,\s]+)/);
          if (match && match[1]) {
            savedVerificationToken = match[1];
          }
        }
      }

      if (response.ok) {
        return {
          success: true,
          requiresVerification: true,
          user: data.cliente || data.user || data.usuario || null,
          message: data.message || 'Código de verificación enviado a tu correo.',
        };
      }

      return {
        success: false,
        error: data.message || data.error || 'No se pudo registrar el cliente.',
      };
    } catch (err) {
      const isTimeout = err.name === 'AbortError';
      return {
        success: false,
        error: isTimeout
          ? `Tiempo de espera agotado al conectar con el servidor (${apiUrl}).`
          : `No se pudo conectar con el servidor (${apiUrl}): ${err.message}`,
      };
    }
  };

  // Función para verificar el código enviado al correo hacia /api/registroClientes/verifyCodeEmail
  const verifyCodeClient = async (verificationCode) => {
    const apiUrl = API_ENDPOINTS.VERIFICAR_CODIGO();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(apiUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verificationCodeRequest: String(verificationCode).trim(),
          token: savedVerificationToken,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      let data = {};
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text };
        }
      }

      if (response.ok) {
        savedVerificationToken = '';
        return {
          success: true,
          message: data.message || 'Cuenta verificada correctamente.',
        };
      }

      return {
        success: false,
        error: data.message || 'Código de verificación inválido o expirado.',
      };
    } catch (err) {
      const isTimeout = err.name === 'AbortError';
      return {
        success: false,
        error: isTimeout
          ? 'Tiempo de espera agotado al verificar código.'
          : `Error al conectar con el servidor: ${err.message}`,
      };
    }
  };

  // Función para crear un nuevo pedido hacia /api/pedidos
  // AVISO LEGAL: NO incluye el CVV bajo ninguna circunstancia
  const createOrder = async (orderPayload) => {
    const apiUrl = API_ENDPOINTS.PEDIDOS();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      let data = {};
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text };
        }
      }

      if (response.ok && data.success) {
        return {
          success: true,
          pedido: data.pedido,
          message: data.message || 'Pedido creado con éxito',
        };
      }

      return {
        success: false,
        error: data.message || data.error || 'No se pudo procesar el pedido.',
      };
    } catch (err) {
      const isTimeout = err.name === 'AbortError';
      return {
        success: false,
        error: isTimeout
          ? `Tiempo de espera agotado al procesar pedido (${apiUrl}).`
          : `Error al procesar el pedido: ${err.message}`,
      };
    }
  };

  // Función para obtener la lista de pedidos desde /api/pedidos
  const getOrders = async (params = {}) => {
    let apiUrl = API_ENDPOINTS.PEDIDOS();
    const queryParams = new URLSearchParams();

    if (params.clienteId) queryParams.append('clienteId', params.clienteId);
    if (params.correo) queryParams.append('correo', params.correo);
    if (params.estado && params.estado !== 'Todos') queryParams.append('estado', params.estado);

    const queryString = queryParams.toString();
    if (queryString) {
      apiUrl = `${apiUrl}?${queryString}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          pedidos: data.pedidos || [],
        };
      }

      return {
        success: false,
        pedidos: [],
        error: `Error al obtener pedidos (${response.status})`,
      };
    } catch (err) {
      return {
        success: false,
        pedidos: [],
        error: err.message,
      };
    }
  };

  // Función para cancelar un pedido hacia /api/pedidos/:id/cancelar
  const cancelOrder = async (orderId) => {
    const apiUrl = `${API_ENDPOINTS.PEDIDOS()}/${orderId}/cancelar`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          pedido: data.pedido,
          message: data.message || 'Pedido cancelado con éxito',
        };
      }

      return {
        success: false,
        error: data.message || 'No se pudo cancelar el pedido',
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
      };
    }
  };

  // Función para obtener direcciones de un cliente: GET /api/direcciones?clienteId=xxx
  const getDirecciones = async (clienteId) => {
    const apiUrl = `${API_ENDPOINTS.DIRECCIONES()}?clienteId=${clienteId}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          direcciones: data.direcciones || [],
        };
      }

      return {
        success: false,
        direcciones: [],
        error: `Error al obtener direcciones (${response.status})`,
      };
    } catch (err) {
      return {
        success: false,
        direcciones: [],
        error: err.message,
      };
    }
  };

  // Función para crear dirección: POST /api/direcciones
  const createDireccion = async (payload) => {
    const apiUrl = API_ENDPOINTS.DIRECCIONES();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          direccion: data.direccion,
          message: data.message || 'Dirección creada con éxito',
        };
      }

      return {
        success: false,
        error: data.message || 'No se pudo guardar la dirección',
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
      };
    }
  };

  // Función para actualizar dirección: PUT /api/direcciones/:id
  const updateDireccion = async (id, payload) => {
    const apiUrl = `${API_ENDPOINTS.DIRECCIONES()}/${id}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          direccion: data.direccion,
          message: data.message || 'Dirección actualizada con éxito',
        };
      }

      return {
        success: false,
        error: data.message || 'No se pudo actualizar la dirección',
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
      };
    }
  };

  // Función para eliminar dirección: DELETE /api/direcciones/:id
  const deleteDireccion = async (id) => {
    const apiUrl = `${API_ENDPOINTS.DIRECCIONES()}/${id}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          message: data.message || 'Dirección eliminada con éxito',
        };
      }

      return {
        success: false,
        error: data.message || 'No se pudo eliminar la dirección',
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
      };
    }
  };

  // Función para obtener métodos de pago de un cliente: GET /api/metodosPago?clienteId=xxx
  const getMetodosPago = async (clienteId) => {
    const apiUrl = `${API_ENDPOINTS.METODOS_PAGO()}?clienteId=${clienteId}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const allCards = data.metodosPago || [];

        // Identificar y limpiar las 2 tarjetas de prueba quemadas (4234 y 3131)
        const burntCards = allCards.filter(
          (m) => m.ultimos4 === '4234' || m.ultimos4 === '3131'
        );

        // Si existen en el backend, borrarlas permanentemente
        if (burntCards.length > 0) {
          burntCards.forEach((bc) => {
            if (bc._id) {
              fetch(`${API_ENDPOINTS.METODOS_PAGO()}/${bc._id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
              }).catch(() => {});
            }
          });
        }

        const validCards = allCards.filter(
          (m) => m.ultimos4 !== '4234' && m.ultimos4 !== '3131'
        );

        return {
          success: true,
          metodosPago: validCards,
        };
      }

      return {
        success: false,
        metodosPago: [],
        error: `Error al obtener métodos de pago (${response.status})`,
      };
    } catch (err) {
      return {
        success: false,
        metodosPago: [],
        error: err.message,
      };
    }
  };

  // Función para crear método de pago: POST /api/metodosPago
  const createMetodoPago = async (payload) => {
    const apiUrl = API_ENDPOINTS.METODOS_PAGO();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          metodoPago: data.metodoPago,
          message: data.message || 'Método de pago guardado con éxito',
        };
      }

      return {
        success: false,
        error: data.message || 'No se pudo guardar el método de pago',
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
      };
    }
  };

  // Función para actualizar método de pago: PUT /api/metodosPago/:id
  const updateMetodoPago = async (id, payload) => {
    const apiUrl = `${API_ENDPOINTS.METODOS_PAGO()}/${id}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          metodoPago: data.metodoPago,
          message: data.message || 'Método de pago actualizado con éxito',
        };
      }

      return {
        success: false,
        error: data.message || 'No se pudo actualizar el método de pago',
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
      };
    }
  };

  // Función para eliminar método de pago: DELETE /api/metodosPago/:id
  const deleteMetodoPago = async (id) => {
    const apiUrl = `${API_ENDPOINTS.METODOS_PAGO()}/${id}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          message: data.message || 'Método de pago eliminado con éxito',
        };
      }

      return {
        success: false,
        error: data.message || 'No se pudo eliminar el método de pago',
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
      };
    }
  };

  // Función para obtener datos actualizados del cliente: GET /api/clientes/:id
  const getCliente = async (clienteId) => {
    if (!clienteId) return { success: false, error: 'ID de cliente requerido' };
    const apiUrl = `${API_ENDPOINTS.CLIENTES()}/${clienteId}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (response.ok && data) {
        return {
          success: true,
          cliente: data,
        };
      }

      return {
        success: false,
        error: data.message || 'Error al obtener datos del cliente',
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
      };
    }
  };

  // Función para actualizar datos del cliente: PUT /api/clientes/:id
  const updateCliente = async (clienteId, clientData) => {
    if (!clienteId) return { success: false, error: 'ID de cliente requerido' };
    const apiUrl = `${API_ENDPOINTS.CLIENTES()}/${clienteId}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          cliente: data.cliente || data,
          message: data.message || 'Información actualizada correctamente',
        };
      }

      return {
        success: false,
        error: data.message || 'Error al actualizar información',
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
      };
    }
  };

  return {
    loginClient,
    registerClient,
    verifyCodeClient,
    createOrder,
    getOrders,
    cancelOrder,
    getDirecciones,
    createDireccion,
    updateDireccion,
    deleteDireccion,
    getMetodosPago,
    createMetodoPago,
    updateMetodoPago,
    deleteMetodoPago,
    getCliente,
    updateCliente,
  };
};

export default useCustomData;
