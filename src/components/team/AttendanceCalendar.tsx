import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import {
  useTeamAttendanceMonths,
  type TeamAttendanceMonth,
} from '../../api/team';
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
  ATTENDANCE_LEGEND,
  ATTENDANCE_STYLE,
  codeForStatus,
  demoAttendanceFor,
  monthGrid,
  type AttendanceCode,
  type MonthGrid,
  type TeamMember,
} from './teamData';

const ROW_HEIGHT = 48;

function StatTile({
  icon,
  label,
  value,
  color,
  background,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  color: string;
  background: string;
}) {
  return (
    <View className="w-[48.5%] rounded-xl border border-slate-200 bg-white p-2.5" style={cardShadow}>
      <View className="flex-row items-center">
        <View
          className="mr-2 h-7 w-7 items-center justify-center rounded-lg"
          style={{ backgroundColor: background }}
        >
          <Feather name={icon} size={15} color={color} />
        </View>
        <View className="flex-1">
          <Text className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </Text>
          <Text className="text-lg font-bold leading-5" style={{ color }}>
            {value}
          </Text>
        </View>
      </View>
    </View>
  );
}

/** Day → cell code lookup for one member's month. */
function codesFor(
  grid: MonthGrid,
  member: TeamMember,
  live: Record<string, TeamAttendanceMonth> | undefined,
  isBackendSession: boolean,
): (day: number) => AttendanceCode {
  if (!isBackendSession) {
    return (day) => demoAttendanceFor(grid, member.employeeId, day);
  }
  const byDay = new Map<
    number,
    { status: string; missedPunch: boolean; late: boolean }
  >();
  for (const entry of live?.[member.id]?.days ?? []) {
    if (typeof entry?.day === 'number') {
      byDay.set(entry.day, {
        status: String(entry.status ?? ''),
        missedPunch: Boolean(entry.missedPunch),
        late: Boolean(entry.late),
      });
    }
  }
  return (day) => {
    const entry = byDay.get(day);
    return codeForStatus(entry?.status, entry?.missedPunch, entry?.late);
  };
}

/** Score line under the member name: attendance % and absent days. */
function scoreFor(
  grid: MonthGrid,
  member: TeamMember,
  live: Record<string, TeamAttendanceMonth> | undefined,
  isBackendSession: boolean,
): { percent: number; absent: number } | null {
  if (isBackendSession) {
    const data = live?.[member.id];
    if (!data) return null;
    return {
      percent: Math.round(Number(data.attendancePercent ?? 0)),
      absent: Number(data.counts?.absent ?? 0),
    };
  }
  let worked = 0;
  let credit = 0;
  let absent = 0;
  for (const day of grid.days) {
    const code = demoAttendanceFor(grid, member.employeeId, day);
    if (code === 'WO' || code === 'H' || code === 'L' || code === 'UP') continue;
    worked += 1;
    if (code === 'P' || code === 'WFH' || code === 'OD' || code === 'CO') credit += 1;
    else if (code === 'HD') credit += 0.5;
    else absent += 1;
  }
  return { percent: worked ? Math.round((credit / worked) * 100) : 0, absent };
}

