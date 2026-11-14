import React, { useEffect, useState } from 'react';
import {
  Box, Typography, TextField, Button, Alert,
  Accordion, AccordionSummary, AccordionDetails, Chip, Stack,
} from '@mui/material';
import { ExpandMore, Save, Send } from '@mui/icons-material';
import { getEmailTemplates, updateEmailTemplate, testTrigger } from '../services/api';
import { toastSuccess, toastError, toastWarning } from '../utils/alerts';

export default function EmailTemplates() {
  const [templates, setTemplates] = useState([]);
  const [error, setError] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [testingId, setTestingId] = useState(null);

  const load = async () => {
    try {
      const r = await getEmailTemplates();
      setTemplates(r.data);
    } catch (e) { setError(e.response?.data?.error || e.message); }
  };

  useEffect(() => { load(); }, []);

  const update = (id, field, value) =>
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));

  const save = async (tpl) => {
    try {
      await updateEmailTemplate(tpl.id, {
        subject: tpl.subject, body_html: tpl.body_html, body_text: tpl.body_text,
      });
      setSavedId(tpl.id);
      toastSuccess('Template saved', `"${tpl.name}" updated successfully`);
      setTimeout(() => setSavedId(null), 2000);
    } catch (e) {
      toastError('Save failed', e.response?.data?.error || e.message);
    }
  };

  const testSend = async (tpl) => {
    setTestingId(tpl.id);
    try {
      const r = await testTrigger({ event_key: tpl.event_key });
      const data = r.data;

      if (data.sent) {
        toastSuccess(
          'Test email sent',
          `Delivered to ${data.recipients} recipient${data.recipients === 1 ? '' : 's'}. Check the Delivery Log for status.`
        );
      } else if (data.reason === 'no recipients') {
        toastWarning(
          'No recipients configured',
          'Create a group in the "Groups by Location" tab and add at least one email. Or use the "Recipients" tab.'
        );
      } else if (data.reason === 'no template') {
        toastWarning('Template not found', `No active template for "${tpl.event_key}".`);
      } else {
        toastWarning('Test skipped', data.reason || 'Unknown reason');
      }
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      toastError('Test failed', msg);
    } finally {
      setTestingId(null);
    }
  };

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Alert severity="info" sx={{ mb: 2 }}>
        Use <code>{'{{variable}}'}</code> in subject/body for dynamic values.
        <br /><strong>dc_created:</strong> dc_number, from_location, to_location, vehicle_no, driver_name, item_count, created_at
        <br /><strong>dc_received:</strong> dc_number, to_location, item_count, received_at
        <br /><strong>dc_returned:</strong> dc_number, to_location, item_count, returned_at
      </Alert>

      {templates.map((t) => (
        <Accordion key={t.id}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <Chip label={t.event_key} size="small" color="primary" />
              <Typography fontWeight={600}>{t.name}</Typography>
              {savedId === t.id && <Chip label="Saved" size="small" color="success" />}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <TextField label="Subject" fullWidth value={t.subject}
                onChange={(e) => update(t.id, 'subject', e.target.value)} />
              <TextField label="Body (HTML)" fullWidth multiline minRows={6}
                value={t.body_html || ''}
                onChange={(e) => update(t.id, 'body_html', e.target.value)}
                inputProps={{ style: { fontFamily: 'monospace', fontSize: 12 } }} />
              <TextField label="Body (plain text)" fullWidth multiline minRows={3}
                value={t.body_text || ''}
                onChange={(e) => update(t.id, 'body_text', e.target.value)}
                inputProps={{ style: { fontFamily: 'monospace', fontSize: 12 } }} />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" startIcon={<Save />} onClick={() => save(t)}>
                  Save
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Send />}
                  onClick={() => testSend(t)}
                  disabled={testingId === t.id}
                >
                  {testingId === t.id ? 'Sending…' : 'Send test'}
                </Button>
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}