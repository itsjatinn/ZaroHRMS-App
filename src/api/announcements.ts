import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { api } from './client';

/**
 * Employee announcements — the same endpoints the web panel's employee
 * Announcements page reads (backend/src/announcements/announcements.controller.ts).
 * GET /announcements/mine returns every SENT announcement addressed to the
 * signed-in user, so anything HR posts from the web shows up here.
 */

export type ReactionKind = 'LIKE' | 'CLAP' | 'PARTY' | 'HEART' | 'SMILE';

export type MediaKind = 'image' | 'video';
export type VideoProvider = 'mp4' | 'youtube' | 'vimeo' | 'stream' | 'drive';

export type Media = {
  kind: MediaKind;
  display?: 'hero' | 'inline' | 'thumbnail' | 'gallery';
  url: string;
  alt?: string;
  videoProvider?: VideoProvider;
  poster?: string;
  gallery?: { url: string; alt?: string }[];
};

export type AttachmentType = 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'zip' | 'other';

export type Attachment = {
  id: string;
  name: string;
  url: string;
  type: AttachmentType;
  sizeKb?: number;
};

export type Cta = {
  id: string;
  label: string;
  url: string;
  variant?: 'primary' | 'ghost';
};

export type EventInfo = {
  start: string;
  end?: string;
  venue?: string;
  meetingUrl?: string;
  organizer?: string;
  rsvp?: boolean;
};

export type PollOption = { id: string; label: string; votes: number };

export type Poll = {
  id: string;
  question: string;
  options: PollOption[];
  singleChoice?: boolean;
};

export type ContactCard = {
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  chatUrl?: string;
};

export type Announcement = {
  id: string;
  title: string;
  summary?: string | null;
  /** Rich-text HTML body authored in the web composer. */
  bodyHtml?: string | null;
  /** Plain fallback when there is no HTML body. */
  message?: string;
  sentAt?: string | null;
  badge?: string | null;
  featured?: boolean;
  postedBy?: string | null;
  media?: Media;
  attachments?: Attachment[];
  ctas?: Cta[];
  event?: EventInfo;
  poll?: Poll;
  reactionsEnabled?: boolean;
  requiresAcknowledgement?: boolean;
  commentsEnabled?: boolean;
  contacts?: ContactCard[];
  /** Per-user state from the server. */
  readAt?: string | null;
  ackedByMe?: boolean;
  myReaction?: ReactionKind | null;
  reactionCounts?: Partial<Record<ReactionKind, number>>;
  totalReactions?: number;
  commentCount?: number;
  ackCount?: number;
  pollVotes?: Record<string, Record<string, number>>;
  myPollVotes?: Record<string, string>;
};

export type CommentRow = {
  id: string;
  announcementId: string;
  userId: string;
  body: string;
  createdAt: string;
};

type Engagement = {
  reactionCounts?: Partial<Record<ReactionKind, number>>;
  totalReactions?: number;
  myReaction?: ReactionKind | null;
  commentCount?: number;
  ackedByMe?: boolean;
  ackCount?: number;
  pollVotes?: Record<string, Record<string, number>>;
  myPollVotes?: Record<string, string>;
};

/**
 * The backend nests the rich payload under `content`; flatten it back onto the
 * shape the card renders from — the same mapping the web page performs.
 */
