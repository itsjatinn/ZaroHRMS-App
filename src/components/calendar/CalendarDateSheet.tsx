import { Info, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { cardShadow } from '../shadow';
import {
  DAY_MARKER_STYLE,
  dayMarkerKey,
  LEAVE_DAY_MARKERS,
  type DayMarkerKind,
} from './dayMarkers';
import MonthCalendar, { type MonthCursor } from './MonthCalendar';

/**
 * Single-date picker drawn with the shared MonthCalendar, so the request forms
 * pick dates against the same grid the home and attendance screens show
 * instead of the OS date dialog — which looks different on every platform and,
 * on web, is whatever the browser feels like rendering.
 *
 * Out-of-range days stay visible but inert: hiding them would make the grid
 * jump between months, and greying them out says *why* they can't be chosen.
 */

const startOfDay = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate());

type Props = {
  visible: boolean;
  value: Date | null;
  /** Earliest selectable day, inclusive. */
  minimumDate?: Date;
  /** Latest selectable day, inclusive. */
  maximumDate?: Date;
  title?: string;
  /**
   * Days to call out, keyed `yyyy-mm-dd` (see dayMarkerKey). Holidays and
   * existing requests only — week-offs come from `weekOffWeekdays`, since
   * enumerating every Saturday and Sunday of every month would be silly.
   */
  markers?: Map<string, DayMarkerKind>;
  /** Weekday indexes that are non-working, e.g. `[0, 6]`. */
  weekOffWeekdays?: number[];
  /** Keys to show. Defaults to the leave set; regularize passes its own. */
  legend?: DayMarkerKind[];
  /**
   * Vetoes a day. Return a sentence explaining why it can't be chosen, or null
   * to allow it. The message is shown inside the sheet rather than swallowed,
   * so a tap that does nothing always says why.
   */
  selectionGuard?: (input: {
    date: Date;
    day: number;
    marker: DayMarkerKind | null;
  }) => string | null;
  /**
   * The month now on screen. Lets a caller whose marker data is per-month
   * fetch the one being looked at — without it, paging away from the selected
   * date shows a month with no markers at all.
   */
  onVisibleMonthChange?: (year: number, month: number) => void;
  onSelect: (value: Date) => void;
  onClose: () => void;
};

