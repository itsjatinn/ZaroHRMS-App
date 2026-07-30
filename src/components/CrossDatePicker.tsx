// Native platforms: re-export the community date/time picker unchanged, so
// call sites get the exact same API. The web build resolves the sibling
// CrossDatePicker.web.tsx instead (Metro picks .web.tsx automatically).
export {
  default,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
