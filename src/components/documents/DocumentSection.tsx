import { Download } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { cardShadow } from '../shadow';
import type { Doc } from './documentsData';

type Props = {
  title: string;
  docs: Doc[];
  onDownload: (name: string) => void;
};

// One titled card listing the documents in a category.
export default function DocumentSection({ title, docs, onDownload }: Props) {
  return (
    <View style={cardShadow} className="rounded-[24px] border border-slate-100 bg-white p-5">
      <Text className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </Text>
      {docs.map((doc, i) => {
        const Icon = doc.icon;
        return (
          <View
            key={doc.name}
            className={`flex-row items-center gap-3 py-3 ${i > 0 ? 'border-t border-slate-100' : ''}`}
          >
            <View className={`h-10 w-10 items-center justify-center rounded-xl ${doc.badge}`}>
              <Icon size={18} color={doc.color} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-ink">{doc.name}</Text>
              <Text className="text-xs text-slate-400">{doc.meta}</Text>
            </View>
            <Pressable
              onPress={() => onDownload(doc.name)}
              hitSlop={6}
              className="h-9 w-9 items-center justify-center rounded-xl border border-slate-200 active:scale-95"
            >
              <Download size={18} color="#14323F" />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
