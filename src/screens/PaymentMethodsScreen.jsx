import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { paymentStyles as styles } from '../styles/paymentStyles';
import { colors } from '../styles/theme';
import useCustomData from '../hooks/useCustomData';

const PaymentMethodsScreen = ({ currentUser, onBack, onNavigate }) => {
  const { getMetodosPago, deleteMetodoPago, updateMetodoPago } = useCustomData();
  const [metodos, setMetodos] = useState([]);
  const [loading, setLoading] = useState(true);

  const clienteId = currentUser?._id || currentUser?.id || null;

  const fetchMetodos = useCallback(async () => {
    if (!clienteId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getMetodosPago(clienteId);
      if (res.success && res.metodosPago) {
        setMetodos(res.metodosPago);
      }
    } catch (err) {
      console.log('Error fetching metodos de pago:', err);
    }
    setLoading(false);
  }, [clienteId]);

  useEffect(() => {
    fetchMetodos();
  }, [fetchMetodos]);

  const handleDelete = (id, ultimos4) => {
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
              setMetodos(prev => prev.filter(m => m._id !== id));
              Alert.alert('Listo', 'Tarjeta eliminada correctamente.');
            } else {
              Alert.alert('Error', res.error || 'No se pudo eliminar la tarjeta.');
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (metodo) => {
    if (metodo.esPredeterminado) return;
    try {
      const res = await updateMetodoPago(metodo._id, {
        ...metodo,
        esPredeterminado: true,
      });
      if (res.success) {
        setMetodos(prev =>
          prev.map(m => ({
            ...m,
            esPredeterminado: m._id === metodo._id,
          }))
        );
        Alert.alert('Listo', 'Tarjeta establecida como predeterminada.');
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo actualizar la tarjeta predeterminada.');
    }
  };

  const handleAdd = () => {
    if (onNavigate) {
      onNavigate('paymentForm');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header azul */}
      <View style={styles.headerBg}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={onBack}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Métodos de Pago</Text>
          <View style={styles.headerPlaceholder} />
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, color: colors.textSecondary, fontSize: 14 }}>
            Cargando tarjetas guardadas...
          </Text>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {metodos.length === 0 ? (
              /* Estado vacío */
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="card-outline" size={44} color="#A855F7" />
                </View>
                <Text style={styles.emptyTitle}>Sin métodos de pago</Text>
                <Text style={styles.emptySubtitle}>
                  Agrega una tarjeta de débito o crédito para agilizar tus compras en Trustphone.
                </Text>
                <TouchableOpacity
                  style={[styles.addBtn, { paddingHorizontal: 24, height: 46, marginTop: 4 }]}
                  onPress={handleAdd}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                  <Text style={[styles.addBtnText, { fontSize: 14 }]}>Agregar tarjeta</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.countRow}>
                  <Text style={styles.countText}>
                    {metodos.length} {metodos.length === 1 ? 'tarjeta guardada' : 'tarjetas guardadas'}
                  </Text>
                </View>

                {metodos.map((metodo) => {
                  const isVisa = (metodo.marca || '').toUpperCase() === 'VISA';
                  return (
                    <View key={metodo._id} style={styles.cardItemContainer}>
                      {/* Cabecera de la tarjeta con banco y badge */}
                      <View style={styles.cardItemHeader}>
                        <View style={styles.cardItemBankRow}>
                          <Ionicons name="card" size={18} color={colors.primary} />
                          <Text style={styles.cardBankName}>
                            {metodo.banco || metodo.tipo || 'Tarjeta Bancaria'}
                          </Text>
                        </View>
                        {metodo.esPredeterminado && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>Predeterminada</Text>
                          </View>
                        )}
                      </View>

                      {/* Tarjeta Visual Realista */}
                      <View style={[styles.visualCard, !isVisa && styles.visualCardGold]}>
                        <View style={styles.visualCardBgCircle1} />
                        <View style={styles.visualCardBgCircle2} />

                        {/* Top: Chip + Tipo + Marca */}
                        <View style={styles.visualCardTop}>
                          <View style={styles.chipAndWifiRow}>
                            <View style={styles.chipBox}>
                              <View style={styles.chipInnerLines} />
                            </View>
                            <Ionicons name="wifi" size={18} color="rgba(255,255,255,0.7)" />
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={styles.typeTag}>
                              <Text style={styles.typeTagText}>
                                {metodo.tipo === 'Tarjeta de Crédito' ? 'CRÉDITO' : 'DÉBITO'}
                              </Text>
                            </View>
                            <Text style={styles.brandBadgeText}>
                              {metodo.marca || 'VISA'}
                            </Text>
                          </View>
                        </View>

                        {/* Número con máscara */}
                        <Text style={styles.visualCardNumber}>
                          ••••  ••••  ••••  {metodo.ultimos4}
                        </Text>

                        {/* Bottom: Titular y Expiración */}
                        <View style={styles.visualCardBottom}>
                          <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={styles.cardLabelSmall}>TITULAR</Text>
                            <Text style={styles.cardValueText} numberOfLines={1}>
                              {metodo.titular.toUpperCase()}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.cardLabelSmall}>VENCE</Text>
                            <Text style={styles.cardValueText}>
                              {metodo.fechaExpiracion}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Botones de acción */}
                      <View style={styles.cardItemActions}>
                        {!metodo.esPredeterminado && (
                          <TouchableOpacity
                            style={styles.setDefaultBtn}
                            onPress={() => handleSetDefault(metodo)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="star-outline" size={14} color={colors.primary} />
                            <Text style={styles.setDefaultBtnText}>Hacer predeterminada</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={styles.deleteCardBtn}
                          onPress={() => handleDelete(metodo._id, metodo.ultimos4)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={14} color="#EF4444" />
                          <Text style={styles.deleteCardBtnText}>Eliminar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </>
            )}
          </ScrollView>

          {/* Botón fijo: Agregar tarjeta */}
          <View style={styles.addBtnContainer}>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={handleAdd}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Agregar tarjeta</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

export default PaymentMethodsScreen;
