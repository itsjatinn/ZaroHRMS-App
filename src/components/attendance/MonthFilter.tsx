import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type Props = {
  year: number;
  month: number; // 0-11
  onChange: (year: number, month: number) => void;
};

// Compact month stepper: ‹ Jun 2026 › — the single source for the page's month.
export default function MonthFilter({ year, month, onChange }: Props) {
  const step = (dir: -1 | 1) => {
    let m = month + dir;
    let y = year;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    onChange(y, m);
  };

  return (
    <View className="flex-row items-center gap-1 rounded-full border border-slate-200 bg-white px-1.5 py-1">
      <Pressable onPress={() => step(-1)} hitSlop={6} className="h-7 w-7 items-center justify-center rounded-full active:bg-slate-100">
        <ChevronLeft size={16} color="#14323F" />
      </Pressable>
      <Text className="min-w-[64px] text-center text-[13px] font-bold text-ink">
        {MONTHS[month]} {year}
      </Text>
      <Pressable onPress={() => step(1)} hitSlop={6} className="h-7 w-7 items-center justify-center rounded-full active:bg-slate-100">
        <ChevronRight size={16} color="#14323F" />
      </Pressable>
    </View>
  );
}
