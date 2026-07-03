import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

type Action = {
  label: string;
  route: string;
  tile: string;
  icon: ReactNode;
};

const ACTIONS: Action[] = [
  {
    label: 'Apply leave',
    route: '/apply-leave',
    tile: 'bg-emerald-100',
    icon: <MaterialCommunityIcons name="calendar-plus" size={18} color="#059669" />,
  },
  {
    label: 'Regularize',
    route: '/regularize',
    tile: 'bg-amber-100',
    icon: <MaterialCommunityIcons name="clipboard-edit-outline" size={18} color="#D9A53B" />,
  },
  {
    label: 'Holidays',
    route: '/holidays',
    tile: 'bg-rose-100',
    icon: <Feather name="calendar" size={18} color="#E0785C" />,
  },
];

export default function QuickActions() {
  const router = useRouter();

  return (
    <View>
      <Text className="px-1 text-base font-bold text-ink">Quick actions</Text>
      <View className="mt-3 flex-row gap-3">
        {ACTIONS.map((action) => (
          <Pressable
            key={action.label}
            onPress={() => router.push(action.route)}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white px-3 py-3 transition duration-200 active:scale-95 active:bg-slate-50"
          >
            <View
              className={`h-9 w-9 items-center justify-center rounded-xl ${action.tile}`}
            >
              {action.icon}
            </View>
            <Text className="flex-1 text-xs font-bold text-ink">
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
