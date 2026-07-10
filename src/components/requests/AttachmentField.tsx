import { Paperclip } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

type AttachmentFieldProps = {
  fileName: string | null;
  onPress: () => void;
};

export default function AttachmentField({
  fileName,
  onPress,
}: AttachmentFieldProps) {
  return (
    <Pressable
      onPress={onPress}
      className="min-h-14 flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 active:bg-slate-100"
    >
      <View className="h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white">
        <Paperclip size={17} color="#64748B" />
      </View>

      <View className="min-w-0 flex-1">
        <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Supporting file
        </Text>
        <Text
          numberOfLines={1}
          className={fileName ? 'mt-0.5 text-sm font-semibold text-ink' : 'mt-0.5 text-sm text-slate-500'}
        >
          {fileName ?? 'No file chosen'}
        </Text>
      </View>

      <View className="h-9 items-center justify-center rounded-xl bg-ink px-4">
        <Text className="text-sm font-bold text-white">Browse</Text>
      </View>
    </Pressable>
  );
}
