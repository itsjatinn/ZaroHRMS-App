import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import {
  CheckCircle2,
  Download,
  Eye,
  History,
  RefreshCw,
  Upload,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Alert } from '../CrossAlert';

import {
  DOC_CATEGORIES,
  MAX_UPLOAD_BYTES,
  authHeader,
  formatBytes,
  useMyDocuments,
  useUploadMyDocument,
  versionContentUrl,
  type DocCategory,
  type DocumentVersion,
  type LiveDoc,
} from '../../api/documents';
import DocumentHistoryModal from './DocumentHistoryModal';
import DocumentPreview, {
  isImage,
  isPdf,
  type PreviewTarget,
} from './DocumentPreview';
import { displayDate } from './liveProfile';

/**
 * Saves a blob: URL to the user's machine. Web only — guarded by
 * `Platform.OS === 'web'` at every call site, so `document` is never touched
 * on native.
 *
 * The object URL is revoked immediately: the browser has already committed to
 * the download by the time click() returns, and leaving it alive pins the whole
 * file in memory for the life of the tab.
 */
function saveOnWeb(uri: string, filename: string) {
  const anchor = document.createElement('a');
  anchor.href = uri;
  anchor.download = filename || 'document';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(uri);
}

/**
 * Live documents for the signed-in employee — the same stitched list and the
 * same four category tabs as the web profile.
 *
 * A document is either uploaded or not. There is no verification step for
 * these (see DocStatus in api/documents.ts), so nothing here claims one.
 */
