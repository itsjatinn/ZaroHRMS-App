import { X } from 'lucide-react-native';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

import { cardShadow } from '../shadow';
import { usePreviewBodyHeight } from './usePreviewBodyHeight';

/**
 * Preview of a downloaded document, in a centred modal card rather than a
 * full-screen takeover — the same shape as the web's preview dialog.
 *
 * The file is already on disk by the time this opens — it has to be, because
 * the content endpoint needs a bearer token that no image or PDF loader can
 * attach on its own.
 */

export type PreviewTarget = {
  name: string;
  /** Local file:// URI of the downloaded file. */
  uri: string;
  mimeType: string;
};

type Props = {
  target: PreviewTarget | null;
  loading?: boolean;
  onClose: () => void;
};

export function isImage(mimeType: string) {
  return mimeType.startsWith('image/');
}

export function isPdf(mimeType: string) {
  return mimeType.includes('pdf');
}

export default function DocumentPreview({ target, loading = false, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const open = Boolean(target) || loading;
  const cardWidth = width * 0.92;
  const bodyHeight = usePreviewBodyHeight({
    target,
    loading,
    cardWidth,
    screenHeight: height,
  });

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      {/* Backdrop closes; the card swallows the press so taps inside stay put. */}
      <Pressable
        className="flex-1 items-center justify-center bg-black/60 px-4"
        onPress={onClose}
      >
        <Pressable
          style={[cardShadow, { width: cardWidth, maxHeight: height * 0.8 }]}
          className="overflow-hidden rounded-[24px] bg-white"
        >
          <View className="flex-row items-center gap-3 border-b border-slate-100 px-4 py-3">
            <Text className="flex-1 text-sm font-bold text-ink" numberOfLines={1}>
              {target?.name ?? 'Loading…'}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close preview"
              className="h-8 w-8 items-center justify-center rounded-full bg-slate-100 active:scale-95"
            >
              <X size={16} color="#334155" />
            </Pressable>
          </View>

          {/* Fitted to the file: an image's own aspect ratio at this width,
              a fixed frame for a PDF, and just a couple of lines for the
              can't-preview message. Always under the card's maxHeight, so the
              header can never be pushed off. */}
          <View style={{ height: bodyHeight }} className="bg-slate-50">
            {loading || !target ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator color="#14323F" />
              </View>
            ) : isImage(target.mimeType) ? (
              <Image
                source={{ uri: target.uri }}
                resizeMode="contain"
                className="h-full w-full"
              />
            ) : isPdf(target.mimeType) ? (
              <WebView
                source={{ uri: target.uri }}
                // Local files sit outside the WebView's origin, so both are
                // needed for the PDF to load off disk.
                allowFileAccess
                allowFileAccessFromFileURLs
                originWhitelist={['*']}
                style={{ flex: 1, backgroundColor: 'transparent' }}
                startInLoadingState
                renderLoading={() => (
                  <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="#14323F" />
                  </View>
                )}
              />
            ) : (
              <View className="flex-1 items-center justify-center px-8">
                <Text className="text-center text-sm text-slate-400">
                  This file type can&apos;t be previewed here. Use Download to
                  open it in another app.
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
