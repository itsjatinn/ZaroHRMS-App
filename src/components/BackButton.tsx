import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

type BackButtonProps = {
  title?: string;
};

// A top-left back control + optional page title. Falls back to the home
// route if there is nothing to go back to.
export default function BackButton({ title }: BackButtonProps) {
  const router = useRouter();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View className="flex-row items-center gap-3 px-4 pb-1 pt-2">
      <Pressable
        onPress={goBack}
        hitSlop={8}
        className="h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white active:scale-95"
      >
        <ChevronLeft size={20} color="#14323F" />
      </Pressable>
      {title ? (
        <Text className="text-lg font-bold text-ink">{title}</Text>
      ) : null}
    </View>
  );
}
