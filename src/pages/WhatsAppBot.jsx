import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Typography, Avatar, TextField, IconButton, Paper, 
  CircularProgress 
} from '@mui/material';
import { Send, MoreVert, Search, ArrowBack, Check } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom'; // Added for back navigation
import { simulateWhatsApp } from '../services/api';
import ulogo from '../assets/ulogo.png';

// ── Helper: Parse WhatsApp Markdown (*bold*, _italic_, ~strike~) ──
const formatWhatsAppText = (text) => {
  if (!text) return '';
  
  const regex = /(\*[^*]+\*|~[^~]+~)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return <strong key={index}>{part.slice(1, -1)}</strong>;
    }
    if (part.startsWith('_') && part.endsWith('_')) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('~') && part.endsWith('~')) {
      return <del key={index}>{part.slice(1, -1)}</del>;
    }
    return <span key={index}>{part}</span>;
  });
};

export default function WhatsAppBot() {
  const navigate = useNavigate(); // Initialize navigate hook

    const [messages, setMessages] = useState([
    { 
      id: 1, 
      sender: 'bot', 
      text: "👋 *Welcome to Unostar!*\n\nI am your RFID Assistant. Here is what I can do:\n\n🔍 1. \"Where is FLC-M-8869?\"\n📦 2. \"Status of PAD-TRK-02_B\"\n🚨 3. \"Show open exceptions\"",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await simulateWhatsApp(userMsg.text);
      
      // Simulate network delay for realism
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'bot',
          text: res.data.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setLoading(false);
      }, 800);

    } catch (err) {
      setLoading(false);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: "Sorry, I am having trouble connecting to the server.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', height: '100%', alignItems: 'center' }}>
      
      {/* Phone Frame */}
      <Paper 
        elevation={12} 
        sx={{ 
          width: '100%', 
          maxWidth: 500, 
          height: '80vh', 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: 4,
          overflow: 'hidden',
          border: '8px solid #101828',
          bgcolor: '#efeae2'
        }}
      >
        
        {/* WhatsApp Header */}
        <Box sx={{ bgcolor: '#075e54', color: '#fff', p: 1, pl: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Back Button Now Works */}
          <IconButton onClick={() => navigate(-1)} sx={{ color: '#fff', ml: 0.5 }}>
            <ArrowBack />
          </IconButton>
          
          <Avatar
            src={ulogo}
            variant="rounded"
            sx={{ bgcolor: '#fff', width: 40, height: 40, p: 0.5, objectFit: 'contain', ml: 0.5 }}
          />
          <Box sx={{ flex: 1, ml: 1 }}>
            <Typography sx={{ fontWeight: 600, fontSize: 15, lineHeight: 1.2 }}>Unostar RFID Assistant</Typography>
            <Typography sx={{ fontSize: 11, color: '#d1d7db' }}>online</Typography>
          </Box>
          <Search sx={{ opacity: 0.8, fontSize: 20, cursor: 'pointer', mr: 1 }} />
          <MoreVert sx={{ opacity: 0.8, fontSize: 20, cursor: 'pointer', mr: 1 }} />
        </Box>

        {/* Chat Area */}
        <Box sx={{ 
          flex: 1, 
          overflowY: 'auto', 
          p: 2, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 1, // Slightly reduced gap for cleaner look
          backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
          backgroundSize: 'cover',
          opacity: 0.9
        }}>
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <Box 
                key={msg.id} 
                sx={{ 
                  display: 'flex', 
                  justifyContent: isUser ? 'flex-end' : 'flex-start' 
                }}
              >
                <Box sx={{
                  bgcolor: isUser ? '#dcf8c6' : '#fff',
                  p: 1,
                  px: 1.5,
                  // Modern WhatsApp clean radius (no glitchy tails)
                  borderRadius: isUser ? '14px 0px 14px 14px' : '0px 14px 14px 14px',
                  maxWidth: '85%',
                  boxShadow: '0px 1px 1px rgba(0,0,0,0.1)',
                  wordBreak: 'break-word',
                }}>
                  <Typography sx={{ 
                    fontSize: 14.5, 
                    whiteSpace: 'pre-line', 
                    color: '#111b21',
                    lineHeight: 1.4 
                  }}>
                    {formatWhatsAppText(msg.text)}
                  </Typography>
                  
                  {/* Timestamp & Ticks */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    alignItems: 'center', 
                    gap: 0.5, 
                    mt: 0.5,
                    ml: 2 
                  }}>
                    <Typography sx={{ fontSize: 10.5, color: '#667781' }}>{msg.time}</Typography>
                    {isUser && <Check sx={{ fontSize: 15, color: '#53bdeb' }} />}
                  </Box>
                </Box>
              </Box>
            );
          })}
          
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Box sx={{ 
                bgcolor: '#fff', 
                p: 1.5, 
                borderRadius: '0px 12px 12px 12px', // Matched clean radius
                display: 'flex', 
                alignItems: 'center',
                gap: 1,
                boxShadow: '0px 1px 1px rgba(0,0,0,0.1)'
              }}>
                <CircularProgress size={14} sx={{ color: '#00a884' }} />
                <Typography sx={{ fontSize: 12, color: '#667781', fontStyle: 'italic' }}>typing...</Typography>
              </Box>
            </Box>
          )}
          <div ref={chatEndRef} />
        </Box>

        {/* Input Area */}
        <Box 
          component="form" 
          onSubmit={handleSend}
          sx={{ bgcolor: '#f0f2f5', p: 1.5, display: 'flex', gap: 1, alignItems: 'center' }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            sx={{
              bgcolor: '#fff',
              borderRadius: 4,
              '& .MuiOutlinedInput-root': {
                borderRadius: 4,
                '& fieldset': { border: 'none' },
                py: 1
              }
            }}
          />
          <IconButton 
            type="submit" 
            sx={{ bgcolor: '#00a884', color: '#fff', '&:hover': { bgcolor: '#008f72' } }}
            disabled={!input.trim() || loading}
          >
            <Send fontSize="small" />
          </IconButton>
        </Box>

      </Paper>
    </Box>
  );
}