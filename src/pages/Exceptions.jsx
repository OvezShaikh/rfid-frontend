import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Paper
} from '@mui/material';
import { getExceptions } from '../services/api';

export default function Exceptions() {
  const [rows, setRows] = useState([]);
  useEffect(() => { getExceptions().then(r => setRows(r.data)).catch(console.error); }, []);

  return (
    <Box>
      <Typography variant="h2" sx={{ mb: 0.5 }}>Exceptions</Typography>
      <Typography variant="body2" sx={{ mb: 3 }}>Every incomplete or mismatched scan creates a ticket here</Typography>

      <Card>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Exception</TableCell>
                  <TableCell>Set</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(e => (
                  <TableRow key={e.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{e.exception_id}</TableCell>
                    <TableCell>{e.set_id}</TableCell>
                    <TableCell>{e.reason}</TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{e.owner_role}</TableCell>
                    <TableCell>
                      <Chip size="small" label={e.status} color={e.status === 'open' ? 'error' : 'success'} />
                    </TableCell>
                    <TableCell>{new Date(e.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: '#667085' }}>No exceptions — all good 🎉</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}