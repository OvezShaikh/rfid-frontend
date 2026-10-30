import React from 'react';
import { Card, Box, Typography, Chip } from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';

export default function KpiCard({ title, value, trend, trendLabel, icon, color = '#5B5BD6' }) {
  const positive = !trend?.startsWith('-');
  return (
    <Card sx={{ p: 2.5, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: 2,
          bgcolor: `${color}15`, color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </Box>
        {trend && (
          <Chip
            size="small"
            icon={positive ? <ArrowUpward sx={{ fontSize: 12 }} /> : <ArrowDownward sx={{ fontSize: 12 }} />}
            label={trend}
            sx={{
              height: 22, fontSize: 11, fontWeight: 600,
              bgcolor: positive ? '#ECFDF3' : '#FEF3F2',
              color: positive ? '#027A48' : '#B42318',
              '& .MuiChip-icon': { color: positive ? '#027A48' : '#B42318' },
            }}
          />
        )}
      </Box>
      <Typography sx={{ fontSize: 13, color: '#667085', mb: 0.5 }}>{title}</Typography>
      <Typography sx={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>{value}</Typography>
      {trendLabel && <Typography sx={{ fontSize: 12, color: '#667085', mt: 0.5 }}>{trendLabel}</Typography>}
    </Card>
  );
}