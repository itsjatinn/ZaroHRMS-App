import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Star,
} from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import type { Announcement } from '../../api/announcements';
import { cardShadow } from '../shadow';
import {
  AcknowledgeBlock,
  AttachmentsBlock,
  CommentsBlock,
  ContactsBlock,
  CtasBlock,
  EventBlock,
  MediaBlock,
  PollBlock,
  ReactionsBlock,
} from './AnnouncementBlocks';
import {
  BRAND_PRIMARY,
  brandAlpha,
  formatRelative,
  GOLD_ACCENT,
  UNREAD_ACCENT,
} from './announcementsData';
import RichText from './RichText';

type Props = {
  announcement: Announcement;
  /** The featured item rendered above the list gets the gold hero treatment. */
  isFeaturedHero?: boolean;
  isRead: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onMarkRead: () => void;
  /** Demo session — interactive blocks stay local instead of calling the API. */
  demo?: boolean;
};

/** Mirrors the web page's AnnouncementCard, block for block. */
export default function AnnouncementCard({
  announcement,
  isFeaturedHero = false,
  isRead,
  isExpanded,
  onToggleExpand,
  onMarkRead,
  demo = false,
}: Props) {
  const hasRichBody =
    Boolean(announcement.bodyHtml?.trim()) ||
    Boolean(announcement.message?.trim());
  const hasExtras = Boolean(
    announcement.media ||
      announcement.attachments?.length ||
      announcement.ctas?.length ||
      announcement.event ||
      announcement.poll ||
      announcement.contacts?.length ||
      announcement.reactionsEnabled ||
      announcement.requiresAcknowledgement ||
      announcement.commentsEnabled,
  );
  const canExpand = hasRichBody || hasExtras;

  // Only the accent border varies — the rest of the chrome is the shared app
  // card look (see the home cards). Precedence: hero → featured → unread →
  // plain, matching the web.
  const surface = isFeaturedHero
    ? { borderColor: 'rgba(212, 162, 74, 0.45)' }
    : announcement.featured
      ? { borderColor: 'rgba(212, 162, 74, 0.4)' }
      : !isRead
        ? { borderColor: 'rgba(91, 90, 184, 0.28)' }
        : undefined;

  return (
    <View
      style={[cardShadow, surface]}
      className="overflow-hidden rounded-[22px] border border-slate-100 bg-white"
    >
      {/* Hero media sits above the header for visual weight, as on the web. */}
      {announcement.media?.display === 'hero' ? (
        <MediaBlock media={announcement.media} title={announcement.title} />
      ) : null}

      <View className="gap-1 px-5 pb-2.5 pt-4">
        <View className="flex-row flex-wrap items-center gap-2">
          {!isRead ? (
            <View
              accessibilityLabel="Unread"
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: UNREAD_ACCENT }}
            />
          ) : null}
          {isFeaturedHero ? (
            <View
              className="flex-row items-center gap-1 rounded-full px-2 py-[2px]"
              style={{ backgroundColor: 'rgba(212, 162, 74, 0.22)' }}
            >
              <Star size={11} color={GOLD_ACCENT} />
              <Text
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: GOLD_ACCENT }}
              >
                Featured
              </Text>
            </View>
          ) : null}
          {announcement.badge ? (
            <View
              className="rounded-full px-2 py-[2px]"
              style={{ backgroundColor: 'rgba(212, 162, 74, 0.22)' }}
            >
              <Text
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: GOLD_ACCENT }}
              >
                {announcement.badge}
              </Text>
            </View>
          ) : null}
        </View>

        <Text
          className="text-[15px] font-bold leading-[20px]"
          style={{ color: BRAND_PRIMARY }}
        >
          {announcement.title}
        </Text>

        {announcement.summary ? (
          <Text
            className="text-[13px] leading-[20px]"
            style={{ color: brandAlpha(0.65) }}
          >
            {announcement.summary}
          </Text>
        ) : null}

        <View className="mt-0.5 flex-row items-center gap-1.5">
          {announcement.postedBy ? (
            <>
              <Text
                className="text-[11px] font-semibold"
                style={{ color: brandAlpha(0.7) }}
              >
                {announcement.postedBy}
              </Text>
              <Text
                className="text-[11px]"
                style={{ color: brandAlpha(0.35) }}
              >
                ·
              </Text>
            </>
          ) : null}
          <Text
            className="text-[11px] font-semibold"
            style={{ color: brandAlpha(0.55) }}
          >
            {formatRelative(announcement.sentAt)}
          </Text>
        </View>
      </View>

      {/* Expanded body — rich text plus every optional block. */}
      {isExpanded ? (
        <View className="gap-4 px-5 pb-5 pt-1">
          {announcement.media?.display === 'inline' ||
          announcement.media?.display === 'thumbnail' ? (
            <MediaBlock
              media={announcement.media}
              title={announcement.title}
              rounded
            />
          ) : null}

          {announcement.bodyHtml ? (
            <RichText html={announcement.bodyHtml} />
          ) : announcement.message ? (
            <Text
              className="text-[13px] leading-[21px]"
              style={{ color: brandAlpha(0.82) }}
            >
              {announcement.message}
            </Text>
          ) : null}

          {announcement.event ? (
            <EventBlock
              title={announcement.title}
              event={announcement.event}
            />
          ) : null}

          {announcement.poll ? (
            <PollBlock
              announcementId={announcement.id}
              poll={announcement.poll}
              initialVotes={announcement.pollVotes?.[announcement.poll.id]}
              initialMyVote={announcement.myPollVotes?.[announcement.poll.id]}
              demo={demo}
            />
          ) : null}

          {announcement.media?.display === 'gallery' ? (
            <MediaBlock
              media={announcement.media}
              title={announcement.title}
              rounded
            />
          ) : null}

          {announcement.attachments?.length ? (
            <AttachmentsBlock attachments={announcement.attachments} />
          ) : null}

          {announcement.ctas?.length ? (
            <CtasBlock ctas={announcement.ctas} />
          ) : null}

          {announcement.contacts?.length ? (
            <ContactsBlock contacts={announcement.contacts} />
          ) : null}

          {announcement.requiresAcknowledgement ? (
            <AcknowledgeBlock
              id={announcement.id}
              initialAcked={announcement.ackedByMe}
              demo={demo}
            />
          ) : null}

          {announcement.reactionsEnabled ? (
            <ReactionsBlock
              id={announcement.id}
              initialMine={announcement.myReaction}
              initialCounts={announcement.reactionCounts}
              demo={demo}
            />
          ) : null}

          {announcement.commentsEnabled ? (
            <CommentsBlock id={announcement.id} demo={demo} />
          ) : null}
        </View>
      ) : null}

      {canExpand || !isRead ? (
        <View
          className="flex-row items-center justify-end gap-2 border-t px-5 py-3"
          style={{ borderTopColor: brandAlpha(0.06) }}
        >
          {canExpand ? (
            <Pressable
              onPress={onToggleExpand}
              accessibilityRole="button"
              className="flex-row items-center gap-1.5 rounded-[10px] border bg-white px-3 py-1.5 active:opacity-70"
              style={{ borderColor: brandAlpha(0.12) }}
            >
              {isExpanded ? (
                <ChevronUp size={13} color={BRAND_PRIMARY} />
              ) : (
                <ChevronDown size={13} color={BRAND_PRIMARY} />
              )}
              <Text
                className="text-[13px] font-bold"
                style={{ color: BRAND_PRIMARY }}
              >
                {isExpanded ? 'Hide' : 'View'}
              </Text>
            </Pressable>
          ) : null}

          {!isRead ? (
            <Pressable
              onPress={onMarkRead}
              accessibilityRole="button"
              className="flex-row items-center gap-1.5 rounded-[10px] px-3 py-1.5 active:opacity-80"
              style={{ backgroundColor: BRAND_PRIMARY }}
            >
              <CheckCircle2 size={13} color="#FFFFFF" />
              <Text className="text-[13px] font-bold text-white">
                Mark read
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
