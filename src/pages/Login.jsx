import React, { useState } from 'react';
import { 
  Box, Grid, Card, CardContent, Typography, TextField, Button, 
  Alert, InputAdornment, Avatar, Divider 
} from '@mui/material';
import { LockOutlined, PersonOutlined, ArrowForward } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ulogo from '../assets/ulogo.png';
import bgImage from '../assets/unostar-logistics.jpg'; 

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await login(username, password);
      
      if (res.data.message) {
        setError(res.data.message); 
      } else {
        navigate('/', { replace: true }); 
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container sx={{ height: '100vh', width: '100vw', m: 0, overflow: 'hidden' }}>
      
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* LEFT SIDE: FULL IMAGE (No Cropping) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Grid 
        size={{ xs: 12, md: 6 }}
        sx={{ 
          height: { xs: '35vh', md: '100vh' },
          // Use 'contain' to ensure the ENTIRE image is visible
          backgroundImage: `url("${bgImage}")`, 
          backgroundSize: 'contain', 
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          bgcolor: '#F9FAFB', // Add a background color in case the image doesn't perfectly match the aspect ratio
          borderRight: { md: '1px solid #EAECF0' } // Subtle separator
        }} 
      />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* RIGHT SIDE: LOGIN FORM */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Grid 
        size={{ xs: 12, md: 6 }}
        sx={{ 
          height: { xs: '65vh', md: '100vh' }, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center',     
          bgcolor: '#F9FAFB',
          p: { xs: 2, sm: 2 },
          overflowY: 'auto', 
          minWidth: 0
        }}
      >
        <Box sx={{ 
          maxWidth: 450, 
          width: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          my: 'auto'
        }}>
          
          {/* ── LOGIN FORM CARD ── */}
          <Card sx={{ 
            width: '100%', 
            boxShadow: '0px 10px 40px rgba(16,24,40,0.08)', 
            borderRadius: 3, 
            border: '1px solid #EAECF0' 
          }}>
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              
              {/* ── BRANDING INSIDE THE FORM ── */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <Avatar 
                  src={ulogo} 
                  variant="rounded"
                  sx={{ 
                    width: 56, height: 56, bgcolor: '#fff', p: 1, mb: 1.5,
                    border: '1px solid #EAECF0', boxShadow: '0px 4px 12px rgba(16,24,40,0.05)'
                  }} 
                >
                  U
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#101828', letterSpacing: -0.5 }}>
                  Unostar RFID
                </Typography>
                <Typography variant="body2" sx={{ color: '#667085', fontWeight: 500, mt: 0.5 }}>
                  Packaging Pool Tracking
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* ── WELCOME TEXT ── */}
              <Box sx={{ mb: 2, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#101828', mb: 0.5 }}>
                  Welcome back
                </Typography>
                <Typography variant="body2" sx={{ color: '#667085' }}>
                  Please enter your credentials.
                </Typography>
              </Box>

              {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth 
                  label="Username" 
                  variant="outlined" 
                  margin="dense"
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonOutlined sx={{ color: '#98A2B3' }} />
                        </InputAdornment>
                      ),
                    }
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fff' } }}
                />
                <TextField
                  fullWidth 
                  label="Password" 
                  type="password" 
                  variant="outlined" 
                  margin="dense"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlined sx={{ color: '#98A2B3' }} />
                        </InputAdornment>
                      ),
                    }
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fff' } }}
                />
                
                <Button 
                  type="submit" 
                  fullWidth 
                  variant="contained" 
                  disabled={loading}
                  endIcon={!loading && <ArrowForward />}
                  sx={{ 
                    mt: 3, py: 1.2, bgcolor: '#102A43', 
                    '&:hover': { bgcolor: '#1E3A5F' },
                    fontWeight: 600, textTransform: 'none',
                    borderRadius: 2, fontSize: 15,
                    boxShadow: '0px 4px 12px rgba(16,24,40,0.15)'
                  }}
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                </Button>
              </form>

            </CardContent>
          </Card>

          {/* Footer */}
          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 2, color: '#98A2B3' }}>
            © {new Date().getFullYear()} Unostar Value Chain Pvt. Ltd.
          </Typography>

        </Box>
      </Grid>
    </Grid>
  );
}