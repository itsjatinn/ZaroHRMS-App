import type { ViewStyle } from 'react-native';

// Low-elevation surface treatment shared by secondary app cards.
// Primary status cards can define their own stronger treatment locally.
export const cardShadow: ViewStyle = {
  shadowColor: '#14323F',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.025,
  shadowRadius: 6,
  elevation: 1,
};
