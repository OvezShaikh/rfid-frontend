import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid, Box, Alert } from '@mui/material';
// ✅ FIX 1: Only import the functions that actually exist in your api.js
import { updateOwnProfile, updateOwnPassword } from '../services/api';

export default function UserProfileModal({ open, onClose, user, onUpdateSuccess }) {
  const [tab, setTab] = useState(0); // 0 = Profile, 1 = Security
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Profile State (Username only)
  const [username, setUsername] = useState(user?.username || '');

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleProfileSave = async () => {
    if (!username.trim()) return setError('Username cannot be empty.');
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // ✅ FIX 2: Call the correct API function
      const res = await updateOwnProfile({ username }); 
      setSuccess('Username updated successfully!');
      if (onUpdateSuccess) onUpdateSuccess(res.data.user); // Pass the exact updated user from backend
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSave = async () => {
    if (newPassword !== confirmPassword) return setError("New passwords don't match.");
    if (newPassword.length < 6) return setError("Password must be at least 6 characters.");
    
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // ✅ FIX 3: Call the correct API function
      await updateOwnPassword({ currentPassword, newPassword }); 
      setSuccess('Password changed successfully!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>My Account</DialogTitle>
      
      {/* Tab Switcher */}
      <Box sx={{ display: 'flex', borderBottom: '1px solid #EAECF0', px: 3, gap: 3 }}>
        <Button onClick={() => { setTab(0); setError(''); setSuccess(''); }} sx={{ textTransform: 'none', fontWeight: tab === 0 ? 700 : 500, color: tab === 0 ? '#5B5BD6' : '#667085', borderBottom: tab === 0 ? '2px solid #5B5BD6' : 'none', borderRadius: 0, pb: 1 }}>Profile</Button>
        <Button onClick={() => { setTab(1); setError(''); setSuccess(''); }} sx={{ textTransform: 'none', fontWeight: tab === 1 ? 700 : 500, color: tab === 1 ? '#5B5BD6' : '#667085', borderBottom: tab === 1 ? '2px solid #5B5BD6' : 'none', borderRadius: 0, pb: 1 }}>Security</Button>
      </Box>

      <DialogContent sx={{ pt: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {tab === 0 ? (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Username" size="small" value={username} onChange={(e) => setUsername(e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Role" size="small" value={user?.role_name || 'Standard User'} disabled sx={{ bgcolor: '#F9FAFB' }} />
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth type="password" label="Current Password" size="small" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth type="password" label="New Password" size="small" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth type="password" label="Confirm New Password" size="small" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button 
          variant="contained" 
          onClick={tab === 0 ? handleProfileSave : handlePasswordSave} 
          disabled={loading}
          sx={{ bgcolor: '#102A43', textTransform: 'none', '&:hover': { bgcolor: '#1E3A5F' } }}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}