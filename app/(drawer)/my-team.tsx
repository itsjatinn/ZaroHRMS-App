import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { findNodeHandle, Keyboard, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useIsManager, useTeamMembers } from '../../src/api/team';
import { useAuth } from '../../src/auth/AuthContext';
import BackButton from '../../src/components/BackButton';
import { cardShadow } from '../../src/components/shadow';
import AttendanceCalendar from '../../src/components/team/AttendanceCalendar';
import LeaveCalendar from '../../src/components/team/LeaveCalendar';
import { STATUS_STYLE, TEAM, type TeamMember, type TeamStatus } from '../../src/components/team/teamData';

type TeamView = 'roster' | 'attendance' | 'leave';

const VIEWS: { key: TeamView; label: string; icon: ReactNode; activeIcon: ReactNode }[] = [
  {
    key: 'roster',
    label: 'Roster',
    icon: <Feather name="users" size={14} color="#64748B" />,
    activeIcon: <Feather name="users" size={14} color="#14323F" />,
  },
  {
    key: 'attendance',
    label: 'Attendance',
    icon: <Feather name="calendar" size={14} color="#64748B" />,
    activeIcon: <Feather name="calendar" size={14} color="#14323F" />,
  },
  {
    key: 'leave',
    label: 'Leave',
    icon: <MaterialCommunityIcons name="airplane" size={14} color="#64748B" />,
    activeIcon: <MaterialCommunityIcons name="airplane" size={14} color="#14323F" />,
  },
];

const SEARCH_KEYBOARD_OFFSET = 85;

function SummaryCard({ icon, label, value, subtitle, color, background }: { icon: ReactNode; label: string; value: number; subtitle: string; color: string; background: string }) {
  return (
    <View className="w-[48.5%] rounded-xl border border-slate-200 bg-white p-2.5" style={cardShadow}>
      <View className="flex-row items-center">
        <View className="mr-2 h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: background }}>{icon}</View>
        <View>
          <Text className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">{label}</Text>
          <Text className="text-lg font-bold leading-5" style={{ color }}>{value}</Text>
        </View>
      </View>
      <Text className="mt-1 text-[9px] text-slate-400">{subtitle}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: TeamStatus }) {
  const colors = STATUS_STYLE[status];
  return (
    <View className="flex-row items-center rounded-full px-2.5 py-1" style={{ backgroundColor: colors.bg }}>
      <View className="mr-1.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors.dot }} />
      <Text className="text-[11px] font-semibold" style={{ color: colors.text }}>{status}</Text>
    </View>
  );
}

