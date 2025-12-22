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
          alignItems: { xs: 'center', sm: 'center' },
          justifyContent: { xs: 'center', sm: 'space-between' },
          gap: { xs: 1.5, sm: 2 },
          borderTop: `4px solid ${COLORS.secondary}`,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}
      >
        <Box 
          display="flex" 
          alignItems="center" 
          gap={{ xs: 1, sm: 2 }}
          sx={{
            flexWrap: 'wrap',
            justifyContent: { xs: 'center', sm: 'flex-start' }
          }}
        >
          <Box
            component="img"
            src="/assets/SACL-LOGO-01.jpg"
            alt="Sakthi Auto"
            sx={{
              height: { xs: 40, sm: 45, md: 55 },
              width: 'auto',
              objectFit: 'contain',
            }}
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: COLORS.primary,
              fontSize: { xs: '0.8rem', sm: '1rem', md: '1.25rem' },
              textAlign: { xs: 'center', sm: 'left' }
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
            fontSize: { xs: '0.6rem', sm: '0.75rem', md: '0.875rem' },
            borderRadius: '12px',
            height: 'auto',
            flexShrink: 0,
            "& .MuiChip-label": {
              padding: { xs: '6px 10px', sm: '10px 16px', md: '12px 20px' },
              display: 'block',
              textAlign: 'center',
              whiteSpace: 'nowrap'
            }
          }}
        />
      </Paper>

    </Box>
  );
};

export default SaclHeader;
