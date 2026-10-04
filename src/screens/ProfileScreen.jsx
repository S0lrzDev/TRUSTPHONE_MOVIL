import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { profileStyles as styles } from '../styles/profileStyles';
import { showComingSoon } from '../utils/alerts';

// ─── Colores de ícono por ítem ────────────────────────────────────────────────
const MENU_ITEMS_CUENTA = [
  {
    key: 'personalInfo',
    label: 'Información Personal',
    icon: 'person-outline',
    iconBg: '#EFF6FF',
    iconColor: '#3B82F6',
  },
  {
    key: 'addresses',
    label: 'Mis Direcciones',
    icon: 'location-outline',
    iconBg: '#F0FDF4',
    iconColor: '#22C55E',
  },
  {
    key: 'payment',
    label: 'Métodos de Pago',
    icon: 'card-outline',
    iconBg: '#FDF4FF',
    iconColor: '#A855F7',
  },
];

const MENU_ITEMS_PREFS = [
  {
    key: 'notifications',
    label: 'Notificaciones',
    icon: 'notifications-outline',
    iconBg: '#FFFBEB',
    iconColor: '#F59E0B',
  },
  {
    key: 'security',
    label: 'Seguridad',
    icon: 'shield-checkmark-outline',
    iconBg: '#EFF6FF',
    iconColor: '#1E3A75',
  },
];

// ─── Componente ProfileScreen ─────────────────────────────────────────────────
const ProfileScreen = ({ currentUser, onLogout, onNavigate, onBack }) => {
  const [imgError, setImgError] = useState(false);

  const getProp = (obj, keys) => {
    if (!obj) return null;
    for (const k of keys) {
      if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
    }
    return null;
  };

  const rawNom = getProp(currentUser, ['nombre', 'Nombre', 'name', 'Name', 'nombreCompleto']) || '';
  const rawApe = getProp(currentUser, ['apellido', 'Apellido', 'lastName', 'last_name']) || '';

  const fullName = (() => {
    if (rawNom && rawApe && !rawNom.toLowerCase().includes(rawApe.toLowerCase())) {
      return `${rawNom} ${rawApe}`.trim();
    }
    return rawNom || rawApe || 'Rodrigo Solórzano';
  })();

  const email = getProp(currentUser, ['correo', 'Correo', 'email', 'Email', 'mail']) || '';
  const photoUrl = getProp(currentUser, ['fotoPerfil', 'foto_perfil', 'foto', 'Foto', 'photo', 'Photo', 'avatar', 'imagen']);
  const hasPhoto = photoUrl && !imgError && !photoUrl.includes('placeholder');
  const initial = (fullName || 'R').charAt(0).toUpperCase();

  const handleMenuPress = (key) => {
    if (key === 'personalInfo') {
      onNavigate('personalInfo');
    } else if (key === 'addresses') {
      onNavigate('addresses');
    } else if (key === 'payment') {
      onNavigate('paymentMethods');
    } else {
      const nombres = { notifications: 'La sección de Notificaciones', security: 'La sección de Seguridad' };
      showComingSoon(nombres[key] || 'Esta sección');
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', style: 'destructive', onPress: onLogout },
      ]
    );
  };

  return (
    <View style={[styles.container, { flex: 1 }]}>
      {/* ── Header azul ── */}
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
          <Text style={styles.headerTitle}>Perfil</Text>
          <TouchableOpacity
            style={styles.headerSettingsBtn}
            activeOpacity={0.7}
            onPress={() => showComingSoon('La configuración de la cuenta')}
          >
            <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarCircle}>
            {hasPhoto ? (
              <Image
                source={{ uri: photoUrl }}
                style={styles.avatarImage}
                onError={() => setImgError(true)}
              />
            ) : (
              <Text style={styles.avatarInitialText}>{initial}</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.avatarEditBtn}
            activeOpacity={0.8}
            onPress={() => showComingSoon('El cambio de foto de perfil')}
          >
            <Ionicons name="add" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.profileName}>{fullName}</Text>
        {email ? <Text style={styles.profileEmail}>{email}</Text> : null}
      </View>

      {/* ── Contenido ── */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* SECCIÓN: CUENTA */}
        <Text style={styles.sectionLabel}>Cuenta</Text>
        <View style={styles.sectionCard}>
          {MENU_ITEMS_CUENTA.map((item, idx) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.menuItem,
                idx < MENU_ITEMS_CUENTA.length - 1 && styles.menuItemBorder,
              ]}
              onPress={() => handleMenuPress(item.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: item.iconBg }]}>
                <Ionicons name={item.icon} size={20} color={item.iconColor} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </TouchableOpacity>
          ))}
        </View>

        {/* SECCIÓN: PREFERENCIAS */}
        <Text style={styles.sectionLabel}>Preferencias</Text>
        <View style={styles.sectionCard}>
          {MENU_ITEMS_PREFS.map((item, idx) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.menuItem,
                idx < MENU_ITEMS_PREFS.length - 1 && styles.menuItemBorder,
              ]}
              onPress={() => handleMenuPress(item.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: item.iconBg }]}>
                <Ionicons name={item.icon} size={20} color={item.iconColor} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Botón Cerrar Sesión */}
        <View style={styles.logoutCard}>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={confirmLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;
