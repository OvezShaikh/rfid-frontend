import Dexie from 'dexie';

export const db = new Dexie('UnostarOfflineDB');

db.version(1).stores({
  pendingScans: '++id, action_type, payload, client_timestamp' 
});

export const queueScan = async (action_type, payload) => {
  try {
    await db.pendingScans.add({
      action_type,
      payload,
      client_timestamp: new Date().toISOString()
    });
    console.log('Scan queued offline successfully.');
  } catch (err) {
    console.error('Failed to queue scan:', err);
  }
};

// ✅ Sync function - imports api dynamically to avoid circular dependency
export const syncOfflineScans = async () => {
  if (!navigator.onLine) return;

  try {
    const pending = await db.pendingScans.toArray();
    if (pending.length === 0) return;

    console.log(`Syncing ${pending.length} offline scans...`);
    
    // ✅ Dynamic import to prevent circular dependencies at module load
    const { unifiedScan, bulkReceive, bulkReturn } = await import('./api');

    for (const scan of pending) {
      try {
        if (scan.action_type === 'UNIFIED' || scan.action_type === 'DISPATCH') {
          await unifiedScan(scan.payload);
        } else if (scan.action_type === 'RECEIVE') {
          await bulkReceive(scan.payload);
        } else if (scan.action_type === 'RETURN') {
          await bulkReturn(scan.payload);
        }
        
        // ✅ Delete from queue once synced successfully
        await db.pendingScans.delete(scan.id);
        console.log(`✅ Synced scan ID ${scan.id}`);
      } catch (err) {
        console.error(`❌ Failed to sync scan ID ${scan.id}:`, err.response?.data?.error || err.message);
        // If it's a permanent error (400 - bad data), delete it so it doesn't block the queue forever
        if (err.response?.status === 400) {
          await db.pendingScans.delete(scan.id);
        }
      }
    }
  } catch (error) {
    console.error("Error during offline sync:", error);
  }
};