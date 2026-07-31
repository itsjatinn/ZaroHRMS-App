import * as ImageManipulator from 'expo-image-manipulator';
import { Minus, Plus } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  PanResponder,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { cardShadow } from '../shadow';

/**
 * Square cropper for the profile photo, replacing the OS editor — whose
 * controls sit over the image on a white backdrop and can't be styled.
 *
 * The maths mirrors the web's cropProfilePhoto: the image is scaled to cover
 * the circle, multiplied by a zoom factor, then translated. Whatever falls
 * inside the circle is the crop.
 */

/** Output edge, in pixels. Matches the web's 320px canvas. */
const OUTPUT_SIZE = 320;
/** JPEG quality for the stored data URL, as on the web. */
const OUTPUT_QUALITY = 0.82;
const MAX_ZOOM = 4;
/**
 * The image opens slightly larger than the circle so there is room to drag
 * from the outset — at an exact cover fit one axis has zero slack (and a
 * square photo has none at all), which reads as "dragging is broken".
 */
const INITIAL_ZOOM = 1.15;

export type CropSource = {
  uri: string;
  /** Supplied by the picker; far more reliable than Image.getSize on Android. */
  width?: number;
  height?: number;
};

type Props = {
  source: CropSource | null;
  onCancel: () => void;
  /** Receives the cropped image as a `data:` URL ready to store. */
  onDone: (dataUrl: string) => void;
};

