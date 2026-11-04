import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Alert, InputAdornment } from '@mui/material';
import { LockOutlined, PersonOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
      
      // If it's the first time initializing the password, it returns a message instead of a token
      if (res.data.message) {
        setError(res.data.message); 
      } else {
        // SUCCESSFUL LOGIN: Redirect to the Dashboard
        navigate('/', { replace: true }); 
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F7F8FA' }}>
      <Card sx={{ maxWidth: 400, width: '100%', p: 3, boxShadow: '0px 10px 30px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: '#5B5BD6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <LockOutlined />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Sign in to Unostar</Typography>
          </Box>

          {error && <Alert severity="info" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth 
              label="Username" 
              variant="outlined" 
              margin="normal"
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutlined /></InputAdornment> }}
            />
            <TextField
              fullWidth 
              label="Password" 
              type="password" 
              variant="outlined" 
              margin="normal"
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button 
              type="submit" 
              fullWidth 
              variant="contained" 
              disabled={loading}
              sx={{ mt: 3, py: 1.5, bgcolor: '#102A43', fontWeight: 600, textTransform: 'none' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}