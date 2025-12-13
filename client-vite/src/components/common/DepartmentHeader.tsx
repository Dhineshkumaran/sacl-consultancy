import { Box, Chip, Paper, Typography } from "@mui/material";
import { COLORS } from "../../theme/appTheme";
import FactoryIcon from '@mui/icons-material/Factory';
import PersonIcon from "@mui/icons-material/Person";

const DepartmentHeader = ({ title, userIP, user }: any) => {
  return (
    <Paper sx={{
      p: 1.5, mb: 3,
      display: "flex", justifyContent: "space-between", alignItems: "center",
      borderLeft: `6px solid ${COLORS.secondary}`,
      border: `1px solid #e2e8f0`
    }}>
      <Box display="flex" alignItems="center" gap={2}>
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
    </Paper>
  )
}

export default DepartmentHeader;