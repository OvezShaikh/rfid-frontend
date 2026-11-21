import Dexie from 'dexie';

export const db = new Dexie('UnostarOfflineDB');

db.version(1).stores({
  pendingScans: '++id, action_type, payload, client_timestamp'
});

db.version(2).stores({
  pendingScans: '++id, action_type, client_timestamp, status',
  failedScans: '++id, action_type, client_timestamp, failed_at'
}).upgrade(async (tx) => {
  await tx.table('pendingScans').toCollection().modify((scan) => {
    scan.status = scan.status || 'pending';
  });
});

export const queueScan = async (action_type, payload) => {
  try {
    await db.pendingScans.add({
      action_type,
      payload,
      status: 'pending',
      attempts: 0,
      client_timestamp: new Date().toISOString()
    });
    return true;
  } catch (err) {
    console.error('Failed to queue scan:', err);
    throw err;
  }
};

// Failed scans are retained for inspection/recovery instead of being silently discarded.
export const getFailedScans = () => db.failedScans.orderBy('failed_at').reverse().toArray();

export const syncOfflineScans = async () => {
  if (!navigator.onLine) return;

  try {
    const pending = await db.pendingScans.where('status').equals('pending').sortBy('id');
    if (pending.length === 0) return;

    const { unifiedScan, bulkReceive, bulkReturn } = await import('./api');

    for (const scan of pending) {
      try {
        if (scan.action_type === 'UNIFIED' || scan.action_type === 'DISPATCH') {
          await unifiedScan(scan.payload);
        } else if (scan.action_type === 'RECEIVE') {
          await bulkReceive(scan.payload);
        } else if (scan.action_type === 'RETURN') {
          await bulkReturn(scan.payload);
        } else {
          throw Object.assign(new Error('Unsupported offline scan action'), {
            response: { status: 400, data: { error: 'Unsupported offline scan action' } }
          });
        }

        await db.pendingScans.delete(scan.id);
      } catch (err) {
        const status = err.response?.status;
        const permanentFailure = [400, 404, 409, 422].includes(status);

        if (permanentFailure) {
          await db.transaction('rw', db.pendingScans, db.failedScans, async () => {
            await db.failedScans.add({
              ...scan,
              failed_at: new Date().toISOString(),
              failure_status: status,
              failure_reason: err.response?.data?.error || err.message || 'Scan rejected by server'
            });
            await db.pendingScans.delete(scan.id);
          });
        } else {
          // Network/server/authentication failures remain queued for a later retry.
          await db.pendingScans.update(scan.id, {
            attempts: (scan.attempts || 0) + 1,
            last_attempt_at: new Date().toISOString(),
            last_error: err.response?.data?.error || err.message || 'Temporary sync failure'
          });
        }
      }
    }
  } catch (error) {
    console.error('Error during offline sync:', error);
  }
};
