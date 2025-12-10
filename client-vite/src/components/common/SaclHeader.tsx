import React from 'react';
import { Box, Paper, Typography, Chip } from '@mui/material';

const COLORS = {
    primary: "#1e293b",
    secondary: "#ea580c",
    border: "#e2e8f0",
};

const SaclHeader: React.FC = () => {
    return (
        <Box>
            {/* Main Header */}
            

            {/* Foundry Sample Card Header */}
            <Paper
  sx={{
    p: 3,
    mb: 3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderTop: `4px solid ${COLORS.secondary}`,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
  }}
>
  <Box display="flex" alignItems="center" gap={2} sx={{ position: 'absolute', left: 24 }}>
    <Box
      component="img"
      src="/assets/SACL-LOGO-01.jpg"
      alt="Sakthi Auto"
      sx={{
        height: { xs: 45, md: 55 },
        width: 'auto',
        objectFit: 'contain',
      }}
    />
    <Typography
      variant="h6"
      sx={{
        fontWeight: 700,
        color: COLORS.primary,
        fontSize: { xs: '1rem', md: '1.25rem' },
      }}
    >
      Sakthi Auto Component Limited
    </Typography>
  </Box>

  <Chip
    label="FOUNDRY SAMPLE CARD"
    sx={{
      backgroundColor: '#FCD34D',
      color: COLORS.primary,
      fontWeight: 700,
      fontSize: { xs: '0.75rem', md: '0.875rem' },
      borderRadius: '12px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      "& .MuiChip-label": {
        padding: '12px 20px',
        display: 'block',
        textAlign: 'center',
      }
    }}
  />
</Paper>

        </Box>
    );
};

export default SaclHeader;