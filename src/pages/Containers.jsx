import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Paper
} from '@mui/material';
import { getContainers } from '../services/api';

export default function Containers() {
  const [containers, setContainers] = useState([]);
  useEffect(() => { getContainers().then(r => setContainers(r.data)).catch(console.error); }, []);

  const statusColor = (s) => ({
    assembled: 'info', dispatched: 'success', received: 'success',
    returned: 'default', incomplete: 'error',
  }[s] || 'default');

  return (
    <Box>
      <Typography variant="h2" sx={{ mb: 0.5 }}>Containers</Typography>
      <Typography variant="body2" sx={{ mb: 3 }}>Full set registry and dispatch status</Typography>

      <Card>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Set ID</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Dispatch Time</TableCell>
                  <TableCell>Expected Return</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {containers.map(c => (
                  <TableRow key={c.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{c.set_id}</TableCell>
                    <TableCell><Chip label={c.status} size="small" color={statusColor(c.status)} /></TableCell>
                    <TableCell>{c.dispatch_time ? new Date(c.dispatch_time).toLocaleString() : '—'}</TableCell>
                    <TableCell>{c.expected_return ? new Date(c.expected_return).toLocaleString() : '—'}</TableCell>
                  </TableRow>
                ))}
                {containers.length === 0 && (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: '#667085' }}>No containers yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}