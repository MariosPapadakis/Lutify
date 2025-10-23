import { Platform } from 'react-native';
import { SymbolView, SymbolViewProps, SFSymbol } from 'expo-symbols';

interface SymbolProps extends Omit<SymbolViewProps, 'name'> {
  name: SFSymbol;
  size?: number;
  tintColor?: string;
}

/**
 * A cross-platform symbol component that uses SF Symbols on iOS
 * and falls back to the provided fallback on other platforms.
 */
export default function Symbol({ 
  name, 
  size = 24, 
  tintColor, 
  fallback,
  style,
  ...props 
}: SymbolProps) {
  // On non-iOS platforms, return the fallback
  if (Platform.OS !== 'ios') {
    return fallback || null;
  }

  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={tintColor}
      style={[{ width: size, height: size }, style]}
      {...props}
    />
  );
}

