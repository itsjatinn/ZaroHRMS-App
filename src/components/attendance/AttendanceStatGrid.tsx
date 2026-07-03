import type { LucideIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { cardShadow } from '../shadow';

export type GridStat = {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string; // status accent (icon + badge tint)
  badge: string; // legacy tailwind badge class (unused on dark cards)
};

type Props = {
  stats: [GridStat, GridStat, GridStat, GridStat]; // TL, TR, BL, BR
  percent: number;
};

const INK = '#14323F'; // primary card color
const CANVAS = '#F9F9F9'; // page background — carves a light hole between the cards
const ICON_COLOR = '#F5D14E';
const GAP = 10;
const HOLE = 108; // diameter of the circular hole cut in the center
const RING = 86; // % ring diameter (nests inside the hole)
const STROKE = 8;
const RR = (RING - STROKE) / 2;
const RC = 2 * Math.PI * RR;

type IconPos = 'tl' | 'tr' | 'bl' | 'br';
// Absolute corner offsets for the icon badge, per position.
const ICON_CORNER: Record<IconPos, object> = {
  tl: { top: 14, left: 14 },
  tr: { top: 14, right: 14 },
  bl: { bottom: 14, left: 14 },
  br: { bottom: 14, right: 14 },
};

function Cell({
  stat,
  iconPos,
  align,
}: {
  stat: GridStat;
  iconPos: IconPos;
  align: 'left' | 'right';
}) {
  const Icon = stat.icon;
  const right = align === 'right';

  return (
    <View
      style={[cardShadow, { flex: 1, backgroundColor: INK }]}
      className="h-[100px] justify-center rounded-[22px] p-4"
    >
      {/* Label + value, aligned to the outer edge */}
      <Text
        className={`text-[11px] font-semibold uppercase tracking-wider text-white/50 ${right ? 'text-right' : ''}`}
      >
        {stat.label}
      </Text>
      <Text className={`mt-1 text-3xl font-bold text-white ${right ? 'text-right' : ''}`}>
        {stat.value}
      </Text>

      {/* Icon badge in its assigned corner — one consistent neutral tint */}
      <View
        style={[
          { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.12)' },
          ICON_CORNER[iconPos],
        ]}
        className="h-9 w-9 items-center justify-center rounded-xl"
      >
        <Icon size={18} color={ICON_COLOR} />
      </View>
    </View>
  );
}

// 2×2 stat grid. A single canvas-colored circle overlaid at the center "bites"
// all four inner corners at once, so they curve inward around a hole that holds
// the attendance % ring.
export default function AttendanceStatGrid({ stats, percent }: Props) {
  const [tl, tr, bl, br] = stats;
  const arc = (percent / 100) * RC;

  return (
    <View className="relative">
      {/* Cards */}
      <View style={{ gap: GAP }}>
        <View className="flex-row" style={{ gap: GAP }}>
          <Cell stat={tl} iconPos="tr" align="left" />
          <Cell stat={tr} iconPos="tl" align="right" />
        </View>
        <View className="flex-row" style={{ gap: GAP }}>
          <Cell stat={bl} iconPos="br" align="left" />
          <Cell stat={br} iconPos="bl" align="right" />
        </View>
      </View>

      {/* Concave bite: one big canvas-colored circle centered where the 4 cards
          meet — sits ON TOP of the card corners, carving them inward. */}
      <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
        <View
          style={{
            width: HOLE,
            height: HOLE,
            borderRadius: HOLE / 2,
            backgroundColor: CANVAS,
          }}
        />
      </View>

      {/* Attendance % ring, nested in the carved hole */}
      <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
        <View style={{ width: RING, height: RING }} className="items-center justify-center">
          <Svg width={RING} height={RING} style={{ position: 'absolute' }}>
            <Circle cx={RING / 2} cy={RING / 2} r={RR} fill="none" stroke="#E7EBEF" strokeWidth={STROKE} />
            <Circle
              cx={RING / 2}
              cy={RING / 2}
              r={RR}
              fill="none"
              stroke="#F5D14E"
              strokeWidth={STROKE}
              strokeDasharray={`${arc} ${RC}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
            />
          </Svg>
          <Text className="text-[22px] font-bold text-ink">{percent}%</Text>
          <Text className="text-[8px] font-semibold uppercase tracking-wide text-slate-400">
            Present
          </Text>
        </View>
      </View>
    </View>
  );
}