export default function CalendarDateSheet({
  visible,
  value,
  minimumDate,
  maximumDate,
  title = 'Select date',
  markers,
  weekOffWeekdays,
  legend = LEAVE_DAY_MARKERS,
  selectionGuard,
  onVisibleMonthChange,
  onSelect,
  onClose,
}: Props) {
  /** Why the last tap was refused, shown under the grid. */
  const [notice, setNotice] = useState<string | null>(null);
  const [cursor, setCursor] = useState<MonthCursor>(() => {
    const base = value ?? minimumDate ?? new Date();
    return { year: base.getFullYear(), month: base.getMonth() };
  });

  // Reopening should land on the month of whatever is currently chosen, not
  // wherever the user browsed to and abandoned last time.
  useEffect(() => {
    if (!visible) return;
    const base = value ?? minimumDate ?? new Date();
    setCursor({ year: base.getFullYear(), month: base.getMonth() });
    onVisibleMonthChange?.(base.getFullYear(), base.getMonth());
    // A refusal from the previous visit must not greet the next one.
    setNotice(null);
    // `value` is intentionally read only when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const selected = value ? startOfDay(value) : null;
  const min = minimumDate ? startOfDay(minimumDate) : null;
  const max = maximumDate ? startOfDay(maximumDate) : null;

  const isDisabled = (day: number) => {
    const date = new Date(cursor.year, cursor.month, day);
    if (min && date < min) return true;
    if (max && date > max) return true;
    return false;
  };

  const weekOffs = new Set(weekOffWeekdays ?? []);

  /** An explicit marker wins over week-off: a holiday on a Sunday is a holiday. */
  const markerFor = (day: number, weekday: number): DayMarkerKind | null => {
    const explicit = markers?.get(dayMarkerKey(cursor.year, cursor.month, day));
    if (explicit) return explicit;
    return weekOffs.has(weekday) ? 'week-off' : null;
  };

  // The full key, not just the kinds visible this month. It stays put as the
  // employee pages between months, so the colours mean the same thing
  // throughout instead of the row reshuffling under them. Sheets given no
  // marker data at all (Regularize, WFH) show no legend.
  const showLegend = Boolean(markers?.size) || weekOffs.size > 0;
  const legendKinds = showLegend ? legend : [];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Backdrop closes; the card swallows the press so taps inside stay put. */}
      <Pressable
        className="flex-1 items-center justify-center bg-black/60 px-4"
        onPress={onClose}
      >
        <Pressable
          style={cardShadow}
          className="w-full max-w-[420px] overflow-hidden rounded-[24px] bg-white px-4 pb-4 pt-3"
        >
          <View className="flex-row items-center gap-3 pb-1">
            <Text className="flex-1 text-sm font-bold text-ink">{title}</Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close date picker"
              className="h-8 w-8 items-center justify-center rounded-full bg-slate-100 active:scale-95"
            >
              <X size={16} color="#334155" />
            </Pressable>
          </View>

          <MonthCalendar
            variant="plain"
            year={cursor.year}
            month={cursor.month}
            longMonthLabel
            onMonthChange={(year, month) => {
              setCursor({ year, month });
              onVisibleMonthChange?.(year, month);
              setNotice(null);
            }}
            onDayPress={(day) => {
              const date = new Date(cursor.year, cursor.month, day);
              // The guard speaks first: a screen that has its own wording for
              // a date should use it for out-of-range days too, rather than
              // having a generic sentence appear for some refusals only.
              const refusal =
                selectionGuard?.({
                  date,
                  day,
                  marker: markerFor(day, date.getDay()),
                }) ??
                (isDisabled(day)
                  ? 'That date is outside the range you can pick.'
                  : null);
              if (refusal) {
                setNotice(refusal);
                return;
              }
              onSelect(date);
              onClose();
            }}
            renderDay={({ day, weekday, isToday }) => {
              if (day == null) return null;
              const marker = markerFor(day, weekday);
              const style = marker ? DAY_MARKER_STYLE[marker] : null;
              const isSelected =
                selected != null &&
                selected.getFullYear() === cursor.year &&
                selected.getMonth() === cursor.month &&
                selected.getDate() === day;

              if (isSelected) {
                return (
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-ink">
                    <Text className="text-sm font-bold text-white">{day}</Text>
                  </View>
                );
              }
              return (
                <View
                  className="h-9 w-9 items-center justify-center rounded-full"
                  style={{
                    // Every day is drawn the same way, in range or not. Fading
                    // the out-of-range ones washed out most of the month on the
                    // pickers that set a bound — the end-date sheet and
                    // regularize — and made them read as a different, broken
                    // calendar rather than the one on the leave form.
                    backgroundColor: style ? style.bg : 'transparent',
                    // A ring, not a fill: today must stay distinguishable from
                    // the selected day when they are different days.
                    borderWidth: isToday ? 1 : 0,
                    borderColor: '#14323F',
                  }}
                >
                  <Text
                    className="text-sm"
                    style={{
                      color: style?.text ?? '#14323F',
                      fontWeight: style ? '600' : '400',
                    }}
                  >
                    {day}
                  </Text>
                </View>
              );
            }}
          />

          {notice ? (
            <View className="mt-3 flex-row items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
              <Info size={14} color="#B45309" style={{ marginTop: 1 }} />
              <Text className="flex-1 text-xs leading-4 text-amber-800">
                {notice}
              </Text>
            </View>
          ) : null}

          {legendKinds.length > 0 ? (
            <View className="mt-3 flex-row flex-wrap justify-center gap-x-3 gap-y-1.5 border-t border-slate-100 pt-3">
              {legendKinds.map((kind) => (
                <View key={kind} className="flex-row items-center gap-1.5">
                  <View
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: DAY_MARKER_STYLE[kind].dot }}
                  />
                  <Text className="text-[11px] text-slate-500">
                    {DAY_MARKER_STYLE[kind].label}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
