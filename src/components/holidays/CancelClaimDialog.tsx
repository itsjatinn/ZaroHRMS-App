import { CalendarDays } from 'lucide-react-native';
import { Modal, Pressable, Text, View } from 'react-native';

import type { CalendarHoliday } from './holidayCalendarData';

type CancelClaimDialogProps = {
  holiday: CalendarHoliday | null;
  onKeep: () => void;
  onConfirm: (holiday: CalendarHoliday) => void;
};

// Cancelling an already-approved optional holiday takes a leave day back off
// the attendance calendar, so it asks first — same confirmation as the web.
export default function CancelClaimDialog({
  holiday,
  onKeep,
  onConfirm,
}: CancelClaimDialogProps) {
  if (!holiday) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onKeep}>
      <Pressable
        className="flex-1 items-center justify-center bg-black/45 px-6"
        onPress={onKeep}
      >
        <Pressable className="w-full rounded-2xl border border-[#14323F]/10 bg-white p-6">
          <View className="h-11 w-11 items-center justify-center rounded-xl bg-[#E0785C]/15">
            <CalendarDays size={20} color="#B04A2A" />
          </View>

          <Text className="mt-3.5 text-[17px] font-bold text-ink">
            Cancel approved leave?
          </Text>
          <Text className="mt-2 text-[13px] leading-5 text-[#14323F]/65">
            <Text className="font-semibold text-ink">{holiday.name}</Text> will be
            removed from your attendance calendar and your optional-holiday
            allowance will be restored.
          </Text>

          <View className="mt-6 flex-row justify-end gap-2.5">
            <Pressable
              onPress={onKeep}
              accessibilityRole="button"
              className="h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 active:scale-95"
            >
              <Text className="text-[13px] font-bold text-ink">Keep leave</Text>
            </Pressable>
            <Pressable
              onPress={() => onConfirm(holiday)}
              accessibilityRole="button"
              className="h-10 items-center justify-center rounded-xl bg-[#B04A2A] px-4 active:scale-95"
            >
              <Text className="text-[13px] font-bold text-white">
                Cancel approved leave
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
