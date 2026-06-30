import { ChevronDown, LifeBuoy } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { cardShadow } from '../shadow';
import { FAQS } from './supportData';

// FAQ card with a single-open accordion.
export default function FaqCard() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <View style={cardShadow} className="rounded-2xl bg-white p-5">
      <View className="mb-1 flex-row items-center gap-2">
        <LifeBuoy size={18} color="#14323F" />
        <Text className="text-base font-bold text-ink">FAQs</Text>
      </View>
      {FAQS.map((item, i) => {
        const expanded = open === i;
        return (
          <View key={item.q} className={i > 0 ? 'border-t border-slate-100' : ''}>
            <Pressable
              onPress={() => setOpen(expanded ? null : i)}
              className="flex-row items-center justify-between py-3.5"
            >
              <Text className="flex-1 pr-3 text-sm font-semibold text-ink">{item.q}</Text>
              <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
                <ChevronDown size={18} color="#94A3B8" />
              </View>
            </Pressable>
            {expanded && (
              <Text className="pb-3.5 text-sm leading-5 text-slate-500">{item.a}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}
