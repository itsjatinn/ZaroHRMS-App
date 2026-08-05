import { useEffect, useState } from 'react';
import { Image } from 'react-native';

/**
 * Height for the preview card's body, fitted to the file it is showing.
 *
 * A fixed height letterboxes a wide receipt inside a tall grey card, or crops
 * the feel of a tall portrait scan. Images are measured and the body takes
 * their aspect ratio at the card's width, clamped so a very tall image cannot
 * push the card off screen and a very wide one still has something to sit in.
 *
 * PDFs keep a fixed height: page dimensions aren't knowable without parsing
 * the file, and the viewer scrolls anyway. The unpreviewable message needs
 * only enough room for two lines.
 *
 * Shared by DocumentPreview and its .web twin so the two can't drift.
 */

type PreviewLike = { uri: string; mimeType: string } | null;

/** Floor, so a tiny icon still gets a usable frame. */
const MIN_BODY = 140;
/** Ceiling, so a tall image leaves room for the header inside maxHeight. */
const MAX_BODY_RATIO = 0.5;
/** Pages have no cheap intrinsic size; the viewer scrolls. */
const PDF_BODY_RATIO = 0.45;
/** Just the "can't preview this" line. */
const MESSAGE_BODY = 120;

function isImageType(mimeType: string) {
  return mimeType.startsWith('image/');
}

function isPdfType(mimeType: string) {
  return mimeType.includes('pdf');
}

export function usePreviewBodyHeight(input: {
  target: PreviewLike;
  loading: boolean;
  cardWidth: number;
  screenHeight: number;
}): number {
  const { target, loading, cardWidth, screenHeight } = input;
  const uri = target?.uri;
  const mimeType = target?.mimeType;
  const [ratio, setRatio] = useState<number | null>(null);

  useEffect(() => {
    // Reset first: keeping the previous file's ratio would size the card
    // wrongly for a beat when a second attachment is opened.
    setRatio(null);
    if (!uri || !mimeType || !isImageType(mimeType)) return;

    let active = true;
    Image.getSize(
      uri,
      (w, h) => {
        if (active && w > 0 && h > 0) setRatio(h / w);
      },
      // Unreadable dimensions just fall through to the default height.
      () => undefined,
    );
    return () => {
      active = false;
    };
  }, [uri, mimeType]);

  const maxBody = screenHeight * MAX_BODY_RATIO;

  if (loading || !mimeType) return MIN_BODY;
  if (isImageType(mimeType)) {
    // Still measuring — the floor avoids a jump from 0 once the size lands.
    if (ratio == null) return MIN_BODY;
    return Math.max(MIN_BODY, Math.min(cardWidth * ratio, maxBody));
  }
  if (isPdfType(mimeType)) return screenHeight * PDF_BODY_RATIO;
  return MESSAGE_BODY;
}
