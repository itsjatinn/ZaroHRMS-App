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
  DAYS,
  LEAVE_LEGEND,
  LEAVE_STYLE,
  MONTH_LABEL,
  TEAM_LEAVES,
  TeamMember,
  approvedOnLeave,
} from './teamData';

const ROW_HEIGHT = 52;
const SUMMARY_HEIGHT = 44;

// Head-count strip: how many people are approved-off on each day. The label
// and the counts are rendered separately so the counts sit inside the same
// horizontal scroller as the day columns they annotate.
function SummaryLabel() {
  return (
    <View
      className="justify-center border-b border-r border-slate-100 bg-slate-50/60 px-3"
      style={{ width: NAME_WIDTH, height: SUMMARY_HEIGHT }}
    >
      <Text className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">
        On leave
      </Text>
      <Text className="text-[8px] text-slate-400">Approved · per day</Text>
    </View>
  );
}

function SummaryCounts() {
  return (
    <View
      className="flex-row border-b border-slate-100 bg-slate-50/60"
      style={{ width: GRID_WIDTH, height: SUMMARY_HEIGHT }}
    >
      {DAYS.map((day) => {
        const count = approvedOnLeave(day);
        return (
          <View
            key={day}
            className="items-center justify-center"
            style={{ width: DAY_WIDTH, backgroundColor: dayTint(day) }}
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
  );
}

function LeaveRow({ member }: { member: TeamMember }) {
  const leaves = TEAM_LEAVES.filter((leave) => leave.employeeId === member.employeeId);

  return (
    <View className="border-b border-slate-100" style={{ width: GRID_WIDTH, height: ROW_HEIGHT }}>
      <View className="absolute inset-0 flex-row">
        {DAYS.map((day) => (
          <View key={day} style={{ width: DAY_WIDTH, height: ROW_HEIGHT, backgroundColor: dayTint(day) }} />
        ))}
      </View>
      {leaves.map((leave) => {
        const style = LEAVE_STYLE[leave.state];
        return (
          <View
            key={`${leave.start}-${leave.label}`}
            className="absolute h-7 items-center justify-center rounded-lg"
            style={{
              top: (ROW_HEIGHT - 28) / 2,
              left: (leave.start - 1) * DAY_WIDTH + 3,
              width: (leave.end - leave.start + 1) * DAY_WIDTH - 6,
              backgroundColor: style.fill,
              borderWidth: style.dashed ? 1 : 0,
              borderStyle: style.dashed ? 'dashed' : 'solid',
              borderColor: '#B98A0E',
            }}
          >
            <Text className="text-[9px] font-bold" style={{ color: style.text }} numberOfLines={1}>
              {leave.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function LeaveCalendar({ team }: { team: TeamMember[] }) {
  const plannedDays = TEAM_LEAVES.filter((leave) =>
    team.some((member) => member.employeeId === leave.employeeId),
  ).reduce((total, leave) => total + (leave.end - leave.start + 1), 0);

  return (
    <View className="gap-4">
      <MonthNav label={MONTH_LABEL} />

      <View className="overflow-hidden rounded-2xl border border-slate-200 bg-white" style={cardShadow}>
        <View className="flex-row items-center justify-between border-b border-slate-100 px-3 py-2.5">
          <View>
            <Text className="text-xs font-bold text-ink">Planned leave</Text>
            <Text className="text-[10px] text-slate-400">{plannedDays} leave days this month</Text>
          </View>
          <Pressable
            onPress={() => Alert.alert('Export', 'The month’s leave plan will be emailed to you.')}
            className="flex-row items-center rounded-lg border border-slate-200 px-2.5 py-1.5 active:opacity-70"
          >
            <Feather name="download" size={12} color="#14323F" />
            <Text className="ml-1.5 text-[11px] font-semibold text-ink">Export</Text>
          </Pressable>
        </View>

        <View className="flex-row">
          <View style={{ width: NAME_WIDTH }}>
            <MemberColumnHeader />
            <SummaryLabel />
            {team.map((member) => (
              <View
                key={member.employeeId}
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
              <DayHeader />
              <SummaryCounts />
              {team.map((member) => (
                <LeaveRow key={member.employeeId} member={member} />
              ))}
            </View>
          </ScrollView>
        </View>

        {team.length === 0 ? (
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
            { color: '#F7F7F9', label: 'Weekend' },
            { color: '#EEF5FA', label: 'Holiday' },
          ]}
        />
      </View>
    </View>
  );
}
