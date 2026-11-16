// Member 6 – Shared UI: one icon set for the whole app (Material Design Icons).
// Browse names at https://pictogrammers.com/library/mdi/ (e.g. "home-variant", "recycle").
import React from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../constants';

interface AppIconProps {
  name: string;
  size?: number;
  color?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({ name, size = 22, color = COLORS.text }) => (
  <MaterialCommunityIcons name={name} size={size} color={color} accessible={false} importantForAccessibility="no" />
);
