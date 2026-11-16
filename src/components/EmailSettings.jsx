import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Box, TextField, Button, Chip,
  Grid, Alert, Divider, CircularProgress, Stack
} from '@mui/material';
import { Email, Send, Save, Warning, CheckCircle } from '@mui/icons-material';
import { getEmailSettings, saveEmailSettings, sendReportEmail } from '../services/api';

export default function EmailSettings() {
  const [recipients, setRecipients] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [metaData, setMetaData] = useState({
    nextSend: 'Tomorrow at 06:00 (Asia/Kolkata)',
    lastSent: '23 Oct 2026, 09:08',
    lastProblem: 'None'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await getEmailSettings();
        setRecipients(res.data.recipients || []);
        setMetaData(res.data.meta || metaData);
      } catch (err) {
        console.error('Failed to load email settings');
      }
    };
    fetchSettings();
  }, []);

  const handleAddEmail = () => {
    const email = newEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }
    if (recipients.includes(email)) {
      setStatus({ type: 'error', message: 'Email already in the list.' });
      return;
    }
    setRecipients([...recipients, email]);
    setNewEmail('');
    setStatus(null);
  };

  const handleDelete = (emailToDelete) => {
    setRecipients(recipients.filter((email) => email !== emailToDelete));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await saveEmailSettings({ recipients });
      setStatus({ type: 'success', message: 'Recipients list saved successfully.' });
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to save settings.' });
    } finally {
      setLoading(false);
    }
  };

  // Trigger manual send
  const handleSendNow = async () => {
    if (recipients.length === 0) {
      setStatus({ type: 'error', message: 'Add at least one recipient first.' });
      return;
    }
    setLoading(true);
    try {
      await sendReportEmail({ recipients });
      setStatus({ type: 'success', message: `Test email sent to ${recipients.length} recipient(s)!` });
      setMetaData({ ...metaData, lastSent: new Date().toLocaleString() });
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to send email. Check backend logs.' });
      setMetaData({ ...metaData, lastProblem: new Date().toLocaleString() });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{
      maxWidth: 800,
      width: '100%',
      m: { xs: 1, sm: 2 },
      boxShadow: 3,
      borderRadius: 3
    }}>
      <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>

        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Email color="action" />
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, lineHeight: 1.3 }}
          >
            Daily report by email
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Dock TAT: every shipment of the last 24 hours, how long each took, and what is still open. Excel attached.
        </Typography>

        {/* Recipients label + chips */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: { xs: 1, sm: 2 },
          mb: 2
        }}>
          <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 60 }}>
            Send to
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, flex: 1 }}>
            {recipients.map((email) => (
              <Chip
                key={email}
                label={email}
                onDelete={() => handleDelete(email)}
                color="primary"
                variant="outlined"
                size="small"
                sx={{ maxWidth: '100%' }}
              />
            ))}
          </Box>
        </Box>

        {/* Add input */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <TextField
            size="small"
            placeholder="name@company.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
            sx={{ flex: 1, maxWidth: { sm: 400 } }}
            fullWidth
          />
          <Button
            variant="outlined"
            onClick={handleAddEmail}
            sx={{ whiteSpace: 'nowrap', alignSelf: { xs: 'stretch', sm: 'auto' } }}
          >
            + Add
          </Button>
        </Stack>

        {/* Status */}
        {status && (
          <Alert severity={status.type} sx={{ mb: 3 }} onClose={() => setStatus(null)}>
            {status.message}
          </Alert>
        )}

        {/* Action buttons */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ mb: 4 }}
        >
          <Button
            variant="contained"
            color="inherit"
            startIcon={loading ? <CircularProgress size={16} /> : <Save />}
            onClick={handleSave}
            disabled={loading}
            sx={{
              bgcolor: '#e0e0e0', color: '#000',
              '&:hover': { bgcolor: '#d5d5d5' },
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            Save
          </Button>
          <Button
            variant="outlined"
            startIcon={<Send />}
            onClick={handleSendNow}
            disabled={loading}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Send now
          </Button>
          <Button
            variant="text"
            startIcon={<Warning />}
            sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'flex-start', sm: 'center' } }}
          >
            Last 24 hours in Excel
          </Button>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {/* Metadata footer */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography variant="caption" color="text.secondary">NEXT</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
              <Typography variant="body2">{metaData.nextSend}</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="caption" color="text.secondary">LAST SENT</Typography>
            <Typography variant="body2">{metaData.lastSent}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="caption" color="text.secondary">LAST PROBLEM</Typography>
            <Typography variant="body2">{metaData.lastProblem}</Typography>
          </Grid>
        </Grid>

      </CardContent>
    </Card>
  );
}