import { Feather } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import type { MonthGrid } from './teamData';

// Shared geometry for both team calendars: a fixed member column on the left
// and a horizontally scrolling day strip on the right.
export const DAY_WIDTH = 34;
export const NAME_WIDTH = 116;

export const gridWidth = (grid: MonthGrid) => grid.days.length * DAY_WIDTH;

export function dayTint(grid: MonthGrid, day: number, holidays?: Set<number>) {
  if (day === grid.todayDay) return '#EEF5FA';
  if (holidays?.has(day)) return '#F4F8FC';
  if (grid.isWeekend(day)) return '#F7F7F9';
  return 'transparent';
}

/**
 * Compact month stepper, sized to sit at the right edge of a tab's title row.
 */
export function MonthNav({
  label,
  onPrev,
  onNext,
}: {
  label: string;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  return (
    <View className="flex-row items-center rounded-xl border border-slate-200 bg-white px-1 py-1">
      <Pressable onPress={onPrev} hitSlop={8} className="h-7 w-7 items-center justify-center rounded-lg active:bg-slate-100">
        <Feather name="chevron-left" size={16} color="#14323F" />
      </Pressable>
      <Text className="min-w-[86px] text-center text-xs font-bold text-ink">{label}</Text>
      <Pressable onPress={onNext} hitSlop={8} className="h-7 w-7 items-center justify-center rounded-lg active:bg-slate-100">
        <Feather name="chevron-right" size={16} color="#14323F" />
      </Pressable>
    </View>
  );
}

// The day-number strip that sits above every grid row.
export function DayHeader({ grid, holidays }: { grid: MonthGrid; holidays?: Set<number> }) {
  return (
    <View className="h-11 flex-row border-b border-slate-100" style={{ width: gridWidth(grid) }}>
      {grid.days.map((day) => (
        <View
          key={day}
          className="items-center justify-center"
          style={{ width: DAY_WIDTH, backgroundColor: dayTint(grid, day, holidays) }}
        >
          <Text className="text-[8px] uppercase text-slate-400">{grid.weekdayLetter(day)}</Text>
          <Text
            className={`text-[11px] font-semibold ${day === grid.todayDay ? 'text-[#2970A8]' : 'text-ink'}`}
          >
            {day}
          </Text>
        </View>
      ))}
    </View>
  );
}

// Weekend / holiday / today background stripes painted behind a grid row.
export function DayStripes({
  grid,
  height,
  holidays,
}: {
  grid: MonthGrid;
  height: number;
  holidays?: Set<number>;
}) {
  return (
    <View className="absolute inset-0 flex-row" pointerEvents="none">
      {grid.days.map((day) => (
        <View key={day} style={{ width: DAY_WIDTH, height, backgroundColor: dayTint(grid, day, holidays) }} />
      ))}
    </View>
  );
}

/** Web parity: a 7px round dot (.tac__legend-dot), not a bar. Ringed variants
 *  sit inside a slightly larger circle so the ring reads without shrinking the
 *  dot — RN cannot draw an outline outside a view's box the way CSS can. */
const LEGEND_DOT = 7;
const LEGEND_RING = 13;

/**
 * Dashed ring as an SVG stroke. React Native silently renders a dashed
 * border solid once a view has a border radius, so the "pending" cue would
 * otherwise be indistinguishable from "approved".
 */
function DashedRing({ size, color }: { size: number; color: string }) {
  const radius = (size - 1) / 2;
  const circumference = 2 * Math.PI * radius;
  const pairs = Math.max(4, Math.round(circumference / 4));
  const dash = circumference / (pairs * 2);
  return (
    <Svg
      width={size}
      height={size}
      style={{ position: 'absolute', top: 0, left: 0 }}
      pointerEvents="none"
    >
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={1}
        strokeDasharray={`${dash} ${dash}`}
        fill="none"
      />
    </Svg>
  );
}

export function Legend({
  items,
}: {
  items: { color: string; label: string; dashed?: boolean; ring?: string }[];
}) {
  return (
    <View className="flex-row flex-wrap gap-x-[18px] gap-y-2 bg-slate-50 px-3 py-3">
      {items.map((item) => {
        const ringColor = item.ring ?? (item.dashed ? item.color : undefined);
        return (
          <View key={item.label} className="flex-row items-center">
            <View
              className="mr-1.5 items-center justify-center"
              style={{ width: LEGEND_RING, height: LEGEND_RING }}
            >
              {ringColor ? (
                item.dashed ? (
                  <DashedRing size={LEGEND_RING} color={ringColor} />
                ) : (
                  <View
                    style={{
                      position: 'absolute',
                      width: LEGEND_RING,
                      height: LEGEND_RING,
                      borderRadius: LEGEND_RING / 2,
                      borderWidth: 1,
                      borderColor: ringColor,
                    }}
                  />
                )
              ) : null}
              <View
                style={{
                  width: LEGEND_DOT,
                  height: LEGEND_DOT,
                  borderRadius: LEGEND_DOT / 2,
                  backgroundColor: item.color,
                }}
              />
            </View>
            <Text className="text-[10.5px] text-slate-500">{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

// Fixed left-hand column header, kept in sync with DayHeader's height.
export function MemberColumnHeader({ trailing }: { trailing?: string }) {
  return (
    <View
      className="h-11 justify-center border-b border-r border-slate-100 px-3"
      style={{ width: NAME_WIDTH }}
    >
      <Text className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">
        {trailing ?? 'Team member'}
      </Text>
    </View>
  );
}
