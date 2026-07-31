import { useQueryClient } from '@tanstack/react-query';
import { forwardRef, useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  type ScrollViewProps,
} from 'react-native';

const REFRESH_TINT = '#14323F';
const REFRESH_ACCENT = '#F5D14E';

type AppScrollViewProps = ScrollViewProps & {
  /** Extra work to run after the shared React Query refresh. */
  onRefreshApp?: () => Promise<void> | void;
};

const AppScrollView = forwardRef<ScrollView, AppScrollViewProps>(
  function AppScrollView(
    { children, onRefreshApp, refreshControl, ...props },
    ref,
  ) {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries();
      await onRefreshApp?.();
    } finally {
      setRefreshing(false);
    }
  }, [onRefreshApp, queryClient]);

  return (
    <ScrollView
      ref={ref}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        refreshControl ?? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={REFRESH_TINT}
            colors={[REFRESH_TINT, REFRESH_ACCENT]}
            progressBackgroundColor="#FFFFFF"
          />
        )
      }
      {...props}
    >
      {children}
    </ScrollView>
  );
  },
);

export default AppScrollView;
