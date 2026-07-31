import { useNavigation, usePathname, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';

/** Where back lands when there is nothing to pop — the home tab. */
const HOME_ROUTE = '/';

/** How long to wait before deciding the back action was a no-op. */
const SETTLE_MS = 150;

type BackButtonProps = {
  title?: string;
  subtitle?: string;
  subtitleNumberOfLines?: number;
  /** Route to land on when there is no history to pop. Defaults to home. */
  fallbackRoute?: string;
};

// A top-left back control + optional page title/subtitle (shown to the right of
// the button). Falls back to the home route if there is nothing to go back to.
export default function BackButton({
  title,
  subtitle,
  subtitleNumberOfLines = 1,
  fallbackRoute = HOME_ROUTE,
}: BackButtonProps) {
  const router = useRouter();
  const navigation = useNavigation();
  const pathname = usePathname();

  // Read inside the timer callback, so it has to be a ref, not the render value.
  const pathnameRef = useRef(pathname);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(
    () => () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    },
    [],
  );

  const goBack = () => {
    const from = pathnameRef.current;

    // `router.back()` dispatches an untargeted GO_BACK from the root, which the
    // drawer screens (Calendar, Holidays, Celebrations…) never receive — the
    // tap then does nothing at all. Asking this screen's own navigator first
    // targets the action at the drawer, which does have somewhere to go back to.
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      // NAVIGATE (not REPLACE) — every navigator handles it, including drawers.
      router.navigate(fallbackRoute);
      return;
    }

    // Safety net: if the route did not actually move, land on the fallback so
    // the button is never a dead control.
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      if (pathnameRef.current === from) router.navigate(fallbackRoute);
    }, SETTLE_MS);
  };

  return (
    <View className="flex-row items-center gap-3 px-4 pb-1 pt-2">
      {/* Square pill back control, shared across drawer screens. */}
      <Pressable
        onPress={goBack}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        className="h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white active:scale-95"
      >
        <ChevronLeft size={22} color="#14323F" />
      </Pressable>
      {title ? (
        <View className="h-10 flex-1 justify-center">
          <Text
            className="text-left text-[18px] font-bold leading-6 text-ink"
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
