import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  readPhotoPreference,
  writePhotoPreference,
  type PhotoPreference,
} from '../components/profile/photoPreference';
import { api } from './client';

/**
 * Profile photo, stored exactly the way the web's employee header stores it:
 * a user preference holding a cropped data URL, under the same key. Keeping
 * the key and the value shape identical means a photo set on either product
 * shows up on the other.
 *
 * (The employee master's own `profilePhoto` field is HR-owned — that is the
 * photo HR sets from the employee modal. This preference is the employee's
 * own picture, which is what their avatar's camera button edits.)
 *
 * The asymmetric read/write shapes live in photoPreference.ts.
 */

const PREFERENCE_KEY = 'employee.profile.photo';

export const profilePhotoKeys = {
  mine: () => ['user-preferences', PREFERENCE_KEY] as const,
};

const path = () => `/user-preferences/${encodeURIComponent(PREFERENCE_KEY)}`;

export function useProfilePhoto(enabled = true) {
  return useQuery({
    queryKey: profilePhotoKeys.mine(),
    queryFn: async ({ signal }) =>
      readPhotoPreference(await api.get<PhotoPreference>(path(), { signal })),
    staleTime: 5 * 60_000,
    enabled,
  });
}

export function useSaveProfilePhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dataUrl: string | null) =>
      api.put(path(), writePhotoPreference(dataUrl)),
    onSuccess: (_result, dataUrl) => {
      // Paint the new photo immediately; the refetch only confirms it.
      queryClient.setQueryData(profilePhotoKeys.mine(), dataUrl);
      queryClient.invalidateQueries({ queryKey: profilePhotoKeys.mine() });
    },
  });
}
