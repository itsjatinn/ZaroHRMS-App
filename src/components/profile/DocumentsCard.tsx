import * as DocumentPicker from 'expo-document-picker';
import { Eye, FileText, RefreshCw, Upload } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { DOCUMENTS, type DocItem } from './documentsData';

// Documents section: each row shows the doc name + status. Uploaded docs offer
// View + Replace; missing docs offer Upload. Picking a file updates locally.
export default function DocumentsCard() {
  const [docs, setDocs] = useState<DocItem[]>(DOCUMENTS);

  const pick = async (key: string) => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;
      const name = res.assets?.[0]?.name ?? 'document';
      setDocs((prev) => prev.map((d) => (d.key === key ? { ...d, file: name } : d)));
    } catch {
      Alert.alert('Upload failed', 'Could not pick that file. Please try again.');
    }
  };

  const view = (doc: DocItem) => {
    // No viewer wired yet — surface the file name.
    Alert.alert(doc.label, doc.file ? `File: ${doc.file}` : 'No file uploaded.');
  };

  return (
    <View>
      {docs.map((doc, i) => {
        const uploaded = doc.file != null;
        return (
          <View
            key={doc.key}
            className={`flex-row items-center gap-3 py-3 ${i > 0 ? 'border-t border-slate-100' : ''}`}
          >
            {/* Doc icon */}
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
              <FileText size={17} color={uploaded ? '#334155' : '#94A3B8'} />
            </View>

            {/* Label + status */}
            <View className="flex-1">
              <Text className="text-sm font-semibold text-ink">{doc.label}</Text>
              {uploaded ? (
                <Text className="text-[11px] text-slate-400" numberOfLines={1}>
                  {doc.file}
                </Text>
              ) : (
                <Text className="text-[11px] font-medium text-amber-600">
                  Not uploaded
                </Text>
              )}
            </View>

            {/* Actions */}
            {uploaded ? (
              <View className="flex-row items-center gap-1.5">
                <Pressable
                  onPress={() => view(doc)}
                  hitSlop={6}
                  accessibilityLabel={`View ${doc.label}`}
                  className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 active:scale-95"
                >
                  <Eye size={16} color="#334155" />
                </Pressable>
                <Pressable
                  onPress={() => pick(doc.key)}
                  hitSlop={6}
                  accessibilityLabel={`Replace ${doc.label}`}
                  className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 active:scale-95"
                >
                  <RefreshCw size={15} color="#334155" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => pick(doc.key)}
                hitSlop={6}
                accessibilityLabel={`Upload ${doc.label}`}
                className="flex-row items-center gap-1.5 rounded-full bg-[#14323F] px-3.5 py-2 active:scale-95"
              >
                <Upload size={14} color="#FFFFFF" />
                <Text className="text-xs font-bold text-white">Upload</Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}
