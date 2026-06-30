import { Text, View } from 'react-native';

import { cardShadow } from '../shadow';
import type { InfoItem } from './profileData';

type Props = {
  title: string;
  items: InfoItem[];
};

// A titled card listing label/value rows with icon badges.
export default function InfoCard({ title, items }: Props) {
  return (
    <View style={cardShadow} className="rounded-2xl bg-white p-5">
      <Text className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </Text>
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <View
            key={item.label}
            className={`flex-row items-center gap-3 py-3 ${i > 0 ? 'border-t border-slate-100' : ''}`}
          >
            <View className={`h-9 w-9 items-center justify-center rounded-xl ${item.badge}`}>
              <Icon size={17} color={item.color} />
            </View>
            <View className="flex-1">
              <Text className="text-[11px] uppercase tracking-wide text-slate-400">
                {item.label}
              </Text>
              <Text className="text-sm font-semibold text-ink">{item.value}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
