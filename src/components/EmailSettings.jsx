import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Box, TextField, Button, Chip,
  Grid, Alert, Divider, CircularProgress
} from '@mui/material';
import { Email, Send, Save, Warning, CheckCircle } from '@mui/icons-material';
import { getEmailSettings, saveEmailSettings, sendReportEmail } from '../services/api'; // Assume these exist in your api.js

export default function EmailSettings() {
  const [recipients, setRecipients] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: string }
  
  // Mocking the meta data shown in your image
  const [metaData, setMetaData] = useState({
    nextSend: 'Tomorrow at 06:00 (Asia/Kolkata)',
    lastSent: '23 Oct 2026, 09:08',
    lastProblem: 'None'
  });

  // Fetch saved emails on load
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

  // Add an email to the list
  const handleAddEmail = () => {
    const email = newEmail.trim().toLowerCase();
    
    // Basic Regex validation
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

  // Remove an email
  const handleDelete = (emailToDelete) => {
    setRecipients(recipients.filter((email) => email !== emailToDelete));
  };

  // Save settings to DB
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
      // Update last sent time locally
      setMetaData({ ...metaData, lastSent: new Date().toLocaleString() });
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to send email. Check backend logs.' });
      setMetaData({ ...metaData, lastProblem: new Date().toLocaleString() });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ maxWidth: 800, m: 2, boxShadow: 3, borderRadius: 3 }}>
      <CardContent sx={{ p: 4 }}>
        
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Email color="action" />
          <Typography variant="h6" fontWeight="bold">Daily report by email</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Dock TAT: every shipment of the last 24 hours, how long each took, and what is still open. Excel attached.
        </Typography>

        {/* Recipients Input */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 60 }}>Send to</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, flex: 1 }}>
            {recipients.map((email) => (
              <Chip
                key={email}
                label={email}
                onDelete={() => handleDelete(email)}
                color="primary"
                variant="outlined"
                size="small"
              />
            ))}
          </Box>
        </Box>

        {/* Add Input */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, ml: 8 }}>
          <TextField
            size="small"
            placeholder="name@company.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
            sx={{ flex: 1, maxWidth: 400 }}
          />
          <Button variant="outlined" onClick={handleAddEmail}>+ Add</Button>
        </Box>

        {/* Status Alerts */}
        {status && (
          <Alert severity={status.type} sx={{ mb: 3, ml: 8 }} onClose={() => setStatus(null)}>
            {status.message}
          </Alert>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4, ml: 8 }}>
          <Button 
            variant="contained" 
            color="inherit" 
            startIcon={loading ? <CircularProgress size={16} /> : <Save />}
            onClick={handleSave}
            disabled={loading}
            sx={{ bgcolor: '#e0e0e0', color: '#000', '&:hover': { bgcolor: '#d5d5d5' } }}
          >
            Save
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<Send />}
            onClick={handleSendNow}
            disabled={loading}
          >
            Send now
          </Button>
          <Button variant="text" startIcon={<Warning />}>
            Last 24 hours in Excel
          </Button>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Metadata Footer */}
        <Grid container spacing={2} sx={{ ml: 7 }}>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary">NEXT</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
              <Typography variant="body2">{metaData.nextSend}</Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary">LAST SENT</Typography>
            <Typography variant="body2">{metaData.lastSent}</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary">LAST PROBLEM</Typography>
            <Typography variant="body2">{metaData.lastProblem}</Typography>
          </Grid>
        </Grid>

      </CardContent>
    </Card>
  );
}