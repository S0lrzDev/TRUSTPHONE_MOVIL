import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { productDetailStyles as styles } from '../styles/productDetailStyles';
import { colors } from '../styles/theme';
import useCustomData from '../hooks/useCustomData';
import { getPhoneBrand } from '../hooks/usePhones';

const MAX_COMMENT = 500;

// ─── Estrellas (solo lectura o seleccionables) ───────────────────────────────
const Stars = ({ value, size = 16, onSelect }) => (
  <View style={{ flexDirection: 'row', gap: onSelect ? 8 : 2 }}>
    {[1, 2, 3, 4, 5].map((n) => {
      const icon = value >= n ? 'star' : value >= n - 0.5 ? 'star-half' : 'star-outline';
      const star = <Ionicons name={icon} size={size} color="#F59E0B" />;
      return onSelect ? (
        <TouchableOpacity key={n} onPress={() => onSelect(n)} activeOpacity={0.7} hitSlop={6}>
          {star}
        </TouchableOpacity>
      ) : (
        <View key={n}>{star}</View>
      );
    })}
  </View>
);

const formatDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  return isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── Pantalla de detalle de producto con valoraciones ─────────────────────────
const ProductDetailScreen = ({ phone, currentUser, onBack, onAddToCart }) => {
  const { getResenas, getResumenResenas, createResena, updateResena, deleteResena } = useCustomData();

  const phoneId = phone?._id || phone?.id;
  const clienteId = currentUser?._id || currentUser?.id;

  const [resenas, setResenas] = useState([]);
  const [resumen, setResumen] = useState({ promedio: 0, total: 0 });
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [imgError, setImgError] = useState(false);

  // Formulario de reseña
  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef(null);
  const formY = useRef(0);

  // Desplaza la vista al formulario de reseña (al escribir o editar)
  const scrollToForm = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(formY.current - 16, 0), animated: true });
    }, 250);
  };

  const name = phone?.nombre || phone?.name || phone?.modelo || 'Celular';
  const brand = getPhoneBrand(phone);
  const price = Number(phone?.precio || phone?.price || 0);
  const imageUrl = phone?.imagen || phone?.image || phone?.foto || null;
  const stock = Number(phone?.stock) > 0 ? Number(phone.stock) : 0;

  const loadReviews = useCallback(async () => {
    if (!phoneId) return;
    setLoadingReviews(true);
    const [lista, res] = await Promise.all([getResenas(phoneId), getResumenResenas(phoneId)]);
    setResenas(lista.resenas || []);
    setResumen({ promedio: res.promedio || 0, total: res.total || 0 });
    setLoadingReviews(false);
  }, [phoneId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const getReviewClientId = (r) => (typeof r.idCliente === 'object' ? r.idCliente?._id : r.idCliente);
  const myReview = resenas.find((r) => getReviewClientId(r) === clienteId);

  const resetForm = () => {
    setCalificacion(0);
    setComentario('');
    setEditingId(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (calificacion < 1 || calificacion > 5) {
      errors.calificacion = 'Selecciona de 1 a 5 estrellas';
    }
    const texto = comentario.trim();
    if (!texto) {
      errors.comentario = 'El comentario no puede estar vacío';
    } else if (texto.length < 3) {
      errors.comentario = 'El comentario debe tener al menos 3 caracteres';
    } else if (texto.length > MAX_COMMENT) {
      errors.comentario = `Máximo ${MAX_COMMENT} caracteres`;
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!clienteId) {
      Alert.alert('Sesión requerida', 'Debes iniciar sesión para valorar productos.');
      return;
    }
    if (!validateForm()) return;

    setSaving(true);
    const payload = { idCelular: phoneId, idCliente: clienteId, calificacion, comentario: comentario.trim() };
    const res = editingId ? await updateResena(editingId, payload) : await createResena(payload);
    setSaving(false);

    if (res.success) {
      Alert.alert('¡Gracias!', editingId ? 'Tu reseña fue actualizada.' : 'Tu reseña fue publicada.');
      resetForm();
      loadReviews();
    } else {
      Alert.alert('No se pudo guardar', res.error);
    }
  };

  const handleEdit = (r) => {
    setEditingId(r._id);
    setCalificacion(r.calificacion);
    setComentario(r.comentario);
    setFormErrors({});
    scrollToForm();
  };

  const handleDelete = (r) => {
    Alert.alert('Eliminar reseña', '¿Seguro que deseas eliminar tu reseña?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const res = await deleteResena(r._id);
          if (res.success) {
            resetForm();
            loadReviews();
          } else {
            Alert.alert('Error', res.error);
          }
        },
      },
    ]);
  };

  const stockStyle = stock <= 0 ? styles.stockOut : stock <= 3 ? styles.stockLow : styles.stockAvailable;
  const stockLabel = stock <= 0 ? 'Agotado' : stock <= 3 ? `¡Últimas ${stock} unidades!` : `${stock} disponibles`;

  const specs = [
    ['Modelo', phone?.modelo],
    ['Almacenamiento', phone?.almacenamiento],
    ['Color', phone?.color],
    ['Condición', phone?.condicion],
  ].filter(([, v]) => v);

  const showForm = !myReview || editingId;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del producto</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          nestedScrollEnabled
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Imagen */}
          <View style={styles.imageBox}>
            {imageUrl && !imgError ? (
              <Image source={{ uri: imageUrl }} style={styles.image} onError={() => setImgError(true)} />
            ) : (
              <Ionicons name="phone-portrait-outline" size={80} color="#CBD5E1" />
            )}
          </View>

          {/* Información */}
          <View style={styles.card}>
            {brand ? <Text style={styles.brand}>{brand}</Text> : null}
            <Text style={styles.name}>{name}</Text>

            <View style={styles.ratingRow}>
              <Stars value={resumen.promedio} />
              <Text style={styles.ratingText}>
                {resumen.total > 0
                  ? `${resumen.promedio.toFixed(1)} (${resumen.total} ${resumen.total === 1 ? 'reseña' : 'reseñas'})`
                  : 'Sin reseñas'}
              </Text>
            </View>

            <Text style={styles.price}>
              ${price.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </Text>

            <View style={[styles.stockPill, stockStyle]}>
              <Text style={styles.stockText}>{stockLabel}</Text>
            </View>

            {specs.length > 0 && (
              <View style={styles.specsGrid}>
                {specs.map(([label, value]) => (
                  <View key={label} style={styles.specItem}>
                    <Text style={styles.specLabel}>{label}</Text>
                    <Text style={styles.specValue}>{value}</Text>
                  </View>
                ))}
              </View>
            )}

            {phone?.descripcion ? <Text style={styles.description}>{phone.descripcion}</Text> : null}

            <TouchableOpacity
              style={[styles.addBtn, stock <= 0 && styles.addBtnDisabled]}
              onPress={() => onAddToCart(phone)}
              activeOpacity={0.85}
              disabled={stock <= 0}
            >
              <Ionicons name={stock <= 0 ? 'close-circle-outline' : 'cart-outline'} size={20} color="#FFFFFF" />
              <Text style={styles.addBtnText}>{stock <= 0 ? 'Producto agotado' : 'Agregar al carrito'}</Text>
            </TouchableOpacity>
          </View>

          {/* Formulario de reseña */}
          <View style={styles.card} onLayout={(e) => { formY.current = e.nativeEvent.layout.y; }}>
            <Text style={styles.sectionTitle}>
              {editingId ? 'Editar tu reseña' : myReview ? 'Tu reseña' : 'Valora este producto'}
            </Text>

            {showForm ? (
              <>
                <Text style={styles.sectionSub}>Solo puedes valorar productos que hayas comprado.</Text>
                <View style={styles.starsRow}>
                  <Stars value={calificacion} size={30} onSelect={setCalificacion} />
                </View>
                {formErrors.calificacion ? <Text style={styles.errorText}>{formErrors.calificacion}</Text> : null}

                <TextInput
                  style={[styles.commentInput, formErrors.comentario && styles.commentInputError]}
                  value={comentario}
                  onChangeText={setComentario}
                  placeholder="Cuéntanos qué te pareció el producto..."
                  placeholderTextColor={colors.placeholder}
                  multiline
                  scrollEnabled={false}
                  onFocus={scrollToForm}
                  maxLength={MAX_COMMENT}
                />
                <Text style={styles.counter}>{comentario.length}/{MAX_COMMENT}</Text>
                {formErrors.comentario ? <Text style={styles.errorText}>{formErrors.comentario}</Text> : null}

                <View style={styles.formActions}>
                  {editingId ? (
                    <TouchableOpacity style={styles.secondaryBtn} onPress={resetForm} activeOpacity={0.7}>
                      <Text style={styles.secondaryBtnText}>Cancelar</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={saving} activeOpacity={0.85}>
                    {saving ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitBtnText}>{editingId ? 'Guardar cambios' : 'Publicar reseña'}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.infoBox}>
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                <Text style={styles.infoText}>Ya valoraste este producto. Puedes editar o eliminar tu reseña abajo.</Text>
              </View>
            )}
          </View>

          {/* Lista de reseñas */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Opiniones de clientes</Text>

            {loadingReviews ? (
              <ActivityIndicator style={{ marginVertical: 16 }} color={colors.primary} />
            ) : resenas.length === 0 ? (
              <Text style={styles.emptyReviews}>Aún no hay reseñas. ¡Sé el primero en opinar!</Text>
            ) : (
              resenas.map((r) => {
                const autor = typeof r.idCliente === 'object' ? r.idCliente : null;
                const autorNombre = autor ? `${autor.nombre || ''} ${autor.Apellido || ''}`.trim() : 'Cliente';
                const isMine = getReviewClientId(r) === clienteId;
                return (
                  <View key={r._id} style={[styles.reviewItem, { marginTop: 8 }]}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewAvatar}>
                        <Text style={styles.reviewAvatarText}>{(autorNombre || 'C').charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reviewAuthor}>{isMine ? `${autorNombre} (tú)` : autorNombre}</Text>
                        <Text style={styles.reviewDate}>{formatDate(r.fechaResena || r.createdAt)}</Text>
                      </View>
                      <Stars value={r.calificacion} size={13} />
                    </View>
                    <Text style={styles.reviewComment}>{r.comentario}</Text>
                    {isMine && (
                      <View style={styles.reviewActions}>
                        <TouchableOpacity onPress={() => handleEdit(r)} activeOpacity={0.7}>
                          <Text style={styles.reviewActionText}>Editar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(r)} activeOpacity={0.7}>
                          <Text style={[styles.reviewActionText, { color: colors.error }]}>Eliminar</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ProductDetailScreen;
