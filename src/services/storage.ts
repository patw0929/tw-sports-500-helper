import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

import { UserProfile } from '@/types/sports500';

const PROFILES_KEY = 'sports500_profiles_v2';
const ACTIVE_PROFILE_KEY = 'sports500_active_profile_id_v2';
const BIOMETRIC_KEY = 'sports500_biometric_enabled_v2';

// In-memory fallback for environments where persistent storage fails
let memoryStorage: Record<string, string> = {};

async function setStorageItem(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (err) {
    console.warn(`SecureStore write failed for ${key}, falling back to memory:`, err);
    memoryStorage[key] = value;
  }
}

async function getStorageItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (err) {
    console.warn(`SecureStore read failed for ${key}, falling back to memory:`, err);
    return memoryStorage[key] || null;
  }
}

export async function getProfiles(): Promise<UserProfile[]> {
  try {
    const raw = await getStorageItem(PROFILES_KEY);
    if (!raw) return [];
    const list: UserProfile[] = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.error('Failed to parse profiles:', e);
    return [];
  }
}

export async function saveProfile(
  data: Omit<UserProfile, 'id' | 'createdAt'>,
  existingId?: string
): Promise<UserProfile> {
  const currentList = await getProfiles();
  const id = existingId || `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const now = Date.now();

  const newProfile: UserProfile = {
    ...data,
    id,
    createdAt: now,
  };

  let updatedList: UserProfile[];
  if (existingId) {
    updatedList = currentList.map((p) => (p.id === existingId ? newProfile : p));
  } else {
    // If first profile, make it default automatically
    if (currentList.length === 0) {
      newProfile.isDefault = true;
    }
    updatedList = [...currentList, newProfile];
  }

  // If this profile is default, un-default others
  if (newProfile.isDefault) {
    updatedList = updatedList.map((p) => (p.id === id ? p : { ...p, isDefault: false }));
    await setStorageItem(ACTIVE_PROFILE_KEY, id);
  }

  await setStorageItem(PROFILES_KEY, JSON.stringify(updatedList));
  return newProfile;
}

export async function deleteProfile(id: string): Promise<void> {
  const currentList = await getProfiles();
  const updatedList = currentList.filter((p) => p.id !== id);

  const activeId = await getStorageItem(ACTIVE_PROFILE_KEY);
  if (activeId === id) {
    const nextDefault = updatedList[0];
    if (nextDefault) {
      nextDefault.isDefault = true;
      await setStorageItem(ACTIVE_PROFILE_KEY, nextDefault.id);
    } else {
      await setStorageItem(ACTIVE_PROFILE_KEY, '');
    }
  }

  await setStorageItem(PROFILES_KEY, JSON.stringify(updatedList));
}

export async function getActiveProfile(): Promise<UserProfile | null> {
  const profiles = await getProfiles();
  if (profiles.length === 0) return null;

  const activeId = await getStorageItem(ACTIVE_PROFILE_KEY);
  if (activeId) {
    const found = profiles.find((p) => p.id === activeId);
    if (found) return found;
  }

  const defaultProfile = profiles.find((p) => p.isDefault);
  if (defaultProfile) return defaultProfile;

  return profiles[0];
}

export async function setActiveProfile(id: string): Promise<void> {
  await setStorageItem(ACTIVE_PROFILE_KEY, id);
  const profiles = await getProfiles();
  const updated = profiles.map((p) => ({ ...p, isDefault: p.id === id }));
  await setStorageItem(PROFILES_KEY, JSON.stringify(updated));
}

export interface BiometricsSupportInfo {
  isAvailable: boolean;
  hasHardware: boolean;
  isEnrolled: boolean;
  label: string;
  icon: 'scan-outline' | 'finger-print';
}

export async function checkBiometricsSupport(): Promise<BiometricsSupportInfo> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    let label = '生物辨識保護';
    let icon: 'scan-outline' | 'finger-print' = 'finger-print';

    if (hasHardware) {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const isFace = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
      const isFingerprint = types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);

      if (isFace && !isFingerprint) {
        label = 'Face ID 保護';
        icon = 'scan-outline';
      } else if (isFingerprint && !isFace) {
        label = '指紋辨識保護';
        icon = 'finger-print';
      } else {
        label = '生物辨識保護 (Face ID / 指紋)';
        icon = 'finger-print';
      }
    }

    return {
      isAvailable: Boolean(hasHardware && isEnrolled),
      hasHardware: Boolean(hasHardware),
      isEnrolled: Boolean(isEnrolled),
      label,
      icon,
    };
  } catch (err) {
    console.warn('Check biometrics support error:', err);
    return {
      isAvailable: false,
      hasHardware: false,
      isEnrolled: false,
      label: '生物辨識保護',
      icon: 'finger-print',
    };
  }
}

export async function isBiometricsEnabled(): Promise<boolean> {
  const flag = await getStorageItem(BIOMETRIC_KEY);
  return flag === 'true';
}

export async function setBiometricsEnabled(enabled: boolean): Promise<void> {
  await setStorageItem(BIOMETRIC_KEY, enabled ? 'true' : 'false');
}

export async function authenticateBiometrics(promptMessage = '請驗證身分以解鎖加碼券個資'): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      return true; // If device has no biometrics, allow access
    }

    const res = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: '取消',
      disableDeviceFallback: false,
    });

    return res.success;
  } catch (err) {
    console.warn('Biometric auth error:', err);
    return false;
  }
}
