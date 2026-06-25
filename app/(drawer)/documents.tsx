import { Alert, ScrollView, Text } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import BackButton from '../../src/components/BackButton';
import DocumentSection from '../../src/components/documents/DocumentSection';
import { DOCUMENT_SECTIONS } from '../../src/components/documents/documentsData';

export default function Documents() {
  const insets = useSafeAreaInsets();
  const download = (name: string) => Alert.alert('Download started', `${name} (PDF)`);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-[#F4F3EF]">
      <BackButton title="Documents" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-sm text-slate-400">
          Your personal, payroll, and company documents in one place.
        </Text>

        {DOCUMENT_SECTIONS.map((section) => (
          <DocumentSection
            key={section.title}
            title={section.title}
            docs={section.docs}
            onDownload={download}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
