import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { STATUS_META, type LogEntry } from './activityLogData';

type LogRowProps = {
  entry: LogEntry;
  /** Absent rows can offer the shortcut into the regularize form. */
  showRegularize?: boolean;
};

// One day of the attendance log: status icon tile, date, punch times, hours
// and status label — plus an optional Regularize shortcut on absent days.
export default function LogRow({ entry, showRegularize = false }: LogRowProps) {
  const router = useRouter();
  const meta = STATUS_META[entry.status];
  const Icon = meta.icon;
  const canRegularize = showRegularize && entry.status === 'absent';

  return (
    <View className="py-3">
      <View className="flex-row items-center gap-3">
        <View
          className={`h-9 w-9 items-center justify-center rounded-xl ${meta.badge}`}
        >
          <Icon size={16} color={meta.color} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold text-ink">{entry.date}</Text>
          <Text className="text-xs text-slate-400">
            {entry.in} – {entry.out}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-sm font-bold text-ink">{entry.hours}</Text>
          <Text
            className="text-xs font-semibold"
            style={{ color: meta.color }}
          >
            {meta.label}
          </Text>
        </View>
      </View>

      {canRegularize ? (
        <View className="mt-2 flex-row justify-end">
          <Pressable
            onPress={() => router.push(`/regularize?date=${entry.iso}`)}
            hitSlop={8}
            accessibilityRole="button"
            className="active:opacity-60"
          >
            <Text className="text-[13px] font-bold text-ink">
              Regularize this day
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
