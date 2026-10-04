import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { API_ENDPOINTS } from './useCustomData';
import { REQUEST_TIMEOUT } from '../config/api';

export const useOrders = (currentUser) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);

  // Ref para acceder al currentUser actualizado sin que sea dependencia del useCallback
  const currentUserRef = useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Función estable que no cambia de referencia — no causa re-renders infinitos
  const fetchOrders = useCallback(async () => {
    const user = currentUserRef.current;

    if (!user?._id && !user?.correo && !user?.email) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setLoading(true);

      let apiUrl = API_ENDPOINTS.PEDIDOS();
      const queryParams = new URLSearchParams();
      if (user._id) queryParams.append('clienteId', user._id);
      if (user.correo || user.email) queryParams.append('correo', user.correo || user.email);
      const queryString = queryParams.toString();
      if (queryString) apiUrl = `${apiUrl}?${queryString}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setOrders(data.pedidos || []);
      } else {
        console.warn('Error al obtener pedidos:', response.status);
        setOrders([]);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error en fetchOrders:', error);
      }
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // ← Sin dependencias: la función nunca cambia de referencia

  // Se ejecuta UNA sola vez al montar, y cuando el usuario cambia de null a autenticado
  const userIdRef = useRef(null);
  useEffect(() => {
    const newId = currentUser?._id || currentUser?.correo || currentUser?.email || null;
    if (newId !== userIdRef.current) {
      userIdRef.current = newId;
      fetchOrders();
    }
  }, [currentUser, fetchOrders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, [fetchOrders]);

  // Cancelar pedido directamente
  const handleCancelOrder = (order) => {
    Alert.alert(
      'Cancelar Pedido',
      `¿Estás seguro de que deseas cancelar la orden #${order.numeroOrden}?`,
      [
        { text: 'No, mantener', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              const orderId = order._id || order.id;
              const apiUrl = `${API_ENDPOINTS.PEDIDOS()}/${orderId}/cancelar`;

              const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
              });

              const data = await response.json();

              if (response.ok && data.success) {
                Alert.alert('Cancelado', 'El pedido ha sido cancelado exitosamente.');
                fetchOrders();
              } else {
                Alert.alert('Aviso', data.message || 'No se pudo cancelar el pedido.');
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo conectar con el servidor.');
            }
          },
        },
      ]
    );
  };

  // Rastrear pedido
  const handleTrackOrder = (order) => {
    Alert.alert(
      'Rastreo de Pedido',
      `Orden #${order.numeroOrden}\nEstado: ${order.estado}\nDestino: ${order.direccionEntrega?.direccion || 'San Salvador'}\nEntrega estimada: ${order.fechaEstimada || '24 a 48 hrs hábiles'}`,
      [{ text: 'Cerrar' }]
    );
  };

  // Ver factura electrónica
  const handleViewInvoice = (order) => {
    const total = Number(order.totales?.total || 0).toFixed(2);
    Alert.alert(
      'Factura Electrónica',
      `Factura SV-${order.numeroOrden}\nCliente: ${order.clienteNombre || 'Cliente'}\nTotal: $${total} USD\nMétodo: ${order.metodoPago?.tipo || 'Tarjeta'} •••• ${order.metodoPago?.ultimos4 || '8824'}\nID Transacción: ${order.metodoPago?.transaccionId || 'TX-0000'}`,
      [{ text: 'Entendido' }]
    );
  };

  // Filtrar pedidos por pestaña activa y término de búsqueda
  const filteredOrders = orders.filter((order) => {
    const matchesTab = activeTab === 'Todos' || order.estado?.toLowerCase() === activeTab.toLowerCase();
    const matchesSearch = !searchQuery.trim() ||
      order.numeroOrden?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.articulos?.some(a => a.nombre?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  return {
    orders,
    filteredOrders,
    loading,
    refreshing,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    searchVisible,
    setSearchVisible,
    fetchOrders,
    onRefresh,
    handleCancelOrder,
    handleTrackOrder,
    handleViewInvoice,
  };
};

export default useOrders;
