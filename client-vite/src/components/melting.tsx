import React from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Divider,
  Chip,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
} from "@mui/material";

// Define the data structure for submitted sample card
export interface PartData {
  id: number;
  pattern_code: string;
  part_name: string;
  material_grade: string;
  chemical_composition: string;
  micro_structure: string;
  tensile: string;
  impact: string;
  hardness: string;
  xray: string;
  created_at: string;
}

export interface SubmittedData {
  selectedPart: PartData;
  selectedPattern: PartData | null;
  machine: string;
  reason: string;
  trialNo: string;
  samplingDate: string;
  mouldCount: string;
  tensileData: { tensileStrength: string; yieldStrength: string; elongation: string };
  microData: { pearlite: string; ferrite: string; carbide: string };
}

// Reuse the same colors and theme
const SAKTHI_COLORS = {
  primary: "#2950bbff",
  secondary: "#DC2626",
  accent: "#F59E0B",
  background: "#F8FAFC",
  lightBlue: "#3B82F6",
  darkGray: "#374151",
  lightGray: "#E5E7EB",
  white: "#FFFFFF",
  success: "#10B981",
};

const NAV_ITEMS = ["Contact Us"];

// Hamburger Icon Component (reuse from first page)
const HamburgerIcon = () => (
  <Box sx={{ width: 20, height: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
    <Box sx={{ width: '100%', height: 2, backgroundColor: 'currentColor' }} />
    <Box sx={{ width: '100%', height: 2, backgroundColor: 'currentColor' }} />
    <Box sx={{ width: '100%', height: 2, backgroundColor: 'currentColor' }} />
  </Box>
);

// Navigation Bar Component (reuse from first page)
function NavigationBar() {
  const isMobile = useMediaQuery('(max-width: 900px)');
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2, color: SAKTHI_COLORS.primary }}>
        SAKTHI AUTO COMPONENT LIMITED
      </Typography>
      <Divider />
      <List>
        {NAV_ITEMS.map((item) => (
          <ListItem key={item} disablePadding>  
            <ListItemText 
              primary={item} 
              sx={{ 
                textAlign: 'center',
                '& .MuiListItemText-primary': {
                  fontWeight: 600,
                  color: SAKTHI_COLORS.primary,
                }
              }} 
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <AppBar 
      position="fixed"
      sx={{ 
        bgcolor: SAKTHI_COLORS.white, 
        color: SAKTHI_COLORS.primary, 
        boxShadow: 1,
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar>
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <HamburgerIcon />
          </IconButton>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Box
            sx={{
              width: 138,
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 1,
              mr: 2
            }}
          >
            <img 
              src="/assets/LOGO.png" 
              alt="Sakthi Auto Logo" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                borderRadius: 4
              }}
            />
          </Box>

          <Typography
            variant="h6"
            component="div"
            sx={{ 
              fontWeight: 700,
              display: { xs: 'none', sm: 'block' }
            }}
          >
            SAKTHI AUTO COMPONENT LIMITED
          </Typography>
        </Box>

        {!isMobile && (
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            {NAV_ITEMS.map((item) => (
              <Button
                key={item}
                sx={{
                  color: SAKTHI_COLORS.primary,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  '&:hover': {
                    bgcolor: SAKTHI_COLORS.background,
                  }
                }}
              >
                {item}
              </Button>
            ))}
          </Box>
        )}
      </Toolbar>

      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: 240,
            top: '64px',
          },
        }}
      >
        {drawer}
      </Drawer>
    </AppBar>
  );
}

interface SampleCardSubmittedProps {
  submittedData: SubmittedData;
  onBackToForm: () => void;
}

