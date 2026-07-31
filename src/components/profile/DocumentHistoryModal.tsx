import { History, X } from 'lucide-react-native';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  formatBytes,
  useDocumentVersions,
  type DocumentVersion,
} from '../../api/documents';
import { cardShadow } from '../shadow';
import { displayDate } from './liveProfile';

/**
 * Prior and current versions of one document type — the same list the web's
 * History popover shows, newest first.
 *
 * Replacing a document supersedes the old file rather than deleting it, so
 * this is the only place an employee can get back to what they replaced.
 */
type Props = {
  /** The document type to list; null closes the modal. */
  documentType: string | null;
  title: string;
  onClose: () => void;
  onView: (version: DocumentVersion) => void;
  /** Version id currently being fetched, so its row can show a spinner. */
  busyId?: string | null;
};

export default function DocumentHistoryModal({
  documentType,
  title,
  onClose,
  onView,
  busyId = null,
}: Props) {
  const { width, height } = useWindowDimensions();
  const query = useDocumentVersions(documentType);

  return (
    <Modal
      visible={Boolean(documentType)}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-black/60 px-4"
        onPress={onClose}
      >
        <Pressable
          style={[cardShadow, { width: width * 0.9, maxHeight: height * 0.7 }]}
          className="overflow-hidden rounded-[24px] bg-white"
        >
          <View className="flex-row items-center gap-2 border-b border-slate-100 px-4 py-3">
            <History size={16} color="#334155" />
            <Text className="flex-1 text-sm font-bold text-ink" numberOfLines={1}>
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close history"
              className="h-8 w-8 items-center justify-center rounded-full bg-slate-100 active:scale-95"
            >
              <X size={16} color="#334155" />
            </Pressable>
          </View>

          {query.isPending ? (
            <View className="items-center py-10">
              <ActivityIndicator color="#14323F" />
            </View>
          ) : query.isError ? (
            <Text className="px-4 py-8 text-center text-sm text-slate-400">
              Couldn&apos;t load version history.
            </Text>
          ) : query.data.length === 0 ? (
            <Text className="px-4 py-8 text-center text-sm text-slate-400">
              No earlier versions.
            </Text>
          ) : (
            <ScrollView contentContainerClassName="px-4 py-1">
              {query.data.map((version, index) => (
                <Pressable
                  key={version.id}
                  onPress={() => onView(version)}
                  disabled={busyId === version.id}
                  accessibilityRole="button"
                  accessibilityLabel={`View ${version.fileName}`}
                  className={`flex-row items-center gap-3 py-3 active:opacity-70 ${index > 0 ? 'border-t border-slate-100' : ''}`}
                >
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text
                        className="flex-shrink text-sm font-semibold text-ink"
                        numberOfLines={1}
                      >
                        {version.fileName}
                      </Text>
                      {version.isCurrent ? (
                        <View className="rounded-full bg-emerald-50 px-2 py-0.5">
                          <Text className="text-[10px] font-bold text-emerald-700">
                            Current
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text className="text-[11px] text-slate-400">
                      {[
                        version.uploadedAt
                          ? `Uploaded ${displayDate(version.uploadedAt)}`
                          : null,
                        formatBytes(version.fileSize),
                        version.supersededAt
                          ? `Replaced ${displayDate(version.supersededAt)}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>
                  {busyId === version.id ? (
                    <ActivityIndicator color="#14323F" />
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
