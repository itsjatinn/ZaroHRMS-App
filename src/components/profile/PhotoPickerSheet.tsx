import * as ImagePicker from 'expo-image-picker';
import { Camera, ImageIcon, Trash2, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Alert } from '../CrossAlert';

import { cardShadow } from '../shadow';

type Props = {
  visible: boolean;
  /** Shows the remove option only when there is a photo to remove. */
  hasPhoto: boolean;
  onClose: () => void;
  /** Clears the photo. Cropped images arrive through `onCrop` instead. */
  onPicked: (dataUrl: string | null) => void;
  /**
   * Called with the picked image so the cropper can open on it. The picker's
   * own width/height ride along — Image.getSize fails on some Android
   * file:// URIs, which would leave the cropper stuck on a spinner.
   */
  onCrop: (source: { uri: string; width?: number; height?: number }) => void;
};

/**
 * Take / choose / remove sheet for the profile photo.
 *
 * The picker crops to a square up front — the avatar is square-ish everywhere,
 * so an uncropped portrait would be centre-cut unpredictably.
 */
export default function PhotoPickerSheet({
  visible,
  hasPhoto,
  onClose,
  onPicked,
  onCrop,
}: Props) {
  const [busy, setBusy] = useState(false);
  const { width } = useWindowDimensions();

  const handle = async (source: 'camera' | 'library') => {
    if (busy) return;
    setBusy(true);
    try {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          source === 'camera' ? 'Camera access needed' : 'Photo access needed',
          'Enable it for Zaro in your device settings to change your photo.',
        );
        return;
      }

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        // The OS editor draws its controls over the image on a white
        // backdrop and can't be styled, so we crop in-app instead.
        allowsEditing: false,
        quality: 1,
      };

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);

      if (result.canceled || !result.assets.length) return;
      // Hand off to the cropper; it produces the stored data URL.
      const asset = result.assets[0];
      onCrop({ uri: asset.uri, width: asset.width, height: asset.height });
    } catch {
      Alert.alert('Could not open the picker.');
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    Alert.alert('Remove photo?', 'Your initials will be shown instead.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          onPicked(null);
          onClose();
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Centred card, matching the document preview. The backdrop closes;
          the card swallows the press so taps inside stay put. */}
      <Pressable
        className="flex-1 items-center justify-center bg-black/60 px-6"
        onPress={onClose}
      >
        <Pressable
          style={[cardShadow, { width: width * 0.86, maxWidth: 400 }]}
          className="overflow-hidden rounded-[24px] bg-white px-4 pb-4 pt-4"
        >
          <View className="mb-2 flex-row items-center gap-3 px-1">
            <Text className="flex-1 text-base font-bold text-ink">
              Profile photo
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close"
              className="h-8 w-8 items-center justify-center rounded-full bg-slate-100 active:scale-95"
            >
              <X size={16} color="#334155" />
            </Pressable>
          </View>

          {busy ? (
            <View className="items-center gap-2 py-6">
              <ActivityIndicator color="#14323F" />
              <Text className="text-xs text-slate-400">Opening…</Text>
            </View>
          ) : (
            <>
              <Pressable
                onPress={() => void handle('camera')}
                accessibilityRole="button"
                className="flex-row items-center gap-3 rounded-2xl px-2 py-3.5 active:bg-slate-50"
              >
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <Camera size={18} color="#14323F" />
                </View>
                <Text className="text-[15px] font-semibold text-ink">
                  Take a photo
                </Text>
              </Pressable>

              <Pressable
                onPress={() => void handle('library')}
                accessibilityRole="button"
                className="flex-row items-center gap-3 rounded-2xl px-2 py-3.5 active:bg-slate-50"
              >
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <ImageIcon size={18} color="#14323F" />
                </View>
                <Text className="text-[15px] font-semibold text-ink">
                  Choose from library
                </Text>
              </Pressable>

              {hasPhoto ? (
                <Pressable
                  onPress={remove}
                  accessibilityRole="button"
                  className="flex-row items-center gap-3 rounded-2xl px-2 py-3.5 active:bg-slate-50"
                >
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-rose-50">
                    <Trash2 size={18} color="#F43F5E" />
                  </View>
                  <Text className="text-[15px] font-semibold text-rose-500">
                    Remove photo
                  </Text>
                </Pressable>
              ) : null}
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
