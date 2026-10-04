import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { loginStyles } from '../styles/loginStyles';
import { colors } from '../styles/theme';

export const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  leftIconName,
  leftIconText,
  showRightIcon = false,
  rightIconName,
  onPressRightIcon,
  topRightLinkText,
  onPressTopRightLink,
  isFocused = false,
  onFocus,
  onBlur,
  error,
  keyboardType = 'default',
  autoCapitalize = 'none',
  maxLength,
}) => {
  return (
    <View style={loginStyles.inputGroup}>
      {/* Label and optional Top Right Link */}
      <View style={loginStyles.labelRow}>
        <Text style={loginStyles.label}>{label}</Text>
        {topRightLinkText && (
          <TouchableOpacity onPress={onPressTopRightLink} activeOpacity={0.7}>
            <Text style={loginStyles.forgotText}>{topRightLinkText}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Input Container */}
      <View
        style={[
          loginStyles.inputContainer,
          isFocused && loginStyles.inputFocused,
          !!error && loginStyles.inputError,
        ]}
      >
        {/* Left Icon (Ionicons or Text like @) */}
        {leftIconName ? (
          <Ionicons
            name={leftIconName}
            size={20}
            color={colors.placeholder}
            style={loginStyles.inputIconLeft}
          />
        ) : leftIconText ? (
          <Text
            style={[
              loginStyles.inputIconLeft,
              { fontSize: 18, color: colors.placeholder, fontWeight: '500' },
            ]}
          >
            {leftIconText}
          </Text>
        ) : null}

        {/* Text Input Field */}
        <TextInput
          style={loginStyles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={secureTextEntry}
          onFocus={onFocus}
          onBlur={onBlur}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
        />

        {/* Optional Right Action Icon (Eye toggle) */}
        {showRightIcon && rightIconName && (
          <TouchableOpacity
            onPress={onPressRightIcon}
            activeOpacity={0.6}
            style={loginStyles.eyeIcon}
          >
            <Ionicons name={rightIconName} size={20} color={colors.placeholder} />
          </TouchableOpacity>
        )}
      </View>

      {/* Error Message */}
      {!!error && <Text style={loginStyles.errorText}>{error}</Text>}
    </View>
  );
};
