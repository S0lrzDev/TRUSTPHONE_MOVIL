import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import useCustomData from './useCustomData';
import { isValidEmail, MIN_PASSWORD } from '../utils/validations';

// Pasos: 'email' -> 'code' -> 'password'
export function useForgotPassword() {
  const router = useRouter();
  const { requestRecoveryCode, verifyRecoveryCode, resetPassword } = useCustomData();

  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedInput, setFocusedInput] = useState(null);

  const goToLogin = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleBack = () => {
    setErrors({});
    if (step === 'password') setStep('code');
    else if (step === 'code') setStep('email');
    else goToLogin();
  };

  // Paso 1: enviar código al correo
  const handleSendCode = async () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Ingresa un correo electrónico válido';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    const result = await requestRecoveryCode(email);
    setLoading(false);

    if (result.success) {
      setCode('');
      setStep('code');
      Alert.alert('Código enviado', `Revisa tu bandeja de entrada (o spam) en ${email.trim()}. El código expira en 15 minutos.`);
    } else {
      Alert.alert('No se pudo enviar', result.error);
    }
  };

  // Paso 2: verificar el código
  const handleVerifyCode = async () => {
    const newErrors = {};
    if (!code.trim()) {
      newErrors.code = 'Ingresa el código que recibiste';
    } else if (!/^[0-9a-fA-F]{6}$/.test(code.trim())) {
      newErrors.code = 'El código tiene 6 caracteres';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    const result = await verifyRecoveryCode(code);
    setLoading(false);

    if (result.success) {
      setStep('password');
    } else {
      setErrors({ code: result.error });
    }
  };

  // Paso 3: guardar la nueva contraseña
  const handleResetPassword = async () => {
    const newErrors = {};
    if (!newPassword) {
      newErrors.newPassword = 'La contraseña es requerida';
    } else if (newPassword.length < MIN_PASSWORD) {
      newErrors.newPassword = `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres`;
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Debes confirmar tu contraseña';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    const result = await resetPassword(newPassword, confirmPassword);
    setLoading(false);

    if (result.success) {
      Alert.alert('Contraseña actualizada', 'Ya puedes iniciar sesión con tu nueva contraseña.', [
        { text: 'Iniciar Sesión', onPress: goToLogin },
      ]);
    } else {
      Alert.alert('Error', result.error);
    }
  };

  return {
    step,
    email,
    setEmail,
    code,
    setCode,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    toggleShowPassword: () => setShowPassword((prev) => !prev),
    loading,
    errors,
    focusedInput,
    setFocusedInput,
    handleBack,
    handleSendCode,
    handleVerifyCode,
    handleResetPassword,
    goToLogin,
  };
}
