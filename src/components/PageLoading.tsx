import { ActivityIndicator, Text, View } from 'react-native';

export default function PageLoading({ label = 'Loading...' }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-6 py-16">
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
        <ActivityIndicator color="#14323F" />
      </View>
      <Text className="text-sm font-semibold text-slate-500">{label}</Text>
    </View>
  );
}