function TeamMemberCard({ member }: { member: TeamMember }) {
  return (
    <View className="rounded-2xl border border-slate-200 bg-white p-4" style={cardShadow}>
      <View className="flex-row items-start">
        <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-[#E8E8ED]">
          <Text className="font-semibold text-slate-500">{member.initials}</Text>
          <View className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white" style={{ backgroundColor: STATUS_STYLE[member.status].dot }} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-base font-bold text-ink">{member.name}</Text>
          <Text className="mt-0.5 text-xs text-slate-500">{member.role}</Text>
          <Text className="mt-1 text-[11px] text-slate-400">{member.employeeId}</Text>
        </View>
        <StatusBadge status={member.status} />
      </View>
      <View className="mt-3 flex-row items-center">
        <Feather name="mail" size={13} color="#78909A" />
        <Text className="ml-1.5 flex-1 text-xs text-slate-500" numberOfLines={1}>{member.email}</Text>
      </View>
      <View className="mt-3 flex-row items-center border-t border-slate-100 pt-3">
        <Text className="text-xs text-slate-500">In <Text className="font-semibold text-ink">{member.inTime}</Text></Text>
        <Text className="mx-2 text-slate-300">•</Text>
        <Text className="text-xs text-slate-500">Out <Text className="font-semibold text-ink">{member.outTime}</Text></Text>
        {member.note ? <Text className="ml-auto rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-500">{member.note}</Text> : null}
      </View>
    </View>
  );
}

function ViewSwitcher({ view, onChange }: { view: TeamView; onChange: (view: TeamView) => void }) {
  return (
    <View className="flex-row rounded-xl border border-slate-200 bg-slate-100 p-1">
      {VIEWS.map((item) => {
        const active = view === item.key;
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            className={`flex-1 flex-row items-center justify-center rounded-lg py-2.5 ${active ? 'bg-white' : ''}`}
            style={active ? cardShadow : undefined}
          >
            {active ? item.activeIcon : item.icon}
            <Text className={`ml-1.5 text-[11px] font-semibold ${active ? 'text-ink' : 'text-slate-500'}`}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function MyTeamScreen() {
  const { isBackendSession } = useAuth();
  const managerAccess = useIsManager();
  // Live roster for a real session; the demo keeps the sample team. While the
  // roster loads, an empty list beats showing six fabricated employees.
  const teamQuery = useTeamMembers(isBackendSession && managerAccess.isManager);
  const roster = useMemo(
    () => (isBackendSession ? (teamQuery.data ?? []) : TEAM),
    [isBackendSession, teamQuery.data],
  );
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<TeamView>('roster');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'All' | TeamStatus>('All');
  const scrollRef = useRef<ScrollView>(null);
  const searchRef = useRef<TextInput>(null);
  const searchTargetRef = useRef<number | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const scrollSearchToKeyboard = useCallback((target = searchTargetRef.current) => {
    if (!target) return;
    setTimeout(() => {
      scrollRef.current
        ?.getScrollResponder()
        ?.scrollResponderScrollNativeHandleToKeyboard(target, SEARCH_KEYBOARD_OFFSET, true);
    }, 80);
  }, []);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      scrollSearchToKeyboard();
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [scrollSearchToKeyboard]);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      setKeyboardHeight(0);
    }, []),
  );

  const handleSearchFocus = () => {
    const target = findNodeHandle(searchRef.current);
    searchTargetRef.current = target;
    scrollSearchToKeyboard(target);
  };

  // Search + status filter apply to every view, so the calendars stay in step
  // with whatever slice of the team the manager is looking at.
  const filteredTeam = useMemo(() => roster.filter((member) => {
    const search = query.trim().toLowerCase();
    const matchesSearch = !search || `${member.name} ${member.role} ${member.employeeId}`.toLowerCase().includes(search);
    return matchesSearch && (status === 'All' || member.status === status);
  }), [roster, query, status]);

  const counts = useMemo(() => ({
    present: roster.filter((member) => member.status === 'Present').length,
    remote: roster.filter((member) => member.status === 'WFH/WO').length,
    leave: roster.filter((member) => member.status === 'On leave').length,
  }), [roster]);

  // Only bounce once the server has answered — redirecting while the
  // is-manager check is in flight would eject a real manager.
  if (managerAccess.ready && !managerAccess.isManager) {
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: keyboardHeight + insets.bottom + 112 }}
      >
        <View className="gap-4 px-4 pt-2">
          <View className="-mx-4">
            <BackButton title="My team" subtitle="Today’s roster, attendance, and planned leave" />
          </View>

          <ViewSwitcher view={view} onChange={setView} />

          <View className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3">
            <Feather name="search" size={18} color="#94A3B8" />
            <TextInput
              ref={searchRef}
              value={query}
              onChangeText={setQuery}
              onFocus={handleSearchFocus}
              placeholder="Search name, role, ID…"
              placeholderTextColor="#94A3B8"
              returnKeyType="search"
              blurOnSubmit
              onSubmitEditing={Keyboard.dismiss}
              className="ml-2 h-12 flex-1 text-sm text-ink"
            />
            {query ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Feather name="x" size={16} color="#94A3B8" />
              </Pressable>
            ) : null}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {(['All', 'Present', 'WFH/WO', 'On leave', 'Absent'] as const).map((item) => (
              <Pressable key={item} onPress={() => setStatus(item)} className={`rounded-full border px-4 py-2 ${status === item ? 'border-ink bg-ink' : 'border-slate-200 bg-white'}`}>
                <Text className={`text-xs font-semibold ${status === item ? 'text-white' : 'text-slate-500'}`}>{item === 'All' ? 'All statuses' : item}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {view === 'roster' ? (
            <>
              <View className="flex-row flex-wrap justify-between gap-y-2">
                <SummaryCard icon={<Feather name="users" size={18} color="#6258B2" />} label="Team size" value={roster.length} subtitle="direct reports" color="#6258B2" background="#F0EEFA" />
                <SummaryCard icon={<Feather name="user-check" size={18} color="#3D8762" />} label="Present" value={counts.present} subtitle="in office today" color="#3D8762" background="#EAF4EE" />
                <SummaryCard icon={<MaterialCommunityIcons name="home-outline" size={20} color="#6258B2" />} label="WFH / WO" value={counts.remote} subtitle="remote today" color="#6258B2" background="#F0EEFA" />
                <SummaryCard icon={<MaterialCommunityIcons name="airplane" size={19} color="#B17B18" />} label="On leave" value={counts.leave} subtitle="out of office" color="#B17B18" background="#FFF5DF" />
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-bold text-ink">My direct reports</Text>
                <Text className="text-xs text-slate-400">{filteredTeam.length} of {roster.length}</Text>
              </View>
              <View className="gap-3">
                {filteredTeam.map((member) => <TeamMemberCard key={member.employeeId} member={member} />)}
                {filteredTeam.length === 0 ? (
                  <View className="items-center rounded-2xl border border-slate-200 bg-white py-10">
                    <Feather name="users" size={30} color="#CBD5E1" />
                    <Text className="mt-3 text-sm text-slate-400">No team members found.</Text>
                  </View>
                ) : null}
              </View>
            </>
          ) : view === 'attendance' ? (
            <AttendanceCalendar team={filteredTeam} />
          ) : (
            <LeaveCalendar team={filteredTeam} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