export default function AttendanceCalendar({
  team,
  isBackendSession,
}: {
  team: TeamMember[];
  isBackendSession: boolean;
}) {
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const grid = useMemo(() => monthGrid(cursor.year, cursor.month), [cursor]);

  const monthsQuery = useTeamAttendanceMonths(
    team,
    cursor.year,
    cursor.month,
    isBackendSession,
  );
  const live = monthsQuery.data;
  const loading = isBackendSession && monthsQuery.isPending;

  const shiftMonth = (delta: number) =>
    setCursor((current) => {
      const next = current.month - 1 + delta;
      return {
        year: current.year + Math.floor(next / 12),
        month: ((next % 12) + 12) % 12 + 1,
      };
    });

  // Team totals for the stat tiles — averaged / summed over the visible team.
  const totals = useMemo(() => {
    let percentSum = 0;
    let percentCount = 0;
    let present = 0;
    let absent = 0;
    let half = 0;
    for (const member of team) {
      if (isBackendSession) {
        const data = live?.[member.id];
        if (!data) continue;
        percentSum += Number(data.attendancePercent ?? 0);
        percentCount += 1;
        present += Number(data.counts?.present ?? 0);
        absent += Number(data.counts?.absent ?? 0);
        half += Number(data.counts?.halfDay ?? 0);
      } else {
        const score = scoreFor(grid, member, undefined, false);
        if (!score) continue;
        percentSum += score.percent;
        percentCount += 1;
        for (const day of grid.days) {
          const code = demoAttendanceFor(grid, member.employeeId, day);
          if (code === 'P' || code === 'WFH') present += 1;
          else if (code === 'A') absent += 1;
          else if (code === 'HD') half += 1;
        }
      }
    }
    return {
      percent: percentCount ? Math.round(percentSum / percentCount) : 0,
      present,
      absent,
      half,
    };
  }, [team, isBackendSession, live, grid]);

  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-bold text-ink">Attendance</Text>
        <MonthNav label={grid.label} onPrev={() => shiftMonth(-1)} onNext={() => shiftMonth(1)} />
      </View>

      <View className="flex-row flex-wrap justify-between gap-y-2">
        <StatTile icon="calendar" label="Team attendance" value={`${totals.percent}%`} color="#2970A8" background="#E9F3FA" />
        <StatTile icon="user-check" label="Present days" value={`${totals.present}`} color="#347553" background="#E7F4EC" />
        <StatTile icon="user-x" label="Absent days" value={`${totals.absent}`} color="#B54246" background="#FDEBEC" />
        <StatTile icon="clock" label="Half days" value={`${totals.half}`} color="#946312" background="#FFF2D8" />
      </View>

      <View className="overflow-hidden rounded-2xl border border-slate-200 bg-white" style={cardShadow}>
        <View className="flex-row items-center justify-between border-b border-slate-100 px-3 py-2.5">
          <Text className="text-xs font-bold text-ink">Daily attendance</Text>
          {isBackendSession && monthsQuery.isFetching && !monthsQuery.isPending ? (
            <ActivityIndicator size="small" color="#14323F" />
          ) : null}
        </View>

        {loading ? (
          <View className="items-center py-10">
            <ActivityIndicator size="small" color="#14323F" />
            <Text className="mt-2 text-xs text-slate-400">Loading attendance…</Text>
          </View>
        ) : (
          <>
            {/* Identity column lives outside the horizontal scroller so names
                stay visible while the month scrolls under them. */}
            <View className="flex-row">
              <View style={{ width: NAME_WIDTH }}>
                <MemberColumnHeader />
                {team.map((member) => {
                  const score = scoreFor(grid, member, live, isBackendSession);
                  const scoreColor =
                    score == null
                      ? '#94A3B8'
                      : score.percent >= 90
                        ? '#347553'
                        : score.percent >= 75
                          ? '#946312'
                          : '#B54246';
                  return (
                    <View
                      key={member.id}
                      className="justify-center border-b border-r border-slate-100 px-3"
                      style={{ width: NAME_WIDTH, height: ROW_HEIGHT }}
                    >
                      <Text className="text-[11px] font-bold text-ink" numberOfLines={1}>
                        {member.name}
                      </Text>
                      <View className="mt-0.5 flex-row items-center">
                        {score ? (
                          <>
                            <Text className="text-[10px] font-bold" style={{ color: scoreColor }}>
                              {score.percent}%
                            </Text>
                            <Text className="ml-1 text-[9px] text-slate-400" numberOfLines={1}>
                              · {score.absent} absent
                            </Text>
                          </>
                        ) : (
                          <Text className="text-[9px] text-slate-400">No data</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                  <DayHeader grid={grid} />
                  {team.map((member) => {
                    const codeFor = codesFor(grid, member, live, isBackendSession);
                    return (
                      <View
                        key={member.id}
                        className="flex-row border-b border-slate-100"
                        style={{ width: gridWidth(grid), height: ROW_HEIGHT }}
                      >
                        {grid.days.map((day) => {
                          const style = ATTENDANCE_STYLE[codeFor(day)];
                          return (
                            <View
                              key={day}
                              className="items-center justify-center"
                              style={{ width: DAY_WIDTH, backgroundColor: dayTint(grid, day) }}
                            >
                              {style.label ? (
                                <View
                                  className="h-6 w-7 items-center justify-center rounded-md"
                                  style={{
                                    backgroundColor: style.bg,
                                    // Ringed codes (missed punch) carry the
                                    // ring on the CELL too — the legend must
                                    // only teach cues the grid actually draws.
                                    borderWidth: style.ring ? 1 : 0,
                                    borderColor: style.ring,
                                  }}
                                >
                                  <Text className="text-[9px] font-bold" style={{ color: style.text }}>
                                    {style.label}
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                          );
                        })}
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {team.length === 0 ? (
              <View className="items-center py-10">
                <Feather name="users" size={26} color="#CBD5E1" />
                <Text className="mt-2 text-xs text-slate-400">No team members match this filter.</Text>
              </View>
            ) : null}
          </>
        )}

        <Legend
          items={ATTENDANCE_LEGEND.map((code) => ({
            color: ATTENDANCE_STYLE[code].dot,
            ring: ATTENDANCE_STYLE[code].ring,
            label: ATTENDANCE_STYLE[code].legend,
          }))}
        />
      </View>
    </View>
  );
}
