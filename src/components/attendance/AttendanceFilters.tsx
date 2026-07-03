import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { RANGES, type RangeKey } from './attendanceStats';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

type Props = {
  month: number; // 0-11
  year: number;
  range: RangeKey;
  onMonthChange: (month: number, year: number) => void;
  onRangeChange: (range: RangeKey) => void;
};

export default function AttendanceFilters({
  month,
  year,
  range,
  onMonthChange,
  onRangeChange,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

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
    onMonthChange(m, y);
  };

  const rangeLabel = RANGES.find((r) => r.key === range)?.label ?? 'This Month';

  return (
    <View className="flex-row items-center justify-between">
      {/* Month navigator */}
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={() => step(-1)}
          hitSlop={6}
          className="h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white active:scale-95"
        >
          <ChevronLeft size={18} color="#14323F" />
        </Pressable>
        <Text className="min-w-[92px] text-center text-[15px] font-bold text-ink">
          {FULL[month]} {year}
        </Text>
        <Pressable
          onPress={() => step(1)}
          hitSlop={6}
          className="h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white active:scale-95"
        >
          <ChevronRight size={18} color="#14323F" />
        </Pressable>
      </View>

      {/* Range dropdown */}
      <Pressable
        onPress={() => setPickerOpen(true)}
        className="flex-row items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 active:scale-95"
      >
        <Text className="text-[13px] font-semibold text-ink">{rangeLabel}</Text>
        <ChevronDown size={15} color="#64748B" />
      </Pressable>

      {/* Range picker sheet */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setPickerOpen(false)}>
          <Pressable className="rounded-t-[28px] bg-white px-5 pb-8 pt-5">
            <View className="mb-2 h-1 w-10 self-center rounded-full bg-slate-200" />
            <Text className="mb-3 text-base font-bold text-ink">Show</Text>
            {RANGES.map((r) => {
              const active = r.key === range;
              return (
                <Pressable
                  key={r.key}
                  onPress={() => {
                    onRangeChange(r.key);
                    setPickerOpen(false);
                  }}
                  className={`rounded-2xl px-4 py-3.5 ${active ? 'bg-[#F5D14E]/15' : 'active:bg-slate-50'}`}
                >
                  <Text className={`text-[15px] ${active ? 'font-bold text-ink' : 'text-slate-700'}`}>
                    {r.label}
                  </Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export { MONTHS };
