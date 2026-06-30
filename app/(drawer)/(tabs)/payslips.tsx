import { Alert, ScrollView, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import BackButton from '../../../src/components/BackButton';
import BreakdownCard from '../../../src/components/payslip/BreakdownCard';
import LatestPayslipCard from '../../../src/components/payslip/LatestPayslipCard';
import PayslipList from '../../../src/components/payslip/PayslipList';
import { PAYSLIPS, type Payslip } from '../../../src/components/payslip/payslipData';

export default function Payslips() {
  const insets = useSafeAreaInsets();
  const latest = PAYSLIPS[0];

  // Placeholder download handler. A real build would render the slip with
  // expo-print and share/save it via expo-sharing / expo-file-system.
  const handleDownload = (payslip: Payslip) => {
    Alert.alert('Download started', `${payslip.month} payslip (PDF)`);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-[#F4F3EF]">
      <BackButton />
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-6"
        // Clear the floating tab bar at the bottom.
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View>
          <Text className="text-xl font-bold text-ink">Payslips</Text>
          <Text className="mt-1 text-sm text-slate-400">
            View and download your monthly salary slips.
          </Text>
        </View>

        {/* Latest payslip */}
        <LatestPayslipCard payslip={latest} onDownload={handleDownload} />

        {/* Salary breakdown */}
        <BreakdownCard month={latest.month} />

        {/* History */}
        <PayslipList onDownload={handleDownload} />
      </ScrollView>
    </SafeAreaView>
  );
}
