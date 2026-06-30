import { Check, ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

type DropdownProps = {
  value: string | null;
  placeholder: string;
  options: readonly string[];
  onSelect: (value: string) => void;
  error?: boolean;
  className?: string;
};

// Lightweight select built on a transparent Modal (RN has no native <select>).
export default function Dropdown({
  value,
  placeholder,
  options,
  onSelect,
  error = false,
  className = '',
}: DropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <View className={className}>
      <Pressable
        onPress={() => setOpen(true)}
        className={`h-12 flex-row items-center justify-between rounded-xl border bg-white px-3.5 ${
          error ? 'border-red-400' : 'border-slate-200'
        }`}
      >
        <Text className={value ? 'text-sm text-ink' : 'text-sm text-slate-400'}>
          {value ?? placeholder}
        </Text>
        <ChevronDown size={18} color="#94A3B8" />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        {/* Tap-outside backdrop closes the menu */}
        <Pressable
          onPress={() => setOpen(false)}
          className="flex-1 justify-center bg-black/30 px-8"
        >
          <View className="overflow-hidden rounded-2xl bg-white p-1.5">
            {options.map((option) => {
              const selected = option === value;
              return (
                <Pressable
                  key={option}
                  onPress={() => {
                    onSelect(option);
                    setOpen(false);
                  }}
                  className={`flex-row items-center justify-between rounded-xl px-4 py-3 ${
                    selected ? 'bg-blue-50' : 'active:bg-slate-100'
                  }`}
                >
                  <Text
                    className={`text-base ${
                      selected ? 'font-semibold text-blue-600' : 'text-ink'
                    }`}
                  >
                    {option}
                  </Text>
                  {selected && <Check size={18} color="#2563EB" />}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
