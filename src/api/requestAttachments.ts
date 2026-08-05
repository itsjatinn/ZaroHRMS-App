import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { API_URL } from './config';
import { authHeader } from './documents';

/**
 * Fetching a request's proof file.
 *
 * The bytes live behind `GET /requests/:id/attachments/:index`, which is
 * bearer-protected — so an <Image src> or <iframe> can never load it directly.
 * The file is pulled down with the auth header first, and what comes back is a
 * local URI (blob: on web, file:// on native) that any renderer can read.
 */

/** Absolute URL for one attachment, indexed as the server stored it. */
export function requestAttachmentUrl(requestId: string, index: number) {
  return `${API_URL}/requests/${encodeURIComponent(requestId)}/attachments/${index}`;
}

export type FetchedAttachment = {
  /** blob: on web, file:// on native — safe to hand to a renderer. */
  uri: string;
  mimeType: string;
};

/** Downloads the attachment and reports where it landed. Throws on failure. */
export async function fetchRequestAttachment(input: {
  requestId: string;
  index: number;
  name: string;
}): Promise<FetchedAttachment> {
  const url = requestAttachmentUrl(input.requestId, input.index);

  if (Platform.OS === 'web') {
    const response = await fetch(url, {
      headers: authHeader(),
      credentials: 'include',
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    return {
      uri: URL.createObjectURL(blob),
      // A blob URL is same-origin, so the built-in PDF viewer and <img> both
      // render it without any cross-origin or file-access flags.
      mimeType: (blob.type || 'application/octet-stream').split(';')[0].trim(),
    };
  }

  // Strip anything the filesystem might choke on; the display name is kept
  // separately for the preview header.
  const safeName = (input.name || 'attachment').replace(/[^\w.\-]/g, '_');
  const result = await FileSystem.downloadAsync(
    url,
    `${FileSystem.cacheDirectory}${safeName}`,
    { headers: authHeader() },
  );
  if (result.status !== 200) throw new Error(`HTTP ${result.status}`);

  // The endpoint sets Content-Type; header casing varies by platform.
  const headers = result.headers as Record<string, string>;
  const mimeType =
    headers['content-type'] ??
    headers['Content-Type'] ??
    'application/octet-stream';
  return { uri: result.uri, mimeType: mimeType.split(';')[0].trim() };
}

/**
 * Escape hatch for what the in-app card cannot draw: DOC/DOCX have no renderer
 * at all, and Android's WebView shows an empty frame for a PDF rather than
 * failing outright — so those go to whatever app the device has for them.
 */
export async function openAttachmentExternally(
  file: FetchedAttachment,
  name: string,
): Promise<void> {
  if (Platform.OS === 'android' && file.mimeType.includes('pdf')) {
    const contentUri = await FileSystem.getContentUriAsync(file.uri);
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: contentUri,
      flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
      type: 'application/pdf',
    });
    return;
  }
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { dialogTitle: name });
  }
}
