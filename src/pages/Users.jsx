import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Select, InputLabel, FormControl,
  Chip, Alert, IconButton, Tooltip
} from '@mui/material';
import { 
  Add, DeleteOutlined, AdminPanelSettings, SupervisorAccount, 
  Engineering, EditOutlined 
} from '@mui/icons-material';
import DataTable from '../components/DataTable';
import { getUsers, createUser, updateUser, deleteUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ROLE_MAP = {
  1: { label: 'Super Admin', color: '#B42318', bg: '#FEF3F2', icon: <AdminPanelSettings sx={{ fontSize: 16 }} /> },
  2: { label: 'Admin',       color: '#5B5BD6', bg: '#F4F3FF', icon: <SupervisorAccount sx={{ fontSize: 16 }} /> },
  3: { label: 'Operator',    color: '#027A48', bg: '#ECFDF3', icon: <Engineering sx={{ fontSize: 16 }} /> },
};

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null = create mode, object = edit mode
  const [formData, setFormData] = useState({ username: '', password: '', role_id: 3 });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({ username: '', password: '', role_id: 3 });
    setError(null);
    setOpen(true);
  };

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setFormData({ username: u.username, password: '', role_id: u.role_id });
    setError(null);
    setOpen(true);
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      if (editingUser) {
        await updateUser(editingUser.id, formData);
        setSuccess('User updated successfully!');
      } else {
        await createUser(formData);
        setSuccess('User created successfully!');
      }
      setOpen(false);
      fetchUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${editingUser ? 'update' : 'create'} user`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteUser(id);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const columns = [
    { key: 'id', label: 'ID', width: 70, sortable: true, hideable: false },
    { key: 'username', label: 'Username', sortable: true, render: (r) => (
        <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{r.username}</Typography>
      ) 
    },
    { key: 'role_id', label: 'Role', filterable: true, filterOptions: ['Super Admin', 'Admin', 'Operator'], render: (r) => {
        const role = ROLE_MAP[r.role_id] || ROLE_MAP[3];
        return (
          <Chip 
            icon={role.icon} 
            label={role.label} 
            size="small" 
            sx={{ bgcolor: role.bg, color: role.color, fontWeight: 600, border: `1px solid ${role.color}33` }} 
          />
        );
      }
    },
    { key: 'created_at', label: 'Created On', render: (r) => new Date(r.created_at).toLocaleDateString('en-GB') }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>User Management</Typography>
          <Typography variant="body2">Manage system access and roles.</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate} sx={{ bgcolor: '#102A43', textTransform: 'none', fontWeight: 600 }}>
          Create User
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <DataTable
        columns={columns}
        rows={users}
        loading={loading}
        exportFileName="users"
        emptyMessage="No users found."
        rowActions={(row) => (
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                {/* Protect the currently logged-in user and the original superadmin from being deleted */}
                {row.id !== user?.id && row.username !== 'superadmin' ? (
                    <>
                        <Tooltip title="Edit User">
                            <IconButton size="small" onClick={() => handleOpenEdit(row)} sx={{ color: '#5B5BD6' }}>
                                <EditOutlined fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete User">
                            <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}>
                                <DeleteOutlined fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </>
                ) : (
                    <Chip label="Protected User" size="small" variant="outlined" sx={{ color: '#B42318', borderColor: '#B42318' }} />
                )}
            </Box>
        )}
      />

      {/* Create / Edit User Modal */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingUser ? `Edit User: ${editingUser.username}` : 'Create New User'}
        </DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <TextField 
            fullWidth label="Username" margin="normal" size="small"
            value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})}
          />
          <TextField 
            fullWidth 
            label={editingUser ? "New Password (leave blank to keep current)" : "Password"} 
            type="password" 
            margin="normal" 
            size="small"
            value={formData.password} 
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />
          <FormControl fullWidth margin="normal" size="small">
            <InputLabel>Role</InputLabel>
            <Select value={formData.role_id} label="Role" onChange={(e) => setFormData({...formData, role_id: e.target.value})}>
              <MenuItem value={1}>Super Admin (Full Access)</MenuItem>
              <MenuItem value={2}>Admin (No Database Access)</MenuItem>
              <MenuItem value={3}>Operator (Scanner Only)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: 'none', color: '#475467' }}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: '#102A43', textTransform: 'none' }}>
            {editingUser ? 'Save Changes' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}