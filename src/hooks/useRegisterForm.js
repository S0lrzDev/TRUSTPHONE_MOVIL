import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import useCustomData from './useCustomData';
import {
  isValidEmail,
  isValidPhone,
  validateBirthDate,
  parseDateDMY,
  formatDateInput,
  MIN_PASSWORD,
} from '../utils/validations';

export function useRegisterForm() {
  const router = useRouter();
  const { registerClient } = useCustomData();

  const [fullName, setFullName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedInput, setFocusedInput] = useState(null);

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const validate = () => {
    const newErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'El nombre es requerido';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }

    if (!email.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Ingresa un correo electrónico válido';
    }

    if (!phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    } else if (!isValidPhone(phone)) {
      newErrors.phone = 'El teléfono debe tener entre 8 y 15 dígitos';
    }

    const birthError = validateBirthDate(birthDate);
    if (birthError) {
      newErrors.birthDate = birthError;
    }

    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (password.length < MIN_PASSWORD) {
      newErrors.password = `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres`;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Debes confirmar tu contraseña';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setSubmitting(true);

    const nombre = fullName.trim();

    const clientPayload = {
      nombre,
      Apellido: lastName.trim(),
      correo: email.trim(),
      contrasena: password,
      telefono: phone.trim(),
      fechaNacimiento: parseDateDMY(birthDate),
      estado: 'Activo',
    };

    const result = await registerClient(clientPayload);
    setSubmitting(false);

    if (result.success) {
      Alert.alert(
        'Verificación Requerida',
        `Se ha enviado un código de verificación a ${email.trim()}. Ingrésalo a continuación para activar tu cuenta.`,
        [
          {
            text: 'Ingresar Código',
            onPress: () => {
              router.push({
                pathname: '/verify-email',
                params: { email: email.trim(), nombre },
              });
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Error de Registro',
        result.error || 'No se pudo registrar el cliente.',
        [{ text: 'Entendido' }]
      );
    }
  };

  const handleGoToLogin = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return {
    fullName,
    setFullName,
    lastName,
    setLastName,
    phone,
    setPhone,
    birthDate,
    setBirthDate: (text) => setBirthDate((prev) => formatDateInput(text, prev)),
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    toggleShowPassword,
    loading: submitting,
    errors,
    focusedInput,
    setFocusedInput,
    handleRegister,
    handleGoToLogin,
  };
}
