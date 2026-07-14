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
      {/* Bare icon button, matching the home header (no pill/circle chrome). */}
      <Pressable
        onPress={goBack}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        className="h-11 w-11 items-center justify-center active:scale-95"
      >
        <ChevronLeft size={24} color="#14323F" />
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
