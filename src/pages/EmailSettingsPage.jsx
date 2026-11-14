import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import EmailSettings  from '../components/EmailSettings';
import EmailGroups    from '../components/EmailGroups';
import EmailTemplates from '../components/EmailTemplates';
import EmailLog       from '../components/EmailLog';

export default function EmailSettingsPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ p: 3, width: '100%', maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>Email & Notifications</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Manage recipients, per-location groups, message templates, and delivery history.
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Recipients" />
          <Tab label="Groups by Location" />
          <Tab label="Templates" />
          <Tab label="Delivery Log" />
        </Tabs>
      </Box>

      {tab === 0 && <EmailSettings />}
      {tab === 1 && <EmailGroups />}
      {tab === 2 && <EmailTemplates />}
      {tab === 3 && <EmailLog />}
    </Box>
  );
}