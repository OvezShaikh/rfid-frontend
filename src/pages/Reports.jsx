import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button, CircularProgress,
  TextField, MenuItem, Select, FormControl, Chip, Divider, Tooltip,
} from '@mui/material';
import { 
  FileDownload, Timer, Place, Warning, FilterAlt, Refresh, 
  TrendingUp, Inventory2, CheckCircleOutlined,
} from '@mui/icons-material';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, 
  CartesianGrid, AreaChart, Area 
} from 'recharts';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import { getTurnaroundReport, getLocationStockReport, getExceptionRateReport, getStuckInTransitReport, getDailyMovementReport, getAuditExceptionsReport } from '../services/api';

// ── PREMIUM CUSTOM TOOLTIP ──
const CustomTooltip = ({ active, payload, label, suffix = '' }) => {
  if (active && payload && payload.length) {
    return (
      <Box sx={{ 
        bgcolor: '#FFFFFF', p: 1.5, borderRadius: 2, 
        boxShadow: '0px 8px 24px rgba(0,0,0,0.12)', border: '1px solid #EAECF0' 
      }}>
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#667085', mb: 0.5 }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#101828' }}>
          {payload[0].value} <span style={{ fontSize: 12, fontWeight: 500, color: '#667085' }}>{suffix}</span>
        </Typography>
      </Box>
    );
  }
  return null;
};

// Common Card Style
const cardSx = {
  borderRadius: 3,
  boxShadow: '0px 4px 20px rgba(16,24,40,0.04)',
  border: '1px solid #EAECF0',
  height: '100%'
};

// Precise time formatter
const formatTime = (hours) => {
  const hrs = parseFloat(hours) || 0;
  if (hrs === 0) return '0 hrs';
  const totalSeconds = Math.round(hrs * 3600);
  if (totalSeconds < 60) return `${totalSeconds} secs`;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  if (totalMinutes < 60) {
    if (remainingSeconds > 0) return `${totalMinutes}m ${remainingSeconds}s`;
    return `${totalMinutes} mins`;
  }
  const displayHours = Math.floor(totalMinutes / 60);
  const displayMinutes = totalMinutes % 60;
  if (displayMinutes > 0) return `${displayHours}h ${displayMinutes}m`;
  return `${displayHours} hrs`;
};

