import {
  Calendar,
  CheckCircle2,
  ExternalLink,
  File as FileIcon,
  FileArchive,
  FileSpreadsheet,
  FileText,
  Link as LinkIcon,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Play,
  Send,
  Square,
  SquareCheck,
  User,
  Users,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  useAcknowledgeAnnouncement,
  useAddAnnouncementComment,
  useAnnouncementComments,
  useCastPollVote,
  useSetAnnouncementReaction,
  type Attachment,
  type ContactCard,
  type Cta,
  type EventInfo,
  type CommentRow,
  type Media,
  type Poll,
  type ReactionKind,
} from '../../api/announcements';
import { demoCommentsFor } from './demoAnnouncements';
import {
  ACK_GREEN,
  ATTACHMENT_STYLE,
  BRAND_PRIMARY,
  brandAlpha,
  formatDateTime,
  formatKb,
  formatRelative,
  REACTIONS,
  safeLinkUrl,
  safeMediaUrl,
  UNREAD_ACCENT,
} from './announcementsData';

/** Section heading shared by every block — the web's .anc__block-title. */
function BlockTitle({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center gap-1.5">
      {icon}
      <Text
        className="text-[13px] font-bold"
        style={{ color: BRAND_PRIMARY }}
      >
        {children}
      </Text>
    </View>
  );
}

const openUrl = (url?: string | null) => {
  const safe = safeLinkUrl(url);
  if (safe) void Linking.openURL(safe);
};

/* ───────────────────────────── Media ───────────────────────────── */

export function MediaBlock({
  media,
  title,
  rounded = false,
}: {
  media: Media;
  title: string;
  rounded?: boolean;
}) {
  const radius = rounded ? 'rounded-xl' : '';

  if (media.display === 'gallery' && media.gallery?.length) {
    const images = media.gallery
      .map((item) => ({ ...item, url: safeMediaUrl(item.url) }))
      .filter((item): item is { url: string; alt?: string } => Boolean(item.url));
    if (!images.length) return null;
    return (
      <View className="flex-row flex-wrap gap-1.5">
        {images.map((image, index) => (
          <Image
            key={index}
            source={{ uri: image.url }}
            accessibilityLabel={image.alt ?? `${title} image ${index + 1}`}
            resizeMode="cover"
            className="h-24 flex-1 rounded-lg"
            style={{ minWidth: 100, backgroundColor: brandAlpha(0.04) }}
          />
        ))}
      </View>
    );
  }

  if (media.kind === 'image') {
    const url = safeMediaUrl(media.url);
    if (!url) return null;
    return (
      <Image
        source={{ uri: url }}
        accessibilityLabel={media.alt ?? title}
        resizeMode="cover"
        className={`w-full ${radius}`}
        style={{
          aspectRatio: media.display === 'thumbnail' ? 16 / 9 : 16 / 10,
          backgroundColor: brandAlpha(0.04),
        }}
      />
    );
  }

  // Video: no embedded player in the app, so the poster (when present) doubles
  // as a tappable thumbnail that hands off to the device's browser/player.
  const videoUrl = safeMediaUrl(media.url);
  if (!videoUrl) return null;
  const poster = safeMediaUrl(media.poster);

  return (
    <Pressable
      onPress={() => openUrl(videoUrl)}
      accessibilityRole="button"
      accessibilityLabel={`Play video: ${title}`}
      className={`w-full items-center justify-center overflow-hidden bg-black ${radius}`}
      style={{ aspectRatio: 16 / 9 }}
    >
      {poster ? (
        <Image
          source={{ uri: poster }}
          resizeMode="cover"
          className="absolute inset-0 h-full w-full opacity-70"
        />
      ) : null}
      <View
        className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
        style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}
      >
        <Play size={12} color="#FFFFFF" />
        <Text className="text-[11px] font-bold text-white">Play video</Text>
      </View>
    </Pressable>
  );
}

/* ─────────────────────────── Attachments ─────────────────────────── */

function FileGlyph({ type, color }: { type: Attachment['type']; color: string }) {
  if (type === 'pdf' || type === 'docx' || type === 'pptx') {
    return <FileText size={16} color={color} />;
  }
  if (type === 'xlsx') return <FileSpreadsheet size={16} color={color} />;
  if (type === 'zip') return <FileArchive size={16} color={color} />;
  return <FileIcon size={16} color={color} />;
}

