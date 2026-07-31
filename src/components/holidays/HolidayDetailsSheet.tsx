import { CalendarDays, Check, Info, X } from 'lucide-react-native';
import { Modal, Pressable, Text, View } from 'react-native';

import { cardShadow } from '../shadow';
import {
  CLAIM_META,
  countdownLabel,
  fullDate,
  HOLIDAY_YEAR,
  isPast,
  TYPE_META,
  weekdayLong,
  type CalendarHoliday,
} from './holidayCalendarData';

type HolidayDetailsSheetProps = {
  holiday: CalendarHoliday | null;
  /** Optional-holiday days still left in the employee's quota. */
  remaining: number;
  onClaim: (holiday: CalendarHoliday) => void;
  /** Withdraw a pending claim, or cancel an approved one (confirmed upstream). */
  onCancelClaim: (holiday: CalendarHoliday) => void;
  onClose: () => void;
};

// Tapping a tile in the year grid opens this. Optional holidays that are still
// open can be claimed from here; everything else is read-only detail.
export default function HolidayDetailsSheet({
  holiday,
  remaining,
  onClaim,
  onCancelClaim,
  onClose,
}: HolidayDetailsSheetProps) {
  if (!holiday) return null;

  const type = TYPE_META[holiday.type];
  const claim = holiday.claim ? CLAIM_META[holiday.claim] : null;
  const past = isPast(holiday.date);
  const canClaim = holiday.claim === 'open' && !past && remaining > 0;
  // A live claim can be taken back until the day itself passes — pending ones
  // withdraw quietly, approved ones get a confirmation upstream because the
  // day comes back onto the attendance calendar.
  const canCancelClaim =
    (holiday.claim === 'pending' || holiday.claim === 'approved') && !past;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/45" onPress={onClose}>
        <Pressable className="rounded-t-[28px] bg-white px-5 pb-7">
          <View className="mt-3 h-1 w-10 self-center rounded-full bg-slate-200" />

          <View className="mt-4 flex-row items-start gap-3">
            <View className="min-w-0 flex-1">
              <View
                className="self-start rounded-full px-2.5 py-1"
                style={{ backgroundColor: type.bg }}
              >
                <Text
                  className="text-[11px] font-semibold"
                  style={{ color: type.color }}
                >
                  {type.label} holiday
                </Text>
              </View>
              <Text className="mt-2 text-xl font-bold text-ink">
                {holiday.name}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close"
              className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 active:scale-95"
            >
              <X size={17} color="#14323F" />
            </Pressable>
          </View>

          <View className="mt-4 flex-row items-center gap-3">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
              <CalendarDays size={16} color="#14323F" />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-sm font-semibold text-ink">
                {fullDate(holiday.date)}
              </Text>
              <Text className="text-xs text-slate-400">
                {weekdayLong(holiday.date)}
                {past ? ' · Passed' : ` · ${countdownLabel(holiday.date).toLowerCase()}`}
              </Text>
            </View>
          </View>

          {claim ? (
            <View className="mt-3 flex-row items-center gap-3">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                {holiday.claim === 'approved' ? (
                  <Check size={16} color="#3F8F5B" />
                ) : (
                  <Info size={16} color="#14323F" />
                )}
              </View>
              <View className="min-w-0 flex-1">
                <Text
                  className="text-sm font-semibold"
                  style={{ color: claim.color }}
                >
                  {claim.label}
                </Text>
                <Text className="text-xs text-slate-400">
                  {holiday.claim === 'open'
                    ? `${remaining} of your optional holidays left this year`
                    : holiday.claim === 'closed'
                      ? 'The claim window for this day has ended'
                      : 'Counted against your optional holiday quota'}
                </Text>
              </View>
            </View>
          ) : (
            <View className="mt-3 flex-row items-center gap-3">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                <Info size={16} color="#14323F" />
              </View>
              <Text className="min-w-0 flex-1 text-xs text-slate-400">
                Office closed — no leave request needed.
              </Text>
            </View>
          )}

          {canClaim ? (
            <Pressable
              onPress={() => onClaim(holiday)}
              style={cardShadow}
              className="mt-5 h-12 items-center justify-center rounded-2xl bg-[#14323F] active:scale-95"
            >
              <Text className="text-sm font-semibold text-white">
                Claim this optional holiday
              </Text>
            </Pressable>
          ) : null}

          {canCancelClaim ? (
            <Pressable
              onPress={() => onCancelClaim(holiday)}
              accessibilityRole="button"
              className="mt-5 h-12 items-center justify-center rounded-2xl border border-[#B04A2A]/30 bg-white active:scale-95"
            >
              <Text className="text-sm font-semibold text-[#B04A2A]">
                {holiday.claim === 'approved'
                  ? 'Cancel holiday claim'
                  : 'Withdraw claim'}
              </Text>
            </Pressable>
          ) : null}

          {holiday.claim === 'open' && !past && remaining === 0 ? (
            <View className="mt-5 rounded-2xl bg-slate-100 px-4 py-3">
              <Text className="text-xs text-slate-500">
                You have used all your optional holidays for {HOLIDAY_YEAR}.
              </Text>
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
