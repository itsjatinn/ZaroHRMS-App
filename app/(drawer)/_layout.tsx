import { Drawer } from 'expo-router/drawer';
import { Platform, useWindowDimensions } from 'react-native';

import DrawerContent from '../../src/components/DrawerContent';

export default function DrawerLayout() {
  const { width } = useWindowDimensions();
  const drawerWidth =
    Platform.OS === 'web'
      ? Math.min(Math.max(width * 0.62, 232), 292)
      : Math.min(Math.max(width * 0.64, 232), 292);

  return (
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        // Transparent so the navy backdrop isn't darkened into a seam at the drawer edge
        overlayColor: 'transparent',
        drawerStyle: {
          backgroundColor: '#14323F',
          // Numeric and bounded on every platform: percentage drawers can look
          // oversized on phones with display scaling and on Expo web.
          width: drawerWidth,
        },
      }}
    >
      {/* The drawer wraps the whole tab navigator */}
      <Drawer.Screen name="(tabs)" />
    </Drawer>
  );
}
