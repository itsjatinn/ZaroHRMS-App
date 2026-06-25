import { ChevronRight } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

type RowProps = {
  icon: LucideIcon;
  color: string;
  badge: string;
  label: string;
  value?: string;
  onPress?: () => void;
  first?: boolean;
};

// A tappable settings row with a leading icon badge and trailing value/chevron.
export default function SettingsRow({
  icon: Icon,
  color,
  badge,
  label,
  value,
  onPress,
  first,
}: RowProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 py-3 ${first ? '' : 'border-t border-slate-100'}`}
    >
      <View className={`h-9 w-9 items-center justify-center rounded-xl ${badge}`}>
        <Icon size={17} color={color} />
      </View>
      <Text className="flex-1 text-sm font-semibold text-ink">{label}</Text>
      {value ? <Text className="mr-1 text-sm text-slate-400">{value}</Text> : null}
      <ChevronRight size={18} color="#CBD5E1" />
    </Pressable>
  );
}

export function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="mb-2 ml-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
      {children}
    </Text>
  );
}
