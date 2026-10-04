import React from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRegisterForm } from '../hooks/useRegisterForm';
import { HeaderRegisterLogo } from '../components/HeaderRegisterLogo';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { loginStyles } from '../styles/loginStyles';

export const RegisterScreen = () => {
  const {
    fullName,
    setFullName,
    lastName,
    setLastName,
    phone,
    setPhone,
    birthDate,
    setBirthDate,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    toggleShowPassword,
    loading,
    errors,
    focusedInput,
    setFocusedInput,
    handleRegister,
    handleSocialRegister,
    handleGoToLogin,
  } = useRegisterForm();

  return (
    <SafeAreaView style={loginStyles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={loginStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={loginStyles.card}>
            {/* Header: Back Arrow, Title, Squircle Shield Icon, Brand Name & Tagline */}
            <HeaderRegisterLogo onBackPress={handleGoToLogin} />

            {/* Registration Form */}
            <View style={loginStyles.form}>
              {/* Full Name Input */}
              <Input
                label="Nombre"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Juan"
                leftIconName="person-outline"
                autoCapitalize="words"
                isFocused={focusedInput === 'fullName'}
                onFocus={() => setFocusedInput('fullName')}
                onBlur={() => setFocusedInput(null)}
                error={errors.fullName}
              />

              {/* Last Name Input */}
              <Input
                label="Apellido"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Pérez"
                leftIconName="person-outline"
                autoCapitalize="words"
                isFocused={focusedInput === 'lastName'}
                onFocus={() => setFocusedInput('lastName')}
                onBlur={() => setFocusedInput(null)}
                error={errors.lastName}
              />

              {/* Email Input */}
              <Input
                label="Correo Electrónico"
                value={email}
                onChangeText={setEmail}
                placeholder="usuario@trustphone.com"
                leftIconName="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                isFocused={focusedInput === 'email'}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
                error={errors.email}
              />

              {/* Phone Input */}
              <Input
                label="Teléfono"
                value={phone}
                onChangeText={setPhone}
                placeholder="7012-3456"
                leftIconName="call-outline"
                keyboardType="phone-pad"
                maxLength={15}
                isFocused={focusedInput === 'phone'}
                onFocus={() => setFocusedInput('phone')}
                onBlur={() => setFocusedInput(null)}
                error={errors.phone}
              />

              {/* Birth Date Input */}
              <Input
                label="Fecha de Nacimiento"
                value={birthDate}
                onChangeText={setBirthDate}
                placeholder="DD/MM/AAAA"
                leftIconName="calendar-outline"
                keyboardType="number-pad"
                maxLength={10}
                isFocused={focusedInput === 'birthDate'}
                onFocus={() => setFocusedInput('birthDate')}
                onBlur={() => setFocusedInput(null)}
                error={errors.birthDate}
              />

              {/* Password Input */}
              <Input
                label="Contraseña"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                leftIconName="lock-closed-outline"
                showRightIcon={true}
                rightIconName={showPassword ? 'eye-outline' : 'eye-off-outline'}
                onPressRightIcon={toggleShowPassword}
                isFocused={focusedInput === 'password'}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                error={errors.password}
              />

              {/* Confirm Password Input */}
              <Input
                label="Confirmar Contraseña"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                leftIconName="lock-closed-outline"
                isFocused={focusedInput === 'confirmPassword'}
                onFocus={() => setFocusedInput('confirmPassword')}
                onBlur={() => setFocusedInput(null)}
                error={errors.confirmPassword}
              />

              {/* Primary Register Button */}
              <Button
                title="Registrarse"
                onPress={handleRegister}
                loading={loading}
              />
            </View>

            {/* Footer Login Link */}
            <View style={[loginStyles.footerRow, { marginTop: 24 }]}>
              <Text style={loginStyles.footerText}>¿Ya tienes una cuenta? </Text>
              <TouchableOpacity onPress={handleGoToLogin} activeOpacity={0.7}>
                <Text style={loginStyles.footerLink}>Iniciar Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
