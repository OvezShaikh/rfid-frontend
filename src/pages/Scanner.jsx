import React from 'react';
import {
  Box, Typography, Grid, Card, CardContent, List, ListItem, ListItemText, Divider
} from '@mui/material';
import { Sensors, CheckCircle, Warning, Inventory2, Wifi } from '@mui/icons-material';
import RFIDReader from '../components/RFIDReader';

export default function Scanner() {
  return (
    <Box>
      <Typography variant="h2" sx={{ mb: 0.5 }}>RFID Scan Station</Typography>
      <Typography variant="body2" sx={{ mb: 3 }}>
        Live reads from the mounted UHF RFID reader at the dispatch gate
      </Typography>

      {/* ✅ Added alignItems="stretch" to force equal row height */}
      <Grid container spacing={2} alignItems="stretch">
        {/* Left — Live scanner simulator */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', height: { xs: 'calc(100dvh - 90px)', md: 'calc(100vh - 160px)' }, minHeight: { xs: 'calc(100dvh - 40px)', md: '600px' }, }}>
          <RFIDReader />
        </Grid>

        {/* Right — Instructions / help card */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex' }}>
          {/* ✅ Changed height: '100%' to flex: 1 to perfectly fill the stretched grid item */}
          <Card sx={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                How the reader works
              </Typography>
              <Typography variant="body2" sx={{ mb: 3 }}>
                Mounted UHF RFID antenna workflow for dispatching a set
              </Typography>

              <List disablePadding>
                <ListItem sx={{ px: 0 }}>
                  <Box sx={{
                    width: 36, height: 36, borderRadius: 2, mr: 2,
                    bgcolor: '#F4F3FF', color: '#5B5BD6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Sensors fontSize="small" />
                  </Box>
                  <ListItemText
                    primary={<Typography sx={{ fontWeight: 600, fontSize: 13 }}>1. Container passes the gate</Typography>}
                    secondary="The container moves through the mounted RFID antenna zone; tags are read automatically."
                  />
                </ListItem>

                <Divider sx={{ my: 1 }} />

                <ListItem sx={{ px: 0 }}>
                  <Box sx={{
                    width: 36, height: 36, borderRadius: 2, mr: 2,
                    bgcolor: '#ECFDF3', color: '#12B76A',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CheckCircle fontSize="small" />
                  </Box>
                  <ListItemText
                    primary={<Typography sx={{ fontWeight: 600, fontSize: 13 }}>2. All parts detected</Typography>}
                    secondary="The system verifies Pallet + Sleeve + Lid are present, then marks the set as dispatched."
                  />
                </ListItem>

                <Divider sx={{ my: 1 }} />

                <ListItem sx={{ px: 0 }}>
                  <Box sx={{
                    width: 36, height: 36, borderRadius: 2, mr: 2,
                    bgcolor: '#FEF3F2', color: '#F04438',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Warning fontSize="small" />
                  </Box>
                  <ListItemText
                    primary={<Typography sx={{ fontWeight: 600, fontSize: 13 }}>3. Missing part</Typography>}
                    secondary="If any component is missing from the read, an exception ticket is created and sent to the supervisor."
                  />
                </ListItem>
              </List>

              <Box sx={{
                mt: 3, p: 2, bgcolor: '#F9FAFB',
                border: '1px solid #EAECF0', borderRadius: 2,
              }}>
                <Typography sx={{ fontSize: 12, color: '#667085', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Wifi sx={{ fontSize: 14 }} />
                  Reading from <strong>Reader RDR-0188</strong> · Mounted at Dock Door 3 · Pallet Line
                </Typography>
              </Box>

              <Box sx={{
                mt: 2, p: 2, bgcolor: '#F9FAFB',
                border: '1px solid #EAECF0', borderRadius: 2,
              }}>
                <Typography sx={{ fontSize: 12, color: '#667085' }}>
                  <Inventory2 sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                  Looking for the raw database tables? Open the <strong>Database</strong> page from the sidebar.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}