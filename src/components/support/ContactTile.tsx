import { Alert, Pressable, Text, View } from 'react-native';

import { cardShadow } from '../shadow';
import type { Contact } from './supportData';

export default function ContactTile({ contact }: { contact: Contact }) {
  const Icon = contact.icon;
  return (
    <Pressable
      onPress={() => Alert.alert(contact.label, contact.action)}
      style={cardShadow}
      className="flex-1 items-center rounded-[24px] border border-slate-100 bg-white px-2 py-4 active:scale-95"
    >
      <View className={`h-11 w-11 items-center justify-center rounded-2xl ${contact.badge}`}>
        <Icon size={20} color={contact.color} />
      </View>
      <Text className="mt-2 text-sm font-semibold text-ink">{contact.label}</Text>
    </Pressable>
  );
}
