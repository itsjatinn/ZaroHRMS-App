import { LayoutAnimation, ScrollView, View } from 'react-native';
import { Alert } from '../../src/components/CrossAlert';
import { useMemo, useState } from 'react';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  useMyProfile,
  usePatchAddress,
  usePatchBank,
  usePatchContact,
  usePatchDemographics,
  usePutEducation,
  usePutEmergencyContacts,
  usePutExperience,
  usePutFamily,
  usePutGuardians,
  usePutNominees,
  type ProfileAddress,
} from '../../src/api/profile';
import {
  toWireItems,
  type CollectionKey,
  type CollectionRow,
} from '../../src/components/profile/collectionFields';
import {
  useProfilePhoto,
  useSaveProfilePhoto,
} from '../../src/api/profilePhoto';
import { useAuth } from '../../src/auth/AuthContext';
import BackButton from '../../src/components/BackButton';
import { cardShadow } from '../../src/components/shadow';
import ProfileHeader from '../../src/components/profile/ProfileHeader';
import PhotoCropModal, {
  type CropSource,
} from '../../src/components/profile/PhotoCropModal';
import PhotoPickerSheet from '../../src/components/profile/PhotoPickerSheet';
import SectionBlock from '../../src/components/profile/SectionBlock';
import type { InfoItem } from '../../src/components/profile/profileData';
import { PROFILE_SECTIONS } from '../../src/components/profile/profileSections';
import {
  buildLiveSectionCards,
  displayDate,
  humanizeEnum,
  isoFromDisplay,
  tenureLabel,
  totalExperienceLabel,
} from '../../src/components/profile/liveProfile';

