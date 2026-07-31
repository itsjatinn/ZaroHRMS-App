import { AlertTriangle, Clock, LogOut } from 'lucide-react-native';
import {
  Modal,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { cardShadow } from './shadow';

/**
 * Confirmation shown before an early punch out, when leaving now would mark
 * the day Half Day or Absent.
 *
 * Punching out is never blocked — this exists so a short day is a decision
 * rather than a surprise on the payslip.
 */

export type PunchOutProjection = {
  tone: 'danger' | 'warn';
  text: string;
};

type Props = {
  projection: PunchOutProjection | null;
  /** Live worked duration, e.g. "03:12:45". */
  worked: string;
  onCancel: () => void;
  onConfirm: () => void;
};

const TONE = {
  danger: {
    tint: '#FDEEEE',
    color: '#B42318',
    heading: "Today will be marked Absent",
  },
  warn: {
    tint: '#FDF6E3',
    color: '#92610A',
    heading: 'Today will be marked Half Day',
  },
} as const;

export default function PunchOutConfirmModal({
  projection,
  worked,
  onCancel,
  onConfirm,
}: Props) {
  const { width } = useWindowDimensions();
  const tone = projection ? TONE[projection.tone] : TONE.warn;

  return (
    <Modal
      visible={Boolean(projection)}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-black/60 px-5"
        onPress={onCancel}
      >
        <Pressable
          style={[cardShadow, { width: Math.min(width * 0.9, 420) }]}
          className="overflow-hidden rounded-[26px] bg-white"
        >
          <View className="items-center px-6 pt-6">
            <View
              className="h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: tone.tint }}
            >
              <AlertTriangle size={26} color={tone.color} />
            </View>

            <Text className="mt-4 text-center text-lg font-bold text-ink">
              {tone.heading}
            </Text>
            <Text className="mt-2 text-center text-sm leading-5 text-slate-500">
              {projection?.text}
            </Text>

            {/* What they've actually worked, so the decision has a number
                attached rather than just a warning. */}
            <View className="mt-4 w-full flex-row items-center justify-center gap-2 rounded-2xl bg-slate-50 py-3">
              <Clock size={15} color="#64748B" />
              <Text className="text-xs font-semibold text-slate-500">
                Worked so far
              </Text>
              <Text className="text-sm font-bold text-ink">{worked}</Text>
            </View>
          </View>

          <View className="flex-row gap-3 px-6 pb-6 pt-5">
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              className="flex-1 items-center justify-center rounded-2xl border border-slate-200 py-3.5 active:bg-slate-50"
            >
              <Text className="text-sm font-bold text-ink">Stay punched in</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              accessibilityRole="button"
              className="flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl py-3.5 active:scale-95"
              style={{ backgroundColor: tone.color }}
            >
              <LogOut size={15} color="#FFFFFF" />
              <Text className="text-sm font-bold text-white">Punch out</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
