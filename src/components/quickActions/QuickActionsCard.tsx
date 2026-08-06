import {
  BarChart3,
  FileText,
  GraduationCap,
  Link as LinkIcon,
  Target,
  type LucideIcon,
} from 'lucide-react-native';
// Namespace import so an icon picked BY NAME in the web editor's library
// resolves here too — lucide-react-native has no `icons` map export.
import * as lucideAll from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';

import {
  useMyQuickLinks,
  useOrgQuickLinks,
  type OrgQuickLink,
} from '../../api/quickLinks';
import {
  launchSatellite,
  useAvailableSatellites,
  warmSatellites,
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

/** Fallback look for HR-published URL links, per catalog id — mirrors the
 *  web APP_CATALOG so a tile reads the same on both products. */
const LINK_META: Record<string, { label: string; icon: LucideIcon; color: string; tint: string }> = {
  pms: {
    label: 'Performance (PMS)',
    icon: Target,
    color: '#A37526',
    tint: 'rgba(212, 162, 74, 0.22)',
  },
  analytics: {
    label: 'HR Analytics',
    icon: BarChart3,
    color: '#3F7B58',
    tint: 'rgba(94, 155, 123, 0.18)',
  },
  custom: {
    label: 'Link',
    icon: LinkIcon,
    color: 'rgba(11, 6, 49, 0.75)',
    tint: 'rgba(11, 6, 49, 0.08)',
  },
};

/** The satellites already have dedicated signed-launch tiles above; their
 *  org entries carry no URL, so only URL links become extra tiles. */
function isRenderableOrgLink(link: OrgQuickLink): boolean {
  return Boolean(link.url) && link.appId !== 'lms' && link.appId !== 'policies';
}

/** Chip look for an org link, honouring the web's precedence:
 *  uploaded image → library icon → catalog default, tinted if set. */
/** Icon-library lookup by PascalCase name ("Rocket"), or null when unknown. */
function libraryIcon(name?: string): LucideIcon | null {
  if (!name || !/^[A-Z][A-Za-z0-9]*$/.test(name)) return null;
  const candidate = (lucideAll as unknown as Record<string, unknown>)[name];
  return candidate ? (candidate as LucideIcon) : null;
}

function orgLinkChip(link: OrgQuickLink) {
  const meta = LINK_META[link.appId] ?? LINK_META.custom;
  const LibraryIcon = libraryIcon(link.icon);
  return {
    Icon: LibraryIcon ?? meta.icon,
    color: link.tint ?? meta.color,
    tint: link.tint ? `${link.tint}29` : meta.tint,
    label: link.label?.trim() || meta.label,
  };
}

/**
 * Web only: paints a lightweight "Opening…" note into a just-claimed blank
 * tab. The tab must be opened synchronously inside the tap (popup blockers
 * kill a window.open issued after an await), which means it exists before
 * the signed URL does — without this the employee stares at about:blank for
 * the whole mint + SSO handshake. Same-origin, so writing is permitted; the
 * navigation that follows replaces it wholesale. Mirrors the web panel's
 * satelliteLaunch.ts interstitial.
 */
function paintOpeningNote(tab: Window, label: string) {
  try {
    const doc = tab.document;
    doc.title = `Opening ${label}…`;
    doc.body.style.cssText =
      'margin:0;display:grid;place-items:center;height:100vh;' +
      'font-family:system-ui,-apple-system,sans-serif;background:#F7F6FC;color:#14323F';
    const style = doc.createElement('style');
    style.textContent = '@keyframes sat-spin{to{transform:rotate(360deg)}}';
    doc.head.appendChild(style);
    const wrap = doc.createElement('div');
    wrap.style.textAlign = 'center';
    const spinner = doc.createElement('div');
    spinner.style.cssText =
      'margin:0 auto 14px;width:28px;height:28px;border-radius:50%;' +
      'border:3px solid rgba(20,50,63,.15);border-top-color:#14323F;' +
      'animation:sat-spin .7s linear infinite';
    const heading = doc.createElement('strong');
    heading.textContent = `Opening ${label}…`;
    const sub = doc.createElement('div');
    sub.style.cssText = 'margin-top:6px;font-size:13px;color:#64748B';
    sub.textContent = 'Signing you in — no password needed.';
    wrap.append(spinner, heading, sub);
    doc.body.appendChild(wrap);
  } catch {
    // Writing restrictions — the blank tab still works.
  }
}

/** Home "Quick Links" card — the connected-service tiles plus the
 *  org-published and personal links from the web panel's Quick Links. */
export default function QuickActionsCard() {
  const { isBackendSession } = useAuth();
  const [launching, setLaunching] = useState<SatelliteKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Gated on a real session: the demo session carries no bearer token, and an
  // unrecoverable 401 makes the API client sign the user out.
  const available = useAvailableSatellites(isBackendSession);

  // Ping the satellites while the tiles are merely on screen, so a cold
  // instance is already up by the time the employee taps one — the cold
  // start was most of the seconds a launch used to spend on a blank page.
  useEffect(() => {
    warmSatellites(available.data);
  }, [available.data]);

  const launchable = useMemo(
    () => new Set((available.data ?? []).map((row) => row.moduleKey)),
    [available.data],
  );

  // HR-published org quick links + the employee's own pins from the web
  // dashboard — same merge order and de-dup as the web widget (org first).
  const orgLinks = useOrgQuickLinks(isBackendSession);
  const myLinks = useMyQuickLinks(isBackendSession);
  const linkTiles = useMemo(() => {
    const seen = new Set<string>();
    const out: OrgQuickLink[] = [];
    for (const link of [...(orgLinks.data ?? []), ...(myLinks.data ?? [])]) {
      if (!isRenderableOrgLink(link)) continue;
      const key = `${link.appId}::${link.url}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(link);
    }
    return out;
  }, [orgLinks.data, myLinks.data]);

  const openLink = async (url: string) => {
    setError(null);
    try {
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      });
    } catch {
      try {
        await Linking.openURL(url);
      } catch {
        setError('Could not open the link.');
      }
    }
  };

  const open = async (key: SatelliteKey) => {
    if (launching) return;
    setError(null);

    // Tapping an unavailable tile explains itself rather than doing nothing.
    // Which of the two is connected is per-organisation, so name the one the
    // employee actually tapped.
    if (!launchable.has(key)) {
      const label = TILES.find((tile) => tile.key === key)?.label ?? 'This portal';
      setError(
        available.isError
          ? `Couldn't check access to ${label}. Pull to refresh and try again.`
          : `${label} isn't connected for your organisation yet. Ask your HR admin to enable it.`,
      );
      return;
    }

    setLaunching(key);

    // Web: claim the tab NOW, synchronously inside the tap — a window.open
    // issued after the mint's await is what popup blockers kill, and the
    // claimed tab gets an "Opening…" note instead of bare about:blank.
    const label = TILES.find((tile) => tile.key === key)?.label ?? 'the portal';
    const claimedTab =
      Platform.OS === 'web' && typeof window !== 'undefined'
        ? window.open('', '_blank')
        : null;
    if (claimedTab) paintOpeningNote(claimedTab, label);

    try {
      // Minted once: each call issues a fresh short-lived signed URL, so the
      // fallback below must reuse this one rather than ask for another.
      const url = await launchSatellite(key);
      if (claimedTab) {
        // Sever the opener link so the satellite page cannot reach back in.
        claimedTab.opener = null;
        claimedTab.location.href = url;
      } else {
        try {
          // An in-app browser tab keeps the employee in the app and handles
          // the signed URL reliably.
          await WebBrowser.openBrowserAsync(url, {
            presentationStyle:
              WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
          });
        } catch {
          // Some devices have no in-app browser; hand the same URL to the OS.
          await Linking.openURL(url);
        }
      }
    } catch (err) {
      claimedTab?.close();
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
      <Text className="text-base font-bold text-ink">Quick Links</Text>

      <View className="flex-row flex-wrap gap-3">
        {TILES.map((tile) => {
          const ready = isBackendSession && launchable.has(tile.key);
          const busy = launching === tile.key;
          const Icon = tile.icon;
          return (
            <Pressable
              key={tile.key}
              onPress={() => void open(tile.key)}
              disabled={busy || !isBackendSession || available.isPending}
              accessibilityRole="button"
              accessibilityLabel={tile.label}
              accessibilityState={{
                disabled: busy || !isBackendSession || available.isPending,
              }}
              className="w-[47.5%] items-start gap-2 rounded-xl border bg-white p-3 active:scale-[0.98]"
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

        {/* HR-published org links — plain URLs, opened in an in-app tab. */}
        {linkTiles.map((link, index) => {
          const chip = orgLinkChip(link);
          const ChipIcon = chip.Icon;
          return (
            <Pressable
              key={`${link.appId}-${index}`}
              onPress={() => void openLink(link.url)}
              accessibilityRole="button"
              accessibilityLabel={chip.label}
              className="w-[47.5%] items-start gap-2 rounded-xl border bg-white p-3 active:scale-[0.98]"
              style={{ borderColor: TILE_BORDER }}
            >
              <View
                className="h-[34px] w-[34px] items-center justify-center rounded-[10px]"
                style={{ backgroundColor: chip.tint }}
              >
                {link.iconImage ? (
                  <Image
                    source={{ uri: link.iconImage }}
                    style={{ width: 20, height: 20, borderRadius: 4 }}
                    resizeMode="contain"
                  />
                ) : (
                  <ChipIcon size={18} color={chip.color} />
                )}
              </View>
              <Text
                className="text-[12.5px] font-bold leading-[16px]"
                style={{ color: BRAND_PRIMARY }}
                numberOfLines={2}
              >
                {chip.label}
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
      ) : null}

      {error ? (
        <Text className="text-xs text-rose-500">{error}</Text>
      ) : null}
    </View>
  );
}