export default function LiveDocumentsCard() {
  const query = useMyDocuments();
  const upload = useUploadMyDocument();
  const [category, setCategory] = useState<DocCategory>('personal');
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewTarget | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [history, setHistory] = useState<LiveDoc | null>(null);
  const [historyBusyId, setHistoryBusyId] = useState<string | null>(null);

  const docs = useMemo(() => query.data ?? [], [query.data]);

  // All four tabs always render, with their own counts — as on the web.
  const tabs = useMemo(
    () =>
      DOC_CATEGORIES.map((meta) => {
        const items = docs.filter((doc) => doc.category === meta.key);
        return {
          ...meta,
          items,
          uploaded: items.filter((doc) => doc.status === 'uploaded').length,
          missing: items.filter((doc) => doc.status === 'missing').length,
        };
      }),
    [docs],
  );

  const active = tabs.find((tab) => tab.key === category) ?? tabs[0];
  const uploadedCount = docs.filter((doc) => doc.status === 'uploaded').length;

  /**
   * Pulls the file down with the bearer token — no image or PDF loader can
   * attach that header itself — and returns where it landed plus its type.
   */
  const fetchFile = async (url: string, name: string) => {
    // Web has no filesystem to download into, and expo-file-system does not
    // run there at all. Pull the bytes with the bearer token and hand back a
    // blob: URL instead — <img> and <iframe> both render one, and an <a
    // download> saves it, which covers every call site below without changing
    // their shape.
    if (Platform.OS === 'web') {
      const response = await fetch(url, {
        headers: authHeader(),
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      return {
        uri: URL.createObjectURL(blob),
        mimeType: (blob.type || 'application/octet-stream')
          .split(';')[0]
          .trim(),
      };
    }

    const safeName = (name || 'document').replace(/[^\w.\-]/g, '_');
    const result = await FileSystem.downloadAsync(
      url,
      `${FileSystem.cacheDirectory}${safeName}`,
      { headers: authHeader() },
    );
    if (result.status !== 200) throw new Error(`HTTP ${result.status}`);
    // The endpoint sets Content-Type; header casing varies by platform.
    const headers = result.headers as Record<string, string>;
    const mimeType =
      headers['content-type'] ??
      headers['Content-Type'] ??
      'application/octet-stream';
    return { uri: result.uri, mimeType: mimeType.split(';')[0].trim() };
  };

  const download = (doc: LiveDoc) => fetchFile(doc.contentUrl!, doc.name);

  /** Opens the document for reading — inline, not through the share sheet. */
  const viewDocument = async (doc: LiveDoc) => {
    if (!doc.contentUrl) return;
    setPreviewLoading(true);
    try {
      const file = await download(doc);

      // Android's WebView can't render a PDF, so hand those to the device's
      // own viewer instead of showing an empty frame.
      if (isPdf(file.mimeType) && Platform.OS === 'android') {
        setPreviewLoading(false);
        const contentUri = await FileSystem.getContentUriAsync(file.uri);
        await IntentLauncher.startActivityAsync(
          'android.intent.action.VIEW',
          {
            data: contentUri,
            flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
            type: 'application/pdf',
          },
        );
        return;
      }

      if (isImage(file.mimeType) || isPdf(file.mimeType)) {
        setPreview({ name: doc.name, uri: file.uri, mimeType: file.mimeType });
        return;
      }

      // Anything else has no in-app renderer — offer it to another app.
      setPreviewLoading(false);
      if (Platform.OS === 'web') {
        saveOnWeb(file.uri, doc.name);
        return;
      }
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { dialogTitle: doc.name });
      } else {
        Alert.alert('Downloaded', `${doc.name} saved to the app's files.`);
      }
    } catch {
      Alert.alert(
        "Couldn't open that document",
        'Please check your connection and try again.',
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  /**
   * Saves the file where the user can get at it — the web's Download button.
   *
   * The two platforms genuinely differ: Android can write into a folder the
   * user picks, while iOS has no user-visible download directory, so its
   * system sheet ("Save to Files") is the platform's download.
   */
  const downloadDocument = async (doc: LiveDoc) => {
    if (!doc.contentUrl) return;
    setBusyKey(doc.key);
    try {
      const file = await download(doc);

      // The browser owns the download UX: an anchor with `download` sends the
      // blob straight to the user's Downloads folder, no permission dance.
      if (Platform.OS === 'web') {
        saveOnWeb(file.uri, doc.name);
        return;
      }

      if (Platform.OS === 'android') {
        const permission =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permission.granted) return;
        const base64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const target = await FileSystem.StorageAccessFramework.createFileAsync(
          permission.directoryUri,
          doc.name,
          file.mimeType,
        );
        await FileSystem.writeAsStringAsync(target, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        Alert.alert('Saved', `${doc.name} was saved to the folder you chose.`);
        return;
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { dialogTitle: `Save ${doc.name}` });
      } else {
        Alert.alert('Downloaded', `${doc.name} saved to the app's files.`);
      }
    } catch {
      Alert.alert("Couldn't download that document", 'Please try again.');
    } finally {
      setBusyKey(null);
    }
  };

  /** Opens one superseded version from the history list. */
  const viewVersion = async (version: DocumentVersion) => {
    setHistoryBusyId(version.id);
    try {
      const file = await fetchFile(
        versionContentUrl(version.id),
        version.fileName,
      );
      if (isPdf(file.mimeType) && Platform.OS === 'android') {
        const contentUri = await FileSystem.getContentUriAsync(file.uri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1,
          type: 'application/pdf',
        });
        return;
      }
      if (isImage(file.mimeType) || isPdf(file.mimeType)) {
        setHistory(null);
        setPreview({
          name: version.fileName,
          uri: file.uri,
          mimeType: file.mimeType,
        });
        return;
      }
      // Nothing can render this type inline. Native offers it to another app;
      // the browser's equivalent is simply to save it.
      if (Platform.OS === 'web') {
        saveOnWeb(file.uri, version.fileName);
        return;
      }
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { dialogTitle: version.fileName });
      }
    } catch {
      Alert.alert("Couldn't open that version", 'Please try again.');
    } finally {
      setHistoryBusyId(null);
    }
  };

  const pickAndUpload = async (doc: LiveDoc) => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'],
        copyToCacheDirectory: true,
      });
      if (picked.canceled || !picked.assets?.length) return;
      const asset = picked.assets[0];

      // The endpoint caps uploads at 10 MB; catching it here gives a clear
      // message instead of a generic failure after a long upload.
      if (asset.size && asset.size > MAX_UPLOAD_BYTES) {
        Alert.alert(
          'File is too large',
          `${doc.name} must be under 10 MB. That file is ${formatBytes(asset.size)}.`,
        );
        return;
      }

      setBusyKey(doc.key);
      await upload.mutateAsync({
        uri: asset.uri,
        name: asset.name ?? 'document',
        mimeType: asset.mimeType,
        // Web hands back a real File; the multipart body needs it there.
        file: asset.file,
        category: doc.category,
        // Both matter: the slot key files it against this row, and reusing the
        // existing type makes a replace supersede the old file.
        documentType: doc.documentType,
        templateFieldKey: doc.templateFieldKey,
      });
    } catch (error) {
      Alert.alert(
        'Upload failed',
        error instanceof Error && error.message
          ? error.message
          : 'Please try again in a moment.',
      );
    } finally {
      setBusyKey(null);
    }
  };

  if (query.isPending) {
    return (
      <View className="items-center py-8">
        <ActivityIndicator color="#14323F" />
      </View>
    );
  }

  if (query.isError) {
    return (
      <Text className="py-6 text-center text-sm text-slate-400">
        Couldn&apos;t load documents. Try again in a moment.
      </Text>
    );
  }

  return (
    <View>
      <Text className="pb-2 text-[11px] text-slate-400">
        {uploadedCount} of {docs.length} uploaded
      </Text>

      {/* Category tabs — no shadow inside a horizontal ScrollView, which
          would otherwise swallow the taps on Android. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 pb-3"
      >
        {tabs.map((tab) => {
          const selected = tab.key === active?.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setCategory(tab.key)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              className="h-8 items-center justify-center rounded-full px-3.5"
              style={{ backgroundColor: selected ? '#14323F' : '#F1F5F9' }}
            >
              <Text
                className="text-xs font-bold"
                style={{ color: selected ? '#FFFFFF' : '#475569' }}
              >
                {tab.label} {tab.uploaded}/{tab.items.length}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {active ? (
        <Text className="pb-1 text-[11px] text-slate-400">
          {active.missing > 0 ? `${active.missing} missing` : active.hint}
        </Text>
      ) : null}

      {!active || active.items.length === 0 ? (
        <Text className="py-6 text-center text-sm text-slate-400">
          No documents in this section yet.
        </Text>
      ) : (
        active.items.map((doc, index) => {
          const busy = busyKey === doc.key;
          const uploaded = doc.status === 'uploaded';
          const canOpen = uploaded && Boolean(doc.contentUrl);
          return (
            <View
              key={doc.key}
              className={`flex-row items-center gap-3 py-3 ${index > 0 ? 'border-t border-slate-100' : ''}`}
            >
              <View
                className="h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: uploaded ? '#0596691A' : '#F1F5F9' }}
              >
                {uploaded ? (
                  <CheckCircle2 size={16} color="#059669" />
                ) : (
                  <Upload size={16} color="#94A3B8" />
                )}
              </View>

              <View className="flex-1">
                <Text className="text-sm font-semibold text-ink" numberOfLines={1}>
                  {doc.name}
                </Text>
                {uploaded ? (
                  <Text className="text-[11px] text-slate-400">
                    {doc.uploadedAt
                      ? `Uploaded ${displayDate(doc.uploadedAt)}`
                      : 'Uploaded'}
                  </Text>
                ) : (
                  <Text className="text-[11px] font-medium text-amber-600">
                    Not uploaded
                  </Text>
                )}
              </View>

              {busy ? (
                <ActivityIndicator color="#14323F" />
              ) : (
                <View className="flex-row items-center gap-1.5">
                  {doc.hasHistory && doc.documentType ? (
                    <Pressable
                      onPress={() => setHistory(doc)}
                      hitSlop={6}
                      accessibilityLabel={`Version history for ${doc.name}`}
                      className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 active:scale-95"
                    >
                      <History size={15} color="#334155" />
                    </Pressable>
                  ) : null}
                  {canOpen ? (
                    <>
                      <Pressable
                        onPress={() => void viewDocument(doc)}
                        hitSlop={6}
                        accessibilityLabel={`View ${doc.name}`}
                        className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 active:scale-95"
                      >
                        <Eye size={16} color="#334155" />
                      </Pressable>
                      <Pressable
                        onPress={() => void downloadDocument(doc)}
                        hitSlop={6}
                        accessibilityLabel={`Download ${doc.name}`}
                        className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 active:scale-95"
                      >
                        <Download size={15} color="#334155" />
                      </Pressable>
                    </>
                  ) : null}
                  <Pressable
                    onPress={() => void pickAndUpload(doc)}
                    hitSlop={6}
                    accessibilityLabel={`${uploaded ? 'Replace' : 'Upload'} ${doc.name}`}
                    className={
                      uploaded
                        ? 'h-9 w-9 items-center justify-center rounded-full bg-slate-100 active:scale-95'
                        : 'flex-row items-center gap-1.5 rounded-full bg-[#14323F] px-3.5 py-2 active:scale-95'
                    }
                  >
                    {uploaded ? (
                      <RefreshCw size={15} color="#334155" />
                    ) : (
                      <Upload size={14} color="#FFFFFF" />
                    )}
                    {uploaded ? null : (
                      <Text className="text-xs font-bold text-white">Upload</Text>
                    )}
                  </Pressable>
                </View>
              )}
            </View>
          );
        })
      )}

      <DocumentHistoryModal
        documentType={history?.documentType ?? null}
        title={history?.name ?? 'Version history'}
        onClose={() => setHistory(null)}
        onView={(version) => void viewVersion(version)}
        busyId={historyBusyId}
      />

      <DocumentPreview
        target={preview}
        loading={previewLoading}
        onClose={() => {
          // On web the preview URI is a blob: URL holding the whole file in
          // memory. Native URIs are plain cache paths and must not be touched.
          if (Platform.OS === 'web' && preview?.uri.startsWith('blob:')) {
            URL.revokeObjectURL(preview.uri);
          }
          setPreview(null);
          setPreviewLoading(false);
        }}
      />
    </View>
  );
}
