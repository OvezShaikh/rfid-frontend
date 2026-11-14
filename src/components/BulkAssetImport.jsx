import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box,
  Typography, Alert, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, TextField, Stack, Divider, Paper, IconButton, LinearProgress,
} from '@mui/material';
import { CloudUpload, Download, PlayArrow, CheckCircle, Close } from '@mui/icons-material';
import { bulkCreateAssets, getLocations } from '../services/api';

const ASSET_TYPES = ['Pallet', 'Sleeve', 'Lid', 'Insert', 'Layer Pad'];
const TYPE_PREFIX = { Pallet: 'PAL', Sleeve: 'SLE', Lid: 'LID', Insert: 'INS', 'Layer Pad': 'PAD' };

const pad = (n, w) => String(n).padStart(w, '0');

const parseCSV = (text) => {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith('#'));
  if (!lines.length) return [];
  const header = lines[0].split(',').map((s) => s.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = line.split(',').map((s) => s.trim());
    const row = {};
    header.forEach((h, i) => { row[h] = cells[i] || ''; });
    return row;
  });
};

export default function BulkAssetImport({ open, onClose, onImported }) {
  const [step, setStep] = useState('pick');           // pick | review | done
  const [locations, setLocations] = useState([]);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    getLocations()
      .then((r) => setLocations(r.data))
      .catch((e) => setError(e.response?.data?.error || e.message));
  }, [open]);

  const defaultLocId = locations[0]?.id || '';

  const validateAndSet = (list) => {
    const seenTag = new Set();
    const seenId = new Set();
    const checked = list.map((r) => {
      const errs = [];
      if (!r.asset_id) errs.push('asset_id required');
      if (!r.type) errs.push('type required');
      if (r.type && !ASSET_TYPES.includes(r.type)) errs.push(`type must be one of ${ASSET_TYPES.join(', ')}`);
      if (!r.rfid_tag_id) errs.push('rfid_tag_id required');
      if (!r.location_id) errs.push('location_id required');
      if (r.asset_id && r.type && TYPE_PREFIX[r.type] && !r.asset_id.startsWith(TYPE_PREFIX[r.type] + '-')) {
        errs.push(`asset_id should start with ${TYPE_PREFIX[r.type]}-`);
      }
      if (r.rfid_tag_id && seenTag.has(r.rfid_tag_id)) errs.push('duplicate rfid_tag_id in file');
      if (r.asset_id && seenId.has(r.asset_id)) errs.push('duplicate asset_id in file');
      if (r.rfid_tag_id) seenTag.add(r.rfid_tag_id);
      if (r.asset_id) seenId.add(r.asset_id);
      return { ...r, _errors: errs };
    });
    setRows(checked);
    setStep('review');
  };

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = parseCSV(ev.target.result).map((r, i) => ({
          _row: i + 2,
          asset_id: r.asset_id || '',
          type: r.type || '',
          rfid_tag_id: r.rfid_tag_id || '',
          location_id: r.location_id || defaultLocId,
          status: r.status || 'available',
          color: r.color || '',
          notes: r.notes || '',
        }));
        validateAndSet(parsed);
        setError(null);
      } catch (err) {
        setError('CSV parse failed: ' + err.message);
      }
    };
    reader.readAsText(f);
    e.target.value = '';
  };

  const downloadTemplate = () => {
    const header = 'asset_id,type,rfid_tag_id,location_id,status,color,notes';
    const sample = ASSET_TYPES.map((t, i) => {
      const n = pad(i + 1, 6);
      const tag = t === 'Pallet' ? `A${pad(i + 1, 11)}` : `CT${pad(i + 1, 11)}`;
      return `${TYPE_PREFIX[t]}-${n},${t},${tag},${defaultLocId},available,,`;
    });
    const blob = new Blob([[header, ...sample].join('\n') + '\n'], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'assets-import-template.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const generateTest = (perType) => {
    const out = [];
    let serial = 1;
    ASSET_TYPES.forEach((type) => {
      for (let i = 0; i < perType; i++) {
        const tag = type === 'Pallet' ? `A${pad(serial, 11)}` : `CT${pad(serial, 11)}`;
        out.push({
          _row: out.length + 2,
          asset_id: `${TYPE_PREFIX[type]}-${pad(serial, 6)}`,
          type,
          rfid_tag_id: tag,
          location_id: defaultLocId,
          status: 'available',
          color: '',
          notes: `test ${type}`,
        });
        serial++;
      }
    });
    validateAndSet(out);
  };

  const submit = async () => {
    if (rows.some((r) => r._errors.length)) return;
    setBusy(true);
    setError(null);
    try {
      const payload = rows.map(({ _row, _errors, ...clean }) => clean);
      const res = await bulkCreateAssets(payload);
      onImported?.(res.data);
      setStep('done');
    } catch (e) {
      const data = e.response?.data;
      setError(
        data?.details?.length
          ? `${data.error}\n${data.details.join('\n')}`
          : (data?.error || e.message)
      );
    } finally {
      setBusy(false);
    }
  };

  const reset = () => { setStep('pick'); setRows([]); setError(null); };
  const close = () => { reset(); onClose(); };
  const invalid = rows.filter((r) => r._errors.length).length;

  return (
    <Dialog open={open} maxWidth="lg" fullWidth onClose={busy ? undefined : close}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Bulk Register Assets
        <IconButton size="small" onClick={close} disabled={busy}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
            {error}
          </Alert>
        )}

        {step === 'pick' && (
          <Stack spacing={2}>
            <Alert severity="info" sx={{ fontSize: 13 }}>
              The <b>type</b> column is required — a paper tag like <code>CT…</code> cannot tell
              the system on its own whether it is a Lid, Insert, Sleeve or Layer Pad.
            </Alert>

            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Columns</Typography>
              <Typography component="code" sx={{ fontSize: 12 }}>
                asset_id, type, rfid_tag_id, location_id, status, color, notes
              </Typography>
            </Paper>

            <Stack direction="row" spacing={1}>
              <Button variant="outlined" startIcon={<Download />} onClick={downloadTemplate}>
                Download template
              </Button>
              <Button variant="contained" component="label" startIcon={<CloudUpload />}>
                Upload CSV
                <input type="file" accept=".csv,text/csv" hidden onChange={handleFile} />
              </Button>
            </Stack>

            <Divider>or generate test data</Divider>

            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                id="bulk-gen-count"
                size="small"
                type="number"
                label="rows per type"
                defaultValue={25}
                inputProps={{ min: 1 }}
                sx={{ width: 160 }}
              />
              <Button
                variant="outlined"
                startIcon={<PlayArrow />}
                onClick={() =>
                  generateTest(
                    Math.max(1, parseInt(document.getElementById('bulk-gen-count').value, 10) || 1)
                  )
                }
              >
                Generate
              </Button>
            </Stack>

            <Typography variant="caption" color="text.secondary">
              {locations.length} location(s) available. Will insert {ASSET_TYPES.length} types × N rows.
            </Typography>
          </Stack>
        )}

        {step === 'review' && (
          <>
            <Alert severity={invalid ? 'warning' : 'success'} sx={{ mb: 2 }}>
              {invalid
                ? `${invalid} of ${rows.length} row(s) have issues. Fix before importing.`
                : `${rows.length} row(s) ready.`}
            </Alert>

            <Box sx={{ maxHeight: 420, overflow: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Asset ID</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>RFID tag</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Issues</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={i} sx={{ bgcolor: r._errors.length ? '#FEF3F2' : undefined }}>
                      <TableCell>{r._row}</TableCell>
                      <TableCell>{r.asset_id || '—'}</TableCell>
                      <TableCell>
                        {r.type ? <Chip size="small" label={r.type} /> : <Chip size="small" color="error" label="?" />}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>
                        {r.rfid_tag_id || '—'}
                      </TableCell>
                      <TableCell>{r.status}</TableCell>
                      <TableCell>
                        {r._errors.length
                          ? r._errors.join('; ')
                          : <CheckCircle color="success" fontSize="small" />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>

            {busy && <LinearProgress sx={{ mt: 2 }} />}
          </>
        )}

        {step === 'done' && (
          <Alert severity="success">
            Imported {rows.length} asset(s). Close this dialog and refresh to see them.
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={close} disabled={busy}>Close</Button>
        {step === 'review' && (
          <Button variant="contained" onClick={submit} disabled={busy || invalid > 0}>
            {busy ? 'Importing…' : `Import ${rows.length} row(s)`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}