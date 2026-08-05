import { Feather } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { cardShadow } from '../shadow';

/**
 * The home screen's month calendar, generalised.
 *
 * Every month grid in the app re-implements the same three things: padding a
 * month out to whole weeks, a chevron month nav, and a weekday header. This
 * owns all three and delegates only the day cell — which is the part that
 * genuinely differs (attendance statuses, holiday tints, a selected range).
 *
 * Deliberately stateless about which month is shown. The screen owns the
 * cursor, because it almost always drives something else too (a summary, a
 * query, a stat grid), and a calendar holding its own month would put those
 * out of step. `shiftMonthCursor` does the wrap-around arithmetic.
 */

const NAVY = '#14323F';

/** Sun-first, matching JS `getDay()` so an index maps straight to a column. */
export const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export type MonthCursor = {
  year: number;
  /** 0-11, as `Date` uses. */
  month: number;
};

/**
 * A month padded to whole weeks. `null` is a lead-in or tail blank, so a row
 * is always exactly seven cells and column index === weekday.
 */
export function buildMonthWeeks(year: number, month: number): (number | null)[][] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return Array.from({ length: cells.length / 7 }, (_, row) =>
    cells.slice(row * 7, row * 7 + 7),
  );
}

/** Moves a cursor by whole months, carrying the year across December. */
export function shiftMonthCursor(cursor: MonthCursor, delta: number): MonthCursor {
  const m = cursor.month + delta;
  return {
    year: cursor.year + Math.floor(m / 12),
    month: ((m % 12) + 12) % 12,
  };
}

/** "Aug 2026" by default, "August 2026" when `long`. */
export function monthLabel(year: number, month: number, long = false): string {
  return new Date(year, month, 1).toLocaleDateString('en-US', {
    month: long ? 'long' : 'short',
    year: 'numeric',
  });
}

/** True when this cell is today's date in the month being shown. */
export function isTodayCell(year: number, month: number, day: number): boolean {
  const now = new Date();
  return (
    year === now.getFullYear() &&
    month === now.getMonth() &&
    day === now.getDate()
  );
}

export type DayCellInfo = {
  /** null on the blank lead-in / tail cells. */
  day: number | null;
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number;
  isWeekend: boolean;
  isToday: boolean;
};

type MonthCalendarProps = {
  year: number;
  /** 0-11. */
  month: number;
  /** Heading on the left of the nav row. Omit for a bare grid. */
  title?: string;
  /**
   * Chevrons appear only when this is given — a calendar that cannot change
   * month should not show controls that do nothing. The screen owns the
   * cursor, so it decides what "next month" means (clamping, refetching…).
   */
  onMonthChange?: (year: number, month: number) => void;
  /** Anything extra for the nav row's right edge (a filter, a count). */
  headerRight?: ReactNode;
  /** Defaults to single initials, as on the home card. */
  weekdayLabels?: string[];
  /** Long month name in the nav, e.g. a full-width picker. */
  longMonthLabel?: boolean;
  /** `card` carries the shared card chrome; `plain` sits in an existing surface. */
  variant?: 'card' | 'plain';
  /** Row height in px. The home card uses 48. */
  rowHeight?: number;
  /** Draws one day. Blanks render nothing unless this chooses otherwise. */
  renderDay: (info: DayCellInfo) => ReactNode;
  onDayPress?: (day: number) => void;
  /** Below the grid — a legend, an error line, a selected-day panel. */
  footer?: ReactNode;
  /** Overlaid on the grid only, so the header stays usable while loading. */
  gridOverlay?: ReactNode;
  /** Measured width of the grid, for callers positioning their own popovers. */
  onGridWidth?: (width: number) => void;
};

export default function MonthCalendar({
  year,
  month,
  title,
  onMonthChange,
  headerRight,
  weekdayLabels = WEEKDAY_INITIALS,
  longMonthLabel = false,
  variant = 'card',
  rowHeight = 48,
  renderDay,
  onDayPress,
  footer,
  gridOverlay,
  onGridWidth,
}: MonthCalendarProps) {
  const weeks = buildMonthWeeks(year, month);
  const label = monthLabel(year, month, longMonthLabel);

  const shift = (delta: number) => {
    const next = shiftMonthCursor({ year, month }, delta);
    onMonthChange?.(next.year, next.month);
  };

  return (
    <View
      style={variant === 'card' ? cardShadow : undefined}
      className={
        variant === 'card'
          ? 'rounded-[22px] border border-slate-100 bg-white px-5 py-5'
          : 'px-1 py-1'
      }
    >
      {/* With a title (the home card) the nav is pushed to the opposite edge.
          On its own — the date sheet — `justify-between` would strand it on
          the left, so it centres instead. */}
      <View
        className={`flex-row items-center ${
          title || headerRight ? 'justify-between' : 'justify-center'
        }`}
      >
        {title ? (
          <Text className="text-base font-bold text-ink">{title}</Text>
        ) : null}

        {onMonthChange ? (
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => shift(-1)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              className="h-9 w-9 items-center justify-center rounded-xl bg-slate-50 active:scale-95"
            >
              <Feather name="chevron-left" size={18} color={NAVY} />
            </Pressable>
            <Text className="text-base font-bold text-ink">{label}</Text>
            <Pressable
              onPress={() => shift(1)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Next month"
              className="h-9 w-9 items-center justify-center rounded-xl bg-slate-50 active:scale-95"
            >
              <Feather name="chevron-right" size={18} color={NAVY} />
            </Pressable>
          </View>
        ) : (
          <Text className="text-base font-bold text-ink">{label}</Text>
        )}

        {headerRight}
      </View>

      <View className="mt-5 flex-row">
        {weekdayLabels.map((letter, i) => (
          <Text
            // Initials repeat (S…S, T…T), so the column index is the key.
            key={i}
            className="flex-1 text-center text-xs font-semibold text-slate-400"
          >
            {letter}
          </Text>
        ))}
      </View>

      <View
        className="relative mt-2"
        onLayout={(e) => onGridWidth?.(e.nativeEvent.layout.width)}
      >
        {weeks.map((week, wi) => (
          <View key={wi} className="flex-row">
            {week.map((day, weekday) => (
              <Pressable
                key={weekday}
                disabled={day == null || !onDayPress}
                onPress={() => day != null && onDayPress?.(day)}
                style={{ height: rowHeight }}
                className="flex-1 items-center justify-center"
              >
                {renderDay({
                  day,
                  weekday,
                  isWeekend: weekday === 0 || weekday === 6,
                  isToday: day != null && isTodayCell(year, month, day),
                })}
              </Pressable>
            ))}
          </View>
        ))}

        {gridOverlay}
      </View>

      {footer}
    </View>
  );
}
