import { useState } from 'react';
import { Alert } from 'react-native';
import useCustomData from './useCustomData';

export const useCheckout = () => {
  const { createOrder } = useCustomData();

  const [selectedMethod, setSelectedMethod] = useState('Tarjeta de Débito');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [showCvv, setShowCvv] = useState(false);
  const [loading, setLoading] = useState(false);

  // Formatear número de tarjeta con espacios cada 4 dígitos
  const handleCardNumberChange = (text) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 16);
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    setCardNumber(formatted);
  };

  // Formatear fecha de vencimiento MM/AA
  const handleExpiryChange = (text) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) {
      setExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`);
    } else {
      setExpiry(cleaned);
    }
  };

  // Formatear CVV únicamente a números
  const handleCvvChange = (text) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    setCvv(cleaned);
  };

  const validatePayment = () => {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    const isSavedCard = cardNumber.includes('•') && cleanNumber.length === 4;

    if (!isSavedCard && cleanNumber.length < 15) {
      Alert.alert('Tarjeta inválida', 'Por favor ingresa un número de tarjeta válido (mínimo 15 dígitos).');
      return false;
    }

    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      Alert.alert('Fecha inválida', 'La fecha de vencimiento debe tener el formato MM/AA (ej. 08/28).');
      return false;
    }

    if (cvv.length < 3) {
      Alert.alert('CVV / CVC requerido', 'Ingresa el código de seguridad de 3 o 4 dígitos.');
      return false;
    }

    return true;
  };

  const handleConfirmOrder = async (
    cart,
    currentUser,
    onSuccess,
    selectedAddress = null,
    selectedCard = null,
    cardCvv = null
  ) => {
    const effectiveCvv = (cardCvv || cvv || '').trim();

    if (selectedCard) {
      if (!effectiveCvv || effectiveCvv.length < 3) {
        Alert.alert('CVV / CVC requerido', 'Por favor ingresa el código de seguridad (CVV) de 3 dígitos para autorizar el pago.');
        return;
      }
    } else {
      if (!validatePayment()) return;
    }

    if (!cart || cart.length === 0) {
      Alert.alert('Carrito vacío', 'No hay artículos en tu carrito para procesar.');
      return;
    }

    if (!selectedAddress) {
      Alert.alert('Dirección requerida', 'Por favor selecciona o agrega una dirección de entrega antes de finalizar la compra.');
      return;
    }

    setLoading(true);

    try {
      const subtotal = cart.reduce(
        (sum, item) => sum + (item.precio || item.price || 0) * (item.quantity || 1),
        0
      );

      const cleanNumber = cardNumber.replace(/\D/g, '');
      const ultimos4 = selectedCard ? selectedCard.ultimos4 : cleanNumber.slice(-4);
      const marcaTarjeta = selectedCard ? (selectedCard.marca || 'VISA') : (cleanNumber.startsWith('4') ? 'VISA' : 'MasterCard');
      const tipoPago = selectedCard ? (selectedCard.tipo || 'Tarjeta de Débito') : selectedMethod;
      const fechaExp = selectedCard ? (selectedCard.fechaExpiracion || expiry) : expiry;
      const bancoRed = selectedCard?.banco || (tipoPago === 'Tarjeta de Débito'
        ? 'Banco Agrícola, BAC Credomatic, Banco Cuscatlán y redes locales'
        : 'BAC Credomatic, Banco Agrícola, Cuscatlán, Davivienda y Promerica');

      // Construcción de la dirección completa
      const direccionCompleta = [
        selectedAddress.direccion,
        selectedAddress.colonia,
        selectedAddress.ciudad,
        selectedAddress.referencia ? `(Ref: ${selectedAddress.referencia})` : '',
      ].filter(Boolean).join(', ');

      // ─── AVISO LEGAL Y DE SEGURIDAD (PCI-DSS) ─────────────────────────────────
      // El código CVV / CVC NUNCA se incluye en el payload enviado al backend ni se guarda en BD.
      const orderPayload = {
        cliente: currentUser?._id || currentUser?.id || null,
        clienteNombre: selectedAddress.nombreDestinatario
          || (currentUser?.nombre
            ? `${currentUser.nombre} ${currentUser.Apellido || currentUser.apellido || ''}`.trim()
            : (currentUser?.name || 'Cliente Trustphone')),
        clienteCorreo: currentUser?.correo || currentUser?.email || 'cliente@trustphone.com',
        clienteTelefono: selectedAddress.telefono || currentUser?.telefono || '7890-1234',
        direccionEntrega: {
          titulo: selectedAddress.titulo || 'Dirección de Entrega',
          direccion: direccionCompleta || 'San Salvador, El Salvador',
          departamento: selectedAddress.departamento || 'San Salvador',
          tipoEnvio: 'Envío Express El Salvador',
        },
        articulos: cart.map((item) => ({
          idCelular: item.id || item._id || item.idCelular || null,
          nombre: item.nombre || item.name || item.modelo || 'Celular Trustphone',
          modelo: item.modelo || item.nombre || '',
          precio: Number(item.precio || item.price || 0),
          cantidad: Number(item.quantity || 1),
          imagen: item.imagen || item.foto || item.imageUrl || '',
          color: item.color || 'Estándar',
          condicion: item.condicion || item.estado || 'Excelente',
          garantia: 'Garantía 12 meses',
        })),
        metodoPago: {
          tipo: tipoPago,
          bancoRed,
          ultimos4,
          marcaTarjeta,
          fechaExpiracion: fechaExp,
          // NUNCA CVV
        },
        totales: {
          subtotal: Number(subtotal),
          costoEnvio: 0,
          iva: Math.round(subtotal * 0.13 * 100) / 100,
          total: Number(subtotal),
        },
      };

      const result = await createOrder(orderPayload);
      setLoading(false);

      if (result.success && result.pedido) {
        if (onSuccess) {
          onSuccess(result.pedido);
        }
      } else {
        Alert.alert('Error en el pago', result.error || 'No se pudo registrar la compra.');
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Ocurrió un error inesperado al procesar tu compra.');
    }
  };

  return {
    selectedMethod,
    setSelectedMethod,
    cardNumber,
    expiry,
    cvv,
    showCvv,
    setShowCvv,
    loading,
    handleCardNumberChange,
    handleExpiryChange,
    handleCvvChange,
    handleConfirmOrder,
  };
};

export default useCheckout;
