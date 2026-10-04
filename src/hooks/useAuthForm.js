import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import useCustomData from './useCustomData';

export function useAuthForm() {
  const router = useRouter();
  const { loginClient } = useCustomData();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedInput, setFocusedInput] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const validate = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      newErrors.email = 'Ingresa un correo electrónico válido';
    }

    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      const result = await loginClient(email, password);
      setLoading(false);

      if (result.success && result.user) {
        setCurrentUser(result.user);
      } else {
        Alert.alert(
          'Error de Autenticación',
          result.error || 'No se pudo iniciar sesión con las credenciales proporcionadas.',
          [{ text: 'Entendido' }]
        );
      }
    } catch (err) {
      setLoading(false);
      Alert.alert(
        'Error de Conexión',
        'No se pudo conectar con el servidor.',
        [{ text: 'Aceptar' }]
      );
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setEmail('');
    setPassword('');
    setErrors({});
  };

  const handleSocialLogin = (provider) => {
    Alert.alert(
      'Continuar con ' + provider,
      `Iniciando autenticación mediante ${provider}...`,
      [{ text: 'Entendido' }]
    );
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

  const handleSignUp = () => {
    router.push('/register');
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    toggleShowPassword,
    loading,
    currentUser,
    updateCurrentUser: (updated) => setCurrentUser((prev) => ({ ...prev, ...updated })),
    handleLogout,
    errors,
    focusedInput,
    setFocusedInput,
    handleLogin,
    handleSocialLogin,
    handleForgotPassword,
    handleSignUp,
  };
}
