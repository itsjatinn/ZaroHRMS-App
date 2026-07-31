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

import { cardShadow } from '../shadow';

/**
 * Web twin of DocumentPreview. Identical chrome and props — the only
 * difference is the PDF branch, which uses an <iframe> because
 * react-native-webview has no web build.
 *
 * The `uri` here is a blob: URL minted by LiveDocumentsCard (the content
 * endpoint needs a bearer token that no <img> or <iframe> can attach itself),
 * so it is same-origin as far as the browser is concerned and renders in the
 * built-in PDF viewer without any file-access flags.
 */

export type PreviewTarget = {
  name: string;
  /** blob: URL of the fetched file. */
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

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      {/* Backdrop closes; the card swallows the press so taps inside stay put. */}
      <Pressable
        className="flex-1 items-center justify-center bg-black/60 px-4"
        onPress={onClose}
      >
        <Pressable
          style={[cardShadow, { width: width * 0.92, maxHeight: height * 0.8 }]}
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

          <View style={{ height: height * 0.62 }} className="bg-slate-50">
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
              // react-native-web renders unknown lowercase elements straight to
              // the DOM, so an iframe passes through untouched.
              <iframe
                src={target.uri}
                title={target.name}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            ) : (
              <View className="flex-1 items-center justify-center px-8">
                <Text className="text-center text-sm text-slate-400">
                  This file type can&apos;t be previewed here. Use Download to
                  save it to your device.
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
