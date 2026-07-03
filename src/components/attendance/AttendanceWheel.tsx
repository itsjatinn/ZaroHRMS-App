import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import type { Stat } from './attendanceStats';

type Props = {
  stats: Stat[];
  percent: number;
};

// Center ring sizing — big ring; the stat pills sit ON its circumference.
const RING = 200;
const STROKE = 14;
const R = (RING - STROKE) / 2; // ring radius (to stroke center)
const C = 2 * Math.PI * R;

// Overall wheel box. Pill centers orbit at the ring's radius so each pill's
// icon badge straddles the ring's border.
const PILL = 74; // pill slot width
const ORBIT = R; // pills sit right on the ring border
const BOX = RING + PILL + 24; // room for the pills + their labels
const CENTER = BOX / 2;

function CenterRing({ percent }: { percent: number }) {
  const arc = (percent / 100) * C;
  return (
    <View style={{ width: RING, height: RING }} className="items-center justify-center">
      <Svg width={RING} height={RING} style={{ position: 'absolute' }}>
        <Circle cx={RING / 2} cy={RING / 2} r={R} fill="none" stroke="#EEF1F4" strokeWidth={STROKE} />
        <Circle
          cx={RING / 2}
          cy={RING / 2}
          r={R}
          fill="none"
          stroke="#F5D14E"
          strokeWidth={STROKE}
          strokeDasharray={`${arc} ${C}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
        />
      </Svg>
      <Text className="text-[42px] font-bold text-ink">{percent}%</Text>
      <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        Attendance
      </Text>
    </View>
  );
}

const BADGE = 48;

// A stat rendered as a labeled icon badge, its BADGE centered exactly on (x, y)
// so it straddles the ring's border; value + label flow just below.
function StatPill({ stat, x, y }: { stat: Stat; x: number; y: number }) {
  const Icon = stat.icon;
  return (
    <View
      style={{ position: 'absolute', left: x - PILL / 2, top: y - BADGE / 2, width: PILL }}
      className="items-center"
    >
      <View
        style={{
          width: BADGE,
          height: BADGE,
          shadowColor: '#0B1F27',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        }}
        className={`items-center justify-center rounded-2xl ${stat.badge}`}
      >
        <Icon size={21} color={stat.color} />
      </View>
      <Text className="mt-1 text-base font-bold text-ink">{stat.value}</Text>
      <Text className="text-[10px] font-semibold text-slate-400" numberOfLines={1}>
        {stat.label}
      </Text>
    </View>
  );
}

// The circular attendance wheel: % ring in the center, stat pills orbiting it.
export default function AttendanceWheel({ stats, percent }: Props) {
  return (
    <View style={{ width: BOX, height: BOX }} className="self-center">
      {/* Orbiting pills — evenly spaced, starting at the top (12 o'clock) */}
      {stats.map((stat, i) => {
        // -90° puts the first pill at the top; go clockwise.
        const angle = (-90 + (360 / stats.length) * i) * (Math.PI / 180);
        const x = CENTER + ORBIT * Math.cos(angle);
        const y = CENTER + ORBIT * Math.sin(angle);
        return <StatPill key={stat.key} stat={stat} x={x} y={y} />;
      })}

      {/* Center ring */}
      <View
        style={{ position: 'absolute', left: CENTER - RING / 2, top: CENTER - RING / 2 }}
      >
        <CenterRing percent={percent} />
      </View>
    </View>
  );
}
