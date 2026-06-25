import { Ticket } from 'lucide-react-native';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import BackButton from '../../src/components/BackButton';
import ContactTile from '../../src/components/support/ContactTile';
import FaqCard from '../../src/components/support/FaqCard';
import { CONTACTS } from '../../src/components/support/supportData';
import { cardShadow } from '../../src/components/shadow';

export default function Support() {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-[#F4F3EF]">
      <BackButton title="Support" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-sm text-slate-400">
          Need help? Reach out or browse common questions below.
        </Text>

        {/* Contact options */}
        <View className="flex-row gap-3">
          {CONTACTS.map((c) => (
            <ContactTile key={c.label} contact={c} />
          ))}
        </View>

        {/* Raise a ticket */}
        <Pressable
          onPress={() => Alert.alert('Raise a ticket', 'Ticket form coming soon.')}
          style={cardShadow}
          className="h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-[#14323F] active:scale-[0.98]"
        >
          <Ticket size={18} color="#F5D14E" />
          <Text className="text-sm font-bold text-white">Raise a Ticket</Text>
        </Pressable>

        <FaqCard />
      </ScrollView>
    </SafeAreaView>
  );
}
