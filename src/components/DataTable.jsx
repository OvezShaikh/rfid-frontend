import React, { useMemo, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, TextField, InputAdornment, IconButton, Button,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Search, Close, FileDownloadOutlined } from '@mui/icons-material';

export default function DataTable({
  columns,
  rows = [],
  loading = false,
  title,
  subtitle,
  searchable = true,
  searchPlaceholder = 'Search…',
  emptyMessage = 'No records found',
  exportFileName = 'data-export',
  showExport = true,
  rowActions,
  actionsHeader = 'Actions',
}) {
  const [search, setSearch] = useState('');

  // ── Convert column config to DataGrid format ──
  const gridColumns = useMemo(() => {
    const cols = columns.map((c) => ({
      field: c.key,
      headerName: c.label,
      width: c.width ? parseInt(c.width, 10) : 150,
      flex: c.width ? 0 : 1,
      minWidth: 120,
      sortable: c.sortable !== false,
      filterable: c.filterable !== false,
      align: c.align || 'left',
      headerAlign: c.align || 'left',
      renderCell: c.render ? (params) => c.render(params.row) : undefined,
      disableColumnMenu: c.hideable === false,
    }));

    if (rowActions) {
      cols.push({
        field: '__actions',
        headerName: actionsHeader,
        width: 120,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        resizable: false,
        align: 'right',
        headerAlign: 'right',
        renderCell: (params) => (
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
            {rowActions(params.row)}
          </Box>
        ),
      });
    }

    return cols;
  }, [columns, rowActions, actionsHeader]);

  // ── Search filter ──
  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((row) =>
      columns.some((c) =>
        String(row[c.key] ?? '').toLowerCase().includes(q)
      )
    );
  }, [rows, search, columns]);

  // ── CSV Export ──
  const exportCSV = useCallback(() => {
    const header = columns.map((c) => c.label);
    const body = filteredRows.map((row) =>
      columns.map((c) => {
        const v = row[c.key];
        return typeof v === 'string' && v.includes(',') ? `"${v}"` : (v ?? '');
      })
    );
    const csv = [header, ...body].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportFileName}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [columns, filteredRows, exportFileName]);

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        border: '1px solid #E4E7EC', 
        borderRadius: 1, 
        overflow: 'hidden',
        boxShadow: '0px 1px 3px rgba(16,24,40,0.05)'
      }}
    >
      {/* Header */}
      {(title || subtitle) && (
        <Box sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
          {title && <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#101828' }}>{title}</Typography>}
          {subtitle && <Typography sx={{ fontSize: 13, color: '#667085', mt: 0.5 }}>{subtitle}</Typography>}
        </Box>
      )}

      {/* Toolbar */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1, p: 2,
        borderBottom: '1px solid #E4E7EC', 
        backgroundColor: '#F9FAFB',
        flexWrap: 'wrap',
      }}>
        {searchable && (
            <TextField
                size="small"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                slotProps={{
                    input: {
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search fontSize="small" sx={{ color: '#667085' }} />
                            </InputAdornment>
                        ),
                        endAdornment: search ? (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setSearch('')}>
                                    <Close fontSize="small" />
                                </IconButton>
                            </InputAdornment>
                        ) : null,
                    },
                }}
            />
        )}

        <Box sx={{ flex: 1 }} />

        {showExport && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<FileDownloadOutlined sx={{ fontSize: 16 }} />}
            onClick={exportCSV}
            sx={{
              borderRadius: 1.5,
              textTransform: 'none',
              fontSize: 13,
              fontWeight: 600,
              color: '#344054',
              borderColor: '#D0D5DD',
              backgroundColor: '#FFFFFF',
              px: 1.5,
              py: 0.75,
              '&:hover': { borderColor: '#98A2B3', bgcolor: '#F9FAFB' },
            }}
          >
            Export CSV
          </Button>
        )}
      </Box>

      {/* DataGrid */}
      <Box sx={{ width: '100%' }}>
        <DataGrid
          rows={filteredRows}
          columns={gridColumns}
          loading={loading}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          disableRowSelectionOnClick
          autoHeight
          sx={{
            border: 'none',
            backgroundColor: '#FFFFFF',

            // ── HEADER: NAVY BLUE ──
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#102A43',
              borderBottom: '2px solid #102A43',
            },
            '& .MuiDataGrid-columnHeader': {
              backgroundColor: '#102A43',
              color: '#FFFFFF',
              '&:hover': {
                backgroundColor: '#243B53',
              },
              '&:focus, &:focus-within': {
                outline: 'none',
              },
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 600,
              fontSize: 11,
              color: '#FFFFFF !important',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            },

            // ── KILL THE WHITE CIRCLES & FIX ICON COLORS ──
            '& .MuiDataGrid-iconButtonContainer': {
              margin: 0,
              padding: 0,
              width: 'auto',
              visibility: 'visible !important',
              opacity: '1 !important',
            },
            '& .MuiDataGrid-iconButtonContainer .MuiIconButton-root': {
              backgroundColor: 'transparent !important',
              color: 'rgba(255,255,255,0.6) !important',
              padding: '2px',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.15) !important',
                color: '#FFFFFF !important',
              },
            },
            '& .MuiDataGrid-sortIcon': {
              color: 'inherit !important', 
            },
            '& .MuiDataGrid-menuIcon': {
              visibility: 'visible !important',
              width: 'auto',
            },
            '& .MuiDataGrid-menuIconButton': {
              color: 'rgba(255,255,255,0.6) !important',
              '&:hover': {
                color: '#FFFFFF !important',
                backgroundColor: 'rgba(255,255,255,0.15) !important',
              },
            },

            // ═══════════════════════════════════════════════════════════
            // FILTER PANEL UX (Clean Flex Layout, No Dropdown Loop)
            // ═══════════════════════════════════════════════════════════
            '& .MuiDataGrid-panelWrapper': {
              '& .MuiDataGrid-panel': {
                width: 480,
                borderRadius: 2,
                boxShadow: '0px 12px 32px rgba(16,24,40,0.2)',
                border: '1px solid #E4E7EC',
                backgroundColor: '#FFFFFF',
                overflow: 'visible', // Allows dropdowns to float
              },
              '& .MuiDataGrid-panelHeader': {
                backgroundColor: '#F9FAFB',
                borderBottom: '1px solid #EAECF0',
                padding: '12px 16px',
                '& .MuiTypography-root': {
                  fontWeight: 600,
                  fontSize: 14,
                  color: '#101828',
                },
              },
              '& .MuiDataGrid-panelContent': {
                padding: '16px',
                overflow: 'visible !important', // Allows dropdowns to float
              },
            },

            // Use Flexbox to wrap the form fields naturally
            '& .MuiDataGrid-filterForm': {
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              alignItems: 'flex-start',
            },
            
            // Column & Operator take up half width each
            '& .MuiDataGrid-filterFormColumnInput': {
              flex: '1 1 calc(50% - 16px)',
              minWidth: 140,
            },
            '& .MuiDataGrid-filterFormOperatorInput': {
              flex: '1 1 calc(50% - 16px)',
              minWidth: 140,
            },
            
            // Value takes up full width and drops to the next row
            '& .MuiDataGrid-filterFormValueInput': {
              flex: '1 1 100%',
            },

            // Hide the default add/delete icons to keep it clean
            '& .MuiDataGrid-filterFormAdd, & .MuiDataGrid-filterFormDeleteIcon': {
              display: 'none',
            },

            // Footer styling
            '& .MuiDataGrid-panelFooter': {
              padding: '12px 16px',
              borderTop: '1px solid #EAECF0',
              backgroundColor: '#FFFFFF',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 1,
              '& .MuiButton-root': {
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 1.5,
              },
            },

            // ── FILLERS (Header vs Body) ──
            '& .MuiDataGrid-columnHeaders .MuiDataGrid-filler': {
              backgroundColor: '#102A43 !important',
            },
            '& .MuiDataGrid-columnHeaders .MuiDataGrid-scrollbarFiller': {
              backgroundColor: '#102A43 !important',
            },
            '& .MuiDataGrid-main .MuiDataGrid-filler': {
              backgroundColor: '#FFFFFF',
            },

            // ── ROWS & CELLS ──
            '& .MuiDataGrid-row': {
              '&:hover': { backgroundColor: '#F9FAFB' },
            },
            '& .MuiDataGrid-cell': {
              fontSize: 13,
              color: '#344054',
              borderBottom: '1px solid #EAECF0',
              display: 'flex',
              alignItems: 'center',
              '&:focus': { outline: 'none' },
            },

            // ── PAGINATION & OVERLAYS ──
            '& .MuiTablePagination-root': {
              borderTop: '1px solid #EAECF0',
              backgroundColor: '#FFFFFF',
            },
            '& .MuiDataGrid-overlay': {
              backgroundColor: '#FFFFFF',
              fontSize: 13,
              color: '#667085',
            },
          }}
          slots={{
            noRowsOverlay: () => (
              <Box sx={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                height: '100%', gap: 1,
              }}>
                <Typography sx={{ fontSize: 13, color: '#667085' }}>
                  {emptyMessage}
                </Typography>
              </Box>
            ),
          }}
        />
      </Box>
    </Paper>
  );
}