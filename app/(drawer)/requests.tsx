import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import BackButton from '../../src/components/BackButton';
import RequestCard from '../../src/components/requests/RequestCard';
import {
  REQUESTS,
  REQUEST_FILTERS,
  type RequestFilter,
} from '../../src/components/requests/requestsData';

export default function Requests() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filter, setFilter] = useState<RequestFilter>('All');

  const rows = filter === 'All' ? REQUESTS : REQUESTS.filter((r) => r.status === filter);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-[#F4F3EF]">
      <BackButton title="Requests" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* New request */}
        <Pressable
          onPress={() => router.push('/apply-leave')}
          className="h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-[#14323F] active:scale-[0.98]"
        >
          <Plus size={18} color="#FFFFFF" />
          <Text className="text-sm font-bold text-white">New Request</Text>
        </Pressable>

        {/* Filter chips */}
        <View className="flex-row gap-2">
          {REQUEST_FILTERS.map((f) => {
            const active = f === filter;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                className={`rounded-full px-3.5 py-2 ${active ? 'bg-[#14323F]' : 'border border-slate-200 bg-white'}`}
              >
                <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-slate-500'}`}>
                  {f}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Request list */}
        {rows.map((r) => (
          <RequestCard key={r.title + r.sub} item={r} />
        ))}

        {rows.length === 0 && (
          <Text className="py-8 text-center text-sm text-slate-400">
            No {filter.toLowerCase()} requests.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
