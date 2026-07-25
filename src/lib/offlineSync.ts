import { db } from '../firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

export interface OfflineQueueItem {
  id: string;
  collectionName: string;
  action: 'set' | 'delete' | 'update';
  docId: string;
  data?: any;
  timestamp: number;
}

const OFFLINE_QUEUE_KEY = 'asl_offline_sync_queue';
const LAST_SYNCED_KEY = 'asl_last_synced_timestamp';

export function getOfflineSyncQueue(): OfflineQueueItem[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveOfflineSyncQueue(queue: OfflineQueueItem[]): void {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn("Could not write to offline sync queue in LocalStorage:", e);
  }
}

export function enqueueOfflineItem(
  collectionName: string,
  action: 'set' | 'delete' | 'update',
  docId: string,
  data?: any
): void {
  const queue = getOfflineSyncQueue();
  const id = `${collectionName}_${docId}_${Date.now()}`;
  
  // Replace previous pending actions on the same doc if applicable
  const filtered = queue.filter(item => !(item.collectionName === collectionName && item.docId === docId));
  filtered.push({
    id,
    collectionName,
    action,
    docId,
    data,
    timestamp: Date.now()
  });

  saveOfflineSyncQueue(filtered);
  console.log(`[Offline Sync Queue] Enqueued item for ${collectionName}/${docId} (${action})`);
}

export function clearOfflineSyncQueue(): void {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
}

export function getLastSyncedAt(): string | null {
  return localStorage.getItem(LAST_SYNCED_KEY);
}

export function setLastSyncedAt(): void {
  localStorage.setItem(LAST_SYNCED_KEY, new Date().toISOString());
}

/**
 * Synchronizes all queued local changes and local data with Firestore when online
 */
export async function syncOfflineDataToCloud(
  onProgress?: (syncedCount: number, total: number) => void
): Promise<{ success: boolean; syncedCount: number; errors: number }> {
  if (!navigator.onLine) {
    console.log("Device is offline. Skipping cloud synchronization.");
    return { success: false, syncedCount: 0, errors: 0 };
  }

  const queue = getOfflineSyncQueue();
  let syncedCount = 0;
  let errors = 0;

  // 1. Process explicit offline mutation queue
  if (queue.length > 0) {
    const remainingQueue: OfflineQueueItem[] = [];

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (onProgress) onProgress(syncedCount, queue.length);

      try {
        const docRef = doc(db, item.collectionName, item.docId);
        if (item.action === 'set' || item.action === 'update') {
          await setDoc(docRef, {
            ...item.data,
            syncedFromOffline: true,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } else if (item.action === 'delete') {
          await deleteDoc(docRef);
        }
        syncedCount++;
      } catch (err) {
        console.warn(`Error syncing offline queue item ${item.id}:`, err);
        errors++;
        remainingQueue.push(item);
      }
    }

    saveOfflineSyncQueue(remainingQueue);
  }

  // 2. Also sync local custom gestures to Firestore 'customGestures' collection if authenticated/available
  try {
    const customGesturesRaw = localStorage.getItem('asl_custom_gestures');
    if (customGesturesRaw) {
      const customGestures = JSON.parse(customGesturesRaw);
      if (Array.isArray(customGestures) && customGestures.length > 0) {
        for (const gesture of customGestures) {
          if (gesture.id) {
            try {
              const docRef = doc(db, 'customGestures', gesture.id);
              await setDoc(docRef, {
                ...gesture,
                syncedAt: new Date().toISOString()
              }, { merge: true });
              syncedCount++;
            } catch (e) {
              // Silently ignore or catch permission errors
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("Sync local custom gestures error:", err);
  }

  // 3. Sync translation history to Firestore
  try {
    const historyRaw = localStorage.getItem('asl_translation_history');
    if (historyRaw) {
      const historyItems = JSON.parse(historyRaw);
      if (Array.isArray(historyItems) && historyItems.length > 0) {
        for (const item of historyItems.slice(-25)) { // Sync last 25 items
          if (item.id) {
            try {
              const docRef = doc(db, 'translationHistory', String(item.id));
              await setDoc(docRef, {
                ...item,
                syncedAt: new Date().toISOString()
              }, { merge: true });
            } catch (e) {
              // Ignore individual doc permission issues
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("Sync translation history error:", err);
  }

  setLastSyncedAt();
  console.log(`Cloud sync completed! Synced ${syncedCount} items with ${errors} errors.`);
  return { success: errors === 0, syncedCount, errors };
}
