import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius, shadows } from '../styles/theme';
import useCustomData from '../hooks/useCustomData';
import { showComingSoon } from '../utils/alerts';
import { isValidEmail, isValidPhone, validateBirthDate, parseDateDMY } from '../utils/validations';

// ─── Función helper para formatear fechas a DD/MM/AAAA ────────────────────────
const formatDateForDisplay = (val) => {
  if (!val) return '';
  const str = String(val).trim();
  // Formato YYYY/MM/DD o YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  return str;
};

// ─── Campo de formulario ──────────────────────────────────────────────────────
const FormField = ({ label, value, onChangeText, icon, placeholder, keyboardType, maxLength }) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={s.fieldGroup}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={[s.fieldRow, focused && s.fieldRowFocused]}>
        <Ionicons name={icon} size={18} color={focused ? colors.primary : colors.textSecondary} />
        <TextInput
          style={s.fieldInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          keyboardType={keyboardType || 'default'}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
};

// ─── Pantalla Información Personal ───────────────────────────────────────────
const PersonalInfoScreen = ({ currentUser, onBack, onUpdateUser }) => {
  const { getCliente, updateCliente } = useCustomData();
  const [imgError, setImgError] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [saving, setSaving] = useState(false);

  const getProp = (obj, keys) => {
    if (!obj) return null;
    for (const k of keys) {
      if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
    }
    return null;
  };

  const rawNombre = getProp(currentUser, ['nombre', 'Nombre', 'name', 'Name']) || '';
  const rawApellido = getProp(currentUser, ['apellido', 'Apellido', 'lastName', 'last_name']) || '';
  const rawDate = getProp(currentUser, ['fecha_nacimiento', 'fechaNacimiento', 'birthDate', 'birth_date', 'nacimiento']) || '';

  let initialNombre = rawNombre;
  let initialApellido = rawApellido;
  if (!initialApellido && rawNombre.includes(' ')) {
    const parts = rawNombre.trim().split(' ');
    initialNombre = parts[0];
    initialApellido = parts.slice(1).join(' ');
  }

  const [nombre, setNombre] = useState(initialNombre);
  const [apellido, setApellido] = useState(initialApellido);
  const [correo, setCorreo] = useState(
    getProp(currentUser, ['correo', 'Correo', 'email', 'Email', 'mail']) || ''
  );
  const [telefono, setTelefono] = useState(
    getProp(currentUser, ['telefono', 'Telefono', 'phone', 'Phone', 'celular', 'Celular', 'telefono_cliente']) || ''
  );
  const [fechaNacimiento, setFechaNacimiento] = useState(formatDateForDisplay(rawDate));
  const [photoUrl, setPhotoUrl] = useState(
    getProp(currentUser, ['fotoPerfil', 'foto_perfil', 'foto', 'Foto', 'photo', 'Photo', 'avatar', 'imagen'])
  );

  // Cargar datos frescos desde el backend al montar la pantalla
  useEffect(() => {
    const fetchFreshData = async () => {
      const clienteId = currentUser?._id || currentUser?.id;
      if (!clienteId) return;

      setLoadingProfile(true);
      try {
        const res = await getCliente(clienteId);
        if (res.success && res.cliente) {
          const cli = res.cliente;
          if (cli.nombre) setNombre(cli.nombre);
          const ape = cli.Apellido || cli.apellido || '';
          if (ape) setApellido(ape);
          if (cli.correo) setCorreo(cli.correo);
          if (cli.telefono) setTelefono(cli.telefono);
          const bDate = cli.fecha_nacimiento || cli.fechaNacimiento || '';
          if (bDate) setFechaNacimiento(formatDateForDisplay(bDate));
          if (cli.fotoPerfil) setPhotoUrl(cli.fotoPerfil);

          if (onUpdateUser) {
            onUpdateUser(cli);
          }
        }
      } catch (err) {
        console.log('Error al cargar datos del cliente:', err);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchFreshData();
  }, [currentUser?._id, currentUser?.id]);

  const handleDateChange = (text) => {
    if (text.length < fechaNacimiento.length) {
      setFechaNacimiento(text);
      return;
    }
    const digits = text.replace(/[^0-9]/g, '');
    if (digits.length <= 2) {
      setFechaNacimiento(digits);
    } else if (digits.length <= 4) {
      setFechaNacimiento(`${digits.slice(0, 2)}/${digits.slice(2)}`);
    } else {
      setFechaNacimiento(`${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`);
    }
  };

  const hasPhoto = photoUrl && !imgError && !photoUrl.includes('placeholder');
  const initial = (nombre || 'R').charAt(0).toUpperCase();

  const handleSave = async () => {
    if (!nombre.trim()) {
      Alert.alert('Campo requerido', 'El nombre es obligatorio.', [{ text: 'OK' }]);
      return;
    }
    if (nombre.trim().length < 2) {
      Alert.alert('Nombre inválido', 'El nombre debe tener al menos 2 caracteres.');
      return;
    }
    if (!apellido.trim()) {
      Alert.alert('Campo requerido', 'El apellido es obligatorio.');
      return;
    }
    if (!correo.trim()) {
      Alert.alert('Campo requerido', 'El correo electrónico es obligatorio.');
      return;
    }
    if (!isValidEmail(correo)) {
      Alert.alert('Correo inválido', 'Ingresa un correo electrónico válido (ej. usuario@correo.com).');
      return;
    }
    if (!telefono.trim()) {
      Alert.alert('Campo requerido', 'El teléfono es obligatorio.');
      return;
    }
    if (!isValidPhone(telefono)) {
      Alert.alert('Teléfono inválido', 'El teléfono debe tener entre 8 y 15 dígitos.');
      return;
    }
    const birthError = validateBirthDate(fechaNacimiento);
    if (birthError) {
      Alert.alert('Fecha de nacimiento', birthError);
      return;
    }

    const clienteId = currentUser?._id || currentUser?.id;
    if (!clienteId) {
      Alert.alert('Error', 'No se encontró la sesión del cliente.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        Apellido: apellido.trim(),
        apellido: apellido.trim(),
        correo: correo.trim(),
        telefono: telefono.trim(),
        fecha_nacimiento: parseDateDMY(fechaNacimiento),
        fechaNacimiento: parseDateDMY(fechaNacimiento),
      };

      const res = await updateCliente(clienteId, payload);
      setSaving(false);

      if (res.success) {
        if (onUpdateUser) {
          onUpdateUser({
            ...(currentUser || {}),
            ...payload,
            ...(res.cliente || {}),
          });
        }

        Alert.alert('✓ Guardado', 'Tu información personal ha sido actualizada con éxito.', [
          { text: 'OK', onPress: onBack },
        ]);
      } else {
        Alert.alert('Error al guardar', res.error || 'No se pudo actualizar la información.');
      }
    } catch (err) {
      setSaving(false);
      Alert.alert('Error de conexión', 'No se pudo conectar con el servidor.');
    }
  };

  return (
    <View style={[s.safe, { flex: 1 }]}>

      {/* ── 1. HEADER AZUL ── */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={onBack}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Información Personal</Text>
        <View style={{ width: 36, alignItems: 'flex-end' }}>
          {loadingProfile && <ActivityIndicator size="small" color="#FFF" />}
        </View>
      </View>

      {/* ── 2. AVATAR — entre header y scroll, marginTop negativo ── */}
      <View style={s.avatarSection}>
        <View style={s.avatarRing}>
          {hasPhoto ? (
            <Image
              source={{ uri: photoUrl }}
              style={s.avatarImg}
              onError={() => setImgError(true)}
            />
          ) : (
            <Text style={s.avatarInitial}>{initial}</Text>
          )}
        </View>
        <TouchableOpacity
          style={s.editPhotoBtn}
          activeOpacity={0.8}
          onPress={() => showComingSoon('El cambio de foto de perfil')}
        >
          <Ionicons name="pencil" size={13} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* ── 3. SCROLL con el formulario ── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.formCard}>
          <FormField
            label="Nombre"
            value={nombre}
            onChangeText={setNombre}
            icon="person-outline"
            placeholder="Tu nombre"
          />
          <FormField
            label="Apellido"
            value={apellido}
            onChangeText={setApellido}
            icon="person-outline"
            placeholder="Tu apellido"
          />
          <FormField
            label="Correo Electrónico"
            value={correo}
            onChangeText={setCorreo}
            icon="mail-outline"
            placeholder="tu@correo.com"
            keyboardType="email-address"
          />
          <FormField
            label="Número de Teléfono"
            value={telefono}
            onChangeText={setTelefono}
            icon="call-outline"
            placeholder="+503 0000-0000"
            keyboardType="phone-pad"
          />
          <FormField
            label="Fecha de Nacimiento"
            value={fechaNacimiento}
            onChangeText={handleDateChange}
            icon="calendar-outline"
            placeholder="DD/MM/AAAA"
            keyboardType="numeric"
            maxLength={10}
          />
        </View>

        <TouchableOpacity
          style={[s.saveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={saving}
        >
          <Text style={s.saveBtnText}>{saving ? 'Guardando...' : 'Guardar Cambios'}</Text>
        </TouchableOpacity>
      </ScrollView>

    </View>
  );
};

// ─── Estilos inline para máximo control del layout ────────────────────────────
const AVATAR_SIZE = 90;

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Header azul compacto
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: AVATAR_SIZE / 2 + 12, // deja espacio para que el avatar sobresalga
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
  },

  // Avatar centrado, overlap entre header y scroll
  avatarSection: {
    alignItems: 'center',
    marginTop: -(AVATAR_SIZE / 2 + 12), // sube exactamente el mismo valor que el paddingBottom del header
    marginBottom: 12,
    zIndex: 20,
  },
  avatarRing: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
  },
  editPhotoBtn: {
    position: 'absolute',
    bottom: 4,
    right: '50%',
    marginRight: -(AVATAR_SIZE / 2) + 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    elevation: 4,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  // Tarjeta de formulario
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  // Campo
  fieldGroup: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    backgroundColor: '#F8FAFC',
    gap: 10,
  },
  fieldRowFocused: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: '#FFF',
  },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    height: '100%',
  },

  // Botón guardar
  saveBtn: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default PersonalInfoScreen;
