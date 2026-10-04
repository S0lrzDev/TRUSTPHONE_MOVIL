import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
  BackHandler,
  Modal,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { dashboardStyles as styles } from '../styles/dashboardStyles';
import { colors } from '../styles/theme';
import usePhones, { getPhoneBrand } from '../hooks/usePhones';
import ProfileScreen from './ProfileScreen';
import PersonalInfoScreen from './PersonalInfoScreen';
import CartScreen from './CartScreen';
import CheckoutPaymentScreen from './CheckoutPaymentScreen';
import CheckoutSuccessScreen from './CheckoutSuccessScreen';
import OrdersScreen from './OrdersScreen';
import AddressesScreen from './AddressesScreen';
import AddressFormScreen from './AddressFormScreen';
import PaymentMethodsScreen from './PaymentMethodsScreen';
import PaymentMethodFormScreen from './PaymentMethodFormScreen';
import ProductDetailScreen from './ProductDetailScreen';
import { showAddedToCart, showComingSoon, confirmAction } from '../utils/alerts';

// ─── Colores por marca (dot en chip de filtro) ────────────────────────────────
const BRAND_COLORS = {
  apple: '#000000',
  iphone: '#000000',
  samsung: '#1428A0',
  google: '#4285F4',
  xiaomi: '#FF6900',
  motorola: '#3B7BDD',
  oneplus: '#F5010C',
  sony: '#003087',
  lg: '#A50034',
  oppo: '#118B50',
  huawei: '#CF0A2C',
  honor: '#00A4E4',
};

const getBrandColor = (brand = '') => {
  const key = brand.toLowerCase();
  for (const [k, v] of Object.entries(BRAND_COLORS)) {
    if (key.includes(k)) return v;
  }
  return colors.textSecondary;
};

// ─── Badge de condición ───────────────────────────────────────────────────────
const ConditionBadge = ({ value }) => {
  const label = (value || '').toLowerCase();
  let badgeStyle = styles.badgeDefault;
  let textStyle = styles.badgeTextDefault;

  if (label.includes('excel') || label.includes('nuevo')) {
    badgeStyle = styles.badgeExcelente;
    textStyle = styles.badgeText;
  } else if (label.includes('buen') || label.includes('usado')) {
    badgeStyle = styles.badgeBueno;
    textStyle = styles.badgeTextBueno;
  }

  if (!value) return null;
  return (
    <View style={styles.badgeRow}>
      <View style={[styles.badge, badgeStyle]}>
        <Text style={textStyle}>{value}</Text>
      </View>
    </View>
  );
};

