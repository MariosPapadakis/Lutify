import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SliderComponent from '@react-native-community/slider';
import Colors from '../constants/Colors';

interface SliderProps {
  label: string;
  value: number;
  minimumValue: number;
  maximumValue: number;
  step?: number;
  onValueChange: (value: number) => void;
  unit?: string;
}

export default function Slider({
  label,
  value,
  minimumValue,
  maximumValue,
  step = 0.01,
  onValueChange,
  unit = '',
}: SliderProps) {
  const formatValue = (val: number): string => {
    if (unit === '%') {
      return `${Math.round(val)}${unit}`;
    }
    return `${val.toFixed(2)}${unit}`;
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{formatValue(value)}</Text>
      </View>
      <SliderComponent
        style={styles.slider}
        value={value}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        onValueChange={onValueChange}
        minimumTrackTintColor={Colors.dark.primary}
        maximumTrackTintColor={Colors.dark.borderLight}
        thumbTintColor={Colors.dark.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.dark.text,
    letterSpacing: -0.1,
  },
  value: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.dark.textSecondary,
    letterSpacing: -0.1,
  },
  slider: {
    width: '100%',
    height: 40,
  },
});


