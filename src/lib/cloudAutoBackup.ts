import { db, auth } from '../firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy, 
  limit, 
  Timestamp 
} from 'firebase/firestore';

export interface AutoBackupSettings {
  enabled: boolean;
  intervalMinutes: number; // e.g. 1, 5, 15, 30, 60
  maxSnapshots: number; // default 10
  backupGestures: boolean;
  backupDatasets: boolean;
  backupHistory: boolean;
  backupSettings: boolean;
  lastBackupTime?: string;
  autoSyncOnAppStart: boolean;
}

export interface BackupItemCounts {
  sessionsCount: number;
  samplesCount: number;
  gesturesCount: number;
  historyCount: number;
  settingsCount: number;
}

export interface CloudBackupSnapshot {
  id: string;
  userId: string;
  userEmail: string;
  createdAt: string;
  timestamp: number;
  deviceName: string;
  browserInfo: string;
  counts: BackupItemCounts;
  data: {
    sessions?: any[];
    samples?: any[];
    gestures?: any[];
    translationHistory?: any[];
    themeSettings?: any;
    userPreferences?: any;
    customDictionary?: any[];
  };
  snapshotSizeKb: number;
  isAutoBackup: boolean;
}

const AUTO_BACKUP_SETTINGS_KEY = 'sign_ai_auto_backup_settings_v1';

export function getLocalAutoBackupSettings(): AutoBackupSettings {
  try {
    const raw = localStorage.getItem(AUTO_BACKUP_SETTINGS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Error reading local auto backup settings:", e);
  }
  return {
    enabled: true,
    intervalMinutes: 5,
    maxSnapshots: 10,
    backupGestures: true,
    backupDatasets: true,
    backupHistory: true,
    backupSettings: true,
    autoSyncOnAppStart: true,
  };
}

export function saveLocalAutoBackupSettings(settings: AutoBackupSettings): void {
  try {
    localStorage.setItem(AUTO_BACKUP_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn("Error saving auto backup settings:", e);
  }
}

export function getDeviceMetadata(): { deviceName: string; browserInfo: string } {
  const ua = navigator.userAgent;
  let deviceName = 'Web Device';
  if (/Macintosh|Mac OS X/.test(ua)) deviceName = 'Mac Desktop';
  else if (/Windows/.test(ua)) deviceName = 'Windows PC';
  else if (/Android/.test(ua)) deviceName = 'Android Device';
  else if (/iPhone|iPad|iPod/.test(ua)) deviceName = 'iOS Mobile Device';
  else if (/Linux/.test(ua)) deviceName = 'Linux Workstation';

  let browserInfo = 'Browser';
  if (ua.includes('Chrome')) browserInfo = 'Google Chrome';
  else if (ua.includes('Safari')) browserInfo = 'Apple Safari';
  else if (ua.includes('Firefox')) browserInfo = 'Mozilla Firefox';
  else if (ua.includes('Edg')) browserInfo = 'Microsoft Edge';

  return { deviceName, browserInfo };
}

/**
 * Creates a cloud backup snapshot in Firestore under users/{userId}/backups/{snapshotId}
 */
export async function createCloudBackupSnapshot(
  userId: string,
  backupData: {
    sessions?: any[];
    samples?: any[];
    gestures?: any[];
    translationHistory?: any[];
    themeSettings?: any;
    userPreferences?: any;
    customDictionary?: any[];
  },
  isAutoBackup: boolean = false
): Promise<CloudBackupSnapshot> {
  if (!userId) {
    throw new Error("Cannot perform cloud backup: User is not authenticated.");
  }

  const { deviceName, browserInfo } = getDeviceMetadata();
  const now = new Date();
  const timestamp = now.getTime();
  const snapshotId = `snapshot_${timestamp}`;
  const userEmail = auth.currentUser?.email || 'authenticated-user@device';

  const counts: BackupItemCounts = {
    sessionsCount: backupData.sessions?.length || 0,
    samplesCount: backupData.samples?.length || 0,
    gesturesCount: backupData.gestures?.length || 0,
    historyCount: backupData.translationHistory?.length || 0,
    settingsCount: backupData.themeSettings ? 1 : 0
  };

  const payloadString = JSON.stringify(backupData);
  const snapshotSizeKb = Math.round((payloadString.length * 2) / 1024 * 10) / 10;

  const snapshot: CloudBackupSnapshot = {
    id: snapshotId,
    userId,
    userEmail,
    createdAt: now.toISOString(),
    timestamp,
    deviceName,
    browserInfo,
    counts,
    data: backupData,
    snapshotSizeKb,
    isAutoBackup
  };

  // 1. Write to snapshot ID doc
  const snapshotRef = doc(db, 'users', userId, 'backups', snapshotId);
  await setDoc(snapshotRef, snapshot, { merge: true });

  // 2. Write to 'latest' alias doc for instant restore
  const latestRef = doc(db, 'users', userId, 'backups', 'latest');
  await setDoc(latestRef, snapshot, { merge: true });

  // 3. Update user profile document with last backup info
  const userProfileRef = doc(db, 'users', userId);
  await setDoc(userProfileRef, {
    lastBackupAt: now.toISOString(),
    lastBackupDevice: `${deviceName} (${browserInfo})`,
    lastBackupSizeKb: snapshotSizeKb,
    updatedAt: now.toISOString()
  }, { merge: true });

  // 4. Update local settings lastBackupTime
  const localSettings = getLocalAutoBackupSettings();
  saveLocalAutoBackupSettings({
    ...localSettings,
    lastBackupTime: now.toISOString()
  });

  return snapshot;
}

/**
 * Lists all available backup snapshots for the current user in Firestore
 */
export async function listCloudBackupSnapshots(userId: string): Promise<CloudBackupSnapshot[]> {
  if (!userId) return [];

  try {
    const backupsColRef = collection(db, 'users', userId, 'backups');
    const q = query(backupsColRef, orderBy('timestamp', 'desc'), limit(20));
    const querySnapshot = await getDocs(q);

    const snapshots: CloudBackupSnapshot[] = [];
    querySnapshot.forEach((docSnap) => {
      if (docSnap.id === 'latest') return; // skip alias
      const d = docSnap.data() as CloudBackupSnapshot;
      if (d && d.timestamp) {
        snapshots.push(d);
      }
    });

    return snapshots.sort((a, b) => b.timestamp - a.timestamp);
  } catch (err) {
    console.warn("Failed to list cloud backup snapshots:", err);
    return [];
  }
}

/**
 * Fetches a single cloud backup snapshot by ID (or 'latest')
 */
export async function getCloudBackupSnapshot(userId: string, snapshotId: string = 'latest'): Promise<CloudBackupSnapshot | null> {
  if (!userId) return null;

  try {
    const snapshotRef = doc(db, 'users', userId, 'backups', snapshotId);
    const docSnap = await getDoc(snapshotRef);
    if (docSnap.exists()) {
      return docSnap.data() as CloudBackupSnapshot;
    }
    return null;
  } catch (err) {
    console.error("Error fetching backup snapshot:", err);
    return null;
  }
}

/**
 * Deletes a single backup snapshot from cloud storage
 */
export async function deleteCloudBackupSnapshot(userId: string, snapshotId: string): Promise<boolean> {
  if (!userId || snapshotId === 'latest') return false;

  try {
    const snapshotRef = doc(db, 'users', userId, 'backups', snapshotId);
    await deleteDoc(snapshotRef);
    return true;
  } catch (err) {
    console.error("Error deleting backup snapshot:", err);
    return false;
  }
}
