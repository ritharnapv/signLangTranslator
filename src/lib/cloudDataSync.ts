import { db, auth } from '../firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  onSnapshot, 
  Unsubscribe, 
  serverTimestamp 
} from 'firebase/firestore';

export interface CrossDeviceSyncState {
  isSynced: boolean;
  lastSyncedTimestamp: string | null;
  activeDeviceId: string;
  connectedDevicesCount: number;
  syncErrors: string[];
}

const DEVICE_SESSION_KEY = 'sign_ai_device_session_id';

export function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(DEVICE_SESSION_KEY);
  if (!id) {
    id = `device_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    localStorage.setItem(DEVICE_SESSION_KEY, id);
  }
  return id;
}

/**
 * Registers active device heartbeat in Firestore under users/{userId}/devices/{deviceId}
 */
export async function registerDeviceHeartbeat(userId: string): Promise<void> {
  if (!userId) return;
  const deviceId = getOrCreateDeviceId();
  const ua = navigator.userAgent;

  try {
    const deviceRef = doc(db, 'users', userId, 'devices', deviceId);
    await setDoc(deviceRef, {
      deviceId,
      userAgent: ua,
      lastActive: new Date().toISOString(),
      platform: navigator.platform || 'Unknown',
      online: true,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn("Heartbeat update error:", err);
  }
}

/**
 * Listens in real-time to user profile & settings changes across devices
 */
export function subscribeToUserDataAcrossDevices(
  userId: string,
  onUpdate: (userData: any) => void
): Unsubscribe | null {
  if (!userId) return null;

  try {
    const userDocRef = doc(db, 'users', userId);
    return onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data());
      }
    }, (err) => {
      console.warn("Realtime user sync subscription error:", err);
    });
  } catch (err) {
    console.error("Failed to subscribe to cross-device user sync:", err);
    return null;
  }
}

/**
 * Listens in real-time to user gestures across devices
 */
export function subscribeToUserGesturesAcrossDevices(
  userId: string,
  onGesturesUpdate: (gestures: any[]) => void
): Unsubscribe | null {
  if (!userId) return null;

  try {
    const gesturesColRef = collection(db, 'users', userId, 'gestures');
    return onSnapshot(gesturesColRef, (snapshot) => {
      const gestures: any[] = [];
      snapshot.forEach((docSnap) => {
        gestures.push({ id: docSnap.id, ...docSnap.data() });
      });
      onGesturesUpdate(gestures);
    }, (err) => {
      console.warn("Realtime gestures cross-device sync error:", err);
    });
  } catch (err) {
    console.error("Failed to subscribe to cross-device gestures:", err);
    return null;
  }
}

/**
 * Push user profile or preferences updates securely to Firestore
 */
export async function pushUserSyncDataToCloud(userId: string, data: Record<string, any>): Promise<boolean> {
  if (!userId) return false;

  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      ...data,
      lastSyncedFromDevice: getOrCreateDeviceId(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.error("Error pushing cross-device sync data:", err);
    return false;
  }
}
