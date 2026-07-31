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
          // 65% lands at ~254px against the 390px design width, which is what
          // the avatar and menu labels are sized for. The percentage alone is
          // unbounded though: on a tablet or desktop it becomes a 600px+ panel,
          // and on a narrow viewport it squeezes below what the fixed-size
          // contents need. Clamp both ends.
          width: '65%',
          minWidth: 240,
          maxWidth: 320,
        },
      }}
    >
      {/* The drawer wraps the whole tab navigator */}
      <Drawer.Screen name="(tabs)" />
    </Drawer>
  );
}