export function AttachmentsBlock({
  attachments,
}: {
  attachments: Attachment[];
}) {
  const files = attachments.filter((file) => safeLinkUrl(file.url));
  if (!files.length) return null;

  return (
    <View className="gap-2">
      <BlockTitle>Attachments</BlockTitle>
      <View className="gap-2">
        {files.map((file) => {
          const tint = ATTACHMENT_STYLE[file.type] ?? ATTACHMENT_STYLE.other;
          return (
            <Pressable
              key={file.id}
              onPress={() => openUrl(file.url)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${file.name}`}
              className="flex-row items-center gap-2.5 rounded-[10px] border px-3 py-2.5 active:opacity-70"
              style={{ borderColor: brandAlpha(0.1) }}
            >
              <View
                className="h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: tint.bg }}
              >
                <FileGlyph type={file.type} color={tint.color} />
              </View>
              <View className="min-w-0 flex-1">
                <Text
                  className="text-[13px] font-bold"
                  style={{ color: BRAND_PRIMARY }}
                  numberOfLines={1}
                >
                  {file.name}
                </Text>
                <Text
                  className="text-[11px] font-semibold tracking-wide"
                  style={{ color: brandAlpha(0.55) }}
                >
                  {file.type.toUpperCase()}
                  {file.sizeKb ? ` · ${formatKb(file.sizeKb)}` : ''}
                </Text>
              </View>
              <ExternalLink size={14} color={brandAlpha(0.4)} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/* ────────────────────────────── CTAs ────────────────────────────── */

export function CtasBlock({ ctas }: { ctas: Cta[] }) {
  const links = ctas.filter((cta) => safeLinkUrl(cta.url));
  if (!links.length) return null;

  return (
    <View className="flex-row flex-wrap gap-2">
      {links.map((cta) => {
        const primary = (cta.variant ?? 'primary') === 'primary';
        return (
          <Pressable
            key={cta.id}
            onPress={() => openUrl(cta.url)}
            accessibilityRole="button"
            className="rounded-[10px] border px-3.5 py-2 active:opacity-80"
            style={{
              backgroundColor: primary ? BRAND_PRIMARY : '#FFFFFF',
              borderColor: primary ? BRAND_PRIMARY : brandAlpha(0.12),
            }}
          >
            <Text
              className="text-[13px] font-bold"
              style={{ color: primary ? '#FFFFFF' : BRAND_PRIMARY }}
            >
              {cta.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ────────────────────────────── Event ───────────────────────────── */

export function EventBlock({
  title,
  event,
}: {
  title: string;
  event: EventInfo;
}) {
  const [rsvp, setRsvp] = useState<'yes' | 'maybe' | 'no' | null>(null);
  const meetingUrl = safeLinkUrl(event.meetingUrl);

  return (
    <View
      className="gap-2.5 rounded-xl border p-3"
      style={{
        borderColor: 'rgba(91, 90, 184, 0.22)',
        backgroundColor: 'rgba(91, 90, 184, 0.05)',
      }}
    >
      <BlockTitle>Event details</BlockTitle>

      <View className="gap-1.5">
        <View className="flex-row items-center gap-2">
          <Calendar size={14} color={brandAlpha(0.55)} />
          <Text
            className="flex-1 text-[13px] font-bold"
            style={{ color: brandAlpha(0.78) }}
          >
            {formatDateTime(event.start)}
            {event.end ? ` → ${formatDateTime(event.end)}` : ''}
          </Text>
        </View>
        {event.venue ? (
          <View className="flex-row items-center gap-2">
            <MapPin size={14} color={brandAlpha(0.55)} />
            <Text
              className="flex-1 text-[13px]"
              style={{ color: brandAlpha(0.78) }}
            >
              {event.venue}
            </Text>
          </View>
        ) : null}
        {meetingUrl ? (
          <Pressable
            onPress={() => openUrl(meetingUrl)}
            accessibilityRole="button"
            className="flex-row items-center gap-2 active:opacity-70"
          >
            <LinkIcon size={14} color={brandAlpha(0.55)} />
            <Text
              className="text-[13px] underline"
              style={{ color: UNREAD_ACCENT }}
            >
              Meeting link
            </Text>
          </Pressable>
        ) : null}
        {event.organizer ? (
          <View className="flex-row items-center gap-2">
            <User size={14} color={brandAlpha(0.55)} />
            <Text
              className="flex-1 text-[13px]"
              style={{ color: brandAlpha(0.78) }}
            >
              {event.organizer}
            </Text>
          </View>
        ) : null}
      </View>

      {event.rsvp ? (
        <View className="flex-row items-center gap-2">
          <Text
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{ color: brandAlpha(0.55) }}
          >
            RSVP
          </Text>
          {(['yes', 'maybe', 'no'] as const).map((option) => {
            const active = rsvp === option;
            return (
              <Pressable
                key={option}
                onPress={() => setRsvp(option)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                className="rounded-full border px-2.5 py-1 active:opacity-70"
                style={{
                  backgroundColor: active ? BRAND_PRIMARY : '#FFFFFF',
                  borderColor: active ? BRAND_PRIMARY : brandAlpha(0.14),
                }}
              >
                <Text
                  className="text-[11px] font-bold"
                  style={{ color: active ? '#FFFFFF' : BRAND_PRIMARY }}
                >
                  {option === 'yes'
                    ? 'Attending'
                    : option === 'maybe'
                      ? 'Maybe'
                      : 'Decline'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <Pressable
        onPress={() => openUrl(googleCalUrl(title, event))}
        accessibilityRole="button"
        className="flex-row items-center justify-center gap-1.5 self-start rounded-[10px] border bg-white px-3 py-2 active:opacity-70"
        style={{ borderColor: brandAlpha(0.12) }}
      >
        <Calendar size={13} color={BRAND_PRIMARY} />
        <Text
          className="text-[13px] font-bold"
          style={{ color: BRAND_PRIMARY }}
        >
          Add to calendar
        </Text>
      </Pressable>
    </View>
  );
}

/** Google Calendar deep link — the one "add to calendar" target that works
 *  without a file download, which the app cannot offer. */
function googleCalUrl(title: string, event: EventInfo): string {
  const stamp = (iso: string) =>
    new Date(iso).toISOString().replace(/[-:]|\.\d{3}/g, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${stamp(event.start)}/${stamp(event.end ?? event.start)}`,
    details: [event.organizer ? `Organiser: ${event.organizer}` : null, event.meetingUrl]
      .filter(Boolean)
      .join('\n'),
    location: event.venue ?? '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/* ────────────────────────────── Poll ───────────────────────────── */

export function PollBlock({
  announcementId,
  poll,
  initialVotes,
  initialMyVote,
  demo = false,
}: {
  announcementId: string;
  poll: Poll;
  initialVotes?: Record<string, number>;
  initialMyVote?: string | null;
  /** Demo session — keep the vote local, never call the API. */
  demo?: boolean;
}) {
  const [voted, setVoted] = useState<string | null>(initialMyVote ?? null);
  const [tallies, setTallies] = useState<Record<string, number>>(
    initialVotes ?? Object.fromEntries(poll.options.map((o) => [o.id, 0])),
  );
  const castVote = useCastPollVote();

  useEffect(() => {
    setVoted(initialMyVote ?? null);
    if (initialVotes) setTallies(initialVotes);
  }, [initialMyVote, initialVotes]);

  const total = Object.values(tallies).reduce((sum, n) => sum + n, 0) || 1;

  const vote = (optionId: string) => {
    if (voted || castVote.isPending) return;
    // Optimistic — rolled back if the request fails.
    setVoted(optionId);
    setTallies((prev) => ({ ...prev, [optionId]: (prev[optionId] ?? 0) + 1 }));
    if (demo) return;
    castVote.mutate(
      { id: announcementId, pollId: poll.id, optionId },
      {
        onError: () => {
          setVoted(null);
          setTallies((prev) => ({
            ...prev,
            [optionId]: Math.max(0, (prev[optionId] ?? 1) - 1),
          }));
        },
      },
    );
  };

  return (
    <View
      className="gap-2.5 rounded-xl border p-3"
      style={{ borderColor: brandAlpha(0.1) }}
    >
      <BlockTitle>{poll.question}</BlockTitle>
      <View className="gap-2">
        {poll.options.map((option) => {
          const count = tallies[option.id] ?? 0;
          const pct = Math.round((count / total) * 100);
          const chosen = voted === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => vote(option.id)}
              disabled={Boolean(voted) || castVote.isPending}
              accessibilityRole="button"
              accessibilityState={{ selected: chosen }}
              className="overflow-hidden rounded-[10px] border"
              style={{
                borderColor: chosen ? UNREAD_ACCENT : brandAlpha(0.12),
                backgroundColor: '#FFFFFF',
              }}
            >
              {/* Result fill sits behind the row once a vote is in. */}
              {voted ? (
                <View
                  className="absolute bottom-0 left-0 top-0"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: chosen
                      ? 'rgba(91, 90, 184, 0.16)'
                      : brandAlpha(0.06),
                  }}
                />
              ) : null}
              <View className="flex-row items-center gap-2 px-3 py-2.5">
                {chosen ? (
                  <SquareCheck size={14} color={UNREAD_ACCENT} />
                ) : (
                  <Square size={14} color={brandAlpha(0.4)} />
                )}
                <Text
                  className="flex-1 text-[13px] font-semibold"
                  style={{ color: BRAND_PRIMARY }}
                >
                  {option.label}
                </Text>
                {voted ? (
                  <Text
                    className="text-[11px] font-bold"
                    style={{ color: brandAlpha(0.6) }}
                  >
                    {pct}% · {count}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
      <Text className="text-[11px] font-semibold" style={{ color: brandAlpha(0.5) }}>
        {voted
          ? `Thanks for voting · ${total} ${total === 1 ? 'vote' : 'votes'}`
          : `${total} ${total === 1 ? 'vote' : 'votes'} so far`}
      </Text>
    </View>
  );
}

/* ──────────────────────────── Reactions ─────────────────────────── */

export function ReactionsBlock({
  id,
  initialMine,
  initialCounts,
  demo = false,
}: {
  id: string;
  initialMine?: ReactionKind | null;
  initialCounts?: Partial<Record<ReactionKind, number>>;
  /** Demo session — keep the reaction local, never call the API. */
  demo?: boolean;
}) {
  const [mine, setMine] = useState<ReactionKind | null>(initialMine ?? null);
  const [counts, setCounts] = useState<Partial<Record<ReactionKind, number>>>(
    initialCounts ?? {},
  );
  const setReaction = useSetAnnouncementReaction();

  useEffect(() => {
    setMine(initialMine ?? null);
    setCounts(initialCounts ?? {});
  }, [initialMine, initialCounts]);

  const toggle = (key: ReactionKind) => {
    const previous = mine;
    const next: ReactionKind | null = mine === key ? null : key;
    setMine(next);
    setCounts((current) => {
      const out = { ...current };
      if (previous) out[previous] = Math.max(0, (out[previous] ?? 0) - 1);
      if (next) out[next] = (out[next] ?? 0) + 1;
      return out;
    });
    if (demo) return;
    setReaction.mutate(
      { id, kind: next },
      {
        onError: () => {
          setMine(previous);
          setCounts((current) => {
            const out = { ...current };
            if (next) out[next] = Math.max(0, (out[next] ?? 0) - 1);
            if (previous) out[previous] = (out[previous] ?? 0) + 1;
            return out;
          });
        },
      },
    );
  };

  return (
    <View className="flex-row flex-wrap gap-2">
      {REACTIONS.map((reaction) => {
        const isMine = mine === reaction.key;
        return (
          <Pressable
            key={reaction.key}
            onPress={() => toggle(reaction.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: isMine }}
            className="flex-row items-center gap-1.5 rounded-full border px-2.5 py-1 active:scale-95"
            style={{
              backgroundColor: isMine
                ? 'rgba(91, 90, 184, 0.12)'
                : brandAlpha(0.05),
              borderColor: isMine ? 'rgba(91, 90, 184, 0.4)' : brandAlpha(0.1),
            }}
          >
            <Text className="text-[15px]">{reaction.emoji}</Text>
            <Text
              className="text-[11px] font-bold"
              style={{ color: BRAND_PRIMARY }}
            >
              {counts[reaction.key] ?? 0}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ─────────────────────────── Acknowledge ────────────────────────── */

export function AcknowledgeBlock({
  id,
  initialAcked,
  demo = false,
}: {
  id: string;
  initialAcked?: boolean;
  /** Demo session — flip to acknowledged locally, never call the API. */
  demo?: boolean;
}) {
  const [acked, setAcked] = useState(Boolean(initialAcked));
  const [confirmed, setConfirmed] = useState(false);
  const acknowledge = useAcknowledgeAnnouncement();

  useEffect(() => {
    setAcked(Boolean(initialAcked));
  }, [initialAcked]);

  const submit = () => {
    if (!confirmed || acked || acknowledge.isPending) return;
    if (demo) {
      setAcked(true);
      return;
    }
    acknowledge.mutate(id, { onSuccess: () => setAcked(true) });
  };

  return (
    <View
      className="gap-2.5 rounded-[10px] border p-3"
      style={
        acked
          ? {
              borderColor: 'rgba(63, 123, 88, 0.4)',
              backgroundColor: 'rgba(94, 155, 123, 0.1)',
            }
          : {
              borderColor: 'rgba(212, 162, 74, 0.45)',
              borderStyle: 'dashed',
              backgroundColor: 'rgba(212, 162, 74, 0.08)',
            }
      }
    >
      <Pressable
        onPress={() => !acked && setConfirmed((value) => !value)}
        disabled={acked}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: acked || confirmed, disabled: acked }}
        className="flex-row items-center gap-2.5"
      >
        {acked || confirmed ? (
          <SquareCheck size={18} color={ACK_GREEN} />
        ) : (
          <Square size={18} color={brandAlpha(0.4)} />
        )}
        <Text
          className="flex-1 text-[13px] font-semibold"
          style={{ color: BRAND_PRIMARY }}
        >
          I have read and understood this announcement.
        </Text>
      </Pressable>

      {acked ? (
        <View className="flex-row items-center gap-1.5">
          <CheckCircle2 size={13} color={ACK_GREEN} />
          <Text
            className="text-[11px] font-bold"
            style={{ color: ACK_GREEN }}
          >
            Acknowledged
          </Text>
        </View>
      ) : (
        <Pressable
          onPress={submit}
          disabled={!confirmed || acknowledge.isPending}
          accessibilityRole="button"
          accessibilityState={{ disabled: !confirmed || acknowledge.isPending }}
          className="flex-row items-center justify-center gap-1.5 self-start rounded-[10px] px-3.5 py-2 active:opacity-80"
          style={{
            backgroundColor: BRAND_PRIMARY,
            opacity: confirmed && !acknowledge.isPending ? 1 : 0.5,
          }}
        >
          <Text className="text-[13px] font-bold text-white">
            {acknowledge.isPending ? 'Acknowledging…' : 'Acknowledge'}
          </Text>
        </Pressable>
      )}

      {acknowledge.isError ? (
        <Text className="text-[11px] font-semibold" style={{ color: '#B91C1C' }}>
          Could not acknowledge. Please try again.
        </Text>
      ) : null}
    </View>
  );
}

/* ──────────────────────────── Comments ─────────────────────────── */

const COMMENT_PALETTE = ['#0D3749', '#7C5CC6', '#5E9B7B', '#D4A24A', '#B04A2A'];

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '?';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return COMMENT_PALETTE[Math.abs(hash) % COMMENT_PALETTE.length];
}

export function CommentsBlock({
  id,
  demo = false,
}: {
  id: string;
  /** Demo session — seeded thread, posts stay local, no API calls at all. */
  demo?: boolean;
}) {
  const [draft, setDraft] = useState('');
  const [localRows, setLocalRows] = useState<CommentRow[]>(() =>
    demo ? demoCommentsFor(id) : [],
  );
  // The query stays disabled on a demo session — it has no token to send.
  const comments = useAnnouncementComments(id, !demo);
  const addComment = useAddAnnouncementComment(id);
  const rows = demo ? localRows : (comments.data ?? []);

  const submit = () => {
    const text = draft.trim();
    if (!text || addComment.isPending) return;
    if (demo) {
      setLocalRows((current) => [
        ...current,
        {
          id: `local-${current.length + 1}`,
          announcementId: id,
          userId: 'You',
          body: text,
          createdAt: new Date().toISOString(),
        },
      ]);
      setDraft('');
      return;
    }
    addComment.mutate(text, { onSuccess: () => setDraft('') });
  };

  return (
    <View className="gap-2.5">
      <BlockTitle icon={<MessageCircle size={14} color={BRAND_PRIMARY} />}>
        Comments · {rows.length}
      </BlockTitle>

      {comments.isPending ? (
        <ActivityIndicator size="small" color={brandAlpha(0.4)} />
      ) : null}

      {rows.map((comment) => {
        const name = comment.userId.slice(0, 8);
        return (
          <View key={comment.id} className="flex-row gap-2.5">
            <View
              className="h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: avatarColor(name) }}
            >
              <Text className="text-[11px] font-bold text-white">
                {initialsFor(name)}
              </Text>
            </View>
            <View className="min-w-0 flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text
                  className="text-[13px] font-bold"
                  style={{ color: BRAND_PRIMARY }}
                >
                  {name}
                </Text>
                <Text
                  className="text-[11px]"
                  style={{ color: brandAlpha(0.5) }}
                >
                  · {formatRelative(comment.createdAt)}
                </Text>
              </View>
              <Text
                className="text-[13px] leading-[19px]"
                style={{ color: brandAlpha(0.78) }}
              >
                {comment.body}
              </Text>
            </View>
          </View>
        );
      })}

      <View className="gap-2">
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Write a comment…"
          placeholderTextColor={brandAlpha(0.45)}
          multiline
          className="min-h-[56px] rounded-[10px] border p-2.5 text-[13px]"
          style={{ borderColor: brandAlpha(0.14), color: BRAND_PRIMARY }}
          textAlignVertical="top"
        />
        <Pressable
          onPress={submit}
          disabled={!draft.trim() || addComment.isPending}
          accessibilityRole="button"
          accessibilityState={{
            disabled: !draft.trim() || addComment.isPending,
          }}
          className="flex-row items-center justify-center gap-1.5 self-end rounded-[10px] px-3.5 py-2 active:opacity-80"
          style={{
            backgroundColor: BRAND_PRIMARY,
            opacity: draft.trim() && !addComment.isPending ? 1 : 0.5,
          }}
        >
          <Send size={13} color="#FFFFFF" />
          <Text className="text-[13px] font-bold text-white">
            {addComment.isPending ? 'Posting…' : 'Post'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ──────────────────────────── Contacts ─────────────────────────── */

export function ContactsBlock({ contacts }: { contacts: ContactCard[] }) {
  return (
    <View className="gap-2.5">
      <BlockTitle icon={<Users size={14} color={BRAND_PRIMARY} />}>
        Need help?
      </BlockTitle>
      {contacts.map((contact) => (
        <View
          key={contact.name + (contact.email ?? '')}
          className="gap-1 rounded-[10px] border p-3"
          style={{ borderColor: brandAlpha(0.1) }}
        >
          <Text
            className="text-[13px] font-bold"
            style={{ color: BRAND_PRIMARY }}
          >
            {contact.name}
          </Text>
          {contact.role ? (
            <Text
              className="text-[11px] font-semibold"
              style={{ color: brandAlpha(0.55) }}
            >
              {contact.role}
            </Text>
          ) : null}
          <View className="mt-1 flex-row flex-wrap gap-3">
            {contact.email ? (
              <Pressable
                onPress={() => openUrl(`mailto:${contact.email}`)}
                accessibilityRole="button"
                className="flex-row items-center gap-1 active:opacity-70"
              >
                <Mail size={11} color={UNREAD_ACCENT} />
                <Text className="text-[11px]" style={{ color: UNREAD_ACCENT }}>
                  {contact.email}
                </Text>
              </Pressable>
            ) : null}
            {contact.phone ? (
              <Pressable
                onPress={() => openUrl(`tel:${contact.phone}`)}
                accessibilityRole="button"
                className="flex-row items-center gap-1 active:opacity-70"
              >
                <Phone size={11} color={UNREAD_ACCENT} />
                <Text className="text-[11px]" style={{ color: UNREAD_ACCENT }}>
                  {contact.phone}
                </Text>
              </Pressable>
            ) : null}
            {safeLinkUrl(contact.chatUrl) ? (
              <Pressable
                onPress={() => openUrl(contact.chatUrl)}
                accessibilityRole="button"
                className="flex-row items-center gap-1 active:opacity-70"
              >
                <MessageCircle size={11} color={UNREAD_ACCENT} />
                <Text className="text-[11px]" style={{ color: UNREAD_ACCENT }}>
                  Chat
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}
