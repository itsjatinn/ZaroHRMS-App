import { Feather } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Alert } from '../CrossAlert';

import { cardShadow } from '../shadow';
import {
  DayHeader,
  DAY_WIDTH,
  GRID_WIDTH,
  Legend,
  MemberColumnHeader,
  MonthNav,
  NAME_WIDTH,
  dayTint,
} from './CalendarChrome';
import {
  ATTENDANCE_LEGEND,
  ATTENDANCE_STYLE,
  DAYS,
  MONTH_LABEL,
  TeamMember,
  attendanceFor,
  attendanceScore,
  attendanceTotals,
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
  // Three to a row: the icon spans both lines with the label above the value
  // beside it. `min-w-0` on the text column matters at a third of the screen —
  // without it a long label pushes the value out of the tile instead of
  // clipping to its own line.
  return (
    <View
      className="flex-1 flex-row items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2.5"
      style={cardShadow}
    >
      <View
        className="h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: background }}
      >
        <Feather name={icon} size={15} color={color} />
      </View>
      <View className="min-w-0 flex-1">
        <Text
          className="text-[8px] font-semibold uppercase tracking-wider text-slate-400"
          numberOfLines={1}
        >
          {label}
        </Text>
        <Text className="text-2xl font-bold leading-7" style={{ color }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function MemberCell({ member }: { member: TeamMember }) {
  const score = attendanceScore(member.employeeId);
  const scoreColor = score.percent >= 90 ? '#2F7D5B' : score.percent >= 75 ? '#A16D13' : '#B74853';

  return (
    <View
      className="justify-center border-b border-r border-slate-100 px-3"
      style={{ width: NAME_WIDTH, height: ROW_HEIGHT }}
    >
      <Text className="text-[11px] font-bold text-ink" numberOfLines={1}>
        {member.name}
      </Text>
      <View className="mt-0.5 flex-row items-center">
        <Text className="text-[10px] font-bold" style={{ color: scoreColor }}>
          {score.percent}%
        </Text>
        <Text className="ml-1 text-[9px] text-slate-400" numberOfLines={1}>
          · {score.absent} absent
        </Text>
      </View>
    </View>
  );
}

function DayCells({ member }: { member: TeamMember }) {
  return (
    <View
      className="flex-row border-b border-slate-100"
      style={{ width: GRID_WIDTH, height: ROW_HEIGHT }}
    >
      {DAYS.map((day) => {
        const code = attendanceFor(member.employeeId, day);
        const style = ATTENDANCE_STYLE[code];
        return (
          <View
            key={day}
            className="items-center justify-center"
            style={{ width: DAY_WIDTH, backgroundColor: dayTint(day) }}
          >
            <View
              className="h-6 w-7 items-center justify-center rounded-md"
              style={{ backgroundColor: style.bg }}
            >
              <Text className="text-[9px] font-bold" style={{ color: style.text }}>
                {style.label}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function AttendanceCalendar({ team }: { team: TeamMember[] }) {
  const totals = attendanceTotals();

  return (
    <View className="gap-4">
      <MonthNav label={MONTH_LABEL} />

      <View className="flex-row gap-2">
        <StatTile icon="calendar" label="Team attendance" value={`${totals.percent}%`} color="#2970A8" background="#E9F3FA" />
        <StatTile icon="user-x" label="Absent days" value={`${totals.absent}`} color="#B74853" background="#FDEBEC" />
        <StatTile icon="clock" label="Half days" value={`${totals.half}`} color="#B17B18" background="#FFF5DF" />
      </View>

      <View className="overflow-hidden rounded-2xl border border-slate-200 bg-white" style={cardShadow}>
        <View className="flex-row items-center justify-between border-b border-slate-100 px-3 py-2.5">
          <Text className="text-xs font-bold text-ink">Daily attendance</Text>
          <Pressable
            onPress={() => Alert.alert('Export', 'The month’s attendance sheet will be emailed to you.')}
            className="flex-row items-center rounded-lg border border-slate-200 px-2.5 py-1.5 active:opacity-70"
          >
            <Feather name="download" size={12} color="#14323F" />
            <Text className="ml-1.5 text-[11px] font-semibold text-ink">Export</Text>
          </Pressable>
        </View>

        {/* Identity column lives outside the horizontal scroller so names stay
            visible while the month scrolls under them. */}
        <View className="flex-row">
          <View style={{ width: NAME_WIDTH }}>
            <MemberColumnHeader />
            {team.map((member) => (
              <MemberCell key={member.employeeId} member={member} />
            ))}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <DayHeader />
              {team.map((member) => (
                <DayCells key={member.employeeId} member={member} />
              ))}
            </View>
          </ScrollView>
        </View>

        {team.length === 0 ? (
          <View className="items-center py-10">
            <Feather name="users" size={26} color="#CBD5E1" />
            <Text className="mt-2 text-xs text-slate-400">No team members match this filter.</Text>
          </View>
        ) : null}

        <Legend
          items={ATTENDANCE_LEGEND.map((code) => ({
            color: ATTENDANCE_STYLE[code].bg,
            label: ATTENDANCE_STYLE[code].legend,
          }))}
        />
      </View>
    </View>
  );
}