export default function PhotoCropModal({ source, onCancel, onDone }: Props) {
  const { width, height } = useWindowDimensions();
  const cardWidth = Math.min(width * 0.92, 460);
  // The circle being cropped to, and the stage that shows what surrounds it.
  const circle = Math.min(cardWidth - 72, height * 0.4);
  const stageHeight = circle + 56;

  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);

  // The PanResponder is created once, so it reads live values through refs
  // rather than closing over the first render's state.
  const offsetRef = useRef(offset);
  const zoomRef = useRef(zoom);
  const sizeRef = useRef(size);
  const panStart = useRef({ x: 0, y: 0 });
  offsetRef.current = offset;
  zoomRef.current = zoom;
  sizeRef.current = size;

  useEffect(() => {
    if (!source) return;
    setZoom(INITIAL_ZOOM);
    setOffset({ x: 0, y: 0 });

    // The picker already measured the image; only fall back to getSize when
    // it didn't, since that call fails on some Android file:// URIs.
    if (source.width && source.height) {
      setSize({ width: source.width, height: source.height });
      return;
    }
    setSize(null);
    Image.getSize(
      source.uri,
      (w, h) => setSize({ width: w, height: h }),
      // A square assumption still lets the user crop rather than being stuck.
      () => setSize({ width: 1000, height: 1000 }),
    );
  }, [source]);

  /** Scale that makes the image cover the circle, before zoom. */
  const baseScale = useMemo(() => {
    if (!size) return 1;
    return Math.max(circle / size.width, circle / size.height);
  }, [size, circle]);

  /** How far the image may travel before its edge would enter the circle. */
  const limitsFor = (
    current: { width: number; height: number },
    currentZoom: number,
  ) => {
    const scale =
      Math.max(circle / current.width, circle / current.height) * currentZoom;
    return {
      x: Math.max(0, (current.width * scale - circle) / 2),
      y: Math.max(0, (current.height * scale - circle) / 2),
    };
  };

  const clamp = (value: number, limit: number) =>
    Math.min(limit, Math.max(-limit, value));

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // Claim the gesture on touch as well as on move: without the start
        // handler a quick drag can be missed entirely.
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          panStart.current = offsetRef.current;
        },
        onPanResponderMove: (_event, gesture) => {
          const current = sizeRef.current;
          if (!current) return;
          const limits = limitsFor(current, zoomRef.current);
          setOffset({
            x: clamp(panStart.current.x + gesture.dx, limits.x),
            y: clamp(panStart.current.y + gesture.dy, limits.y),
          });
        },
      }),
    // Recreated only when the crop circle changes size.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [circle],
  );

  const changeZoom = (next: number) => {
    const clamped = Math.min(MAX_ZOOM, Math.max(1, next));
    setZoom(clamped);
    if (!size) return;
    // Zooming out can leave the image off-centre past its new limit.
    const limits = limitsFor(size, clamped);
    setOffset((prev) => ({
      x: clamp(prev.x, limits.x),
      y: clamp(prev.y, limits.y),
    }));
  };

  const drawWidth = size ? size.width * baseScale * zoom : 0;
  const drawHeight = size ? size.height * baseScale * zoom : 0;

  const apply = async () => {
    if (!source || !size) return;
    setSaving(true);
    try {
      const scale = baseScale * zoom;
      // Top-left of the circle's bounding box, in source pixels.
      const originX = ((drawWidth - circle) / 2 - offset.x) / scale;
      const originY = ((drawHeight - circle) / 2 - offset.y) / scale;
      const side = circle / scale;

      // Rounded and clamped: a rect even a pixel outside the source makes the
      // native cropper throw.
      const cropSide = Math.max(
        1,
        Math.min(Math.round(side), size.width, size.height),
      );
      const result = await ImageManipulator.manipulateAsync(
        source.uri,
        [
          {
            crop: {
              originX: Math.max(
                0,
                Math.min(Math.round(originX), size.width - cropSide),
              ),
              originY: Math.max(
                0,
                Math.min(Math.round(originY), size.height - cropSide),
              ),
              width: cropSide,
              height: cropSide,
            },
          },
          { resize: { width: OUTPUT_SIZE, height: OUTPUT_SIZE } },
        ],
        {
          compress: OUTPUT_QUALITY,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        },
      );
      if (result.base64) onDone(`data:image/jpeg;base64,${result.base64}`);
    } finally {
      setSaving(false);
    }
  };

  // A ring thick enough to reach every stage edge. Drawn as a border on a
  // circular view, which leaves the middle a true hole — so the surrounding
  // photo stays visible underneath, just dimmed.
  const ringThickness = Math.max(cardWidth, stageHeight);

  return (
    <Modal
      visible={Boolean(source)}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 items-center justify-center bg-black/70 px-4">
        <View
          style={[cardShadow, { width: cardWidth }]}
          className="overflow-hidden rounded-[24px] bg-white"
        >
          <Text className="px-5 pb-1 pt-4 text-base font-bold text-ink">
            Crop photo
          </Text>
          <Text className="px-5 pb-3 text-xs text-slate-400">
            Drag to reposition, zoom to fill the circle.
          </Text>

          {/* Dark stage so the photo reads against it, not white-on-white. */}
          <View
            {...panResponder.panHandlers}
            style={{ height: stageHeight }}
            className="w-full overflow-hidden bg-slate-900"
          >
            {source && size ? (
              <>
                <Image
                  source={{ uri: source.uri }}
                  style={{
                    position: 'absolute',
                    width: drawWidth,
                    height: drawHeight,
                    left: (cardWidth - drawWidth) / 2 + offset.x,
                    top: (stageHeight - drawHeight) / 2 + offset.y,
                  }}
                />
                {/* Dims everything outside the circle while leaving it visible. */}
                <View
                  pointerEvents="none"
                  className="absolute inset-0 items-center justify-center"
                >
                  <View
                    style={{
                      width: circle + ringThickness * 2,
                      height: circle + ringThickness * 2,
                      borderRadius: (circle + ringThickness * 2) / 2,
                      borderWidth: ringThickness,
                      borderColor: 'rgba(15, 23, 42, 0.62)',
                    }}
                  />
                </View>
                {/* Crop edge. */}
                <View
                  pointerEvents="none"
                  className="absolute inset-0 items-center justify-center"
                >
                  <View
                    style={{
                      width: circle,
                      height: circle,
                      borderRadius: circle / 2,
                      borderWidth: 2,
                      borderColor: 'rgba(255,255,255,0.9)',
                    }}
                  />
                </View>
              </>
            ) : (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator color="#FFFFFF" />
              </View>
            )}
          </View>

          {/* Zoom sits below the image, never on top of it. */}
          <View className="flex-row items-center justify-center gap-4 bg-slate-900 pb-4">
            <Pressable
              onPress={() => changeZoom(zoom - 0.25)}
              disabled={zoom <= 1}
              accessibilityRole="button"
              accessibilityLabel="Zoom out"
              className="h-9 w-9 items-center justify-center rounded-full bg-white/15 active:scale-95"
              style={{ opacity: zoom <= 1 ? 0.4 : 1 }}
            >
              <Minus size={16} color="#FFFFFF" />
            </Pressable>
            <Text className="w-12 text-center text-xs font-bold text-white">
              {zoom.toFixed(1)}×
            </Text>
            <Pressable
              onPress={() => changeZoom(zoom + 0.25)}
              disabled={zoom >= MAX_ZOOM}
              accessibilityRole="button"
              accessibilityLabel="Zoom in"
              className="h-9 w-9 items-center justify-center rounded-full bg-white/15 active:scale-95"
              style={{ opacity: zoom >= MAX_ZOOM ? 0.4 : 1 }}
            >
              <Plus size={16} color="#FFFFFF" />
            </Pressable>
          </View>

          <View className="flex-row gap-3 px-5 py-4">
            <Pressable
              onPress={onCancel}
              disabled={saving}
              accessibilityRole="button"
              className="flex-1 items-center justify-center rounded-2xl border border-slate-200 py-3 active:bg-slate-50"
            >
              <Text className="text-sm font-bold text-ink">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => void apply()}
              disabled={saving || !size}
              accessibilityRole="button"
              className="flex-1 items-center justify-center rounded-2xl bg-ink py-3 active:scale-95"
              style={{ opacity: saving || !size ? 0.6 : 1 }}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-sm font-bold text-white">Use photo</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
