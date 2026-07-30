import { FileText, GraduationCap, type LucideIcon } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native';

import {
  launchSatellite,
  useAvailableSatellites,
  type SatelliteKey,
} from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { cardShadow } from '../shadow';

const BRAND_PRIMARY = '#0D3749';
/** Tile border — the web's rgba(brand-primary, 0.1). */
const TILE_BORDER = 'rgba(13, 55, 73, 0.1)';

/**
 * The two connected services from the web panel's quick-links catalog
 * (APP_CATALOG in QuickLinksWidget.tsx) — label, icon and tint copied verbatim
 * so the tiles read identically on both products.
 *
 * Neither carries a URL: the destination is a short-lived signed URL minted per
 * tap so the employee lands already authenticated.
 */
const TILES: {
  key: SatelliteKey;
  label: string;
  icon: LucideIcon;
  color: string;
  tint: string;
}[] = [
  {
    key: 'compliance',
    label: 'Learning (LMS)',
    icon: GraduationCap,
    color: '#5B5AB8',
    tint: 'rgba(91, 90, 184, 0.16)',
  },
  {
    key: 'policies',
    label: 'Company policies',
    icon: FileText,
    color: '#3F7B58',
    tint: 'rgba(94, 155, 123, 0.18)',
  },
];

/** Home card carrying the web panel's two quick-link tiles. */
export default function QuickActionsCard() {
  const { isBackendSession } = useAuth();
  const [launching, setLaunching] = useState<SatelliteKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Gated on a real session: the demo session carries no bearer token, and an
  // unrecoverable 401 makes the API client sign the user out.
  const available = useAvailableSatellites(isBackendSession);

  const launchable = useMemo(
    () => new Set((available.data ?? []).map((row) => row.moduleKey)),
    [available.data],
  );

  const open = async (key: SatelliteKey) => {
    if (launching) return;
    setError(null);
    setLaunching(key);
    try {
      const url = await launchSatellite(key);
      await Linking.openURL(url);
    } catch (err) {
      // The backend distinguishes "not licensed" (403) from "licensed but never
      // connected" (409); both are actionable by an admin, so pass its wording
      // through rather than flattening it.
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Could not open the portal. Please try again in a moment.',
      );
    } finally {
      setLaunching(null);
    }
  };

  // Nothing is tappable until the availability check answers, so a tap can't
  // dead-end on an org that was never connected.
  const anyReady = TILES.some(
    (tile) => isBackendSession && launchable.has(tile.key),
  );

  return (
    <View
      style={cardShadow}
      className="gap-4 rounded-[22px] border border-slate-100 bg-white px-5 py-5"
    >
      <Text className="text-base font-bold text-ink">Quick actions</Text>

      <View className="flex-row gap-3">
        {TILES.map((tile) => {
          const ready = isBackendSession && launchable.has(tile.key);
          const busy = launching === tile.key;
          const Icon = tile.icon;
          return (
            <Pressable
              key={tile.key}
              onPress={() => void open(tile.key)}
              disabled={!ready || busy}
              accessibilityRole="button"
              accessibilityLabel={tile.label}
              accessibilityState={{ disabled: !ready || busy }}
              className="flex-1 items-start gap-2 rounded-xl border bg-white p-3 active:scale-[0.98]"
              style={{ borderColor: TILE_BORDER, opacity: ready ? 1 : 0.55 }}
            >
              <View
                className="h-[34px] w-[34px] items-center justify-center rounded-[10px]"
                style={{ backgroundColor: tile.tint }}
              >
                {busy ? (
                  <ActivityIndicator size="small" color={tile.color} />
                ) : (
                  <Icon size={18} color={tile.color} />
                )}
              </View>
              <Text
                className="text-[12.5px] font-bold leading-[16px]"
                style={{ color: BRAND_PRIMARY }}
                numberOfLines={2}
              >
                {busy ? 'Opening…' : tile.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Why the tiles are inert, when they are. */}
      {!isBackendSession ? (
        <Text className="text-xs text-slate-400">
          Sign in against the HRMS backend to open these.
        </Text>
      ) : available.isPending ? (
        <Text className="text-xs text-slate-400">Checking access…</Text>
      ) : !anyReady ? (
        <Text className="text-xs text-slate-400">
          Not connected for your organisation yet.
        </Text>
      ) : (
        <Text className="text-xs text-slate-400">
          Opens in your browser, already signed in.
        </Text>
      )}

      {error ? (
        <Text className="text-xs text-rose-500">{error}</Text>
      ) : null}
    </View>
  );
}