export default function Reports() {
  const [loading, setLoading] = useState(true);
  
  const [turnaround, setTurnaround] = useState({ data: [], averageHours: 0 });
  const [locationStock, setLocationStock] = useState({ components: [], containers: [] });
  const [exceptionRate, setExceptionRate] = useState([]);
  const [stuckTransit, setStuckTransit] = useState([]);
  const [auditExceptions, setAuditExceptions] = useState([]);
  const [dailyMovement, setDailyMovement] = useState([]);

  const [dateRange, setDateRange] = useState('30days');
  const [customStart, setCustomStart] = useState(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [customEnd, setCustomEnd] = useState(dayjs().format('YYYY-MM-DD'));

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, lRes, eRes, sRes, dRes, aRes] = await Promise.all([
        getTurnaroundReport(),
        getLocationStockReport(),
        getExceptionRateReport(),
        getStuckInTransitReport(),
        getDailyMovementReport(customStart, customEnd),
        getAuditExceptionsReport(customStart, customEnd)
      ]);
      setTurnaround(tRes.data || { data: [], averageHours: 0 });
      setLocationStock(lRes.data || { components: [], containers: [] });
      setExceptionRate(Array.isArray(eRes.data) ? eRes.data : []);
      setStuckTransit(Array.isArray(sRes.data) ? sRes.data : []);
      setDailyMovement(Array.isArray(dRes.data) ? dRes.data : []);
      setAuditExceptions(Array.isArray(aRes.data) ? aRes.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [dateRange, customStart, customEnd]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // ── AGGREGATE STOCK DATA FOR CHART (Since backend now returns breakdown) ──
  const stockChartData = React.useMemo(() => {
    return Object.values(
      (locationStock.components || []).reduce((acc, curr) => {
        if (!acc[curr.location_name]) {
          acc[curr.location_name] = { location_name: curr.location_name, total_components: 0 };
        }
        acc[curr.location_name].total_components += curr.quantity;
        return acc;
      }, {})
    );
  }, [locationStock.components]);

  // ── INDIVIDUAL EXCEL EXPORTS WITH PROPER HEADERS ──
  const exportIndividual = (type) => {
    const wb = XLSX.utils.book_new();
    let formattedData = [];
    let sheetName = "";

    if (type === 'turnaround') {
      if (!turnaround.data || turnaround.data.length === 0) return alert("No data to export.");
      formattedData = turnaround.data.map(r => ({
        'Set ID': r.set_id,
        'Customer Location': r.customer_location,
        'Dispatch Time': dayjs(r.dispatch_time).format('DD MMM YYYY, hh:mm A'),
        'Return Time': dayjs(r.returned_at).format('DD MMM YYYY, hh:mm A'),
        'Turnaround (Hours)': parseFloat(r.hours_out).toFixed(2)
      }));
      sheetName = "Turnaround Time";
    } else if (type === 'stock') {
      if (!locationStock.components || locationStock.components.length === 0) return alert("No data to export.");
      formattedData = locationStock.components.map(r => ({
        'Location Name': r.location_name,
        'Component Type': r.component_type,
        'Quantity': r.quantity
      }));
      sheetName = "Location Stock";
    } else if (type === 'exception') {
      if (!exceptionRate || exceptionRate.length === 0) return alert("No data to export.");
      formattedData = exceptionRate.map(r => ({
        'Date': dayjs(r.date).format('DD MMM YYYY'),
        'Total Exceptions': r.exception_count
      }));
      sheetName = "Exception Rate";
    }

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(formattedData), sheetName);
    XLSX.writeFile(wb, `Unostar_${sheetName.replace(' ', '_')}_${dayjs().format('YYYY-MM-DD')}.xlsx`);
  };

  // ── MASTER EXCEL EXPORT (MULTI-SHEET) ──
  const exportMasterReport = () => {
    const wb = XLSX.utils.book_new();

    if (turnaround.data && turnaround.data.length > 0) {
      const formatted = turnaround.data.map(r => ({
        'Set ID': r.set_id,
        'Customer Location': r.customer_location,
        'Dispatch Time': dayjs(r.dispatch_time).format('DD MMM YYYY, hh:mm A'),
        'Return Time': dayjs(r.returned_at).format('DD MMM YYYY, hh:mm A'),
        'Turnaround (Hours)': parseFloat(r.hours_out).toFixed(2)
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(formatted), "Turnaround Time");
    }

    if (locationStock.components && locationStock.components.length > 0) {
      const formatted = locationStock.components.map(r => ({
        'Location Name': r.location_name,
        'Component Type': r.component_type,
        'Quantity': r.quantity
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(formatted), "Location Stock");
    }

    if (exceptionRate && exceptionRate.length > 0) {
      const formatted = exceptionRate.map(r => ({
        'Date': dayjs(r.date).format('DD MMM YYYY'),
        'Total Exceptions': r.exception_count
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(formatted), "Exception Rate");
    }

    if (wb.SheetNames.length === 0) return alert("No data available to export.");
    XLSX.writeFile(wb, `Unostar_Executive_Report_${dayjs().format('YYYY-MM-DD')}.xlsx`);
  };

  return (
    <Box>
      {/* HEADER & MASTER EXPORT */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>Executive Reports</Typography>
          <Typography variant="body2" color="text.secondary">
            Generate, analyze, and export live supply chain insights.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<FileDownload />} 
          onClick={exportMasterReport}
          sx={{ bgcolor: '#102A43', textTransform: 'none', fontWeight: 600, borderRadius: 2, boxShadow: '0px 4px 12px rgba(16,24,40,0.15)', '&:hover': { bgcolor: '#1E3A5F' } }}
        >
          Download Full Report
        </Button>
      </Box>

      {/* FILTER BAR */}
      <Card sx={{ mb: 4, borderRadius: 2, boxShadow: '0px 2px 12px rgba(16,24,40,0.06)', border: '1px solid #EAECF0' }}>
        <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', py: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
            <FilterAlt sx={{ color: '#175CD3', fontSize: 20 }} />
            <Typography sx={{ fontWeight: 600, fontSize: 14, color: '#344054' }}>Report Period:</Typography>
          </Box>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select value={dateRange} onChange={(e) => setDateRange(e.target.value)} sx={{ borderRadius: 2 }}>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="7days">Last 7 Days</MenuItem>
              <MenuItem value="30days">Last 30 Days</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
              <MenuItem value="custom">Custom Range</MenuItem>
            </Select>
          </FormControl>

          {dateRange === 'custom' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField type="date" size="small" value={customStart} onChange={(e) => setCustomStart(e.target.value)} sx={{ borderRadius: 2 }} />
              <Typography variant="body2" color="text.secondary">to</Typography>
              <TextField type="date" size="small" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} sx={{ borderRadius: 2 }} />
            </Box>
          )}

          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchReports} disabled={loading} sx={{ textTransform: 'none', borderRadius: 2, ml: 'auto', fontWeight: 600 }}>
            Generate
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 10, gap: 2 }}>
          <CircularProgress size={40} />
          <Typography variant="body2" color="text.secondary">Crunching numbers...</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          
          {/* 1. Turnaround Time */}
          <Grid size={{ xs: 12 }}>
            <Card sx={cardSx}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Timer sx={{ color: '#5B5BD6' }} /> Turnaround Time
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Average time containers spend at customer sites before return.
                    </Typography>
                  </Box>
                  <Button size="small" variant="outlined" startIcon={<FileDownload />} onClick={() => exportIndividual('turnaround')} sx={{ textTransform: 'none', borderRadius: 2 }}>
                    Export
                  </Button>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: '1 1 200px', p: 2, bgcolor: '#F4F3FF', borderRadius: 2, border: '1px solid #D9D6FE', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1.5, bgcolor: '#5B5BD6', borderRadius: 2, color: '#fff', display: 'flex' }}>
                      <TrendingUp />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#5B5BD6', mb: 0.5 }}>Avg. Time Out</Typography>
                      <Typography sx={{ fontSize: 24, fontWeight: 800, color: '#5B5BD6', lineHeight: 1 }}>
                        {formatTime(turnaround.averageHours)}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ flex: '1 1 200px', p: 2, bgcolor: '#F9FAFB', borderRadius: 2, border: '1px solid #EAECF0', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1.5, bgcolor: '#344054', borderRadius: 2, color: '#fff', display: 'flex' }}>
                      <Inventory2 />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#667085', mb: 0.5 }}>Sets Returned</Typography>
                      <Typography sx={{ fontSize: 24, fontWeight: 800, color: '#344054', lineHeight: 1 }}>{turnaround.data.length}</Typography>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ height: 280 }}>
                  {turnaround.data.length === 0 ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#98A2B3' }}>
                      <Typography>No turnaround data available for this period.</Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={turnaround.data.slice(0, 10)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAECF0" />
                        <XAxis dataKey="set_id" tick={{ fontSize: 12, fill: '#667085' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: '#667085' }} axisLine={false} tickLine={false} />
                        <RechartsTooltip content={<CustomTooltip suffix="hrs" />} cursor={{ fill: '#F9FAFB' }} />
                        <Bar dataKey="hours_out" fill="#5B5BD6" radius={[6, 6, 0, 0]} name="Hours Out" barSize={50} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* 2. Location Stock */}
          <Grid size={{ xs: 12 }}>
            <Card sx={cardSx}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Place sx={{ color: '#12B76A' }} /> Location-Wise Stock
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Total components currently sitting at each location.
                    </Typography>
                  </Box>
                  <Button size="small" variant="outlined" startIcon={<FileDownload />} onClick={() => exportIndividual('stock')} sx={{ textTransform: 'none', borderRadius: 2 }}>
                    Export
                  </Button>
                </Box>
                
                <Box sx={{ height: 280 }}>
                  {stockChartData.length === 0 ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#98A2B3' }}>
                      <Typography>No stock data available.</Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stockChartData} layout="vertical" margin={{ top: 0, right: 10, left: 40, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EAECF0" />
                        <XAxis type="number" tick={{ fontSize: 12, fill: '#667085' }} axisLine={false} tickLine={false} />
                        <YAxis dataKey="location_name" type="category" tick={{ fontSize: 13, fontWeight: 600, fill: '#344054' }} axisLine={false} tickLine={false} width={120} />
                        <RechartsTooltip content={<CustomTooltip suffix="parts" />} cursor={{ fill: '#F9FAFB' }} />
                        <Bar dataKey="total_components" fill="#12B76A" radius={[0, 6, 6, 0]} name="Components" barSize={28} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* 3. Exception Rate */}
          <Grid size={{ xs: 12 }}>
            <Card sx={cardSx}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Warning sx={{ color: '#F04438' }} /> Exception Rate
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Daily breakdown of missing or incomplete scans detected at the gate.
                    </Typography>
                  </Box>
                  <Button size="small" variant="outlined" startIcon={<FileDownload />} onClick={() => exportIndividual('exception')} sx={{ textTransform: 'none', borderRadius: 2 }}>
                    Export
                  </Button>
                </Box>
                
                <Box sx={{ height: 280 }}>
                  {exceptionRate.length === 0 ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#98A2B3' }}>
                      <Typography>No exceptions recorded for this period. Good job!</Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={exceptionRate} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorExceptions" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F04438" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#F04438" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAECF0" />
                        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#667085' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: '#667085' }} axisLine={false} tickLine={false} />
                        <RechartsTooltip content={<CustomTooltip suffix="exceptions" />} />
                        <Area type="monotone" dataKey="exception_count" stroke="#F04438" strokeWidth={3} fill="url(#colorExceptions)" name="Exceptions" activeDot={{ r: 6, strokeWidth: 3, stroke: '#FFF' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* 4. Stuck in Transit */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={cardSx}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Warning sx={{ color: '#B54708' }} /> Stuck in Transit
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Trucks dispatched over 24 hours ago that haven't been received.
                    </Typography>
                  </Box>
                </Box>

                {stuckTransit.length === 0 ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 150, color: '#12B76A' }}>
                    <Typography>No trucks delayed. Great!</Typography>
                  </Box>
                ) : (
                  <Box sx={{ maxHeight: 250, overflowY: 'auto' }}>
                    {stuckTransit.map((truck) => (
                      <Box key={truck.challan_no} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, mb: 1, bgcolor: '#FFFAEB', border: '1px solid #FEDF89', borderRadius: 2 }}>
                        <Box>
                          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{truck.challan_no} ({truck.vehicle_no})</Typography>
                          <Typography sx={{ fontSize: 12, color: '#667085' }}>To: {truck.destination}</Typography>
                        </Box>
                        <Chip label={`${truck.hours_stuck}h Delayed`} size="small" sx={{ bgcolor: '#FEF0C7', color: '#B54708', fontWeight: 700 }} />
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          
          {/* 5. Overrides & Audits */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={cardSx}>
              <CardContent sx={{ p: 3 }}>

                {/* Header */}
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3
                }}>
                  <Box>
                    <Typography variant="h5" sx={{
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <Warning sx={{ color: '#F04438' }} />
                      Manual Overrides
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Recent supervisor overrides and incomplete dispatches.
                    </Typography>
                  </Box>

                  <Chip
                    label={`${auditExceptions?.length || 0} Events`}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      bgcolor: '#FEF3F2',
                      color: '#B42318',
                      borderRadius: 2
                    }}
                  />
                </Box>

                {/* Empty State */}
                {!Array.isArray(auditExceptions) || auditExceptions.length === 0 ? (
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 190,
                    border: '1px dashed #D0D5DD',
                    borderRadius: 2,
                    bgcolor: '#FCFCFD',
                    gap: 1
                  }}>
                    <CheckCircleOutlined sx={{ fontSize: 36, color: '#12B76A' }} />

                    <Typography sx={{ fontWeight: 600, color: '#344054' }}>
                      No audit events found
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      Supervisor overrides and exceptions will appear here.
                    </Typography>
                  </Box>
                ) : (

                  /* Activity List */
                  <Box sx={{
                    maxHeight: 310,
                    overflowY: 'auto',
                    pr: 0.5,
                    '&::-webkit-scrollbar': { width: 5 },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: '#D0D5DD',
                      borderRadius: 5
                    }
                  }}>

                    {auditExceptions.slice(0, 10).map((log, idx) => {

                      const action = String(log?.action_type || '').toUpperCase();

                      const isIncomplete = action.includes('INCOMPLETE');

                      return (
                        <Box
                          key={log?.id || `${log?.created_at}-${idx}`}
                          sx={{
                            display: 'flex',
                            gap: 1.5,
                            p: 1.75,
                            mb: 1.25,
                            border: '1px solid #EAECF0',
                            borderRadius: 2,
                            bgcolor: '#FFFFFF',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              borderColor: '#D0D5DD',
                              bgcolor: '#FCFCFD'
                            }
                          }}
                        >

                          {/* Event Icon */}
                          <Box sx={{
                            width: 36,
                            height: 36,
                            minWidth: 36,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: isIncomplete ? '#FEF3F2' : '#FFFAEB'
                          }}>
                            <Warning
                              sx={{
                                fontSize: 19,
                                color: isIncomplete ? '#D92D20' : '#DC6803'
                              }}
                            />
                          </Box>

                          {/* Event Details */}
                          <Box sx={{ flex: 1, minWidth: 0 }}>

                            <Box sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              gap: 1,
                              flexWrap: 'wrap'
                            }}>
                              <Typography sx={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: '#101828',
                                overflowWrap: 'anywhere'
                              }}>
                                {log?.operator_name || 'System'}
                              </Typography>

                              <Typography sx={{
                                fontSize: 11,
                                color: '#667085',
                                whiteSpace: 'nowrap'
                              }}>
                                {log?.created_at
                                  ? dayjs(log.created_at).format('DD MMM, hh:mm A')
                                  : '—'}
                              </Typography>
                            </Box>

                            <Typography sx={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: '#475467',
                              mt: 0.5,
                              mb: 0.75
                            }}>
                              {(log?.action_type || 'AUDIT EVENT')
                                .replace(/_/g, ' ')}
                            </Typography>

                            <Typography sx={{
                              fontSize: 12,
                              color: '#667085',
                              lineHeight: 1.6,
                              overflowWrap: 'anywhere'
                            }}>
                              {log?.details || 'No additional details available'}
                            </Typography>

                            {log?.challan_no && (
                              <Box sx={{ mt: 1 }}>
                                <Chip
                                  size="small"
                                  label={`Reference: ${log.challan_no}`}
                                  variant="outlined"
                                  sx={{
                                    height: 23,
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: '#175CD3',
                                    borderColor: '#B2DDFF',
                                    bgcolor: '#EFF8FF'
                                  }}
                                />
                              </Box>
                            )}

                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                )}

              </CardContent>
            </Card>
          </Grid>


          {/* 6. Daily Movement */}
          <Grid size={{ xs: 12 }}>
            <Card sx={cardSx}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUp sx={{ color: '#175CD3' }} /> Daily Movement
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Total tags scanned per day, grouped by action (Dispatch, Receive, Return).
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ height: 280 }}>
                  {dailyMovement.length === 0 ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#98A2B3' }}>
                      <Typography>No movement data available for this period.</Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyMovement} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAECF0" />
                        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#667085' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: '#667085' }} axisLine={false} tickLine={false} />
                        <RechartsTooltip content={<CustomTooltip suffix="tags" />} cursor={{ fill: '#F9FAFB' }} />
                        <Bar dataKey="unique_tags" fill="#175CD3" radius={[6, 6, 0, 0]} name="Tags Scanned" barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

        </Grid>
      )}
    </Box>
  );
}