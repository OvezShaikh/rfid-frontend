import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#5B5BD6', contrastText: '#fff' },
    secondary: { main: '#12B76A' },
    background: { default: '#F7F8FA', paper: '#FFFFFF' },
    text: { primary: '#101828', secondary: '#667085' },
    divider: '#EAECF0',
    success: { main: '#12B76A' },
    warning: { main: '#F79009' },
    error: { main: '#F04438' },
    info: { main: '#2E90FA' },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Inter","Roboto","Helvetica","Arial",sans-serif',
    h1: { fontSize: 30, fontWeight: 700, letterSpacing: -0.5 },
    h2: { fontSize: 22, fontWeight: 700 },
    h3: { fontSize: 18, fontWeight: 600 },
    h4: { fontSize: 16, fontWeight: 600 },
    h5: { fontSize: 14, fontWeight: 600 },
    h6: { fontSize: 13, fontWeight: 600 },
    body1: { fontSize: 14 },
    body2: { fontSize: 13, color: '#667085' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #EAECF0',
          boxShadow: '0px 1px 3px rgba(16,24,40,0.04)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, boxShadow: 'none' },
        containedPrimary: { boxShadow: 'none' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 600, color: '#667085', backgroundColor: '#F9FAFB', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4 },
      },
    },
  },
});

export default theme;