import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, borderRadius, spacing, shadows } from '../styles/theme';
import { addressStyles as addrStyles } from '../styles/addressStyles';
import StepIndicator from '../components/StepIndicator';
import useCheckout from '../hooks/useCheckout';
import useCustomData from '../hooks/useCustomData';

export const CheckoutPaymentScreen = ({
  cart,
  currentUser,
  onBack,
  onSuccess,
}) => {
  const {
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
  } = useCheckout();

  const { getDirecciones, createDireccion, getMetodosPago, createMetodoPago, deleteMetodoPago } = useCustomData();
  const [direcciones, setDirecciones] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [isChangingAddress, setIsChangingAddress] = useState(false);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);

  // Estados para Tarjetas / Métodos de pago (mismo patrón que direcciones)
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [loadingCards, setLoadingCards] = useState(true);
  const [isChangingCard, setIsChangingCard] = useState(false);
  const [isAddingNewCard, setIsAddingNewCard] = useState(false);
  const [cardCvv, setCardCvv] = useState('');
  const [showCardCvv, setShowCardCvv] = useState(false);

  // Formulario rápido para nueva dirección desde checkout
  const [newTitulo, setNewTitulo] = useState('Casa');
  const [newNombre, setNewNombre] = useState(currentUser?.nombre || currentUser?.name || '');
  const [newTelefono, setNewTelefono] = useState(currentUser?.telefono || '');
  const [newDireccion, setNewDireccion] = useState('');
  const [newColonia, setNewColonia] = useState('');
  const [newCiudad, setNewCiudad] = useState('San Salvador');
  const [newDepartamento, setNewDepartamento] = useState('San Salvador');
  const [savingNewAddress, setSavingNewAddress] = useState(false);

  // Formulario rápido para nueva tarjeta desde checkout
  const [newCardTipo, setNewCardTipo] = useState('Tarjeta de Débito');
  const [newCardTitular, setNewCardTitular] = useState(
    currentUser?.nombre
      ? `${currentUser.nombre} ${currentUser.Apellido || currentUser.apellido || ''}`.trim()
      : (currentUser?.name || '')
  );
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardExpiry, setNewCardExpiry] = useState('');
  const [newCardCvv, setNewCardCvv] = useState('');
  const [newCardShowCvv, setNewCardShowCvv] = useState(false);
  const [newCardBanco, setNewCardBanco] = useState('Banco Agrícola');
  const [savingNewCard, setSavingNewCard] = useState(false);

  const clienteId = currentUser?._id || currentUser?.id;

  useEffect(() => {
    const fetchSavedData = async () => {
      if (!clienteId) {
        setLoadingAddresses(false);
        setLoadingCards(false);
        return;
      }
      setLoadingAddresses(true);
      setLoadingCards(true);

      try {
        const res = await getDirecciones(clienteId);
        if (res.success && res.direcciones) {
          setDirecciones(res.direcciones);
          const principal = res.direcciones.find(d => d.esPrincipal) || res.direcciones[0] || null;
          setSelectedAddress(principal);
        }
      } catch (e) {
        console.log('Error al cargar direcciones en checkout:', e);
      } finally {
        setLoadingAddresses(false);
      }

      try {
        const cardsRes = await getMetodosPago(clienteId);
        if (cardsRes.success && cardsRes.metodosPago) {
          setCards(cardsRes.metodosPago);
          const defaultCard = cardsRes.metodosPago.find(c => c.esPredeterminado) || cardsRes.metodosPago[0] || null;
          setSelectedCard(defaultCard);
        }
      } catch (e) {
        console.log('Error al cargar tarjetas en checkout:', e);
      } finally {
        setLoadingCards(false);
      }
    };

    fetchSavedData();
  }, [clienteId]);

  const handleNewCardNumberChange = (text) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 16);
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    setNewCardNumber(formatted);
  };

  const handleNewCardExpiryChange = (text) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) {
      setNewCardExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`);
    } else {
      setNewCardExpiry(cleaned);
    }
  };

  const handleNewCardCvvChange = (text) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    setNewCardCvv(cleaned);
  };

  const handleSaveQuickCard = async () => {
    if (!clienteId) {
      Alert.alert('Sesión requerida', 'Debes iniciar sesión para registrar una tarjeta.');
      return;
    }
    if (!newCardTitular.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa el nombre del titular.');
      return;
    }
    const cleanNumber = newCardNumber.replace(/\D/g, '');
    if (cleanNumber.length < 15) {
      Alert.alert('Tarjeta inválida', 'Ingresa un número de tarjeta válido (15 o 16 dígitos).');
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(newCardExpiry)) {
      Alert.alert('Fecha inválida', 'La fecha de vencimiento debe tener formato MM/AA (ej. 08/28).');
      return;
    }
    const month = parseInt(newCardExpiry.slice(0, 2), 10);
    if (month < 1 || month > 12) {
      Alert.alert('Mes inválido', 'El mes de vencimiento debe estar entre 01 y 12.');
      return;
    }
    if (newCardCvv.length < 3) {
      Alert.alert('CVV requerido', 'Ingresa el código de seguridad de 3 o 4 dígitos.');
      return;
    }

    const marca = cleanNumber.startsWith('4')
      ? 'VISA'
      : cleanNumber.startsWith('5')
      ? 'MasterCard'
      : cleanNumber.startsWith('3')
      ? 'American Express'
      : 'VISA';

    setSavingNewCard(true);

    const payload = {
      cliente: clienteId,
      tipo: newCardTipo,
      titular: newCardTitular.trim(),
      marca,
      ultimos4: cleanNumber.slice(-4),
      fechaExpiracion: newCardExpiry.trim(),
      banco: newCardBanco || 'Banco Agrícola',
      esPredeterminado: cards.length === 0,
    };

    try {
      const res = await createMetodoPago(payload);
      setSavingNewCard(false);

      if (res.success && res.metodoPago) {
        setCards(prev => [res.metodoPago, ...prev]);
        setSelectedCard(res.metodoPago);
        setCardCvv(newCardCvv);
        setIsAddingNewCard(false);
        setIsChangingCard(false);
        setNewCardNumber('');
        setNewCardExpiry('');
        setNewCardCvv('');
        Alert.alert('Tarjeta guardada', 'Tu tarjeta se guardó correctamente y ha sido seleccionada.');
      } else {
        Alert.alert('Error', res.error || 'No se pudo guardar la tarjeta.');
      }
    } catch (e) {
      setSavingNewCard(false);
      Alert.alert('Error', 'Hubo un problema al guardar la tarjeta.');
    }
  };

  const handleDeleteCard = (id, ultimos4) => {
    Alert.alert(
      'Eliminar método de pago',
      `¿Deseas eliminar la tarjeta terminada en •••• ${ultimos4}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const res = await deleteMetodoPago(id);
            if (res.success) {
              setCards(prev => {
                const filtered = prev.filter(c => c._id !== id);
                if (selectedCard?._id === id) {
                  setSelectedCard(filtered[0] || null);
                }
                return filtered;
              });
            } else {
              Alert.alert('Error', res.error || 'No se pudo eliminar la tarjeta.');
            }
          },
        },
      ]
    );
  };

  const handleSaveQuickAddress = async () => {
    if (!clienteId) {
      Alert.alert('Sesión requerida', 'Debes iniciar sesión para guardar una dirección.');
      return;
    }
    if (!newNombre.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa el nombre de quien recibe.');
      return;
    }
    if (!newTelefono.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa un teléfono de contacto.');
      return;
    }
    if (!newDireccion.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa la dirección de entrega.');
      return;
    }

    setSavingNewAddress(true);
    const payload = {
      cliente: clienteId,
      titulo: newTitulo || 'Casa',
      nombreDestinatario: newNombre.trim(),
      telefono: newTelefono.trim(),
      direccion: newDireccion.trim(),
      colonia: newColonia.trim(),
      ciudad: newCiudad.trim() || 'San Salvador',
      departamento: newDepartamento.trim() || 'San Salvador',
      esPrincipal: direcciones.length === 0,
    };

    const res = await createDireccion(payload);
    setSavingNewAddress(false);

    if (res.success && res.direccion) {
      setDirecciones(prev => [res.direccion, ...prev]);
      setSelectedAddress(res.direccion);
      setIsAddingNewAddress(false);
      setIsChangingAddress(false);
      setNewDireccion('');
      setNewColonia('');
    } else {
      Alert.alert('Error', res.error || 'No se pudo guardar la dirección.');
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.precio || item.price || 0) * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const formattedSubtotal = subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2 });

  // Resumen conciso de nombres de productos (ej. "iPhone 13 + Samsung S22")
  const productNamesSummary = cart.map(i => i.nombre || i.name || i.modelo || 'Celular').slice(0, 2).join(' + ') +
    (cart.length > 2 ? ` (+${cart.length - 2} más)` : '');

  return (
    <View style={styles.container}>
      {/* Header Dark Navy */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleCenter}>
          <Text style={styles.headerTitle}>Finalizar Pago</Text>
          <View style={styles.securityTagRow}>
            <View style={styles.cyanDot} />
            <Text style={styles.securityTagText}>CHECKOUT SEGURO</Text>
          </View>
        </View>
        <View style={styles.lockIconContainer}>
          <Ionicons name="lock-closed" size={16} color="#38BDF8" />
        </View>
      </View>

      {/* Indicador de los 3 pasos */}
      <StepIndicator currentStep={2} theme="dark" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          {/* Card: Resumen de compra desplegable / conciso */}
          <View style={styles.purchaseSummaryCard}>
            <View style={styles.summaryTopRow}>
              <View style={styles.summaryTitleRow}>
                <Ionicons name="bag-handle-outline" size={18} color={colors.primary} />
                <Text style={styles.summaryTitle}>
                  Resumen de compra ({totalItems})
                </Text>
              </View>
              <Text style={styles.summaryTotalTop}>${formattedSubtotal}</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryDetailRow}>
              {/* Miniatura del primer producto */}
              <View style={styles.miniImageContainer}>
                {cart[0]?.imagen || cart[0]?.imageUrl ? (
                  <Image
                    source={{ uri: cart[0].imagen || cart[0].imageUrl }}
                    style={styles.miniImage}
                  />
                ) : (
                  <Ionicons name="phone-portrait-outline" size={24} color="#94A3B8" />
                )}
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.productsSummaryText} numberOfLines={1}>
                  {productNamesSummary}
                </Text>
                <Text style={styles.shippingSummaryText}>
                  Envío express El Salvador (San Salvador, La Libertad y cobertura nacional)
                </Text>
              </View>

              <View style={styles.gratisBadge}>
                <Text style={styles.gratisBadgeText}>GRATIS</Text>
              </View>
            </View>

            <View style={styles.subtotalAccumulatedRow}>
              <Text style={styles.subtotalAccumulatedLabel}>Subtotal acumulado</Text>
              <Text style={styles.subtotalAccumulatedValue}>${formattedSubtotal}</Text>
            </View>
          </View>

          {/* ── SECCIÓN: Dirección de Entrega ── */}
          <View style={addrStyles.checkoutAddressCard}>
            <View style={addrStyles.checkoutAddressHeader}>
              <View style={addrStyles.checkoutAddressTitleRow}>
                <Ionicons name="location-sharp" size={18} color={colors.primary} />
                <Text style={addrStyles.checkoutAddressTitle}>Dirección de entrega</Text>
              </View>
              {direcciones.length > 0 && !isAddingNewAddress && (
                <TouchableOpacity
                  style={addrStyles.checkoutChangeBtn}
                  onPress={() => setIsChangingAddress(!isChangingAddress)}
                  activeOpacity={0.7}
                >
                  <Text style={addrStyles.checkoutChangeBtnText}>
                    {isChangingAddress ? 'Cerrar' : 'Cambiar'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {loadingAddresses ? (
              <View style={{ paddingVertical: 14, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                  Cargando direcciones...
                </Text>
              </View>
            ) : isAddingNewAddress ? (
              /* Mini Formulario de Dirección */
              <View style={styles.quickFormCard}>
                <Text style={styles.quickFormTitle}>Nueva dirección de entrega</Text>

                {/* Chips de tipo */}
                <View style={[styles.labelRowQuick, { marginBottom: 10 }]}>
                  {['Casa', 'Oficina', 'Otro'].map((l) => (
                    <TouchableOpacity
                      key={l}
                      style={[styles.quickChip, newTitulo === l && styles.quickChipActive]}
                      onPress={() => setNewTitulo(l)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.quickChipText, newTitulo === l && styles.quickChipTextActive]}>
                        {l}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.quickInputGroup}>
                  <Text style={styles.quickInputLabel}>Nombre de quien recibe *</Text>
                  <TextInput
                    style={styles.quickInput}
                    value={newNombre}
                    onChangeText={setNewNombre}
                    placeholder="Ej: Roberto Solórzano"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={styles.quickInputGroup}>
                  <Text style={styles.quickInputLabel}>Teléfono de contacto *</Text>
                  <TextInput
                    style={styles.quickInput}
                    value={newTelefono}
                    onChangeText={setNewTelefono}
                    placeholder="Ej: 7890-1234"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.quickInputGroup}>
                  <Text style={styles.quickInputLabel}>Dirección exacta (calle, número) *</Text>
                  <TextInput
                    style={styles.quickInput}
                    value={newDireccion}
                    onChangeText={setNewDireccion}
                    placeholder="Ej: Av. Masferrer Norte #340"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={styles.quickInputGroup}>
                  <Text style={styles.quickInputLabel}>Colonia o Residencial</Text>
                  <TextInput
                    style={styles.quickInput}
                    value={newColonia}
                    onChangeText={setNewColonia}
                    placeholder="Ej: Col. Escalón"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={[styles.quickInputGroup, { flex: 1 }]}>
                    <Text style={styles.quickInputLabel}>Ciudad *</Text>
                    <TextInput
                      style={styles.quickInput}
                      value={newCiudad}
                      onChangeText={setNewCiudad}
                      placeholder="San Salvador"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  <View style={[styles.quickInputGroup, { flex: 1 }]}>
                    <Text style={styles.quickInputLabel}>Departamento *</Text>
                    <TextInput
                      style={styles.quickInput}
                      value={newDepartamento}
                      onChangeText={setNewDepartamento}
                      placeholder="San Salvador"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

                <View style={styles.quickBtnRow}>
                  <TouchableOpacity
                    style={styles.quickCancelBtn}
                    onPress={() => setIsAddingNewAddress(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quickCancelBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickSaveBtn}
                    onPress={handleSaveQuickAddress}
                    disabled={savingNewAddress}
                    activeOpacity={0.85}
                  >
                    {savingNewAddress ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.quickSaveBtnText}>Guardar y Usar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : isChangingAddress ? (
              /* Selector de direcciones guardadas */
              <View style={addrStyles.checkoutAddressSelector}>
                {direcciones.map((dir) => {
                  const isSelected = selectedAddress?._id === dir._id;
                  return (
                    <TouchableOpacity
                      key={dir._id}
                      style={[
                        addrStyles.checkoutAddressOption,
                        isSelected && addrStyles.checkoutAddressOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedAddress(dir);
                        setIsChangingAddress(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={isSelected ? colors.primary : '#94A3B8'}
                      />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>
                            {dir.titulo || 'Dirección'}
                          </Text>
                          {dir.esPrincipal && (
                            <View style={addrStyles.principalBadge}>
                              <Text style={addrStyles.principalBadgeText}>Principal</Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontSize: 12, color: colors.textSecondary }} numberOfLines={1}>
                          {dir.direccion}{dir.colonia ? `, ${dir.colonia}` : ''} ({dir.ciudad})
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={addrStyles.checkoutAddNewBtn}
                  onPress={() => setIsAddingNewAddress(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={16} color={colors.primary} />
                  <Text style={addrStyles.checkoutAddNewBtnText}>Agregar otra dirección</Text>
                </TouchableOpacity>
              </View>
            ) : selectedAddress ? (
              /* Dirección seleccionada actualmente */
              <View style={addrStyles.checkoutAddressBody}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Ionicons name="home-outline" size={14} color={colors.primary} />
                  <Text style={addrStyles.checkoutAddressName}>
                    {selectedAddress.nombreDestinatario} ({selectedAddress.titulo || 'Entrega'})
                  </Text>
                  {selectedAddress.esPrincipal && (
                    <View style={addrStyles.principalBadge}>
                      <Text style={addrStyles.principalBadgeText}>Principal</Text>
                    </View>
                  )}
                </View>
                <Text style={addrStyles.checkoutAddressText}>
                  {selectedAddress.direccion}{selectedAddress.colonia ? `, ${selectedAddress.colonia}` : ''}
                </Text>
                <Text style={addrStyles.checkoutAddressText}>
                  {selectedAddress.ciudad}, {selectedAddress.departamento}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <Ionicons name="call-outline" size={12} color={colors.textSecondary} />
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                    {selectedAddress.telefono}
                  </Text>
                </View>
              </View>
            ) : (
              /* Sin direcciones registradas */
              <View style={addrStyles.noAddressContainer}>
                <Ionicons name="location-outline" size={32} color="#94A3B8" />
                <Text style={addrStyles.noAddressText}>
                  No tienes direcciones guardadas para el envío
                </Text>
                <TouchableOpacity
                  style={[addrStyles.checkoutChangeBtn, { paddingHorizontal: 16, paddingVertical: 8 }]}
                  onPress={() => setIsAddingNewAddress(true)}
                  activeOpacity={0.8}
                >
                  <Text style={addrStyles.checkoutChangeBtnText}>+ Agregar dirección de entrega</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ── SECCIÓN: Método de Pago (Mismo patrón que Dirección de Entrega) ── */}
          <View style={addrStyles.checkoutAddressCard}>
            <View style={addrStyles.checkoutAddressHeader}>
              <View style={addrStyles.checkoutAddressTitleRow}>
                <Ionicons name="card" size={18} color={colors.primary} />
                <Text style={addrStyles.checkoutAddressTitle}>Método de pago</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={styles.tlsBadge}>
                  <Ionicons name="shield-checkmark" size={12} color="#0D9488" />
                  <Text style={styles.tlsText}>TLS 256-bit</Text>
                </View>
                {cards.length > 0 && !isAddingNewCard && (
                  <TouchableOpacity
                    style={addrStyles.checkoutChangeBtn}
                    onPress={() => setIsChangingCard(!isChangingCard)}
                    activeOpacity={0.7}
                  >
                    <Text style={addrStyles.checkoutChangeBtnText}>
                      {isChangingCard ? 'Cerrar' : 'Cambiar'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {loadingCards ? (
              <View style={{ paddingVertical: 14, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                  Cargando métodos de pago...
                </Text>
              </View>
            ) : isAddingNewCard ? (
              /* Mini Formulario de Tarjeta */
              <View style={styles.quickFormCard}>
                <Text style={styles.quickFormTitle}>Nueva tarjeta de crédito o débito</Text>

                {/* Chips de tipo */}
                <View style={[styles.labelRowQuick, { marginBottom: 10 }]}>
                  {['Tarjeta de Débito', 'Tarjeta de Crédito'].map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.quickChip, newCardTipo === t && styles.quickChipActive]}
                      onPress={() => setNewCardTipo(t)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.quickChipText, newCardTipo === t && styles.quickChipTextActive]}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.quickInputGroup}>
                  <Text style={styles.quickInputLabel}>Nombre del titular (como aparece en la tarjeta) *</Text>
                  <TextInput
                    style={styles.quickInput}
                    value={newCardTitular}
                    onChangeText={setNewCardTitular}
                    placeholder="Ej: ROBERTO SOLORZANO"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="characters"
                  />
                </View>

                <View style={styles.quickInputGroup}>
                  <Text style={styles.quickInputLabel}>Número de tarjeta *</Text>
                  <View style={styles.cardInputWrapper}>
                    <TextInput
                      style={[styles.quickInput, { borderWidth: 0, paddingHorizontal: 0, flex: 1 }]}
                      value={newCardNumber}
                      onChangeText={handleNewCardNumberChange}
                      placeholder="4000 1234 5678 9010"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      maxLength={19}
                    />
                    <Ionicons
                      name="card-outline"
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={[styles.quickInputGroup, { flex: 1 }]}>
                    <Text style={styles.quickInputLabel}>Vencimiento (MM/AA) *</Text>
                    <TextInput
                      style={styles.quickInput}
                      value={newCardExpiry}
                      onChangeText={handleNewCardExpiryChange}
                      placeholder="08/28"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      maxLength={5}
                    />
                  </View>
                  <View style={[styles.quickInputGroup, { flex: 1 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.quickInputLabel}>CVV / CVC *</Text>
                      <TouchableOpacity onPress={() => setNewCardShowCvv(!newCardShowCvv)}>
                        <Ionicons
                          name={newCardShowCvv ? "eye-off-outline" : "eye-outline"}
                          size={13}
                          color="#64748B"
                        />
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={styles.quickInput}
                      value={newCardCvv}
                      onChangeText={handleNewCardCvvChange}
                      placeholder="123"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      secureTextEntry={!newCardShowCvv}
                      maxLength={4}
                    />
                  </View>
                </View>

                <View style={styles.quickInputGroup}>
                  <Text style={styles.quickInputLabel}>Banco emisor (opcional)</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {['Banco Agrícola', 'BAC Credomatic', 'Banco Cuscatlán', 'Davivienda'].map((b) => (
                      <TouchableOpacity
                        key={b}
                        style={[
                          styles.quickChip,
                          { paddingHorizontal: 8, paddingVertical: 4 },
                          newCardBanco === b && styles.quickChipActive,
                        ]}
                        onPress={() => setNewCardBanco(b)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.quickChipText, { fontSize: 10 }, newCardBanco === b && styles.quickChipTextActive]}>
                          {b}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.securityNoticeRow}>
                  <Ionicons name="lock-closed" size={13} color="#0D9488" />
                  <Text style={styles.securityNoticeText}>
                    Transacción cifrada en USD con tokenización 3DS segura
                  </Text>
                </View>

                <View style={styles.quickBtnRow}>
                  <TouchableOpacity
                    style={styles.quickCancelBtn}
                    onPress={() => setIsAddingNewCard(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quickCancelBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickSaveBtn}
                    onPress={handleSaveQuickCard}
                    disabled={savingNewCard}
                    activeOpacity={0.85}
                  >
                    {savingNewCard ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.quickSaveBtnText}>Guardar y Usar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : isChangingCard ? (
              /* Selector de tarjetas guardadas */
              <View style={addrStyles.checkoutAddressSelector}>
                {cards.map((card) => {
                  const isSelected = selectedCard?._id === card._id;
                  return (
                    <TouchableOpacity
                      key={card._id}
                      style={[
                        addrStyles.checkoutAddressOption,
                        isSelected && addrStyles.checkoutAddressOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedCard(card);
                        setIsChangingCard(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={isSelected ? colors.primary : '#94A3B8'}
                      />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <View style={{
                            backgroundColor: card.marca === 'American Express' ? '#E0F2FE' : '#EEF2FF',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                          }}>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: colors.primary }}>
                              {card.marca || 'VISA'}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>
                            •••• {card.ultimos4}
                          </Text>
                          {card.esPredeterminado && (
                            <View style={addrStyles.principalBadge}>
                              <Text style={addrStyles.principalBadgeText}>Principal</Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                          {card.titular || 'Titular'} • Vence {card.fechaExpiracion} {card.banco ? `• ${card.banco}` : ''}
                        </Text>
                      </View>

                      {/* Botón para eliminar tarjeta */}
                      <TouchableOpacity
                        onPress={() => handleDeleteCard(card._id, card.ultimos4)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={{ padding: 4 }}
                      >
                        <Ionicons name="trash-outline" size={17} color="#EF4444" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={addrStyles.checkoutAddNewBtn}
                  onPress={() => setIsAddingNewCard(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={16} color={colors.primary} />
                  <Text style={addrStyles.checkoutAddNewBtnText}>Agregar otra tarjeta</Text>
                </TouchableOpacity>
              </View>
            ) : selectedCard ? (
              /* Tarjeta seleccionada actualmente */
              <View style={addrStyles.checkoutAddressBody}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{
                      backgroundColor: selectedCard.marca === 'American Express' ? '#E0F2FE' : '#EEF2FF',
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 4,
                    }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: colors.primary }}>
                        {selectedCard.marca || 'VISA'}
                      </Text>
                    </View>
                    <Text style={addrStyles.checkoutAddressName}>
                      •••• {selectedCard.ultimos4}
                    </Text>
                    {selectedCard.esPredeterminado && (
                      <View style={addrStyles.principalBadge}>
                        <Text style={addrStyles.principalBadgeText}>Principal</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary }}>
                    {selectedCard.tipo || 'Tarjeta'}
                  </Text>
                </View>

                <Text style={addrStyles.checkoutAddressText}>
                  Titular: {selectedCard.titular || currentUser?.nombre || 'Titular registrado'}
                </Text>
                <Text style={addrStyles.checkoutAddressText}>
                  Vencimiento: {selectedCard.fechaExpiracion} {selectedCard.banco ? `• ${selectedCard.banco}` : ''}
                </Text>

                {/* Input de autorización CVV */}
                <View style={{
                  marginTop: 10,
                  paddingTop: 10,
                  borderTopWidth: 1,
                  borderTopColor: '#E2E8F0',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textPrimary }}>
                      Código de seguridad (CVV) *
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.textSecondary }}>
                      3 o 4 dígitos al reverso
                    </Text>
                  </View>

                  <View style={{ width: 90 }}>
                    <TextInput
                      style={[styles.quickInput, { textAlign: 'center', fontWeight: '700', letterSpacing: 2, height: 38 }]}
                      value={cardCvv}
                      onChangeText={setCardCvv}
                      placeholder="•••"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      secureTextEntry={!showCardCvv}
                      maxLength={4}
                    />
                  </View>

                  <TouchableOpacity
                    onPress={() => setShowCardCvv(!showCardCvv)}
                    style={{ padding: 6, marginLeft: 2 }}
                  >
                    <Ionicons
                      name={showCardCvv ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Sin tarjetas registradas */
              <View style={addrStyles.noAddressContainer}>
                <Ionicons name="card-outline" size={32} color="#94A3B8" />
                <Text style={addrStyles.noAddressText}>
                  No tienes tarjetas guardadas para el pago
                </Text>
                <TouchableOpacity
                  style={[addrStyles.checkoutChangeBtn, { paddingHorizontal: 16, paddingVertical: 8 }]}
                  onPress={() => setIsAddingNewCard(true)}
                  activeOpacity={0.8}
                >
                  <Text style={addrStyles.checkoutChangeBtnText}>+ Agregar tarjeta de débito o crédito</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Barra Inferior Fija de Pago */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomTotalRow}>
          <View>
            <Text style={styles.bottomTotalLabel}>TOTAL A PAGAR</Text>
            <Text style={styles.bottomTotalValue}>${formattedSubtotal} USD</Text>
          </View>
          <View style={styles.expressTagRight}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="car-outline" size={14} color="#0D9488" />
              <Text style={styles.expressTagText}>Envío Express Gratis</Text>
            </View>
            <Text style={styles.taxesIncludedText}>Impuestos incluidos</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.confirmBtn,
            (loading || (!selectedAddress && !loadingAddresses) || (!selectedCard && cards.length > 0)) && styles.confirmBtnDisabled,
          ]}
          onPress={() => {
            if (!selectedAddress) {
              Alert.alert('Dirección requerida', 'Por favor agrega o selecciona una dirección de entrega.');
              return;
            }
            if (!selectedCard && cards.length > 0) {
              Alert.alert('Tarjeta requerida', 'Por favor selecciona una tarjeta de pago.');
              return;
            }
            if (!selectedCard && cards.length === 0) {
              Alert.alert('Tarjeta requerida', 'Por favor agrega una tarjeta de pago para continuar.');
              setIsAddingNewCard(true);
              return;
            }
            handleConfirmOrder(cart, currentUser, onSuccess, selectedAddress, selectedCard, cardCvv);
          }}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.confirmBtnText} numberOfLines={1}>
                Continuar al Resumen
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#0F2544', // Dark Navy Blue
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSize.md + 1,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  securityTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  cyanDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
  },
  securityTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#38BDF8',
    letterSpacing: 0.8,
  },
  lockIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 24,
  },
  purchaseSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: 14,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.card,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryTitle: {
    fontSize: fontSize.sm + 1,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  summaryTotalTop: {
    fontSize: fontSize.sm + 1,
    fontWeight: '800',
    color: colors.primary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  summaryDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniImageContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  miniImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  productsSummaryText: {
    fontSize: fontSize.xs + 1,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  shippingSummaryText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  gratisBadge: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginLeft: 6,
  },
  gratisBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
  },
  subtotalAccumulatedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  subtotalAccumulatedLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  subtotalAccumulatedValue: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  paymentSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentSectionTitle: {
    fontSize: fontSize.sm + 1,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tlsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tlsText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  methodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...shadows.card,
  },
  methodCardSelected: {
    borderColor: '#0D9488',
    backgroundColor: '#FAFDFF',
  },
  methodHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: '#0D9488',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0D9488',
  },
  methodName: {
    fontSize: fontSize.sm + 1,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recommendedBadge: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recommendedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0F766E',
  },
  cardLogoBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  cardLogoText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  cuotasBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cuotasBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  banksSupportedText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 30,
    marginBottom: 10,
  },
  cardForm: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  cardInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
  },
  cardInput: {
    flex: 1,
    height: 44,
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
  },
  rowTwoInputs: {
    flexDirection: 'row',
  },
  securityNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  securityNoticeText: {
    fontSize: 10,
    color: '#0F766E',
    fontWeight: '500',
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    ...shadows.card,
  },
  bottomTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  bottomTotalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  bottomTotalValue: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  expressTagRight: {
    alignItems: 'flex-end',
  },
  expressTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D9488',
  },
  taxesIncludedText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  confirmBtn: {
    backgroundColor: '#0F2544',
    borderRadius: borderRadius.md,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
    ...shadows.button,
  },
  confirmBtnDisabled: {
    opacity: 0.7,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  // ─── Estilos de formulario rápido de dirección en Checkout ───
  quickFormCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickFormTitle: {
    fontSize: fontSize.xs + 1,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  labelRowQuick: {
    flexDirection: 'row',
    gap: 8,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.primary,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  quickChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  quickInputGroup: {
    marginBottom: 8,
  },
  quickInputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 3,
  },
  quickInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 40,
    fontSize: fontSize.xs + 1,
    color: colors.textPrimary,
  },
  quickBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  quickSaveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 6,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickSaveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: fontSize.xs + 1,
  },
  quickCancelBtn: {
    paddingHorizontal: 16,
    borderRadius: 6,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
  },
  quickCancelBtnText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: fontSize.xs + 1,
  },
});

export default CheckoutPaymentScreen;
