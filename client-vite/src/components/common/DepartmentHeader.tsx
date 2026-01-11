import { Box, Chip, Paper, Typography } from "@mui/material";
import { COLORS } from "../../theme/appTheme";
import FactoryIcon from '@mui/icons-material/Factory';
import PersonIcon from "@mui/icons-material/Person";
import BackButton from "./BackButton";
import { useNavigate } from "react-router-dom";

const DepartmentHeader = ({ title, userIP, user }: any) => {
  const navigate = useNavigate();

  return (
    <Paper sx={{
      mb: 3,
      p: 1.5,
      display: "flex", justifyContent: "space-between", alignItems: "center",
      border: `1px solid #e2e8f0`,
      borderLeft: `6px solid ${COLORS.secondary}`,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(8px)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    }}>
      <Box display="flex" alignItems="center" gap={2}>
        <BackButton label="Back to Dashboard" variant="inline" />
        <FactoryIcon sx={{ fontSize: 32, color: COLORS.primary }} />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
      </Box>
      <Box display="flex" gap={1} alignItems="center">
        <Chip label={userIP} size="small" variant="outlined" sx={{ bgcolor: 'white' }} />
        <Chip
          label={`${user?.username}`}
          sx={{
            bgcolor: COLORS.secondary,
            color: 'white',
            fontWeight: 700,
            fontSize: '0.75rem'
          }}
          size="small"
          icon={<PersonIcon style={{ color: 'white' }} />}
        />
      </Box>
    </Paper >
  )
}

export default DepartmentHeader;
