import type { ViewStyle } from 'react-native';

// Soft, consistent shadow shared by every dashboard card.
// (shadow* props apply on iOS, elevation applies on Android.)
export const cardShadow: ViewStyle = {
  shadowColor: '#14323F',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
};
