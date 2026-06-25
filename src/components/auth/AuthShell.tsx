import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Keyboard,
  LayoutAnimation,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cardShadow } from '../shadow';
import { font } from './fonts';
import Logo from '../../../assets/logo_big.svg';

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Hide the small "ZARO" wordmark above the title (matches the reset screen). */
  showWordmark?: boolean;
};

// Shared scaffold for every auth screen: dark teal backdrop + centered white
// card with the Zaro logo, wordmark, title and subtitle. Pages pass their form
// fields and actions as children.
export default function AuthShell({
  title,
  subtitle,
  children,
  showWordmark = true,
}: AuthShellProps) {
  // Track the keyboard's actual height. We add that much bottom padding to the
  // scroll area so every field/button can scroll fully above the keyboard
  // (nothing left half-covered), and hide the logo while typing to stay compact.
  const [kbHeight, setKbHeight] = useState(0);
  useEffect(() => {
    const onShow = (e: { endCoordinates?: { height: number } }) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKbHeight(e.endCoordinates?.height ?? 0);
    };
    const onHide = () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKbHeight(0);
    };
    const show = Keyboard.addListener('keyboardDidShow', onShow);
    const hide = Keyboard.addListener('keyboardDidHide', onHide);
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const keyboardOpen = kbHeight > 0;

  return (
    <SafeAreaView className="flex-1 bg-ink">
      <StatusBar style="light" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingTop: 20,
          // Keyboard height + a little margin = enough room to scroll the lowest
          // element fully into view above the keyboard.
          paddingBottom: keyboardOpen ? kbHeight + 24 : 20,
          justifyContent: keyboardOpen ? 'flex-start' : 'center',
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View
          className={`w-full max-w-[440px] self-center rounded-[28px] bg-white px-7 ${
            keyboardOpen ? 'py-6' : 'py-9'
          }`}
          style={cardShadow}
        >
            {/* Logo + wordmark — hidden while typing to keep the form compact */}
            {!keyboardOpen ? (
              <>
                <View className="h-20 w-20 items-center justify-center self-center rounded-2xl bg-slate-100">
                  <Logo width={46} height={46} />
                </View>

                {showWordmark ? (
                  <Text
                    className="mt-3 text-center text-xs text-[#48626E]"
                    style={{ fontFamily: font.bold, letterSpacing: 4 }}
                  >
                    ZARO
                  </Text>
                ) : null}
              </>
            ) : null}

            <Text
              className={`text-center text-[34px] leading-tight text-[#0F172A] ${
                keyboardOpen ? '' : 'mt-4'
              }`}
              style={{ fontFamily: font.bold }}
            >
              {title}
            </Text>

            <Text className="mt-2 text-center text-base text-slate-500">
              {subtitle}
            </Text>

            <View className={keyboardOpen ? 'mt-5' : 'mt-7'}>{children}</View>
          </View>
        </ScrollView>
    </SafeAreaView>
  );
}
