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
import { useForgotPassword } from '../hooks/useForgotPassword';
import { HeaderRegisterLogo } from '../components/HeaderRegisterLogo';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { loginStyles } from '../styles/loginStyles';
import { colors } from '../styles/theme';

const STEP_TEXT = {
  email: 'Ingresa el correo de tu cuenta y te enviaremos un código de verificación.',
  code: 'Escribe el código de 6 caracteres que enviamos a tu correo.',
  password: 'Crea tu nueva contraseña.',
};

export const ForgotPasswordScreen = () => {
  const {
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
    toggleShowPassword,
    loading,
    errors,
    focusedInput,
    setFocusedInput,
    handleBack,
    handleSendCode,
    handleVerifyCode,
    handleResetPassword,
    goToLogin,
  } = useForgotPassword();

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
            <HeaderRegisterLogo onBackPress={handleBack} title="Recuperar Contraseña" />

            <Text
              style={{
                textAlign: 'center',
                color: colors.textSecondary,
                fontSize: 14,
                marginBottom: 20,
                lineHeight: 20,
              }}
            >
              {STEP_TEXT[step]}
            </Text>

            <View style={loginStyles.form}>
              {step === 'email' && (
                <>
                  <Input
                    label="Correo Electrónico"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="usuario@trustphone.com"
                    leftIconName="mail-outline"
                    keyboardType="email-address"
                    isFocused={focusedInput === 'email'}
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                    error={errors.email}
                  />
                  <Button title="Enviar Código" onPress={handleSendCode} loading={loading} />
                </>
              )}

              {step === 'code' && (
                <>
                  <Input
                    label="Código de Verificación"
                    value={code}
                    onChangeText={setCode}
                    placeholder="a1b2c3"
                    leftIconName="key-outline"
                    maxLength={6}
                    isFocused={focusedInput === 'code'}
                    onFocus={() => setFocusedInput('code')}
                    onBlur={() => setFocusedInput(null)}
                    error={errors.code}
                  />
                  <Button title="Verificar Código" onPress={handleVerifyCode} loading={loading} />
                  <TouchableOpacity
                    onPress={handleSendCode}
                    disabled={loading}
                    activeOpacity={0.7}
                    style={{ alignItems: 'center', marginTop: 16 }}
                  >
                    <Text style={loginStyles.footerLink}>Reenviar código</Text>
                  </TouchableOpacity>
                </>
              )}

              {step === 'password' && (
                <>
                  <Input
                    label="Nueva Contraseña"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                    leftIconName="lock-closed-outline"
                    showRightIcon={true}
                    rightIconName={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    onPressRightIcon={toggleShowPassword}
                    isFocused={focusedInput === 'newPassword'}
                    onFocus={() => setFocusedInput('newPassword')}
                    onBlur={() => setFocusedInput(null)}
                    error={errors.newPassword}
                  />
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
                  <Button title="Guardar Contraseña" onPress={handleResetPassword} loading={loading} />
                </>
              )}
            </View>

            <View style={[loginStyles.footerRow, { marginTop: 24 }]}>
              <Text style={loginStyles.footerText}>¿Recordaste tu contraseña? </Text>
              <TouchableOpacity onPress={goToLogin} activeOpacity={0.7}>
                <Text style={loginStyles.footerLink}>Iniciar Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;
