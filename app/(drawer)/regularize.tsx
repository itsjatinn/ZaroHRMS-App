import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackButton from '../../src/components/BackButton';

export default function Regularize() {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <BackButton title="Regularize" />
      <View className="flex-1 items-center justify-center">
        <Text className="text-xl font-bold text-ink">Regularize</Text>
      </View>
    </SafeAreaView>
  );
}
