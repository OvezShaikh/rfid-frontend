import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Stack,
  Select, MenuItem, FormControl, InputLabel, Chip, IconButton, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider, Grid,
} from '@mui/material';
import { Add, Delete, Group as GroupIcon, Place } from '@mui/icons-material';
import { toastSuccess, toastError, dangerConfirm } from '../utils/alerts';
import {
  getEmailGroups, createEmailGroup, deleteEmailGroup,
  addEmailGroupMember, removeEmailGroupMember, getLocations,
} from '../services/api';

export default function EmailGroups() {
  const [groups, setGroups] = useState([]);
  const [locations, setLocations] = useState([]);
  const [error, setError] = useState(null);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({ name: '', location_id: '' });
  const [memberInput, setMemberInput] = useState({});

  const load = async () => {
    try {
      const [g, l] = await Promise.all([getEmailGroups(), getLocations()]);
      setGroups(g.data);
      setLocations(l.data);
    } catch (e) { setError(e.response?.data?.error || e.message); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
  if (!form.name) return;
  try {
    await createEmailGroup({ name: form.name, location_id: form.location_id || null });
    setDialog(false);
    setForm({ name: '', location_id: '' });
    toastSuccess('Group created', `"${form.name}" is ready.`);
    load();
  } catch (e) { toastError('Create failed', e.response?.data?.error || e.message); }
};

const handleAddMember = async (groupId) => {
  const email = (memberInput[groupId] || '').trim();
  if (!email) return;
  try {
    await addEmailGroupMember(groupId, { email });
    setMemberInput({ ...memberInput, [groupId]: '' });
    toastSuccess('Member added', email);
    load();
  } catch (e) { toastError('Could not add member', e.response?.data?.error || e.message); }
};

  const handleRemoveMember = async (groupId, email) => {
    await removeEmailGroupMember(groupId, email);
    load();
  };

  const handleDeleteGroup = async (group) => {
  const { isConfirmed } = await dangerConfirm(
    'Delete group?',
    `"${group.name}" and all its ${group.members.length} member(s) will be removed. This cannot be undone.`,
    'Delete Group'
  );
  if (!isConfirmed) return;

  try {
    await deleteEmailGroup(group.id);
    toastSuccess('Group deleted', `"${group.name}" removed.`);
    load();
  } catch (e) {
    toastError('Delete failed', e.response?.data?.error || e.message);
  }
};

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialog(true)}>
          New Group
        </Button>
      </Box>

      <Grid container spacing={2}>
        {groups.map((g) => (
          <Grid item xs={12} md={6} key={g.id}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box>
                    <Typography fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GroupIcon fontSize="small" /> {g.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Place sx={{ fontSize: 12 }} />
                      {g.location_name || 'Global (all locations)'}
                    </Typography>
                  </Box>
                  <IconButton size="small" color="error" onClick={() => handleDeleteGroup(g.id)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>

                <Divider sx={{ my: 1 }} />

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1, minHeight: 32 }}>
                  {g.members.length === 0 && (
                    <Typography variant="caption" color="text.secondary">No members yet.</Typography>
                  )}
                  {g.members.map((m) => (
                    <Chip key={m.email} label={m.email} size="small"
                      onDelete={() => handleRemoveMember(g.id, m.email)} />
                  ))}
                </Box>

                <Stack direction="row" spacing={1}>
                  <TextField
                    size="small"
                    placeholder="name@company.com"
                    value={memberInput[g.id] || ''}
                    onChange={(e) => setMemberInput({ ...memberInput, [g.id]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddMember(g.id)}
                    fullWidth
                  />
                  <Button variant="outlined" onClick={() => handleAddMember(g.id)}>Add</Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {groups.length === 0 && (
          <Grid item xs={12}>
            <Card variant="outlined"><CardContent>
              <Typography color="text.secondary">No groups yet. Create one to start routing notifications by location.</Typography>
            </CardContent></Card>
          </Grid>
        )}
      </Grid>

      <Dialog open={dialog} onClose={() => setDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Group</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Group name" fullWidth
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Minda Plant Ops" />
            <FormControl fullWidth>
              <InputLabel>Location</InputLabel>
              <Select value={form.location_id} label="Location"
                onChange={(e) => setForm({ ...form, location_id: e.target.value })}>
                <MenuItem value="">Global (all locations)</MenuItem>
                {locations.map((l) => (
                  <MenuItem key={l.id} value={l.id}>{l.location_name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.name}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}