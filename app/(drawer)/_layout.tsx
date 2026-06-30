import { Drawer } from 'expo-router/drawer';

import DrawerContent from '../../src/components/DrawerContent';

export default function DrawerLayout() {
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
          width: '65%',
        },
      }}
    >
      {/* The drawer wraps the whole tab navigator */}
      <Drawer.Screen name="(tabs)" />
    </Drawer>
  );
}
