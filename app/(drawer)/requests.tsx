import { CalendarX } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackButton from '../../src/components/BackButton';
import RequestCard from '../../src/components/leave/RequestCard';
import { REQUESTS } from '../../src/components/leave/requestsData';
import { cardShadow } from '../../src/components/shadow';

const FILTERS = ['All', 'Pending', 'Approved', 'Rejected'] as const;
type Filter = (typeof FILTERS)[number];

export default function AllRequestsScreen() {
  const [filter, setFilter] = useState<Filter>('All');

  const counts = useMemo(
    () => ({
      All: REQUESTS.length,
      Pending: REQUESTS.filter((r) => r.status === 'Pending').length,
      Approved: REQUESTS.filter((r) => r.status === 'Approved').length,
      Rejected: REQUESTS.filter((r) => r.status === 'Rejected').length,
    }),
    [],
  );

  const visible = useMemo(
    () =>
      filter === 'All'
        ? REQUESTS
        : REQUESTS.filter((r) => r.status === filter),
    [filter],
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <BackButton
        title="Leave Requests"
        subtitle={`${counts.All} total · ${counts.Pending} pending`}
      />

      {/* Filter segmented control */}
      <View className="mx-4 mt-2 flex-row rounded-2xl bg-slate-200/70 p-1.5">
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              className={`flex-1 items-center justify-center rounded-xl py-2.5 ${
                active ? 'bg-white' : ''
              }`}
              style={active ? cardShadow : undefined}
            >
              <Text
                className={`text-[13px] font-semibold ${
                  active ? 'text-ink' : 'text-slate-500'
                }`}
              >
                {f}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-4 pb-32 pt-4"
        showsVerticalScrollIndicator={false}
      >
        {visible.length > 0 ? (
          visible.map((r) => (
            <RequestCard
              key={r.id}
              type={r.type}
              dates={r.dates}
              days={r.days}
              status={r.status}
              icon={r.icon}
              iconColor={r.iconColor}
              badgeClass={r.badgeClass}
              onCancel={r.status !== 'Rejected' ? () => {} : undefined}
            />
          ))
        ) : (
          <View className="mt-24 items-center gap-3">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <CalendarX size={26} color="#94A3B8" />
            </View>
            <Text className="text-base font-bold text-ink">
              No {filter.toLowerCase()} requests
            </Text>
            <Text className="px-10 text-center text-sm text-slate-400">
              You have no {filter.toLowerCase()} leave requests right now.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
