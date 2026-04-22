import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Linking,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import {
  Camera,
  ChevronRight,
  Images,
  Trash2,
  UserCircle,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const PRIMARY = '#0d3749';
const SECONDARY = '#f9d36b';
const DANGER = '#dc2626';

type Props = {
  visible: boolean;
  onClose: () => void;
  hasImage: boolean;
  onImagePicked: (uri: string) => void;
  onRemove: () => void;
};

type ActionKey = 'camera' | 'library' | 'remove';

type Action = {
  key: ActionKey;
  label: string;
  description: string;
  Icon: typeof Camera;
  tone: 'primary' | 'accent' | 'danger';
};

export default function AvatarActionSheet({
  visible,
  onClose,
  hasImage,
  onImagePicked,
  onRemove,
}: Props) {
  const slide = useRef(new Animated.Value(0)).current;
  const [rendered, setRendered] = useState(visible);

  useEffect(() => {
    if (visible) setRendered(true);
  }, [visible]);

  useEffect(() => {
    if (!rendered) return;
    Animated.timing(slide, {
      toValue: visible ? 1 : 0,
      duration: visible ? 340 : 220,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !visible) setRendered(false);
    });
  }, [rendered, visible, slide]);

  const translateY = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT, 0],
  });
  const backdropOpacity = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.55],
  });

  const pick = async (source: 'camera' | 'library') => {
    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!perm.granted) {
      onClose();
      Alert.alert(
        'Permission needed',
        source === 'camera'
          ? 'Allow camera access in Settings to take a new profile photo.'
          : 'Allow photo library access in Settings to choose a profile photo.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    };

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled && result.assets[0]?.uri) {
      onImagePicked(result.assets[0].uri);
    }
    onClose();
  };

  const actions: Action[] = [
    {
      key: 'camera',
      label: 'Take Photo',
      description: 'Capture a new portrait',
      Icon: Camera,
      tone: 'accent',
    },
    {
      key: 'library',
      label: 'Choose from Library',
      description: 'Pick, crop and zoom to fit',
      Icon: Images,
      tone: 'primary',
    },
    ...(hasImage
      ? ([
          {
            key: 'remove',
            label: 'Remove Photo',
            description: 'Revert to your initials',
            Icon: Trash2,
            tone: 'danger',
          },
        ] as Action[])
      : []),
  ];

  if (!rendered) return null;

  return (
    <Modal
      visible={rendered}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View
          pointerEvents={visible ? 'auto' : 'none'}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#000',
            opacity: backdropOpacity,
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={{
            transform: [{ translateY }],
            backgroundColor: '#ffffff',
            borderTopLeftRadius: 36,
            borderTopRightRadius: 36,
            paddingBottom: 36,
            shadowColor: PRIMARY,
            shadowOffset: { width: 0, height: -12 },
            shadowOpacity: 0.18,
            shadowRadius: 28,
            elevation: 24,
          }}
        >
          {/* Grab handle */}
          <View className="items-center pt-3 pb-1">
            <View className="h-[5px] w-12 rounded-full bg-slate-200" />
          </View>

          {/* Header */}
          <View className="px-7 pt-5 pb-5 flex-row items-center">
            <View
              className="h-12 w-12 rounded-2xl items-center justify-center mr-4"
              style={{ backgroundColor: SECONDARY + '33' }}
            >
              <UserCircle
                size={26}
                color={PRIMARY}
                strokeWidth={2.2}
              />
            </View>
            <View className="flex-1">
              <Text
                className="text-[20px] font-bold tracking-tight"
                style={{ color: PRIMARY }}
              >
                Profile Photo
              </Text>
              <Text className="text-[13px] text-slate-500 mt-0.5">
                Update how you appear across ZaroHR
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View className="mx-7 h-px bg-slate-100" />

          {/* Actions */}
          <View className="px-4 pt-3">
            {actions.map((a) => {
              const isDanger = a.tone === 'danger';
              const isAccent = a.tone === 'accent';
              const { Icon } = a;
              return (
                <Pressable
                  key={a.key}
                  onPress={() => {
                    if (a.key === 'remove') {
                      onRemove();
                      onClose();
                    } else {
                      pick(a.key);
                    }
                  }}
                  className="flex-row items-center px-3 py-3 rounded-[22px] mb-1"
                  style={({ pressed }) => ({
                    backgroundColor: pressed
                      ? isDanger
                        ? '#fef2f2'
                        : '#f1f5f9'
                      : 'transparent',
                    transform: [{ scale: pressed ? 0.985 : 1 }],
                  })}
                  accessibilityRole="button"
                  accessibilityLabel={a.label}
                >
                  <View
                    className="h-12 w-12 rounded-2xl items-center justify-center mr-4"
                    style={{
                      backgroundColor: isAccent
                        ? SECONDARY
                        : isDanger
                          ? '#fee2e2'
                          : '#eef2f5',
                      shadowColor: isAccent ? SECONDARY : 'transparent',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: isAccent ? 0.45 : 0,
                      shadowRadius: 10,
                    }}
                  >
                    <Icon
                      size={22}
                      color={isDanger ? DANGER : PRIMARY}
                      strokeWidth={2.2}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-[16px] font-semibold"
                      style={{ color: isDanger ? DANGER : PRIMARY }}
                    >
                      {a.label}
                    </Text>
                    <Text className="text-[12.5px] text-slate-500 mt-0.5">
                      {a.description}
                    </Text>
                  </View>
                  <ChevronRight
                    size={18}
                    color={isDanger ? DANGER : '#94a3b8'}
                    strokeWidth={2.2}
                  />
                </Pressable>
              );
            })}
          </View>

          {/* Cancel */}
          <View className="px-5 mt-3">
            <Pressable
              onPress={onClose}
              className="h-14 items-center justify-center rounded-[20px]"
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#e2e8f0' : '#f1f5f9',
              })}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text
                className="text-[15px] font-bold tracking-wide"
                style={{ color: PRIMARY }}
              >
                Cancel
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
