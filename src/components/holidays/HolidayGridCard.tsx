import { Check } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { cardShadow } from '../shadow';
import {
  CLAIM_META,
  dayNumber,
  monthShort,
  TYPE_META,
  weekdayLong,
  type CalendarHoliday,
} from './holidayCalendarData';

type HolidayGridCardProps = {
  holiday: CalendarHoliday;
  /** Past holidays stay in the grid but recede. */
  past?: boolean;
  onPress?: (holiday: CalendarHoliday) => void;
};

// One tile in the year grid: date box, type badge, name, weekday and — for
// optional holidays — the claim status in a footer strip.
export default function HolidayGridCard({
  holiday,
  past = false,
  onPress,
}: HolidayGridCardProps) {
  const type = TYPE_META[holiday.type];
  const claim = holiday.claim ? CLAIM_META[holiday.claim] : null;
  const approved = holiday.claim === 'approved';

  return (
    <Pressable
      onPress={onPress ? () => onPress(holiday) : undefined}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${holiday.name}, ${type.label} holiday`}
      style={[cardShadow, past && { opacity: 0.55 }]}
      className={`w-[48.5%] rounded-[22px] border bg-white p-3.5 ${
        onPress ? 'active:scale-[0.98] ' : ''
      }${approved ? 'border-[#CFE6D4]' : 'border-slate-100'}`}
    >
      {/* Date box + type badge */}
      <View className="flex-row items-start justify-between">
        <View className="h-[52px] w-[52px] items-center justify-center rounded-2xl border border-slate-100 bg-slate-50">
          <Text className="text-[19px] font-bold leading-6 text-ink">
            {dayNumber(holiday.date)}
          </Text>
          <Text className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
            {monthShort(holiday.date)}
          </Text>
        </View>
        <View
          className="rounded-full px-2 py-1"
          style={{ backgroundColor: type.bg }}
        >
          <Text
            className="text-[10px] font-semibold"
            style={{ color: type.color }}
          >
            {type.label}
          </Text>
        </View>
      </View>

      <Text className="mt-3 text-[13.5px] font-bold leading-[18px] text-ink">
        {holiday.name}
      </Text>
      <Text className="mt-0.5 text-[11.5px] text-slate-400">
        {weekdayLong(holiday.date)}
      </Text>

      {claim ? (
        <View className="mt-3 border-t border-slate-100 pt-2.5">
          {approved ? (
            <View className="flex-row items-center gap-1 self-start rounded-full bg-[#E6F4EA] px-2 py-1">
              <Check size={11} color="#3F8F5B" />
              <Text className="text-[10.5px] font-semibold text-[#3F8F5B]">
                {claim.label}
              </Text>
            </View>
          ) : (
            <Text
              className="text-[11px] font-medium"
              style={{ color: claim.color }}
            >
              {claim.label}
            </Text>
          )}
        </View>
      ) : null}
    </Pressable>
  );
}
