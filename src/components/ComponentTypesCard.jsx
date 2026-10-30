import React from 'react';
import { Card, CardContent, Typography, Box, Divider } from '@mui/material';
import { Pallet, Layers } from '@mui/icons-material';
import lidImg from '../assets/lid.png';

const TYPE_INFO = {
  Pallet: {
    label: 'Pallet',
    icon: <Pallet sx={{ fontSize: 56 }} />,
    color: '#F5B041',
    bg: '#FEF6E7',
    description: 'Base of the container',
    longDescription:
      'The upper component / base of the foldable container. Each pallet carries its own RFID tag so it can be tracked even when separated from the sleeve.',
  },
  Sleeve: {
    label: 'Sleeve',
    icon: <Layers sx={{ fontSize: 56 }} />,
    color: '#2E90FA',
    bg: '#EAF2FF',
    description: 'Foldable side walls',
    longDescription:
      'The foldable side structure that connects the pallet and the lid. Tag placement is verified in both folded and unfolded states.',
  },
  Lid: {
    label: 'Lid',
    icon: (
      <Box
        component="img"
        src={lidImg}
        alt="Lid"
        sx={{ width: 56, height: 56, objectFit: 'contain', display: 'block' }}
      />
    ),
    color: '#5B5BD6',
    bg: '#F4F3FF',
    description: 'Closing cover',
    longDescription:
      'The closing cover of the container. Tracked on its own so a missing lid is visible the moment a set comes back incomplete.',
  },
};

export default function ComponentTypesCard({ selectedType = 'Pallet', assets = [] }) {
  const info = TYPE_INFO[selectedType] || TYPE_INFO.Pallet;
  const count = assets.filter((a) => a.type === selectedType).length;
  const total = assets.length || 1;
  const pct = Math.round((count / total) * 100);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Component Type
        </Typography>
        <Typography variant="body2" sx={{ mb: 2.5 }}>
          The type you have selected
        </Typography>

        {/* Big icon + name */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: 3,
            borderRadius: 2,
            bgcolor: info.bg,
            border: `1px solid ${info.color}33`,
            mb: 2.5,
          }}
        >
          <Box
            sx={{
              width: 96,
              height: 96,
              borderRadius: 3,
              bgcolor: '#FFFFFF',
              color: info.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1.5,
              boxShadow: '0px 4px 12px rgba(16,24,40,0.06)',
            }}
          >
            {info.icon}
          </Box>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#101828' }}>
            {info.label}
          </Typography>
          <Typography sx={{ fontSize: 13, color: '#667085', mt: 0.5 }}>
            {info.description}
          </Typography>
        </Box>

        {/* Description */}
        <Typography variant="body2" sx={{ color: '#475467', mb: 2.5, lineHeight: 1.6 }}>
          {info.longDescription}
        </Typography>

        <Divider sx={{ mb: 2 }} />

        {/* Live count */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1 }}>
          <Typography sx={{ fontSize: 13, color: '#667085' }}>
            Registered {info.label}s
          </Typography>
          <Typography sx={{ fontSize: 28, fontWeight: 700, color: info.color, lineHeight: 1 }}>
            {count}
          </Typography>
        </Box>

        {/* Progress bar */}
        <Box sx={{ height: 6, borderRadius: 3, bgcolor: '#F2F4F7', overflow: 'hidden' }}>
          <Box
            sx={{
              height: '100%',
              width: `${pct}%`,
              bgcolor: info.color,
              transition: 'width 0.4s ease',
            }}
          />
        </Box>
        <Typography sx={{ fontSize: 11, color: '#98A2B3', mt: 1 }}>
          {pct}% of all {assets.length} registered components
        </Typography>
      </CardContent>
    </Card>
  );
}