// ─── Tarjeta de celular ───────────────────────────────────────────────────────
const PhoneCard = ({ item, onAddToCart, onPress }) => {
  const [imgError, setImgError] = useState(false);

  const name = item.nombre || item.name || item.modelo || 'Sin nombre';
  const brand = getPhoneBrand(item) || item.marca || item.brand || '';
  const price = item.precio || item.price || 0;
  const imageUrl = item.imagen || item.image || item.foto || item.imageUrl || null;
  const condition = item.condicion || item.estado || item.condition || '';
  const soldOut = getStock(item) <= 0;

  const formattedPrice = typeof price === 'number'
    ? `$${price.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
    : price;

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)} activeOpacity={0.85}>
      {/* Imagen */}
      <View style={styles.cardImageContainer}>
        {imageUrl && !imgError ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.cardImage}
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Ionicons name="phone-portrait-outline" size={40} color="#CBD5E1" />
          </View>
        )}
        {soldOut && (
          <View style={stockStyles.soldOutBadge}>
            <Text style={stockStyles.soldOutText}>AGOTADO</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.cardBody}>
        {brand ? <Text style={styles.cardBrand}>{brand}</Text> : null}
        <Text style={styles.cardName} numberOfLines={2}>{name}</Text>

        <View style={styles.cardPriceRow}>
          <Text style={styles.cardPrice}>{formattedPrice}</Text>
          <TouchableOpacity
            style={[styles.addBtn, soldOut && stockStyles.addBtnDisabled]}
            onPress={() => onAddToCart(item)}
            activeOpacity={0.8}
          >
            <Ionicons name={soldOut ? 'close' : 'add'} size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ConditionBadge value={condition} />
      </View>
    </TouchableOpacity>
  );
};

// Stock disponible de un celular (0 si no viene definido)
export const getStock = (item) => {
  const stock = Number(item?.stock);
  return Number.isFinite(stock) && stock > 0 ? stock : 0;
};

const stockStyles = StyleSheet.create({
  soldOutBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.error || '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  soldOutText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  addBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
});

// ─── Chip de filtro ───────────────────────────────────────────────────────────
const FilterChip = ({ label, active, onPress }) => {
  const dotColor = label === 'Todos' ? colors.primary : getBrandColor(label);
  return (
    <TouchableOpacity
      style={[styles.filterChip, active && styles.filterChipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {label !== 'Todos' && (
        <View style={[styles.filterDot, { backgroundColor: active ? '#FFFFFF88' : dotColor }]} />
      )}
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// ─── Componente Toast de Confirmación ─────────────────────────────────────────
const CartToast = ({ message, onHide, onViewCart }) => {
  if (!message) return null;

  return (
    <View style={styles.toastContainer}>
      <View style={styles.toastCard}>
        <View style={styles.toastIconCircle}>
          <Ionicons name="checkmark" size={18} color="#FFFFFF" />
        </View>
        <View style={styles.toastTextCol}>
          <Text style={styles.toastTitle}>{message.title}</Text>
          {message.subtitle ? (
            <Text style={styles.toastSubtitle} numberOfLines={1}>
              {message.subtitle}
            </Text>
          ) : null}
        </View>
        {onViewCart ? (
          <TouchableOpacity style={styles.toastViewBtn} onPress={onViewCart} activeOpacity={0.8}>
            <Text style={styles.toastViewBtnText}>Ver carrito</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity onPress={onHide} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Modal de Filtros Avanzados ───────────────────────────────────────────────
function FilterModal({
  visible,
  onClose,
  activeFilter,
  setActiveFilter,
  selectedCondition,
  setSelectedCondition,
  selectedStorage,
  setSelectedStorage,
  priceRange,
  setPriceRange,
  resetFilters,
  totalResults,
  brands,
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={filterStyles.modalOverlay}>
        <TouchableOpacity style={filterStyles.backdropTouch} activeOpacity={1} onPress={onClose} />
        <View style={filterStyles.modalContent}>
          {/* Header del Modal */}
          <View style={filterStyles.modalHeader}>
            <View>
              <Text style={filterStyles.modalTitle}>Filtros</Text>
              <Text style={filterStyles.modalSubtitle}>Encuentra el celular perfecto para ti</Text>
            </View>
            <TouchableOpacity style={filterStyles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={filterStyles.modalScroll} showsVerticalScrollIndicator={false}>
            {/* 1. Marcas */}
            <Text style={filterStyles.sectionTitle}>Marca</Text>
            <View style={filterStyles.chipRow}>
              {brands.map((b) => {
                const isSelected = activeFilter.toLowerCase() === b.toLowerCase();
                return (
                  <TouchableOpacity
                    key={b}
                    style={[filterStyles.chip, isSelected && filterStyles.chipActive]}
                    onPress={() => setActiveFilter(b)}
                    activeOpacity={0.7}
                  >
                    <Text style={[filterStyles.chipText, isSelected && filterStyles.chipTextActive]}>
                      {b}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 2. Condición */}
            <Text style={filterStyles.sectionTitle}>Condición</Text>
            <View style={filterStyles.chipRow}>
              {['Todas', 'Excelente', 'Bueno'].map((cond) => {
                const isSelected = selectedCondition === cond;
                return (
                  <TouchableOpacity
                    key={cond}
                    style={[filterStyles.chip, isSelected && filterStyles.chipActive]}
                    onPress={() => setSelectedCondition(cond)}
                    activeOpacity={0.7}
                  >
                    <Text style={[filterStyles.chipText, isSelected && filterStyles.chipTextActive]}>
                      {cond}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 3. Almacenamiento */}
            <Text style={filterStyles.sectionTitle}>Almacenamiento</Text>
            <View style={filterStyles.chipRow}>
              {['Todos', '64GB', '128GB', '256GB', '512GB', '1TB'].map((stor) => {
                const isSelected = selectedStorage === stor;
                return (
                  <TouchableOpacity
                    key={stor}
                    style={[filterStyles.chip, isSelected && filterStyles.chipActive]}
                    onPress={() => setSelectedStorage(stor)}
                    activeOpacity={0.7}
                  >
                    <Text style={[filterStyles.chipText, isSelected && filterStyles.chipTextActive]}>
                      {stor}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 4. Rango de Precio */}
            <Text style={filterStyles.sectionTitle}>Rango de Precio</Text>
            <View style={filterStyles.chipRow}>
              {[
                { id: 'all', label: 'Todos' },
                { id: 'under300', label: 'Menos de 300 €' },
                { id: '300to800', label: '300 € - 800 €' },
                { id: 'over800', label: 'Más de 800 €' },
              ].map((p) => {
                const isSelected = priceRange === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[filterStyles.chip, isSelected && filterStyles.chipActive]}
                    onPress={() => setPriceRange(p.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[filterStyles.chipText, isSelected && filterStyles.chipTextActive]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer de Acciones */}
          <View style={filterStyles.modalFooter}>
            <TouchableOpacity
              style={filterStyles.resetBtn}
              onPress={resetFilters}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh-outline" size={16} color={colors.textSecondary} />
              <Text style={filterStyles.resetBtnText}>Limpiar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={filterStyles.applyBtn}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={filterStyles.applyBtnText}>
                Ver {totalResults} {totalResults === 1 ? 'celular' : 'celulares'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Modal de Ordenamiento ───────────────────────────────────────────────────
function SortModal({ visible, onClose, sortBy, setSortBy }) {
  const options = [
    { key: 'featured', label: 'Destacados', subtitle: 'Orden recomendado', icon: 'sparkles-outline' },
    { key: 'priceAsc', label: 'Precio: Menor a Mayor', subtitle: 'De más económico a premium', icon: 'trending-up-outline' },
    { key: 'priceDesc', label: 'Precio: Mayor a Menor', subtitle: 'De gama alta a más económico', icon: 'trending-down-outline' },
    { key: 'nameAsc', label: 'Nombre: A - Z', subtitle: 'Orden alfabético', icon: 'text-outline' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={filterStyles.modalOverlayCenter}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={filterStyles.sortCard} onStartShouldSetResponder={() => true}>
          <View style={filterStyles.sortHeader}>
            <Text style={filterStyles.sortTitle}>Ordenar Catálogo</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={filterStyles.sortOptions}>
            {options.map((opt) => {
              const selected = sortBy === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[filterStyles.sortOptionItem, selected && filterStyles.sortOptionItemSelected]}
                  onPress={() => {
                    setSortBy(opt.key);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[filterStyles.sortIconBox, selected && filterStyles.sortIconBoxSelected]}>
                    <Ionicons
                      name={opt.icon}
                      size={18}
                      color={selected ? '#FFFFFF' : colors.textSecondary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[filterStyles.sortOptionLabel, selected && filterStyles.sortOptionLabelSelected]}>
                      {opt.label}
                    </Text>
                    <Text style={filterStyles.sortOptionSub}>{opt.subtitle}</Text>
                  </View>
                  {selected && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// ─── Estilos de Filtros y Modales ─────────────────────────────────────────────
const filterStyles = StyleSheet.create({
  btnActive: {
    borderColor: colors.primary,
    backgroundColor: '#EFF6FF',
  },
  btnTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 14,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  applyBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Modal Sort
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  sortCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  sortHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sortTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sortOptions: {
    gap: 8,
  },
  sortOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  sortOptionItemSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.primary,
  },
  sortIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortIconBoxSelected: {
    backgroundColor: colors.primary,
  },
  sortOptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sortOptionLabelSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  sortOptionSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
});

// ─── Pantalla principal: DashboardScreen ─────────────────────────────────────
const DashboardScreen = ({ currentUser, onLogout, onUpdateUser }) => {
  const {
    phones,
    filteredPhones,
    loading,
    error,
    fetchPhones,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    selectedCondition,
    setSelectedCondition,
    selectedStorage,
    setSelectedStorage,
    priceRange,
    setPriceRange,
    sortBy,
    setSortBy,
    resetFilters,
    activeFiltersCount,
    filters,
  } = usePhones();

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('inicio');
  // Navegación interna: 'catalog' | 'profile' | 'personalInfo' | 'cart'
  const [currentScreen, setCurrentScreen] = useState('catalog');

  // Estado del carrito y orden completada
  const [cart, setCart] = useState([]);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [selectedAddressForEdit, setSelectedAddressForEdit] = useState(null);
  const [cartToast, setCartToast] = useState(null);
  const [selectedPhone, setSelectedPhone] = useState(null);

  // Auto-dismiss del toast tras 2.8 segundos
  useEffect(() => {
    if (cartToast) {
      const timer = setTimeout(() => {
        setCartToast(null);
      }, 2800);
      return () => clearTimeout(timer);
    }
  }, [cartToast]);

  // Navegación con animación protegida
  const navigateWithAnimation = (screen, tab, params = null) => {
    try {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } catch (e) {
      // Ignorar fallo de animación si no está disponible
    }
    if (screen) setCurrentScreen(screen);
    if (tab) setActiveTab(tab);
    if (params && params.direccion !== undefined) {
      setSelectedAddressForEdit(params.direccion);
    }
  };

  // Manejo del botón atrás físico y gestos de Android
  useEffect(() => {
    const onBackPress = () => {
      if (currentScreen === 'productDetail') {
        navigateWithAnimation('catalog', 'inicio');
        return true;
      }
      if (currentScreen === 'paymentForm') {
        navigateWithAnimation('paymentMethods', 'perfil');
        return true;
      }
      if (currentScreen === 'paymentMethods') {
        navigateWithAnimation('profile', 'perfil');
        return true;
      }
      if (currentScreen === 'addressForm' || currentScreen === 'addressEdit') {
        navigateWithAnimation('addresses', 'perfil');
        return true;
      }
      if (currentScreen === 'addresses' || currentScreen === 'personalInfo') {
        navigateWithAnimation('profile', 'perfil');
        return true;
      }
      if (currentScreen === 'checkout') {
        navigateWithAnimation('cart', 'carrito');
        return true;
      }
      if (currentScreen === 'checkoutSuccess') {
        navigateWithAnimation('catalog', 'inicio');
        return true;
      }
      if (currentScreen === 'cart' || currentScreen === 'orders' || currentScreen === 'profile') {
        navigateWithAnimation('catalog', 'inicio');
        return true;
      }
      return false; // Permite salir de la app si está en el catálogo
    };

    const backSub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSub.remove();
  }, [currentScreen]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPhones();
    setRefreshing(false);
  }, [fetchPhones]);

  const handleAddToCart = (item) => {
    const itemId = item.id || item._id || item.idCelular;
    // Usar el stock más reciente del catálogo si está disponible
    const catalogItem = phones.find((p) => (p.id || p._id) === itemId) || item;
    const stock = getStock(catalogItem);
    const inCart = cart.find((c) => (c.id || c._id || c.idCelular) === itemId);
    const nameForAlert = item.nombre || item.name || item.modelo || 'Este producto';

    // Control de inventario: no permitir agregar productos sin stock
    if (stock <= 0) {
      Alert.alert('Producto agotado', `${nameForAlert} no tiene unidades disponibles por el momento.`);
      return false;
    }
    if (inCart && inCart.quantity >= stock) {
      Alert.alert('Stock máximo', `Solo hay ${stock} unidad(es) disponibles de ${nameForAlert} y ya están en tu carrito.`);
      return false;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(
        c => (c.id || c._id || c.idCelular) === (item.id || item._id || item.idCelular)
      );
      if (existingItem) {
        return prevCart.map(c => 
          (c.id || c._id || c.idCelular) === (item.id || item._id || item.idCelular)
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [...prevCart, { ...catalogItem, quantity: 1 }];
    });
    const itemName = item.nombre || item.name || item.modelo || 'Celular Trustphone';
    showAddedToCart(itemName, () => navigateWithAnimation('cart', 'carrito'));
    return true;
  };

  const handleUpdateQuantity = (item, delta) => {
    const itemId = item.id || item._id || item.idCelular;
    const catalogItem = phones.find((p) => (p.id || p._id) === itemId) || item;
    const stock = getStock(catalogItem);

    if (delta > 0 && item.quantity + delta > stock) {
      Alert.alert('Stock máximo', `Solo hay ${stock} unidad(es) disponibles de este producto.`);
      return;
    }

    setCart(prevCart => prevCart.map(c => {
      if ((c.id || c._id || c.idCelular) === itemId) {
        const newQuantity = c.quantity + delta;
        return { ...c, stock, quantity: newQuantity > 0 ? newQuantity : 1 };
      }
      return c;
    }));
  };

  const handleRemoveItem = (item) => {
    const itemName = item.nombre || item.name || item.modelo || 'este producto';
    confirmAction(
      'Eliminar del carrito',
      `¿Deseas quitar ${itemName} de tu carrito?`,
      'Eliminar',
      () => setCart(prevCart => prevCart.filter(
        c => (c.id || c._id || c.idCelular) !== (item.id || item._id || item.idCelular)
      ))
    );
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const userInitial = (currentUser?.nombre || currentUser?.name || 'U').charAt(0).toUpperCase();

  // ─── Render item de la grid ────────────────────────────────────────────────
  const renderPhone = ({ item }) => (
    <PhoneCard
      item={item}
      onAddToCart={handleAddToCart}
      onPress={(phone) => {
        setSelectedPhone(phone);
        navigateWithAnimation('productDetail', 'inicio');
      }}
    />
  );

  const SORT_LABELS = {
    featured: 'Destacados',
    priceAsc: 'Menor precio',
    priceDesc: 'Mayor precio',
    nameAsc: 'Nombre: A-Z',
  };

  // ─── Header de la sección catálogo ────────────────────────────────────────
  const CatalogHeader = () => (
    <View style={styles.catalogHeader}>
      <View>
        <Text style={styles.catalogTitle}>
          CATÁLOGO{' '}
          <Text style={styles.catalogCount}>({filteredPhones.length})</Text>
        </Text>
      </View>
      <View style={styles.catalogActions}>
        <TouchableOpacity
          style={[styles.filterBtn, activeFiltersCount > 0 && filterStyles.btnActive]}
          activeOpacity={0.7}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons
            name="options-outline"
            size={13}
            color={activeFiltersCount > 0 ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.filterBtnText, activeFiltersCount > 0 && filterStyles.btnTextActive]}>
            Filtros{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortBtn, sortBy !== 'featured' && filterStyles.btnActive]}
          activeOpacity={0.7}
          onPress={() => setShowSortModal(true)}
        >
          <Text style={[styles.sortBtnText, sortBy !== 'featured' && filterStyles.btnTextActive]}>
            {SORT_LABELS[sortBy] || 'Destacados'}
          </Text>
          <Ionicons
            name="chevron-down"
            size={12}
            color={sortBy !== 'featured' ? colors.primary : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── Renderizado según la pantalla activa ──────────────────────────────────
  const renderCurrentContent = () => {
    if (currentScreen === 'productDetail' && selectedPhone) {
      const phoneId = selectedPhone._id || selectedPhone.id;
      // Usar los datos más recientes del catálogo (stock actualizado)
      const freshPhone = phones.find((p) => (p._id || p.id) === phoneId) || selectedPhone;
      return (
        <ProductDetailScreen
          phone={freshPhone}
          currentUser={currentUser}
          onBack={() => navigateWithAnimation('catalog', 'inicio')}
          onAddToCart={handleAddToCart}
        />
      );
    }

    if (currentScreen === 'cart') {
      return (
        <CartScreen
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onBack={() => navigateWithAnimation('catalog', 'inicio')}
          onProceedToCheckout={() => navigateWithAnimation('checkout', 'carrito')}
        />
      );
    }

    if (currentScreen === 'checkout') {
      return (
        <CheckoutPaymentScreen
          cart={cart}
          currentUser={currentUser}
          onBack={() => navigateWithAnimation('cart', 'carrito')}
          onSuccess={(order) => {
            setCompletedOrder(order);
            setCart([]); // Vaciamos el carrito tras compra exitosa
            fetchPhones(); // Refrescar stock del catálogo
            navigateWithAnimation('checkoutSuccess', 'carrito');
          }}
        />
      );
    }

    if (currentScreen === 'checkoutSuccess') {
      return (
        <CheckoutSuccessScreen
          order={completedOrder}
          onGoToOrders={() => navigateWithAnimation('orders', 'pedidos')}
          onContinueShopping={() => navigateWithAnimation('catalog', 'inicio')}
        />
      );
    }

    if (currentScreen === 'orders') {
      return (
        <OrdersScreen
          currentUser={currentUser}
          onBack={() => navigateWithAnimation('catalog', 'inicio')}
          onExploreCatalog={() => navigateWithAnimation('catalog', 'inicio')}
          onBuyAgain={(item) => {
            if (!handleAddToCart(item)) return;
            navigateWithAnimation('cart', 'carrito');
          }}
        />
      );
    }

    if (currentScreen === 'profile') {
      return (
        <ProfileScreen
          currentUser={currentUser}
          onLogout={onLogout}
          onNavigate={(screen) => navigateWithAnimation(screen)}
          onBack={() => navigateWithAnimation('catalog', 'inicio')}
        />
      );
    }

    if (currentScreen === 'personalInfo') {
      return (
        <PersonalInfoScreen
          currentUser={currentUser}
          onBack={() => navigateWithAnimation('profile', 'perfil')}
          onUpdateUser={onUpdateUser}
        />
      );
    }

    if (currentScreen === 'addresses') {
      return (
        <AddressesScreen
          currentUser={currentUser}
          onBack={() => navigateWithAnimation('profile', 'perfil')}
          onNavigate={(screen, params) => {
            if (screen === 'addressEdit') {
              setSelectedAddressForEdit(params?.direccion || null);
              navigateWithAnimation('addressEdit');
            } else if (screen === 'addressForm') {
              setSelectedAddressForEdit(null);
              navigateWithAnimation('addressForm');
            } else {
              navigateWithAnimation(screen);
            }
          }}
        />
      );
    }

    if (currentScreen === 'addressForm' || currentScreen === 'addressEdit') {
      return (
        <AddressFormScreen
          currentUser={currentUser}
          editAddress={currentScreen === 'addressEdit' ? selectedAddressForEdit : null}
          onBack={() => navigateWithAnimation('addresses')}
          onSaveSuccess={() => navigateWithAnimation('addresses')}
        />
      );
    }

    if (currentScreen === 'paymentMethods') {
      return (
        <PaymentMethodsScreen
          currentUser={currentUser}
          onBack={() => navigateWithAnimation('profile', 'perfil')}
          onNavigate={(screen) => navigateWithAnimation(screen)}
        />
      );
    }

    if (currentScreen === 'paymentForm') {
      return (
        <PaymentMethodFormScreen
          currentUser={currentUser}
          onBack={() => navigateWithAnimation('paymentMethods')}
          onSaveSuccess={() => navigateWithAnimation('paymentMethods')}
        />
      );
    }

    // ─── Estado: Loading ───
    if (loading && filteredPhones.length === 0) {
      return (
        <View style={{ flex: 1 }}>
          <HeaderSection
            onAvatarPress={() => navigateWithAnimation('profile', 'perfil')}
            userInitial={userInitial}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filters={filters}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
          />
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Cargando catálogo...</Text>
          </View>
        </View>
      );
    }

    // ─── Estado: Error ───
    if (error && filteredPhones.length === 0) {
      return (
        <View style={{ flex: 1 }}>
          <HeaderSection
            onAvatarPress={() => navigateWithAnimation('profile', 'perfil')}
            userInitial={userInitial}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filters={filters}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
          />
          <View style={styles.centered}>
            <Ionicons name="cloud-offline-outline" size={56} color="#CBD5E1" />
            <Text style={styles.errorTitle}>Sin conexión al servidor</Text>
            <Text style={styles.errorSubtitle}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchPhones} activeOpacity={0.85}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // ─── Vista de Catálogo (Inicio) ───
    return (
      <View style={{ flex: 1 }}>
        <HeaderSection
          userInitial={userInitial}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filters={filters}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
        />

        <FlatList
          data={filteredPhones}
          renderItem={renderPhone}
          keyExtractor={(item, index) =>
            (item.id || item._id || item.idCelular || index).toString()
          }
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.grid}
          ListHeaderComponent={<CatalogHeader />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="search-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No se encontraron celulares</Text>
              {(activeFilter !== 'Todos' || activeFiltersCount > 0 || searchQuery.trim() !== '') && (
                <TouchableOpacity
                  style={{
                    marginTop: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 10,
                    backgroundColor: colors.primary,
                  }}
                  onPress={resetFilters}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 13 }}>
                    Restablecer Filtros
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />

        {/* Modal de Filtros Avanzados */}
        <FilterModal
          visible={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          selectedCondition={selectedCondition}
          setSelectedCondition={setSelectedCondition}
          selectedStorage={selectedStorage}
          setSelectedStorage={setSelectedStorage}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          resetFilters={resetFilters}
          totalResults={filteredPhones.length}
          brands={filters}
        />

        {/* Modal de Ordenamiento */}
        <SortModal
          visible={showSortModal}
          onClose={() => setShowSortModal(false)}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
      </View>
    );
  };

  // Ocultar barra inferior en pantallas de flujo completo (checkout, direcciones, pagos, formularios)
  const HIDE_BOTTOM_TAB_SCREENS = [
    'productDetail',
    'checkout',
    'checkoutSuccess',
    'addresses',
    'addressForm',
    'addressEdit',
    'personalInfo',
    'paymentMethods',
    'paymentForm',
  ];
  const shouldShowTabBar = !HIDE_BOTTOM_TAB_SCREENS.includes(currentScreen);

  // ─── Vista principal ────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={{ flex: 1 }}>
        {renderCurrentContent()}
      </View>

      {shouldShowTabBar && (
        <BottomTabBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onNavigate={(s, t) => navigateWithAnimation(s, t)}
          cartCount={cartCount}
        />
      )}
    </SafeAreaView>
  );
};

// ─── Header con logo, búsqueda y filtros ─────────────────────────────────────
const HeaderSection = ({
  onAvatarPress,
  userInitial,
  searchQuery,
  setSearchQuery,
  filters,
  activeFilter,
  setActiveFilter,
}) => (
  <View style={styles.header}>
    {/* Logo + íconos */}
    <View style={styles.headerTop}>
      <View style={styles.logoRow}>
        <View style={styles.logoIcon}>
          <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
        </View>
        <Text style={styles.logoText}>TRUSTPHONE</Text>
      </View>
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.iconBtn}
          activeOpacity={0.7}
          onPress={() => showComingSoon('La lista de favoritos')}
        >
          <Ionicons name="heart-outline" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.avatarBtn} activeOpacity={0.8} onPress={onAvatarPress}>
          <Text style={styles.avatarInitial}>{userInitial}</Text>
        </TouchableOpacity>
      </View>
    </View>

    {/* Búsqueda */}
    <View style={styles.searchContainer}>
      <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
      <TextInput
        style={styles.searchInput}
        placeholder="Busca por iPhone 15, Galaxy S24..."
        placeholderTextColor={colors.placeholder}
        value={searchQuery}
        onChangeText={setSearchQuery}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
    </View>

    {/* Chips de filtro */}
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filtersScroll}
      contentContainerStyle={styles.filtersContent}
    >
      {filters.map((f) => {
        const isSelected = activeFilter.toLowerCase() === f.toLowerCase();
        return (
          <FilterChip
            key={f}
            label={f}
            active={isSelected}
            onPress={() => setActiveFilter(isSelected && f !== 'Todos' ? 'Todos' : f)}
          />
        );
      })}
    </ScrollView>
  </View>
);

// ─── Bottom Tab Bar ───────────────────────────────────────────────────────────
const TAB_ITEMS = [
  { key: 'inicio', label: 'Inicio', icon: 'home', iconActive: 'home' },
  { key: 'carrito', label: 'Carrito', icon: 'bag-outline', iconActive: 'bag' },
  { key: 'pedidos', label: 'Pedidos', icon: 'receipt-outline', iconActive: 'receipt' },
  { key: 'perfil', label: 'Perfil', icon: 'person-outline', iconActive: 'person' },
];

const BottomTabBar = ({ activeTab, setActiveTab, onNavigate, cartCount = 0 }) => (
  <View style={styles.tabBar}>
    {TAB_ITEMS.map((tab) => {
      const isActive = activeTab === tab.key;
      return (
        <TouchableOpacity
          key={tab.key}
          style={styles.tabItem}
          onPress={() => {
            if (tab.key === 'perfil') {
              onNavigate('profile', 'perfil');
            } else if (tab.key === 'carrito') {
              onNavigate('cart', 'carrito');
            } else if (tab.key === 'pedidos') {
              onNavigate('orders', 'pedidos');
            } else if (tab.key === 'inicio') {
              onNavigate('catalog', 'inicio');
            } else {
              onNavigate(null, tab.key);
            }
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.tabIconContainer, isActive && styles.tabIconBg]}>
            <Ionicons
              name={isActive ? tab.iconActive : tab.icon}
              size={22}
              color={isActive ? colors.primary : colors.textSecondary}
            />
            {tab.key === 'carrito' && cartCount > 0 && (
              <View style={{
                position: 'absolute',
                top: -4,
                right: -6,
                backgroundColor: colors.error,
                borderRadius: 10,
                minWidth: 18,
                height: 18,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 4,
              }}>
                <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>{cartCount}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

export default DashboardScreen;
