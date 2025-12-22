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
          p: { xs: 1.5, sm: 2, md: 3 },
          mb: { xs: 2, md: 3 },
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: { xs: 1.5, sm: 2 },
          borderTop: `4px solid ${COLORS.secondary}`,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }}>
          <Box
            component="img"
            src="/assets/SACL-LOGO-01.jpg"
            alt="Sakthi Auto"
            sx={{
              height: { xs: 35, sm: 45, md: 55 },
              width: 'auto',
              objectFit: 'contain',
            }}
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: COLORS.primary,
              fontSize: { xs: '0.85rem', sm: '1rem', md: '1.25rem' },
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
            fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' },
            borderRadius: '12px',
            alignSelf: { xs: 'flex-end', sm: 'auto' },
            "& .MuiChip-label": {
              padding: { xs: '8px 12px', sm: '10px 16px', md: '12px 20px' },
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