function fromBackend(row: Record<string, unknown>): Announcement {
  const content =
    (row.content as Record<string, unknown> | null | undefined) ?? {};
  const eng = (row.engagement as Engagement | undefined) ?? {};
  const rawAttachments = row.attachments as
    | { id?: string; fileName?: string; name?: string; url?: string; sizeKb?: number }[]
    | undefined;

  // Attachments can arrive either on `content` (composer payload) or as the
  // related `attachments` rows Prisma includes.
  const attachments =
    (content.attachments as Attachment[] | undefined) ??
    rawAttachments
      ?.filter((file) => Boolean(file.url))
      .map((file, index) => ({
        id: file.id ?? String(index),
        name: file.fileName ?? file.name ?? 'Attachment',
        url: file.url as string,
        type: attachmentTypeFor(file.fileName ?? file.name ?? ''),
        sizeKb: file.sizeKb,
      }));

  return {
    id: row.id as string,
    title: (row.title as string) ?? 'Untitled',
    summary: (row.summary as string | null) ?? null,
    bodyHtml: (content.bodyHtml as string | null | undefined) ?? null,
    message: (row.message as string | undefined) ?? '',
    sentAt: (row.sentAt as string | null) ?? null,
    badge: (content.badge as string | null | undefined) ?? null,
    featured: Boolean(content.featured),
    postedBy: (content.postedBy as string | null | undefined) ?? null,
    requiresAcknowledgement: content.requiresAcknowledgement as
      | boolean
      | undefined,
    reactionsEnabled: content.reactionsEnabled as boolean | undefined,
    commentsEnabled: content.commentsEnabled as boolean | undefined,
    ctas: content.ctas as Cta[] | undefined,
    poll: content.poll as Poll | undefined,
    media: content.media as Media | undefined,
    attachments,
    contacts: content.contacts as ContactCard[] | undefined,
    event: content.event as EventInfo | undefined,
    readAt: (row.readAt as string | null | undefined) ?? null,
    ackedByMe: eng.ackedByMe ?? false,
    myReaction: eng.myReaction ?? null,
    reactionCounts: eng.reactionCounts ?? {},
    totalReactions: eng.totalReactions ?? 0,
    commentCount: eng.commentCount ?? 0,
    ackCount: eng.ackCount ?? 0,
    pollVotes: eng.pollVotes ?? {},
    myPollVotes: eng.myPollVotes ?? {},
  };
}

/** Maps a file name to the icon/colour bucket the web uses. */
export function attachmentTypeFor(name: string): AttachmentType {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'doc' || ext === 'docx') return 'docx';
  if (ext === 'xls' || ext === 'xlsx' || ext === 'csv') return 'xlsx';
  if (ext === 'ppt' || ext === 'pptx') return 'pptx';
  if (ext === 'zip' || ext === 'rar' || ext === '7z') return 'zip';
  return 'other';
}

export const announcementKeys = {
  mine: () => ['announcements', 'mine'] as const,
  comments: (id: string) => ['announcements', id, 'comments'] as const,
  settings: () => ['announcements', 'settings'] as const,
};

/**
 * HR-configured behaviour — today just how many days a read announcement stays
 * in the Archive view. The backend defaults to 30 when never configured.
 */
export function useAnnouncementSettings(enabled = true) {
  return useQuery({
    queryKey: announcementKeys.settings(),
    queryFn: ({ signal }) =>
      api.get<{ archiveRetentionDays?: number }>('/announcements/settings', {
        signal,
      }),
    staleTime: 5 * 60_000,
    enabled,
  });
}

/** Every SENT announcement addressed to the signed-in employee. */
export function useMyAnnouncements(enabled = true) {
  return useQuery({
    queryKey: announcementKeys.mine(),
    queryFn: async ({ signal }) => {
      const rows = await api.get<Record<string, unknown>[]>(
        '/announcements/mine',
        { signal },
      );
      return Array.isArray(rows) ? rows.map(fromBackend) : [];
    },
    staleTime: 60_000,
    enabled,
  });
}

export function useMarkAnnouncementRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/announcements/${id}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.mine() });
    },
  });
}

export function useAcknowledgeAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ ackAt: string }>(`/announcements/${id}/acknowledge`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.mine() });
    },
  });
}

export function useSetAnnouncementReaction() {
  const queryClient = useQueryClient();
  return useMutation({
    // PUT, not POST — the backend exposes this as an idempotent set/clear.
    mutationFn: (input: { id: string; kind: ReactionKind | null }) =>
      api.put(`/announcements/${input.id}/reaction`, { kind: input.kind }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.mine() });
    },
  });
}

export function useCastPollVote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; pollId: string; optionId: string }) =>
      api.post(`/announcements/${input.id}/poll/${input.pollId}/vote`, {
        optionId: input.optionId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.mine() });
    },
  });
}

export function useAnnouncementComments(id: string, enabled = true) {
  return useQuery({
    queryKey: announcementKeys.comments(id),
    queryFn: ({ signal }) =>
      api.get<CommentRow[]>(`/announcements/${id}/comments`, { signal }),
    enabled,
  });
}

export function useAddAnnouncementComment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      api.post<CommentRow>(`/announcements/${id}/comments`, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.comments(id) });
      queryClient.invalidateQueries({ queryKey: announcementKeys.mine() });
    },
  });
}
