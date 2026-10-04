import { Alert } from 'react-native';

// Alertas reutilizables en toda la app

// Sección o función que se agregará en una próxima versión
export const showComingSoon = (section = 'Esta sección') => {
  Alert.alert(
    'Próximamente',
    `${section} estará disponible en una próxima actualización de TrustPhone.`,
    [{ text: 'Entendido' }]
  );
};

// Producto agregado al carrito, con acceso directo al carrito
export const showAddedToCart = (productName, onViewCart) => {
  Alert.alert(
    '¡Agregado al carrito!',
    `${productName} se agregó a tu carrito de compras.`,
    [
      { text: 'Seguir comprando', style: 'cancel' },
      { text: 'Ver carrito', onPress: onViewCart },
    ]
  );
};

// Confirmación genérica antes de una acción
export const confirmAction = (title, message, confirmText, onConfirm, destructive = true) => {
  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel' },
    { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
};
