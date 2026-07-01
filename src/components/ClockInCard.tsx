import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import type { ViewStyle } from 'react-native';
import { Pressable, Text, View } from 'react-native';

const YELLOW = '#F5D14E';
const NAVY = '#14323F';
const PUNCH_CARD_SHADOW: ViewStyle = {
  shadowColor: NAVY,
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
};

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export default function ClockInCard() {
  // false = not punched in yet (default), true = punched in
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
  const month = now.toLocaleDateString('en-US', { month: 'long' });
  const dateStr = `${weekday} ${now.getDate()} ${month}`.toUpperCase();
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  return (
    <View style={PUNCH_CARD_SHADOW} className="rounded-3xl bg-[#14323F] p-6">
      <View className="flex-row items-center">
        {/* Left: date, status, time */}
        <View className="flex-1 pr-4">
          <Text className="text-xs font-bold uppercase tracking-wider text-white/40">
            {dateStr}
          </Text>

          {/* Status pill */}
          <View className="mt-3 flex-row">
            <View className="flex-row items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
              <View
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: isPunchedIn ? YELLOW : '#94A3B8' }}
              />
              <Text className="text-sm font-semibold text-white">
                {isPunchedIn ? 'Punched in' : 'Not punched in yet'}
              </Text>
            </View>
          </View>

          {/* Live time */}
          <View className="mt-4 flex-row items-center gap-2">
            <Feather name="clock" size={20} color={YELLOW} />
            <Text className="text-4xl font-bold tracking-tight text-white">
              {time}
            </Text>
          </View>

          {/* Status note */}
          <Text
            className="mt-3 text-sm font-medium"
            style={{ color: isPunchedIn ? '#6FCF97' : '#F08D7E' }}
          >
            {isPunchedIn ? 'Punched in successfully.' : 'Unable to punch in.'}
          </Text>
        </View>

        {/* Right: dashed ring + yellow punch button */}
        <View
          className="items-center justify-center rounded-full p-1"
          style={{
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.25)',
            borderStyle: 'dashed',
          }}
        >
          <Pressable
            onPress={() => setIsPunchedIn((prev) => !prev)}
            className="h-28 w-28 items-center justify-center rounded-full transition duration-200 active:scale-95"
            style={{ backgroundColor: YELLOW }}
          >
            <MaterialCommunityIcons name="fingerprint" size={40} color={NAVY} />
            <Text className="mt-1 text-xs font-extrabold tracking-wide text-[#14323F]">
              {isPunchedIn ? 'PUNCH OUT' : 'PUNCH IN'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
