import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { cardShadow } from './shadow';

const ACTIONS = [
  {
    label: 'Apply leave',
    route: '/leave',
    tile: 'bg-[#F5D14E]/20',
    icon: <MaterialCommunityIcons name="palm-tree" size={22} color="#C99A1F" />,
  },
  {
    label: 'Payslips',
    route: '/payslips',
    tile: 'bg-emerald-100',
    icon: <Ionicons name="document-text-outline" size={22} color="#059669" />,
  },
  {
    label: 'Regularize',
    route: '/regularize',
    tile: 'bg-sky-100',
    icon: <Feather name="clock" size={22} color="#2563EB" />,
  },
  {
    label: 'Documents',
    route: '/documents',
    tile: 'bg-violet-100',
    icon: <Feather name="file" size={22} color="#7C3AED" />,
  },
];

export default function QuickActions() {
  const router = useRouter();

  return (
    <View style={cardShadow} className="flex-row rounded-3xl bg-white p-5">
      {ACTIONS.map((action) => (
        <Pressable
          key={action.label}
          onPress={() => router.push(action.route)}
          className="flex-1 items-center"
        >
          <View
            className={`h-14 w-14 items-center justify-center rounded-2xl ${action.tile}`}
          >
            {action.icon}
          </View>
          <Text className="mt-2 text-xs font-medium text-ink">{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
