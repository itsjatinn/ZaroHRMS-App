import { ChevronDown } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { cardShadow } from '../shadow';
import ClaimActionButton from './ClaimActionButton';
import {
  accentColor,
  claimActionFor,
  dayNumber,
  TYPE_META,
  weekdayShort,
  type CalendarHoliday,
  type ClaimAction,
} from './holidayCalendarData';

type HolidayMonthGroupProps = {
  label: string;
  /** "Completed" | "Current month" | "Upcoming". */
  status: string;
  items: CalendarHoliday[];
  /** Past months collapse behind their header, as on the web. */
  collapsible: boolean;
  collapsed: boolean;
  onToggle: () => void;
  today: Date;
  remaining: number;
  /** A claim call is in flight — every action stays disabled until it lands. */
  busy?: boolean;
  onClaimAction: (holiday: CalendarHoliday, action: ClaimAction) => void;
};

// One month card in the list view: a header strip with the month, its state and
// holiday count, then a timeline of rows — marker, date box, name, type chip
// and the optional-holiday claim control.
export default function HolidayMonthGroup({
  label,
  status,
  items,
  collapsible,
  collapsed,
  onToggle,
  today,
  remaining,
  busy = false,
  onClaimAction,
}: HolidayMonthGroupProps) {
  return (
    <View
      style={cardShadow}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
    >
      <Pressable
        onPress={collapsible ? onToggle : undefined}
        disabled={!collapsible}
        accessibilityRole={collapsible ? 'button' : undefined}
        accessibilityState={collapsible ? { expanded: !collapsed } : {}}
        className={`flex-row items-center justify-between bg-[#FAFBFC] px-4 py-3 ${
          collapsed ? '' : 'border-b border-slate-100'
        } ${collapsible ? 'active:bg-slate-100' : ''}`}
      >
        <View>
          <Text className="text-[13px] font-bold text-ink">{label}</Text>
          <Text className="mt-0.5 text-[11px] font-semibold text-slate-400">
            {status} · {items.length} holiday{items.length === 1 ? '' : 's'}
          </Text>
        </View>
        {collapsible ? (
          <View style={{ transform: [{ rotate: collapsed ? '0deg' : '180deg' }] }}>
            <ChevronDown size={17} color="#94A3B8" />
          </View>
        ) : null}
      </Pressable>

      {collapsed ? null : (
        <View className="py-1.5">
          {/* Timeline rail behind the markers. */}
          {items.length > 1 ? (
            <View className="absolute bottom-9 left-[25px] top-9 w-0.5 rounded-full bg-slate-200" />
          ) : null}

          {items.map((holiday, index) => {
            const type = TYPE_META[holiday.type];
            const spec = claimActionFor(holiday, remaining, today);

            return (
              <View
                key={holiday.id}
                className={`flex-row items-center gap-3 px-4 py-2.5 ${
                  index === items.length - 1 ? '' : 'border-b border-slate-100'
                }`}
              >
                <View
                  className="h-3.5 w-3.5 rounded-full border-[3px] bg-white"
                  style={{
                    borderColor: accentColor(holiday),
                    backgroundColor: `${accentColor(holiday)}20`,
                  }}
                />

                <View className="h-12 w-[52px] items-center justify-center rounded-xl border border-slate-200 bg-[#F8FAFB]">
                  <Text className="text-[15px] font-bold text-ink">
                    {dayNumber(holiday.date)}
                  </Text>
                  <Text className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    {weekdayShort(holiday.date)}
                  </Text>
                </View>

                <View className="min-w-0 flex-1">
                  <Text
                    className="text-[13px] font-semibold text-ink"
                    numberOfLines={2}
                  >
                    {holiday.name}
                  </Text>
                  <View
                    className="mt-1 self-start rounded-full px-2 py-0.5"
                    style={{ backgroundColor: type.bg }}
                  >
                    <Text
                      className="text-[10px] font-bold"
                      style={{ color: type.color }}
                    >
                      {type.label}
                    </Text>
                  </View>
                </View>

                {spec ? (
                  <ClaimActionButton
                    spec={busy ? { ...spec, disabled: true } : spec}
                    onPress={() =>
                      spec.action && onClaimAction(holiday, spec.action)
                    }
                  />
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
