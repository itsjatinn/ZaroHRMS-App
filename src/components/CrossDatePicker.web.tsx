import { useEffect, useRef } from 'react';

// Mirror of the community picker's change-event shape, narrowed to the fields
// the app actually reads (event.type).
export type DateTimePickerEvent = {
  type: 'set' | 'dismissed';
  nativeEvent: { timestamp?: number };
};

type CrossDatePickerProps = {
  value: Date;
  mode?: 'date' | 'time';
  onChange: (event: DateTimePickerEvent, date?: Date) => void;
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

// Native input value strings.
function toDateValue(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function toTimeValue(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Web replacement for @react-native-community/datetimepicker. The app mounts
// the picker only while its local `open` flag is true and unmounts it in the
// onChange handler — same lifecycle as native. On mount we render a hidden
// HTML <input type="date|time"> and open its native calendar/clock; picking a
// value or dismissing fires onChange with the native-compatible event shape.
export default function CrossDatePicker({
  value,
  mode = 'date',
  onChange,
}: CrossDatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Guard so a value change + a blur don't both fire onChange.
  const settledRef = useRef(false);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    // Open the browser's native picker as soon as we mount.
    const open = () => {
      try {
        // showPicker() is supported in all current mobile browsers.
        (input as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
        input.focus();
      } catch {
        input.focus();
      }
    };
    // Defer a tick so the element is laid out before we open it.
    const id = setTimeout(open, 0);
    return () => clearTimeout(id);
  }, []);

  const settle = (event: DateTimePickerEvent, date?: Date) => {
    if (settledRef.current) return;
    settledRef.current = true;
    onChange(event, date);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (!raw) {
      settle({ type: 'dismissed', nativeEvent: {} });
      return;
    }
    const next = new Date(value);
    if (mode === 'time') {
      const [h, m] = raw.split(':').map(Number);
      next.setHours(h, m, 0, 0);
    } else {
      const [y, mo, d] = raw.split('-').map(Number);
      next.setFullYear(y, mo - 1, d);
    }
    settle(
      { type: 'set', nativeEvent: { timestamp: next.getTime() } },
      next,
    );
  };

  return (
    <input
      ref={inputRef}
      type={mode}
      defaultValue={mode === 'time' ? toTimeValue(value) : toDateValue(value)}
      onChange={handleInput}
      onBlur={() => settle({ type: 'dismissed', nativeEvent: {} })}
      style={{
        position: 'absolute',
        opacity: 0,
        width: 1,
        height: 1,
        border: 0,
        padding: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
