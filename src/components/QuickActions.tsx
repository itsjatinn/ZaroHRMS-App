import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { cardShadow } from './shadow';

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
    icon: <MaterialCommunityIcons name="calendar-plus" size={24} color="#059669" />,
  },
  {
    label: 'Regularize',
    route: '/regularize',
    tile: 'bg-amber-100',
    icon: <MaterialCommunityIcons name="clipboard-edit-outline" size={24} color="#D9A53B" />,
  },
  {
    label: 'Holiday\ncalendar',
    route: '/holidays',
    tile: 'bg-rose-100',
    icon: <Feather name="calendar" size={24} color="#E0785C" />,
  },
];

export default function QuickActions() {
  const router = useRouter();

  return (
    <View style={cardShadow} className="rounded-3xl bg-white p-6">
      <Text className="text-base font-bold text-ink">Quick actions</Text>

      <View className="mt-6 flex-row gap-3">
        {ACTIONS.map((action) => (
          <Pressable
            key={action.label}
            onPress={() => router.push(action.route)}
            className="flex-1 items-center rounded-2xl border border-slate-100 px-2 py-4 transition duration-200 active:scale-95"
          >
            <View
              className={`h-12 w-12 items-center justify-center rounded-2xl ${action.tile}`}
            >
              {action.icon}
            </View>
            <Text className="mt-2.5 text-center text-xs font-semibold text-ink">
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
