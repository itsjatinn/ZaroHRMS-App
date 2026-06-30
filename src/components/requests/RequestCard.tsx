import { Text, View } from 'react-native';

import { cardShadow } from '../shadow';
import { STATUS_META, type Request } from './requestsData';

export default function RequestCard({ item }: { item: Request }) {
  const meta = STATUS_META[item.status];
  const StatusIcon = meta.icon;
  const TypeIcon = item.icon;

  return (
    <View style={cardShadow} className="flex-row items-center gap-3 rounded-2xl bg-white p-4">
      <View className={`h-11 w-11 items-center justify-center rounded-xl ${item.badge}`}>
        <TypeIcon size={20} color={item.color} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-bold text-ink">{item.title}</Text>
        <Text className="text-xs text-slate-400">
          {item.type} · {item.sub}
        </Text>
      </View>
      <View className={`flex-row items-center gap-1 rounded-full px-2.5 py-1 ${meta.badge}`}>
        <StatusIcon size={12} color={meta.color} />
        <Text className="text-xs font-semibold" style={{ color: meta.color }}>
          {item.status}
        </Text>
      </View>
    </View>
  );
}
