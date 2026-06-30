import { Megaphone, Pin } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { cardShadow } from '../shadow';
import type { Announcement } from './announcementsData';

export default function AnnouncementCard({ item }: { item: Announcement }) {
  return (
    <View
      style={cardShadow}
      className={`rounded-2xl bg-white p-5 ${item.pinned ? 'border border-[#F5D14E]' : ''}`}
    >
      <View className="flex-row items-center justify-between">
        <View className={`flex-row items-center gap-1.5 rounded-md px-2 py-0.5 ${item.badge}`}>
          {item.pinned ? (
            <Pin size={11} color={item.color} />
          ) : (
            <Megaphone size={11} color={item.color} />
          )}
          <Text className="text-xs font-semibold" style={{ color: item.color }}>
            {item.category}
          </Text>
        </View>
        <Text className="text-xs text-slate-400">{item.date}</Text>
      </View>

      <Text className="mt-3 text-base font-bold text-ink">{item.title}</Text>
      <Text className="mt-1 text-sm leading-5 text-slate-500">{item.excerpt}</Text>
    </View>
  );
}
