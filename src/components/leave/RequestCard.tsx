import type { LucideIcon } from 'lucide-react-native';
import { ChevronDown, ChevronUp, Paperclip, X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';

import type { RequestAttachment } from '../../api/leave';
import {
  fetchRequestAttachment,
  openAttachmentExternally,
} from '../../api/requestAttachments';
import { Alert } from '../CrossAlert';
import DocumentPreview, {
  isImage,
  isPdf,
  type PreviewTarget,
} from '../profile/DocumentPreview';
import { cardShadow } from '../shadow';

// Web-only: an unbroken string (no spaces) never wraps on its own there, so it
// forces the text column wider than the card and shoves the More/Less toggle
// off the edge. Native wraps anywhere by default and needs nothing.
const BREAK_LONG_WORDS =
  Platform.OS === 'web'
    ? ({ wordBreak: 'break-word' } as unknown as import('react-native').TextStyle)
    : null;

/**
 * The full set the HRMS tracks. Cancellation is its own small workflow: an
 * employee asks, HR decides, and the request ends up cancelled or with the
 * cancellation rejected (leaving the original approval standing).
 */
export type RequestStatus =
  | 'Approved'
  | 'Pending'
  | 'Rejected'
  | 'Cancelled'
  | 'Cancellation requested'
  | 'Cancellation rejected';

type RequestCardProps = {
  type: string; // e.g. "Annual Leave"
  dates: string; // e.g. "12 – 14 Aug 2026"
  days: string; // e.g. "3 days"
  status: RequestStatus;
  icon: LucideIcon;
  rejectionReason?: string; // rejected cards reveal this behind a collapsible row
  onCancel?: () => void;
  /** LEAVE | WFH | OD | REGULARIZATION — only leave says "Cancel leave". */
  category?: string;
  /** Why it was raised. */
  reason?: string;
  /** When it was submitted. */
  appliedOn?: string;
  /** When it was approved or rejected; absent while pending. */
  actionDate?: string;
  /**
   * Proof files uploaded with the request. Needs `requestId` too — the
   * download endpoint addresses them as /requests/:id/attachments/:index, so
   * the position in this array IS the identifier.
   */
  attachments?: RequestAttachment[];
  requestId?: string;
};

// Per-status treatment for the status pill — soft 50-tints so a mixed list
// stays calm; the small dot carries the strongest color.
const STATUS_STYLES: Record<
  RequestStatus,
  { pill: string; text: string; dot: string }
> = {
  Approved: {
    pill: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: '#059669',
  },
  Pending: {
    pill: 'bg-amber-50',
    text: 'text-amber-700',
    dot: '#D97706',
  },
  Rejected: {
    pill: 'bg-red-50',
    text: 'text-red-700',
    dot: '#DC2626',
  },
  Cancelled: {
    pill: 'bg-slate-100',
    text: 'text-slate-600',
    dot: '#64748B',
  },
  'Cancellation requested': {
    pill: 'bg-violet-50',
    text: 'text-violet-700',
    dot: '#7C5CC6',
  },
  'Cancellation rejected': {
    pill: 'bg-orange-50',
    text: 'text-orange-700',
    dot: '#B04A2A',
  },
};

// A single leave-request row: neutral icon tile (ink on slate — no per-type
// color, matching the home page's monochrome card language), title and dates,
// a soft status pill, and a footer action — plain-text "Cancel leave" for
// active requests, or a collapsible "Rejection reason" for rejected ones.
export default function RequestCard({
  type,
  dates,
  days,
  status,
  icon: Icon,
  rejectionReason,
  onCancel,
  category,
  reason,
  appliedOn,
  actionDate,
  attachments,
  requestId,
}: RequestCardProps) {
  const [reasonOpen, setReasonOpen] = useState(false);
  /** Long reasons collapse to one line behind a More toggle. */
  const [reasonExpanded, setReasonExpanded] = useState(false);
  /** Index of the attachment currently downloading, so only its button spins. */
  const [openingIndex, setOpeningIndex] = useState<number | null>(null);
  /** The file being shown in the in-app preview card, once it is on disk. */
  const [preview, setPreview] = useState<PreviewTarget | null>(null);

  // Without an id there is nothing to fetch, so the buttons render inert
  // rather than failing. That is the demo session, whose sample requests
  // carry no stored files.
  const canOpenAttachments = Boolean(requestId);

  const closePreview = () => {
    // A blob URL pins the whole file in memory for the life of the tab.
    if (preview?.uri.startsWith('blob:')) URL.revokeObjectURL(preview.uri);
    setPreview(null);
  };

  const openAttachment = async (index: number, name: string) => {
    if (!requestId || openingIndex !== null) return;
    setOpeningIndex(index);
    try {
      const file = await fetchRequestAttachment({ requestId, index, name });

      // Images and PDFs render in the card. DOC/DOCX have no renderer, and
      // Android's WebView draws an empty frame for a PDF rather than failing,
      // so both go to the device's own viewer instead of an empty card.
      const previewable =
        isImage(file.mimeType) ||
        (isPdf(file.mimeType) && Platform.OS !== 'android');

      if (previewable) {
        setPreview({ name, uri: file.uri, mimeType: file.mimeType });
      } else {
        await openAttachmentExternally(file, name);
      }
    } catch {
      Alert.alert(
        "Couldn't open the attachment",
        'Please check your connection and try again.',
      );
    } finally {
      setOpeningIndex(null);
    }
  };
  const s = STATUS_STYLES[status];
  const rejected = status === 'Rejected';
  const cancellable = !rejected && onCancel;
  // A regularization or WFH request isn't leave, so don't call it that.
  const cancelLabel =
    String(category ?? '').toUpperCase() === 'LEAVE' || !category
      ? 'Cancel leave'
      : 'Cancel request';

  return (
    <View
      style={cardShadow}
      className="rounded-3xl border border-slate-100 bg-white p-4"
    >
      <View className="flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50">
          <Icon size={20} color="#14323F" strokeWidth={1.75} />
        </View>

        <View className="flex-1">
          <Text className="text-base font-bold text-ink">{type}</Text>
          <Text className="mt-0.5 text-xs font-medium text-slate-400">
            {dates} · {days}
          </Text>
        </View>

        <View
          className={`flex-row items-center gap-1.5 rounded-full px-2.5 py-1 ${s.pill}`}
        >
          <View
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: s.dot }}
          />
          <Text className={`text-xs font-bold ${s.text}`}>{status}</Text>
        </View>
      </View>

      {reason || appliedOn || actionDate || attachments?.length ? (
        <>
          <View className="mt-3 border-t border-slate-100" />
          <View className="mt-3 gap-2">
            {reason ? (
              <View className="flex-row gap-2">
                <Text className="w-20 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Reason
                </Text>
                <View className="min-w-0 flex-1 flex-row items-start gap-2">
                  {/* One line by default — a long reason was swallowing the
                      whole card. "More" reveals the rest in place, and the
                      text itself toggles too, so collapsing never depends on
                      hitting the small label. */}
                  <Text
                    className="min-w-0 flex-1 text-xs leading-5 text-ink"
                    style={BREAK_LONG_WORDS}
                    numberOfLines={reasonExpanded ? undefined : 1}
                    onPress={
                      reason.length > 40
                        ? () => setReasonExpanded((v) => !v)
                        : undefined
                    }
                  >
                    {reason}
                  </Text>
                  {reason.length > 40 ? (
                    <Pressable
                      onPress={() => setReasonExpanded((v) => !v)}
                      hitSlop={8}
                      accessibilityRole="button"
                      className="shrink-0"
                    >
                      <Text className="text-[11px] font-bold leading-5 text-slate-400">
                        {reasonExpanded ? 'Less' : 'More'}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ) : null}
            {appliedOn || actionDate || cancellable ? (
              // Applied (and Actioned, once a decision exists) on the left,
              // with the card's action where the attachment chip used to sit.
              <View className="flex-row flex-wrap items-center gap-x-3 gap-y-2">
                {appliedOn ? (
                  <View className="flex-row gap-2">
                    <Text className="w-20 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Applied
                    </Text>
                    <Text className="text-xs font-medium text-ink">
                      {appliedOn}
                    </Text>
                  </View>
                ) : null}
                {/* Only once a decision exists — a dash on every pending
                    request was noise, not information. */}
                {actionDate ? (
                  <View className="flex-row gap-2">
                    <Text className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Actioned
                    </Text>
                    <Text className="text-xs font-medium text-ink">
                      {actionDate}
                    </Text>
                  </View>
                ) : null}
                {cancellable ? (
                  <Pressable
                    onPress={onCancel}
                    hitSlop={8}
                    className="ml-auto flex-row items-center gap-1.5 active:opacity-60"
                  >
                    <X size={14} color="#EF4444" strokeWidth={2.5} />
                    <Text className="text-[13px] font-bold text-red-500">
                      {cancelLabel}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
            {/* Below the applied row. Shown for every status, not just
                approved: the employee needs to check what they sent while it
                is still pending, and to re-read it after a rejection. */}
            {attachments?.length ? (
              <View className="flex-row flex-wrap items-center gap-2">
                <Text className="w-20 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Attachment
                </Text>
                {attachments.map((file, index) => {
                  const busy = openingIndex === index;
                  return (
                    <Pressable
                      // Name alone is not unique — the same file can be
                      // attached twice — and the list never reorders, so
                      // the index is stable.
                      key={`${index}-${file.name}`}
                      disabled={!canOpenAttachments || openingIndex !== null}
                      onPress={() => openAttachment(index, file.name)}
                      hitSlop={6}
                      accessibilityRole={canOpenAttachments ? 'button' : 'text'}
                      accessibilityLabel={
                        canOpenAttachments ? `View ${file.name}` : file.name
                      }
                      className={`flex-row items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 ${
                        canOpenAttachments ? 'active:opacity-70' : ''
                      }`}
                    >
                      <Paperclip size={12} color="#64748B" strokeWidth={2} />
                      {busy ? (
                        <ActivityIndicator size="small" color="#14323F" />
                      ) : (
                        <Text className="text-[11px] font-bold text-ink">
                          {/* Numbered only when there is more than one, so
                              the buttons stay tellable apart. */}
                          {canOpenAttachments ? 'View' : 'File'}
                          {attachments.length > 1 ? ` ${index + 1}` : ''}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
        </>
      ) : null}

      {/* Cards with no detail rows still need somewhere for the action. */}
      {cancellable && !(reason || appliedOn || actionDate || attachments?.length) ? (
        <>
          <View className="mt-3 border-t border-slate-100" />
          <View className="mt-3 flex-row justify-end">
            <Pressable
              onPress={onCancel}
              hitSlop={8}
              className="flex-row items-center gap-1.5 active:opacity-60"
            >
              <X size={14} color="#EF4444" strokeWidth={2.5} />
              <Text className="text-[13px] font-bold text-red-500">
                {cancelLabel}
              </Text>
            </Pressable>
          </View>
        </>
      ) : null}

      {rejected && rejectionReason ? (
        <>
          <View className="mt-3 border-t border-slate-100" />
          <Pressable
            onPress={() => setReasonOpen((v) => !v)}
            hitSlop={8}
            className="mt-3 flex-row items-center justify-between active:opacity-60"
          >
            <Text className="text-[13px] font-bold text-slate-500">
              Rejection reason
            </Text>
            {reasonOpen ? (
              <ChevronUp size={16} color="#94A3B8" strokeWidth={2.25} />
            ) : (
              <ChevronDown size={16} color="#94A3B8" strokeWidth={2.25} />
            )}
          </Pressable>
          {reasonOpen ? (
            <View className="mt-2.5 rounded-xl bg-slate-50 px-3.5 py-3">
              <Text className="text-[13px] leading-5 text-slate-600">
                {rejectionReason}
              </Text>
            </View>
          ) : null}
        </>
      ) : null}

      {/* In-app viewer: a centred card over the list, not a new tab or the
          share sheet. Mounted only once a file has actually been fetched, so
          an untouched card costs nothing. */}
      <DocumentPreview target={preview} onClose={closePreview} />
    </View>
  );
}
