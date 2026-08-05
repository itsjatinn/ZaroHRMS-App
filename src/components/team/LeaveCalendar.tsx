import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { useTeamLeaveCalendar } from '../../api/team';
import { cardShadow } from '../shadow';
import {
  DayHeader,
  DAY_WIDTH,
  gridWidth,
  Legend,
  MemberColumnHeader,
  MonthNav,
  NAME_WIDTH,
  dayTint,
} from './CalendarChrome';
import {
  LEAVE_LEGEND,
  LEAVE_STYLE,
  leaveStateFor,
  monthGrid,
  TEAM_LEAVES,
  type LeaveState,
  type MonthGrid,
  type TeamMember,
} from './teamData';

const ROW_HEIGHT = 52;
const SUMMARY_HEIGHT = 44;

/** A leave clamped into the visible month, in day-of-month coordinates. */
type Bar = {
  key: string;
  start: number;
  end: number;
  label: string;
  state: LeaveState;
};

/** "YYYY-MM-DD" → day-of-month within the grid, or null when outside it. */
function dayInMonth(iso: string, grid: MonthGrid): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
  if (!match) return null;
  const [, y, m, d] = match;
  if (Number(y) !== grid.year || Number(m) !== grid.month) return null;
  return Number(d);
}

function clampBar(
  startDate: string,
  endDate: string,
  grid: MonthGrid,
): { start: number; end: number } | null {
  const lastDay = grid.days.length;
  const startsBefore = startDate < `${grid.year}-${String(grid.month).padStart(2, '0')}-01`;
  const endsAfter = endDate > `${grid.year}-${String(grid.month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  const start = startsBefore ? 1 : dayInMonth(startDate, grid);
  const end = endsAfter ? lastDay : dayInMonth(endDate, grid);
  if (start == null || end == null || end < start) return null;
  return { start, end };
}

export default function LeaveCalendar({
  team,
  isBackendSession,
}: {
  team: TeamMember[];
  isBackendSession: boolean;
}) {
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const grid = useMemo(() => monthGrid(cursor.year, cursor.month), [cursor]);

  const calendarQuery = useTeamLeaveCalendar(cursor.year, cursor.month, isBackendSession);
  const loading = isBackendSession && calendarQuery.isPending;

  const shiftMonth = (delta: number) =>
    setCursor((current) => {
      const next = current.month - 1 + delta;
      return {
        year: current.year + Math.floor(next / 12),
        month: ((next % 12) + 12) % 12 + 1,
      };
    });

  // Company holidays tint the day columns, same as the web calendar.
  const holidays = useMemo(() => {
    const days = new Set<number>();
    for (const holiday of calendarQuery.data?.holidays ?? []) {
      const day = dayInMonth(holiday.date, grid);
      if (day != null) days.add(day);
    }
    if (!isBackendSession) days.add(18);
    return days;
  }, [calendarQuery.data, grid, isBackendSession]);

  // Bars per member id, from the live feed or the demo set.
  const barsById = useMemo(() => {
    const map = new Map<string, Bar[]>();
    if (isBackendSession) {
      for (const member of calendarQuery.data?.members ?? []) {
        const bars: Bar[] = [];
        for (const leave of member.leaves ?? []) {
          const state = leaveStateFor(leave.status);
          const span = clampBar(leave.startDate, leave.endDate, grid);
          if (!state || !span) continue;
          bars.push({ key: leave.id, ...span, label: leave.type, state });
        }
        map.set(member.id, bars);
      }
    } else {
      for (const leave of TEAM_LEAVES) {
        const bars = map.get(leave.employeeId) ?? [];
        bars.push({
          key: `${leave.employeeId}-${leave.start}`,
          start: leave.start,
          end: leave.end,
          label: leave.label,
          state: leave.state,
        });
        map.set(leave.employeeId, bars);
      }
    }
    return map;
  }, [calendarQuery.data, grid, isBackendSession]);

  // Approved head-count out of office per day — drives the summary strip.
  const approvedPerDay = useMemo(() => {
    const counts = new Map<number, number>();
    for (const bars of barsById.values()) {
      for (const bar of bars) {
        if (bar.state !== 'approved') continue;
        for (let day = bar.start; day <= bar.end; day += 1) {
          counts.set(day, (counts.get(day) ?? 0) + 1);
        }
      }
    }
    return counts;
  }, [barsById]);

  const plannedDays = useMemo(() => {
    let total = 0;
    for (const member of team) {
      for (const bar of barsById.get(member.id) ?? []) {
        if (bar.state === 'approved' || bar.state === 'pending') {
          total += bar.end - bar.start + 1;
        }
      }
    }
    return total;
  }, [team, barsById]);

  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-bold text-ink">Leave</Text>
        <MonthNav label={grid.label} onPrev={() => shiftMonth(-1)} onNext={() => shiftMonth(1)} />
      </View>

      <View className="overflow-hidden rounded-2xl border border-slate-200 bg-white" style={cardShadow}>
        <View className="flex-row items-center justify-between border-b border-slate-100 px-3 py-2.5">
          <View>
            <Text className="text-xs font-bold text-ink">Planned leave</Text>
            <Text className="text-[10px] text-slate-400">{plannedDays} leave days this month</Text>
          </View>
          {isBackendSession && calendarQuery.isFetching && !calendarQuery.isPending ? (
            <ActivityIndicator size="small" color="#14323F" />
          ) : null}
        </View>

        {loading ? (
          <View className="items-center py-10">
            <ActivityIndicator size="small" color="#14323F" />
            <Text className="mt-2 text-xs text-slate-400">Loading leave plan…</Text>
          </View>
        ) : (
          <View className="flex-row">
            <View style={{ width: NAME_WIDTH }}>
              <MemberColumnHeader />
              <View
                className="justify-center border-b border-r border-slate-100 bg-slate-50/60 px-3"
                style={{ width: NAME_WIDTH, height: SUMMARY_HEIGHT }}
              >
                <Text className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">
                  On leave
                </Text>
                <Text className="text-[8px] text-slate-400">Approved · per day</Text>
              </View>
              {team.map((member) => (
                <View
                  key={member.id}
                  className="justify-center border-b border-r border-slate-100 px-3"
                  style={{ height: ROW_HEIGHT }}
                >
                  <Text className="text-[11px] font-bold text-ink" numberOfLines={1}>
                    {member.name}
                  </Text>
                  <Text className="text-[9px] text-slate-400" numberOfLines={1}>
                    {member.role}
                  </Text>
                </View>
              ))}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                <DayHeader grid={grid} holidays={holidays} />
                <View
                  className="flex-row border-b border-slate-100 bg-slate-50/60"
                  style={{ width: gridWidth(grid), height: SUMMARY_HEIGHT }}
                >
                  {grid.days.map((day) => {
                    const count = approvedPerDay.get(day) ?? 0;
                    return (
                      <View
                        key={day}
                        className="items-center justify-center"
                        style={{ width: DAY_WIDTH, backgroundColor: dayTint(grid, day, holidays) }}
                      >
                        {count ? (
                          <Text className="text-[11px] font-bold text-ink">{count}</Text>
                        ) : (
                          <Text className="text-[11px] text-slate-300">·</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
                {team.map((member) => {
                  const bars = barsById.get(member.id) ?? [];
                  return (
                    <View
                      key={member.id}
                      className="border-b border-slate-100"
                      style={{ width: gridWidth(grid), height: ROW_HEIGHT }}
                    >
                      <View className="absolute inset-0 flex-row">
                        {grid.days.map((day) => (
                          <View
                            key={day}
                            style={{ width: DAY_WIDTH, height: ROW_HEIGHT, backgroundColor: dayTint(grid, day, holidays) }}
                          />
                        ))}
                      </View>
                      {bars.map((bar) => {
                        const style = LEAVE_STYLE[bar.state];
                        return (
                          <View
                            key={bar.key}
                            className="absolute h-7 items-center justify-center rounded-lg"
                            style={{
                              top: (ROW_HEIGHT - 28) / 2,
                              left: (bar.start - 1) * DAY_WIDTH + 3,
                              width: (bar.end - bar.start + 1) * DAY_WIDTH - 6,
                              backgroundColor: style.fill,
                              borderWidth: style.dashed ? 1 : 0,
                              borderStyle: style.dashed ? 'dashed' : 'solid',
                              borderColor: '#B98A0E',
                            }}
                          >
                            <Text className="text-[9px] font-bold" style={{ color: style.text }} numberOfLines={1}>
                              {bar.label}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {!loading && team.length === 0 ? (
          <View className="items-center py-10">
            <Feather name="calendar" size={26} color="#CBD5E1" />
            <Text className="mt-2 text-xs text-slate-400">No team members match this filter.</Text>
          </View>
        ) : null}

        <Legend
          items={[
            ...LEAVE_LEGEND.map((state) => ({
              color: LEAVE_STYLE[state].fill,
              label: LEAVE_STYLE[state].legend,
              dashed: LEAVE_STYLE[state].dashed,
            })),
            // Weekend/Holiday are faint COLUMN TINTS on the grid; at 7px a
            // near-white dot is invisible, so the legend uses a readable
            // equivalent of each tint with a ring for definition.
            { color: '#D9DDE4', ring: '#B4BAC4', label: 'Weekend' },
            { color: '#C7DBEF', ring: '#8FB4D6', label: 'Holiday' },
          ]}
        />
      </View>
    </View>
  );
}
