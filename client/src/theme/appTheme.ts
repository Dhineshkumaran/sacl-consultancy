import { createTheme } from '@mui/material/styles';

/**
 * Application color palette
 * Used consistently across all components
 */
export const COLORS = {
    primary: '#1e293b',
    secondary: '#ea580c',
    background: '#f1f5f9',
    surface: '#ffffff',
    border: '#e2e8f0',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    blueHeaderBg: '#eff6ff',
    blueHeaderText: '#3b82f6',
    orangeHeaderBg: '#fff7ed',
    orangeHeaderText: '#c2410c',
    successBg: '#ecfdf5',
    successText: '#059669',
    headerBg: '#d1d5db', // Grey header for Sand Properties
    accentBlue: '#0ea5e9', // For PouringDetailsTable
    accentGreen: '#10b981', // For PouringDetailsTable
} as const;

/**
 * Shared MUI theme configuration
 * Provides consistent styling across all inspection forms and pages
 */
export const appTheme = createTheme({
    breakpoints: {
        values: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920 },
    },
    palette: {
        primary: { main: COLORS.primary },
        secondary: { main: COLORS.secondary },
        background: { default: COLORS.background, paper: COLORS.surface },
        text: { primary: COLORS.textPrimary, secondary: COLORS.textSecondary },
    },
    typography: {
        fontFamily: '"Trebuchet MS", "Lucida Grande", sans-serif',
        h1: { fontFamily: '"Futura", "Century Gothic", sans-serif', fontWeight: 700, color: COLORS.primary },
        h2: { fontFamily: '"Futura", "Century Gothic", sans-serif', fontWeight: 700, color: COLORS.primary },
        h3: { fontFamily: '"Futura", "Century Gothic", sans-serif', fontWeight: 700, color: COLORS.primary },
        h4: { fontFamily: '"Futura", "Century Gothic", sans-serif', fontWeight: 700, color: COLORS.primary },
        h5: { fontFamily: '"Futura", "Century Gothic", sans-serif', fontWeight: 700, color: COLORS.primary },
        h6: { fontFamily: '"Futura", "Century Gothic", sans-serif', fontWeight: 700, color: COLORS.primary },
        subtitle1: { fontWeight: 600, color: COLORS.primary },
        subtitle2: {
            fontWeight: 600,
            fontSize: '0.75rem',
            letterSpacing: 0.5,
            textTransform: 'uppercase'
        },
        body2: {
            fontFamily: '"Trebuchet MS", "Lucida Grande", sans-serif',
            fontSize: '0.875rem'
        },
        caption: {
            fontWeight: 600,
            color: COLORS.textSecondary,
            textTransform: 'uppercase'
        },
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
                    border: `1px solid ${COLORS.border}`,
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottom: `1px solid ${COLORS.border}`,
                    borderRight: `1px solid ${COLORS.border}`,
                    padding: '8px 12px',
                },
                head: {
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    textAlign: 'center',
                    color: COLORS.blueHeaderText,
                    backgroundColor: COLORS.blueHeaderBg,
                },
                body: {
                    color: COLORS.textPrimary,
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 8,
                        backgroundColor: '#fff',
                        '& fieldset': { borderColor: '#cbd5e1' },
                        '&:hover fieldset': { borderColor: COLORS.primary },
                        '&.Mui-focused fieldset': {
                            borderColor: COLORS.secondary,
                            borderWidth: 1
                        },
                    },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    fontWeight: 600,
                    textTransform: 'none',
                    padding: '8px 24px',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    },
                },
            },
        },
    },
});

export default appTheme;
