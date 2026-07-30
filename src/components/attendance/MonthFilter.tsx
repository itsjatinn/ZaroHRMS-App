import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type Props = {
  year: number;
  month: number; // 0-11
  onChange: (year: number, month: number) => void;
};

// Compact month stepper: ‹ Jun 2026 › — the single source for the page's
// month. Arrows step one month; tapping the label opens a direct picker
// (year stepper + month grid).
export default function MonthFilter({ year, month, onChange }: Props) {
  const [open, setOpen] = useState(false);
  // The year shown inside the picker; committed only when a month is tapped.
  const [pickerYear, setPickerYear] = useState(year);

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

  const openPicker = () => {
    setPickerYear(year);
    setOpen(true);
  };

  const pick = (m: number) => {
    setOpen(false);
    onChange(pickerYear, m);
  };

  return (
    <View className="flex-row items-center gap-1 rounded-xl border border-slate-200 bg-white px-1.5 py-1">
      <Pressable
        onPress={() => step(-1)}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Previous month"
        className="h-7 w-7 items-center justify-center rounded-lg active:bg-slate-100"
      >
        <ChevronLeft size={16} color="#14323F" />
      </Pressable>
      <Pressable
        onPress={openPicker}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Choose month"
        className="rounded-lg px-1 py-1 active:bg-slate-100"
      >
        <Text className="min-w-[64px] text-center text-[13px] font-bold text-ink">
          {MONTHS[month]} {year}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => step(1)}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Next month"
        className="h-7 w-7 items-center justify-center rounded-lg active:bg-slate-100"
      >
        <ChevronRight size={16} color="#14323F" />
      </Pressable>

      {/* Direct month picker */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          onPress={() => setOpen(false)}
          className="flex-1 items-center justify-center bg-black/40 px-8"
        >
          {/* Swallow taps so touching the card doesn't dismiss the modal. */}
          <Pressable
            onPress={() => {}}
            className="w-full max-w-[320px] rounded-[22px] bg-white p-5"
          >
            {/* Year stepper */}
            <View className="mb-4 flex-row items-center justify-between">
              <Pressable
                onPress={() => setPickerYear((y) => y - 1)}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Previous year"
                className="h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white active:bg-slate-100"
              >
                <ChevronLeft size={16} color="#14323F" />
              </Pressable>
              <Text className="text-base font-bold text-ink">{pickerYear}</Text>
              <Pressable
                onPress={() => setPickerYear((y) => y + 1)}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Next year"
                className="h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white active:bg-slate-100"
              >
                <ChevronRight size={16} color="#14323F" />
              </Pressable>
            </View>

            {/* Month grid */}
            <View className="flex-row flex-wrap justify-between gap-y-2">
              {MONTHS.map((label, m) => {
                const active = pickerYear === year && m === month;
                return (
                  <Pressable
                    key={label}
                    onPress={() => pick(m)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    className={`w-[23%] items-center justify-center rounded-xl py-2.5 ${
                      active ? 'bg-ink' : 'active:bg-slate-100'
                    }`}
                  >
                    <Text
                      className={`text-[13px] font-semibold ${
                        active ? 'text-white' : 'text-ink'
                      }`}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
