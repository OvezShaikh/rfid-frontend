import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Button, Chip, Snackbar, Alert, Avatar, Card 
} from '@mui/material';
import { 
  CheckCircle, WarningAmber, ShieldOutlined, 
  AdminPanelSettings, SupervisorAccount, Engineering, Person 
} from '@mui/icons-material';import DataTable from '../components/DataTable';
import { getExceptions, resolveException } from '../services/api';

export default function Exceptions() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchExceptions = async () => {
    setLoading(true);
    try {
      const res = await getExceptions();
      setRows(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, []);

  const handleResolve = async (id) => {
    try {
      await resolveException(id);
      setSnackbar({ open: true, message: 'Exception resolved successfully!', severity: 'success' });
      fetchExceptions();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to resolve exception.', severity: 'error' });
    }
  };

  const columns = [
    { 
      key: 'exception_id', 
      label: 'Ticket ID', 
      sortable: true, 
      noWrap: true,
      render: (r) => (
        <Typography sx={{ fontWeight: 600, fontSize: 13, color: '#101828' }}>
          {r.exception_id}
        </Typography>
      )
    },
    { 
      key: 'set_id', 
      label: 'Set ID', 
      sortable: true, 
      noWrap: true,
      width: 150,
      render: (r) => (
        <Chip 
          label={r.set_id} 
          size="small" 
          sx={{ bgcolor: '#F9FAFB', color: '#344054', fontWeight: 600, borderRadius: 1.5, border: '1px solid #EAECF0' }} 
        />
      )
    },
        { 
      key: 'reason', 
      label: 'Reason / Missing Parts', 
      width: 350,         // <-- Give it a large fixed width
      minWidth: 300,      // <-- Ensure it never shrinks below this
      render: (r) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
          <WarningAmber sx={{ fontSize: 16, color: '#F04438', flexShrink: 0 }} />
          <Typography sx={{ 
            fontSize: 13, 
            color: '#B42318', 
            fontWeight: 500,
            whiteSpace: 'normal',    // <-- Allows text to wrap to a new line if needed
            wordBreak: 'break-word'  // <-- Prevents long words from breaking layout
          }}>
            {r.reason}
          </Typography>
        </Box>
      ) 
    },
        { 
      key: 'owner_role', 
      label: 'Assigned To', 
      render: (r) => {
        const role = (r.owner_role || 'supervisor').toLowerCase();
        
        // Choose the icon based on the role
        let RoleIcon = Person;
        let iconColor = '#667085';
        let bgColor = '#F9FAFB';

        if (role === 'admin') {
          RoleIcon = AdminPanelSettings;
          iconColor = '#B42318'; // Red for Admin
          bgColor = '#FEF3F2';
        } else if (role === 'supervisor') {
          RoleIcon = SupervisorAccount;
          iconColor = '#5B5BD6'; // Purple for Supervisor
          bgColor = '#F4F3FF';
        } else if (role === 'operator') {
          RoleIcon = Engineering;
          iconColor = '#027A48'; // Green for Operator
          bgColor = '#ECFDF3';
        }

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ 
              width: 28, height: 28, borderRadius: '50%', 
              bgcolor: bgColor, color: iconColor, 
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <RoleIcon sx={{ fontSize: 16 }} />
            </Box>
            <Typography sx={{ textTransform: 'capitalize', fontSize: 13, color: '#344054', fontWeight: 500 }}>
              {role}
            </Typography>
          </Box>
        );
      } 
    },
    { 
      key: 'status', 
      label: 'Status', 
      filterable: true,
      filterOptions: ['open', 'closed'],
      render: (r) => (
        <Chip 
          size="small" 
          label={r.status.toUpperCase()} 
          sx={{
            fontWeight: 600,
            fontSize: 11,
            borderRadius: 1.5,
            ...(r.status === 'open' 
              ? { bgcolor: '#FEF3F2', color: '#B42318', border: '1px solid #FECDCA' } 
              : { bgcolor: '#ECFDF3', color: '#027A48', border: '1px solid #ABEFC6' })
          }}
        />
      ) 
    },
    { 
      key: 'created_at', 
      label: 'Created',
      width: 150, 
      render: (r) => (
        <Typography sx={{ fontSize: 12, color: '#667085', fontWeight: 500 }}>
          {new Date(r.created_at).toLocaleString('en-GB', { 
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
          })}
        </Typography>
      )
    }
  ];

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', width: '100%' }}>
      
      {/* ── CLEAN HEADER ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Box sx={{ 
          width: 48, height: 48, borderRadius: 1, 
          bgcolor: '#F4F3FF', color: '#5B5BD6', 
          display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>
          <ShieldOutlined sx={{ fontSize: 28 }} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#101828', letterSpacing: -0.5 }}>
            Exception Management
          </Typography>
          <Typography variant="body2" sx={{ color: '#667085', mt: 0.5 }}>
            Review and resolve missing or incomplete sets caught by the RFID gates.
          </Typography>
        </Box>
      </Box>

      {/* ── MODERN FLAT TABLE CONTAINER ── */}
      <Card sx={{ 
        borderRadius: 1, 
        boxShadow: '0px 4px 20px rgba(16,24,40,0.05)', 
        border: '1px solid #EAECF0',
        overflow: 'hidden'
      }}>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          exportFileName="exceptions"
          emptyMessage="No exceptions found — everything is running smoothly! 🎉"
          rowActions={(row) => (
            row.status === 'open' ? (
              <Button 
                size="small" 
                variant="contained" 
                onClick={() => handleResolve(row.id)}
                startIcon={<CheckCircle />}
                sx={{ 
                  textTransform: 'none', 
                  fontWeight: 600,
                  fontSize: 12,
                  borderRadius: 2,
                  bgcolor: '#027A48', 
                  color: '#fff',
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#05603A', boxShadow: '0px 4px 12px rgba(2,122,72,0.2)' } 
                }}
              >
                Resolve
              </Button>
            ) : null
          )}
        />
      </Card>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}