import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { loginStyles } from '../styles/loginStyles';
import { colors } from '../styles/theme';

export const HeaderRegisterLogo = ({ onBackPress, title = 'Crear Cuenta' }) => {
  return (
    <View style={{ alignItems: 'center', width: '100%', marginBottom: 12 }}>
      {/* Top Header Row with Back Button and Title */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          width: '100%',
          marginBottom: 20,
        }}
      >
        <TouchableOpacity
          onPress={onBackPress}
          activeOpacity={0.7}
          style={{ padding: 4 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', marginRight: 28 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: colors.textPrimary,
            }}
          >
            {title}
          </Text>
        </View>
      </View>

      {/* Brand Icon Shield Squircle with Upward Shield Icon */}
      <View style={loginStyles.iconBox}>
        <Ionicons name="shield" size={32} color={colors.background} />
      </View>

      {/* Brand Name & Tagline Subtitle */}
      <Text
        style={[
          loginStyles.appName,
          { fontSize: 24, marginBottom: 4, color: colors.primary },
        ]}
      >
        TrustPhone
      </Text>
      <Text
        style={[
          loginStyles.subtitle,
          { marginBottom: 20, color: colors.textSecondary },
        ]}
      >
        Protegiendo tu comunicación
      </Text>
    </View>
  );
};