export default function ViewProfile() {
  const insets = useSafeAreaInsets();
  const { isBackendSession, user } = useAuth();

  // Live profile — the same GET the web page reads. The demo session keeps the
  // sample sections (no token to fetch with).
  const profileQuery = useMyProfile(isBackendSession);
  const profile = profileQuery.data;

  // The photo is a user preference (a data URL), stored under the same key the
  // web writes — so a picture set on either product shows on both.
  const photoQuery = useProfilePhoto(isBackendSession);
  const savePhoto = useSaveProfilePhoto();
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  // URI of the image being cropped, between picking and saving.
  const [cropSource, setCropSource] = useState<CropSource | null>(null);

  const onPickPhoto = (dataUrl: string | null) => {
    if (!isBackendSession) {
      Alert.alert(
        'Sign in to save',
        'Photo changes need a live HRMS session.',
      );
      return;
    }
    savePhoto.mutate(dataUrl, {
      onError: (error) => {
        Alert.alert(
          'Could not save your photo',
          error instanceof Error && error.message
            ? error.message
            : 'Please try again in a moment.',
        );
      },
    });
  };

  const patchContact = usePatchContact();
  const patchDemographics = usePatchDemographics();
  const patchAddress = usePatchAddress();
  const patchBank = usePatchBank();
  const putEmergencyContacts = usePutEmergencyContacts();
  const putFamily = usePutFamily();
  const putNominees = usePutNominees();
  const putGuardians = usePutGuardians();
  const putEducation = usePutEducation();
  const putExperience = usePutExperience();

  /**
   * The editable repeatable collections per section. Each save maps the rows
   * onto the wire item shape (grade→gradeCgpa, dateOfBirth→dob) and replaces
   * the whole collection — the same PUT-the-lot contract the web uses. The
   * profile refetch on success reconciles ids and ordering.
   */
  const collectionsBySection = useMemo(() => {
    if (!isBackendSession || !profile) return undefined;
    const commit =
      (key: CollectionKey, mutate: (items: Record<string, unknown>[]) => Promise<unknown>) =>
      (nextRows: CollectionRow[]) =>
        mutate(toWireItems(key, nextRows));
    return {
      'family-nominees': [
        {
          key: 'emergency-contacts' as const,
          rows: (profile.emergencyContacts ?? []) as CollectionRow[],
          onCommit: commit('emergency-contacts', (items) =>
            putEmergencyContacts.mutateAsync(items),
          ),
        },
        {
          key: 'family' as const,
          rows: (profile.family ?? []) as CollectionRow[],
          onCommit: commit('family', (items) => putFamily.mutateAsync(items)),
        },
        {
          key: 'nominees' as const,
          rows: (profile.nominees ?? []) as CollectionRow[],
          onCommit: commit('nominees', (items) => putNominees.mutateAsync(items)),
        },
        {
          key: 'guardians' as const,
          rows: (profile.guardians ?? []) as CollectionRow[],
          onCommit: commit('guardians', (items) => putGuardians.mutateAsync(items)),
        },
      ],
      education: [
        {
          key: 'education' as const,
          rows: (profile.education ?? []) as CollectionRow[],
          onCommit: commit('education', (items) => putEducation.mutateAsync(items)),
        },
      ],
      experience: [
        {
          key: 'experience' as const,
          rows: (profile.experience ?? []) as CollectionRow[],
          onCommit: commit('experience', (items) => putExperience.mutateAsync(items)),
        },
      ],
    } as Record<string, { key: CollectionKey; rows: CollectionRow[]; onCommit: (rows: CollectionRow[]) => Promise<unknown> }[]>;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBackendSession, profile]);

  const liveCards = useMemo(
    () => (isBackendSession && profile ? buildLiveSectionCards(profile) : null),
    [isBackendSession, profile],
  );

  // Only one section open at a time. Starts on the first section.
  const [openKey, setOpenKey] = useState<string | null>(PROFILE_SECTIONS[0]?.key ?? null);

  const toggle = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenKey((cur) => (cur === key ? null : key));
  };

  /**
   * Routes a row's new value onto its PATCH slice. Each slice sends the full
   * current slice with the edited field swapped in — the web does the same, so
   * a partial body never wipes sibling fields.
   */
  const onCommit = (item: InfoItem, value: string) => {
    if (!item.field || !profile) return;
    const clean = value === '—' ? '' : value.trim();
    const onError = (error: unknown) => {
      Alert.alert(
        'Could not save',
        error instanceof Error && error.message
          ? error.message
          : 'Please try again in a moment.',
      );
    };

    const [slice, ...path] = item.field.split('.');

    if (slice === 'contact') {
      patchContact.mutate(
        {
          personalEmail: profile.personalEmail,
          mobileNo: profile.mobileNo,
          [path[0]]: clean,
        },
        { onError },
      );
      return;
    }

    if (slice === 'demographics') {
      // The fill-once identity fields are independent of marital status, so
      // they go up on their own — sending the marital pair alongside would
      // rewrite it for no reason.
      if (path[0] !== 'maritalStatus' && path[0] !== 'marriageAnniversaryDate') {
        patchDemographics.mutate(
          {
            [path[0]]:
              path[0] === 'dateOfBirth' ? isoFromDisplay(clean) : clean,
          },
          { onError },
        );
        return;
      }

      const nextStatus =
        path[0] === 'maritalStatus' ? clean : profile.maritalStatus ?? null;
      const married = String(nextStatus ?? '').toLowerCase().startsWith('marri');
      patchDemographics.mutate(
        {
          maritalStatus: nextStatus || null,
          // The anniversary only exists for married employees, as on the web.
          marriageAnniversaryDate: !married
            ? null
            : path[0] === 'marriageAnniversaryDate'
              ? isoFromDisplay(clean)
              : profile.marriageAnniversaryDate ?? null,
        },
        { onError },
      );
      return;
    }

    if (slice === 'address') {
      const [which, key] = path;
      const base: ProfileAddress =
        (which === 'current' ? profile.currentAddress : profile.permanentAddress) ??
        {};
      const nextAddress = { ...base, [key]: clean };
      patchAddress.mutate(
        {
          currentAddress:
            which === 'current' ? nextAddress : profile.currentAddress,
          permanentAddress:
            which === 'permanent' ? nextAddress : profile.permanentAddress,
          sameAsCurrent: profile.sameAsCurrent ?? false,
        },
        { onError },
      );
      return;
    }

    if (slice === 'bank') {
      patchBank.mutate(
        {
          accountHolderName: profile.accountHolderName,
          bankAccountNumber: profile.bankAccountNumber,
          bankName: profile.bankName,
          ifscCode: profile.ifscCode,
          branchNameAddress: profile.branchNameAddress,
          [path[0]]: clean,
        },
        { onError },
      );
    }
  };

  const headerIdentity = isBackendSession
    ? {
        name: profile?.name || user?.name,
        designation: profile?.designation,
        employeeId: profile?.code ?? null,
        email: profile?.workEmail ?? user?.email,
        // Same trio the web's profile hero shows.
        stats: [
          { label: 'Tenure', value: tenureLabel(profile?.dateOfJoining) },
          { label: 'Joined', value: displayDate(profile?.dateOfJoining) },
          { label: 'Type', value: humanizeEnum(profile?.employmentType) },
        ],
        // The employee's own picture wins; the HR-set master photo is the
        // fallback. Neither one means initials, not the sample portrait.
        avatar: photoQuery.data ?? profile?.profilePhoto ?? null,
      }
    : {};

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <BackButton title="View Profile" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader
          {...headerIdentity}
          onEditPhoto={() => setPhotoSheetOpen(true)}
          savingPhoto={savePhoto.isPending}
        />

        {/* All sections in one unified accordion container */}
        <View
          style={cardShadow}
          className="overflow-hidden rounded-[22px] border border-slate-100 bg-white"
        >
          {PROFILE_SECTIONS.map((s, i) => (
            <SectionBlock
              key={s.key}
              section={s}
              open={openKey === s.key}
              onToggle={() => toggle(s.key)}
              first={i === 0}
              cards={liveCards?.[s.key]}
              onCommit={onCommit}
              live={isBackendSession}
              collections={collectionsBySection?.[s.key]}
              headline={
                s.key === 'experience' && isBackendSession
                  ? {
                      label: 'Total years of experience',
                      value: totalExperienceLabel(profile?.experience ?? []),
                    }
                  : null
              }
            />
          ))}
        </View>
      </ScrollView>

      <PhotoPickerSheet
        visible={photoSheetOpen}
        hasPhoto={Boolean(photoQuery.data)}
        onClose={() => setPhotoSheetOpen(false)}
        onPicked={onPickPhoto}
        onCrop={(picked) => {
          setPhotoSheetOpen(false);
          setCropSource(picked);
        }}
      />

      <PhotoCropModal
        source={cropSource}
        onCancel={() => setCropSource(null)}
        onDone={(dataUrl) => {
          setCropSource(null);
          onPickPhoto(dataUrl);
        }}
      />
    </SafeAreaView>
  );
}