export default function SampleCardSubmitted({ submittedData, onBackToForm }: SampleCardSubmittedProps) {
  return (
    <Box sx={{ bgcolor: "background.default", minHeight: '100vh', pt: '80px' }}>
      <NavigationBar />

      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Paper variant="outlined" sx={{ overflow: "hidden", border: `2px solid ${SAKTHI_COLORS.primary}`, bgcolor: SAKTHI_COLORS.white }}>
          {/* Header Section */}
          <Box sx={{ p: 3, borderBottom: `3px solid ${SAKTHI_COLORS.primary}`, background: `linear-gradient(135deg, ${SAKTHI_COLORS.primary} 0%, ${SAKTHI_COLORS.lightBlue} 100%)`, color: SAKTHI_COLORS.white }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, alignItems: 'start' }}>
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Pattern Code</Typography>
                <Paper sx={{ p: 2, bgcolor: SAKTHI_COLORS.white, color: SAKTHI_COLORS.darkGray, borderRadius: 2 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    {submittedData.selectedPattern?.pattern_code || "N/A"}
                  </Typography>
                </Paper>
              </Box>

              <Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: SAKTHI_COLORS.white, mb: 1 }}>TRIAL No</Typography>
                    <Paper sx={{ p: 2, bgcolor: SAKTHI_COLORS.white, color: SAKTHI_COLORS.darkGray, borderRadius: 2 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        {submittedData.trialNo || "N/A"}
                      </Typography>
                    </Paper>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: SAKTHI_COLORS.white, mb: 1 }}>Part Name</Typography>
                    <Paper sx={{ p: 2, bgcolor: SAKTHI_COLORS.white, color: SAKTHI_COLORS.darkGray, borderRadius: 2 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        {submittedData.selectedPart?.part_name || "N/A"}
                      </Typography>
                    </Paper>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Title Section */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 3, borderBottom: `2px solid ${SAKTHI_COLORS.lightGray}`, bgcolor: SAKTHI_COLORS.background }}>
            <Paper variant="outlined" sx={{ border: `4px solid ${SAKTHI_COLORS.primary}`, bgcolor: SAKTHI_COLORS.white, borderRadius: 2 }}>
              <Box sx={{ py: 2, px: 3, textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 800, color: SAKTHI_COLORS.primary, fontSize: '1.1rem' }}>Metallurgical Specification</Typography>
              </Box>
            </Paper>
            <Chip label="MICRO" sx={{ bgcolor: SAKTHI_COLORS.secondary, color: SAKTHI_COLORS.white, fontWeight: 700, fontSize: "1rem", height: 36, px: 2 }} />
          </Box>

          {/* Success Message */}
          <Box sx={{ px: 3, pt: 3, pb: 2 }}>
            <Chip 
              icon={<span style={{ fontSize: '1.2rem' }}>✅</span>} 
              label="Sample Card Successfully Submitted" 
              sx={{ 
                bgcolor: SAKTHI_COLORS.success + '20', 
                color: SAKTHI_COLORS.darkGray, 
                border: `1px dashed ${SAKTHI_COLORS.success}`, 
                fontWeight: 600, 
                fontSize: '0.875rem', 
                py: 2.5 
              }} 
            />
          </Box>

          {/* Specification Table */}
          <Box sx={{ p: 3 }}>
            <Paper variant="outlined" sx={{ border: `2px solid ${SAKTHI_COLORS.primary}`, overflow: "auto", mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {["Material Grade", "Tensile Strength (N/mm²)", "Elongation (%)", "Pearlite (%)", "Ferrite (%)", "Carbide (%)", "Hardness (BHN)"].map((h) => (
                      <TableCell key={h} align="center" sx={{ 
                        fontSize: '0.9rem', 
                        minWidth: '120px',
                        fontWeight: 700,
                        backgroundColor: SAKTHI_COLORS.lightBlue,
                        color: SAKTHI_COLORS.white,
                        borderRight: `2px solid ${SAKTHI_COLORS.primary}`,
                      }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell align="center" sx={{ borderRight: `2px solid ${SAKTHI_COLORS.lightGray}` }}>
                      <Typography sx={{ fontWeight: 600 }}>
                        {submittedData.selectedPart?.material_grade || "N/A"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ borderRight: `2px solid ${SAKTHI_COLORS.lightGray}` }}>
                      <Typography sx={{ fontWeight: 600 }}>
                        {submittedData.tensileData?.tensileStrength || "--"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ borderRight: `2px solid ${SAKTHI_COLORS.lightGray}` }}>
                      <Typography sx={{ fontWeight: 600 }}>
                        {submittedData.tensileData?.elongation || "--"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ borderRight: `2px solid ${SAKTHI_COLORS.lightGray}` }}>
                      <Typography sx={{ fontWeight: 600 }}>
                        {submittedData.microData?.pearlite || "--"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ borderRight: `2px solid ${SAKTHI_COLORS.lightGray}` }}>
                      <Typography sx={{ fontWeight: 600 }}>
                        {submittedData.microData?.ferrite || "--"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ borderRight: `2px solid ${SAKTHI_COLORS.lightGray}` }}>
                      <Typography sx={{ fontWeight: 600 }}>
                        {submittedData.microData?.carbide || "--"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography sx={{ fontWeight: 600 }}>
                        {submittedData.selectedPart?.hardness?.split('\n')[0] || "--"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Paper>

            {/* Sampling Details Table */}
            <Paper variant="outlined" sx={{ border: `2px solid ${SAKTHI_COLORS.primary}`, overflow: "auto", mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell align="center" sx={{ 
                      fontWeight: 700, 
                      fontSize: '0.9rem', 
                      minWidth: '150px',
                      backgroundColor: SAKTHI_COLORS.lightBlue,
                      color: SAKTHI_COLORS.white,
                      borderRight: `2px solid ${SAKTHI_COLORS.primary}`,
                    }}>
                      Date of Sampling
                    </TableCell>
                    <TableCell align="center" sx={{ 
                      fontWeight: 700, 
                      fontSize: '0.9rem', 
                      minWidth: '140px',
                      backgroundColor: SAKTHI_COLORS.lightBlue,
                      color: SAKTHI_COLORS.white,
                      borderRight: `2px solid ${SAKTHI_COLORS.primary}`,
                    }}>
                      No. of Moulds
                    </TableCell>
                    <TableCell align="center" sx={{ 
                      fontWeight: 700, 
                      fontSize: '0.9rem', 
                      minWidth: '180px',
                      backgroundColor: SAKTHI_COLORS.lightBlue,
                      color: SAKTHI_COLORS.white,
                      borderRight: `2px solid ${SAKTHI_COLORS.primary}`,
                    }}>
                      DISA / FOUNDRY-A
                    </TableCell>
                    <TableCell align="center" sx={{ 
                      fontWeight: 700, 
                      fontSize: '0.9rem', 
                      minWidth: '180px',
                      backgroundColor: SAKTHI_COLORS.lightBlue,
                      color: SAKTHI_COLORS.white,
                    }}>
                      Reason For Sampling
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell align="center" sx={{ borderRight: `2px solid ${SAKTHI_COLORS.lightGray}` }}>
                      <Typography sx={{ fontWeight: 600 }}>
                        {submittedData.samplingDate || "N/A"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ borderRight: `2px solid ${SAKTHI_COLORS.lightGray}` }}>
                      <Typography sx={{ fontWeight: 600 }}>
                        {submittedData.mouldCount || "N/A"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ borderRight: `2px solid ${SAKTHI_COLORS.lightGray}` }}>
                      <Typography sx={{ fontWeight: 600 }}>
                        {submittedData.machine || "N/A"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography sx={{ fontWeight: 600 }}>
                        {submittedData.reason || "N/A"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Paper>

            {/* Melting Table */}
            <Paper variant="outlined" sx={{ border: `2px solid ${SAKTHI_COLORS.primary}`, overflow: "auto", mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell align="center" sx={{ 
                      fontWeight: 700, 
                      fontSize: '0.9rem',
                      backgroundColor: SAKTHI_COLORS.lightBlue,
                      color: SAKTHI_COLORS.white,
                      borderRight: `2px solid ${SAKTHI_COLORS.primary}`,
                    }}>
                      Heat code
                    </TableCell>
                    <TableCell align="center" sx={{ 
                      fontWeight: 700, 
                      fontSize: '0.9rem',
                      backgroundColor: SAKTHI_COLORS.lightBlue,
                      color: SAKTHI_COLORS.white,
                      borderRight: `2px solid ${SAKTHI_COLORS.primary}`,
                    }}>
                      Composition
                    </TableCell>
                    <TableCell align="center" sx={{ 
                      fontWeight: 700, 
                      fontSize: '0.9rem',
                      backgroundColor: SAKTHI_COLORS.lightBlue,
                      color: SAKTHI_COLORS.white,
                      borderRight: `2px solid ${SAKTHI_COLORS.primary}`,
                    }}>
                      Pouring Temperature Deg.C
                    </TableCell>
                    <TableCell align="center" sx={{ 
                      fontWeight: 700, 
                      fontSize: '0.9rem',
                      backgroundColor: SAKTHI_COLORS.lightBlue,
                      color: SAKTHI_COLORS.white,
                      borderRight: `2px solid ${SAKTHI_COLORS.primary}`,
                    }}>
                      Pouring Time (Sec.)
                    </TableCell>
                    <TableCell align="center" sx={{ 
                      fontWeight: 700, 
                      fontSize: '0.9rem',
                      backgroundColor: SAKTHI_COLORS.lightBlue,
                      color: SAKTHI_COLORS.white,
                    }}>
                      Other Remarks
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell align="center" sx={{ borderRight: `2px solid ${SAKTHI_COLORS.lightGray}` }}>
                      <Typography sx={{ fontWeight: 600 }}>-</Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ borderRight: `2px solid ${SAKTHI_COLORS.lightGray}` }}>
                      <Box sx={{ textAlign: 'left', pl: 2 }}>
                        <Typography sx={{ fontWeight: 600 }}>C -</Typography>
                        <Typography sx={{ fontWeight: 600 }}>P -</Typography>
                        <Typography sx={{ fontWeight: 600 }}>Cu -</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ borderRight: `2px solid ${SAKTHI_COLORS.lightGray}` }}>
                      <Typography sx={{ fontWeight: 600 }}>-</Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ borderRight: `2px solid ${SAKTHI_COLORS.lightGray}` }}>
                      <Typography sx={{ fontWeight: 600 }}>-</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ textAlign: 'left', pl: 2 }}>
                        <Typography sx={{ fontWeight: 600 }}>PP Code :</Typography>
                        <Typography sx={{ fontWeight: 600 }}>Followed by :</Typography>
                        <Typography sx={{ fontWeight: 600 }}>HOR filled</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Paper>

            {/* HOD Approval Status */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, bgcolor: SAKTHI_COLORS.success + '10', borderRadius: 2, border: `2px solid ${SAKTHI_COLORS.success}`, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 600, color: SAKTHI_COLORS.success }}>
                  ✓ Approved by HOD
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: SAKTHI_COLORS.darkGray, fontStyle: 'italic' }}>
                Submitted on {new Date().toLocaleDateString()}
              </Typography>
            </Box>

            {/* Back Button */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button 
                variant="outlined" 
                size="large" 
                onClick={onBackToForm}
                sx={{ 
                  minWidth: 200, 
                  height: 56, 
                  fontSize: '1.1rem', 
                  fontWeight: 700,
                  borderColor: SAKTHI_COLORS.primary,
                  color: SAKTHI_COLORS.primary,
                  '&:hover': {
                    borderColor: SAKTHI_COLORS.lightBlue,
                    bgcolor: SAKTHI_COLORS.background,
                  }
                }}
              >
                Back to Form
              </Button>
              <Button 
                variant="contained" 
                size="large" 
                sx={{ 
                  minWidth: 200, 
                  height: 56, 
                  fontSize: '1.1rem', 
                  fontWeight: 700, 
                  background: `linear-gradient(135deg, ${SAKTHI_COLORS.primary} 0%, ${SAKTHI_COLORS.lightBlue} 100%)`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${SAKTHI_COLORS.lightBlue} 0%, ${SAKTHI_COLORS.primary} 100%)`,
                  }
                }}
              >
                Print / Save PDF
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}