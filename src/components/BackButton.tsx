import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

type BackButtonProps = {
  title?: string;
  subtitle?: string;
  subtitleNumberOfLines?: number;
};

// A top-left back control + optional page title/subtitle (shown to the right of
// the button). Falls back to the home route if there is nothing to go back to.
export default function BackButton({
  title,
  subtitle,
  subtitleNumberOfLines = 1,
}: BackButtonProps) {
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
        <View className="flex-1">
          <Text className="text-lg font-bold text-ink">{title}</Text>
          {subtitle ? (
            <Text className="text-xs text-slate-400" numberOfLines={subtitleNumberOfLines}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
