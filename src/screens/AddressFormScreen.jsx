import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addressStyles as styles } from '../styles/addressStyles';
import { colors } from '../styles/theme';
import useCustomData from '../hooks/useCustomData';
import { isValidPhone } from '../utils/validations';

const FormInputField = ({
  label,
  value,
  onChangeText,
  icon,
  placeholder,
  keyboardType = 'default',
  multiline = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.fieldInputRow, isFocused && styles.fieldInputRowFocused]}>
        <Ionicons
          name={icon}
          size={18}
          color={isFocused ? colors.primary : colors.textSecondary}
        />
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          keyboardType={keyboardType}
          multiline={multiline}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </View>
    </View>
  );
};

const AddressFormScreen = ({ currentUser, editAddress, onBack, onSaveSuccess }) => {
  const { createDireccion, updateDireccion } = useCustomData();
  const isEditing = Boolean(editAddress && editAddress._id);

  const clienteId = currentUser?._id || currentUser?.id || null;

  const [titulo, setTitulo] = useState(editAddress?.titulo || 'Casa');
  const [nombreDestinatario, setNombreDestinatario] = useState(
    editAddress?.nombreDestinatario || currentUser?.nombre || currentUser?.name || ''
  );
  const [telefono, setTelefono] = useState(
    editAddress?.telefono || currentUser?.telefono || ''
  );
  const [direccion, setDireccion] = useState(editAddress?.direccion || '');
  const [colonia, setColonia] = useState(editAddress?.colonia || '');
  const [ciudad, setCiudad] = useState(editAddress?.ciudad || 'San Salvador');
  const [departamento, setDepartamento] = useState(
    editAddress?.departamento || 'San Salvador'
  );
  const [codigoPostal, setCodigoPostal] = useState(editAddress?.codigoPostal || '');
  const [referencia, setReferencia] = useState(editAddress?.referencia || '');
  const [esPrincipal, setEsPrincipal] = useState(editAddress?.esPrincipal || false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!clienteId) {
      Alert.alert('Error', 'Debes iniciar sesión para guardar una dirección.');
      return;
    }

    if (!nombreDestinatario.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa el nombre de quien recibe.');
      return;
    }

    if (!telefono.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa un número de teléfono de contacto.');
      return;
    }

    if (!isValidPhone(telefono)) {
      Alert.alert('Teléfono inválido', 'El teléfono debe tener entre 8 y 15 dígitos.');
      return;
    }

    if (!direccion.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa la dirección exacta (calle, número).');
      return;
    }

    if (!ciudad.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa la ciudad o municipio.');
      return;
    }

    if (!departamento.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa el departamento o estado.');
      return;
    }

    setSaving(true);

    const payload = {
      cliente: clienteId,
      titulo: titulo.trim() || 'Casa',
      nombreDestinatario: nombreDestinatario.trim(),
      telefono: telefono.trim(),
      direccion: direccion.trim(),
      colonia: colonia.trim(),
      ciudad: ciudad.trim(),
      departamento: departamento.trim(),
      codigoPostal: codigoPostal.trim(),
      referencia: referencia.trim(),
      esPrincipal,
    };

    try {
      let result;
      if (isEditing) {
        result = await updateDireccion(editAddress._id, payload);
      } else {
        result = await createDireccion(payload);
      }

      setSaving(false);

      if (result.success) {
        Alert.alert(
          'Éxito',
          isEditing
            ? 'Dirección actualizada correctamente.'
            : 'Dirección guardada correctamente.',
          [
            {
              text: 'OK',
              onPress: () => {
                if (onSaveSuccess) onSaveSuccess(result.direccion);
                else if (onBack) onBack();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'No se pudo guardar la dirección.');
      }
    } catch (err) {
      setSaving(false);
      Alert.alert('Error', 'Ocurrió un error inesperado.');
    }
  };

  const labelOptions = [
    { label: 'Casa', icon: 'home-outline' },
    { label: 'Oficina', icon: 'business-outline' },
    { label: 'Otro', icon: 'location-outline' },
  ];

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
          <Text style={styles.headerTitle}>
            {isEditing ? 'Editar Dirección' : 'Nueva Dirección'}
          </Text>
          <View style={styles.headerPlaceholder} />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.formScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Card: Selector de etiqueta y Destinatario */}
          <View style={styles.formCard}>
            <Text style={styles.formSectionTitle}>Tipo de Lugar</Text>
            <View style={styles.labelSelectorRow}>
              {labelOptions.map((opt) => {
                const isSelected = titulo === opt.label;
                return (
                  <TouchableOpacity
                    key={opt.label}
                    style={[styles.labelChip, isSelected && styles.labelChipActive]}
                    onPress={() => setTitulo(opt.label)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={16}
                      color={isSelected ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.labelChipText,
                        isSelected && styles.labelChipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.formSectionTitle}>Datos del Destinatario</Text>
            <FormInputField
              label="Nombre de quien recibe *"
              value={nombreDestinatario}
              onChangeText={setNombreDestinatario}
              icon="person-outline"
              placeholder="Ej: Roberto Solórzano"
            />

            <FormInputField
              label="Teléfono de contacto *"
              value={telefono}
              onChangeText={setTelefono}
              icon="call-outline"
              placeholder="Ej: 7890-1234"
              keyboardType="phone-pad"
            />
          </View>

          {/* Card: Dirección exacta y ubicación */}
          <View style={styles.formCard}>
            <Text style={styles.formSectionTitle}>Detalles de Entrega</Text>

            <FormInputField
              label="Dirección exacta *"
              value={direccion}
              onChangeText={setDireccion}
              icon="location-outline"
              placeholder="Calle, avenida, pasaje, número de casa/apto"
            />

            <FormInputField
              label="Colonia / Residencial / Barrio"
              value={colonia}
              onChangeText={setColonia}
              icon="business-outline"
              placeholder="Ej: Col. Escalón, Residencial Los Sueños"
            />

            <View style={styles.fieldRowTwo}>
              <View style={{ flex: 1 }}>
                <FormInputField
                  label="Ciudad / Municipio *"
                  value={ciudad}
                  onChangeText={setCiudad}
                  icon="navigate-outline"
                  placeholder="Ej: San Salvador"
                />
              </View>
              <View style={{ flex: 1 }}>
                <FormInputField
                  label="Departamento *"
                  value={departamento}
                  onChangeText={setDepartamento}
                  icon="map-outline"
                  placeholder="Ej: San Salvador"
                />
              </View>
            </View>

            <View style={styles.fieldRowTwo}>
              <View style={{ flex: 1 }}>
                <FormInputField
                  label="Código Postal"
                  value={codigoPostal}
                  onChangeText={setCodigoPostal}
                  icon="mail-outline"
                  placeholder="Ej: 1101"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <FormInputField
                  label="Punto de Referencia"
                  value={referencia}
                  onChangeText={setReferencia}
                  icon="information-circle-outline"
                  placeholder="Frente al parque..."
                />
              </View>
            </View>

            {/* Toggle dirección principal */}
            <View style={styles.principalRow}>
              <View style={styles.principalLabelRow}>
                <Ionicons
                  name={esPrincipal ? 'star' : 'star-outline'}
                  size={20}
                  color={esPrincipal ? '#F59E0B' : colors.textSecondary}
                />
                <Text style={styles.principalLabel}>
                  Marcar como dirección principal
                </Text>
              </View>
              <Switch
                value={esPrincipal}
                onValueChange={setEsPrincipal}
                trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                thumbColor={esPrincipal ? colors.primary : '#F1F5F9'}
              />
            </View>
          </View>

          {/* Botón Guardar */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveBtnText}>
                {isEditing ? 'Actualizar Dirección' : 'Guardar Dirección'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default AddressFormScreen;
