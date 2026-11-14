import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, CardContent, Typography, Table, TableHead, TableRow, TableCell,
  TableBody, Chip, Box, Tooltip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, Divider, Stack, Alert,
} from '@mui/material';
import {
  Visibility, Close, ContentCopy, Refresh,
} from '@mui/icons-material';
import { getEmailLog, retryEmail } from '../services/api';
import { toastSuccess, toastError } from '../utils/alerts';

const statusChip = (s) => {
  const map = { sent: 'success', failed: 'error', pending: 'warning' };
  return <Chip label={s} size="small" color={map[s] || 'default'} sx={{ fontWeight: 600 }} />;
};

const eventChip = (k) => {
  if (!k) return <Chip label="—" size="small" />;
  const map = { dc_created: 'primary', dc_received: 'info', dc_returned: 'warning' };
  return <Chip label={k} size="small" color={map[k] || 'default'} variant="outlined" />;
};

const compactRecipients = (recipients) => {
  if (!recipients) return '—';
  const list = String(recipients).split(',').map((e) => e.trim()).filter(Boolean);
  if (list.length === 0) return '—';
  if (list.length <= 2) return list.join(', ');
  return `${list[0]} +${list.length - 1} more`;
};

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).catch(() => {});
};

// ── 1. Moved DetailDialog OUTSIDE the main component ──
const DetailDialog = ({ selected, onClose, onRetrySuccess }) => {
  if (!selected) return null;

  const recipientsList = String(selected.recipients || '')
    .split(',').map((e) => e.trim()).filter(Boolean);

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Email #{selected.id}</Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(selected.created_at).toLocaleString('en-IN')}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          {/* Status + event */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            {statusChip(selected.status)}
            {eventChip(selected.event_key)}
            {selected.sent_at && (
              <Typography variant="caption" color="text.secondary">
                Sent at: {new Date(selected.sent_at).toLocaleString('en-IN')}
              </Typography>
            )}
          </Box>

          {/* Subject */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Subject
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="body2" sx={{ wordBreak: 'break-word', flex: 1 }}>
                {selected.subject || '—'}
              </Typography>
              <IconButton size="small" onClick={() => copyToClipboard(selected.subject || '')}>
                <ContentCopy sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          </Box>

          {/* Recipients */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Recipients ({recipientsList.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
              {recipientsList.length === 0 && (
                <Typography variant="body2" color="text.secondary">None</Typography>
              )}
              {recipientsList.map((e, i) => (
                <Chip
                  key={i}
                  label={e}
                  size="small"
                  onClick={() => copyToClipboard(e)}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Box>

          {/* Error message */}
          {selected.error_message && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Error
              </Typography>
              <Alert severity="error" sx={{ mt: 0.5, fontSize: 12, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {selected.error_message}
              </Alert>
            </Box>
          )}

          {/* Message ID */}
          {selected.message_id && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Message ID
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', flex: 1 }}>
                  {selected.message_id}
                </Typography>
                <IconButton size="small" onClick={() => copyToClipboard(selected.message_id)}>
                  <ContentCopy sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            </Box>
          )}

          {/* Context */}
          {selected.context && Object.keys(selected.context).length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Context (trigger data)
              </Typography>
              <Box
                component="pre"
                sx={{
                  mt: 0.5, p: 1.5, borderRadius: 1, bgcolor: '#F9FAFB',
                  fontSize: 11, fontFamily: 'monospace', overflow: 'auto',
                  maxHeight: 240, m: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                }}
              >
                {JSON.stringify(selected.context, null, 2)}
              </Box>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        {selected.status === 'failed' && (
          <Button
            startIcon={<Refresh />}
            onClick={async () => {
              try {
                const r = await retryEmail(selected.id);
                if (r.data.sent) {
                  toastSuccess('Retry succeeded', `Sent to ${r.data.recipients} recipient(s)`);
                  onClose(); // Close dialog
                  onRetrySuccess(); // Refresh the table
                } else {
                  toastError('Retry failed', r.data.error || r.data.reason || 'Unknown error');
                }
              } catch (e) {
                toastError('Retry failed', e.response?.data?.error || e.message);
              }
            }}
          >
            Retry
          </Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// ── 2. Main Component ──
export default function EmailLog() {
  const [rows, setRows] = useState([]);
  const [selectedId, setSelectedId] = useState(null); // Store ID instead of object
  const [refreshing, setRefreshing] = useState(false);

  // Find the live row data based on the selected ID
  const selectedRow = rows.find((r) => r.id === selectedId) || null;

  const fetchLogs = useCallback((silent = false) => {
    if (!silent) setRefreshing(true);
    getEmailLog({ limit: 100 })
      .then((r) => setRows(r.data))
      .catch(() => {})
      .finally(() => {
        if (!silent) setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    fetchLogs();
    // 3. Pause auto-refresh if a dialog is open to prevent any background re-render issues
    const t = setInterval(() => {
      if (!selectedId) {
        fetchLogs(true); // silent background fetch
      }
    }, 15000);
    return () => clearInterval(t);
  }, [fetchLogs, selectedId]);

  return (
    <>
      <Card variant="outlined">
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography fontWeight={700}>Recent Sends</Typography>
              <Typography variant="caption" color="text.secondary">
                Auto-refresh every 15s · Click a row for details
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => fetchLogs(false)} disabled={refreshing}>
              <Refresh fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ '& tbody tr': { cursor: 'pointer', '&:hover': { bgcolor: '#F9FAFB' } } }}>
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Event</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Recipients</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => {
                  const recipientCount = String(r.recipients || '').split(',').filter(Boolean).length;
                  return (
                    <TableRow key={r.id} onClick={() => setSelectedId(r.id)}>
                      <TableCell sx={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                        {new Date(r.created_at).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>{eventChip(r.event_key)}</TableCell>
                      <TableCell sx={{ fontSize: 12, maxWidth: 280 }}>
                        <Tooltip title={r.subject || ''}>
                          <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.subject || '—'}
                          </Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="caption" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                            {compactRecipients(r.recipients)}
                          </Typography>
                          {recipientCount > 2 && (
                            <Chip label={recipientCount} size="small" sx={{ height: 18, fontSize: 10 }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {r.status === 'failed' && r.error_message ? (
                          <Tooltip title={r.error_message}>{statusChip(r.status)}</Tooltip>
                        ) : statusChip(r.status)}
                      </TableCell>
                      <TableCell align="right" sx={{ py: 0 }}>
                        <IconButton size="small">
                          <Visibility sx={{ fontSize: 16 }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                      No emails sent yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>

      <DetailDialog 
        selected={selectedRow} 
        onClose={() => setSelectedId(null)} 
        onRetrySuccess={() => fetchLogs(false)} 
      />
    </>
  );
}