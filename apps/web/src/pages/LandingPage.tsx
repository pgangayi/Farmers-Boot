import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  Avatar,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  LocationOn,
  Agriculture,
  AttachMoney,
  BarChart,
  Inventory,
  LocalFlorist,
  Favorite,
} from '@mui/icons-material';

const PRIMARY_ACCENT = 'primary.main';
const TEXT_PRIMARY = 'text.primary';

export function LandingPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const features = [
    {
      icon: <LocationOn />,
      title: 'Farm Management',
      description:
        'Organize and monitor multiple farms with detailed mapping and comprehensive data management.',
    },
    {
      icon: <LocalFlorist />,
      title: 'Field & Crop Management',
      description:
        'Track field details, soil analysis, crop planning, and monitor yields for optimal productivity.',
    },
    {
      icon: <Favorite />,
      title: 'Livestock Management',
      description:
        'Keep detailed records of livestock, health treatments, breeding cycles, and production monitoring.',
    },
    {
      icon: <AttachMoney />,
      title: 'Financial Management',
      description:
        'Track income, expenses, budgets, and profitability with comprehensive financial reporting.',
    },
    {
      icon: <Inventory />,
      title: 'Inventory Control',
      description:
        'Track supplies, equipment, and resources with real-time inventory management and alerts.',
    },
    {
      icon: <BarChart />,
      title: 'Analytics & Reports',
      description:
        'Get insights into your farm operations with detailed analytics and customizable reports.',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <AppBar position="static" color="default" elevation={1}>
        <Container maxWidth="lg">
          <Toolbar sx={{ py: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ flexGrow: 1 }}>
              <Avatar sx={{ bgcolor: PRIMARY_ACCENT, width: 32, height: 32 }}>
                <Agriculture fontSize="small" />
              </Avatar>
              <Typography
                variant="h6"
                component="div"
                sx={{ fontWeight: 600, color: TEXT_PRIMARY }}
              >
                Farmers Boot
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2}>
              <Button
                variant="text"
                onClick={() => navigate('/login')}
                sx={{ color: TEXT_PRIMARY }}
              >
                Login
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/signup')}
                sx={{ bgcolor: 'grey.900', '&:hover': { bgcolor: 'grey.800' } }}
              >
                Get Started
              </Button>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
        <Grid container spacing={4} alignItems="center">
          {/* Hero Section */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography
              variant={isMobile ? 'h3' : 'h2'}
              component="h1"
              sx={{ fontWeight: 700, mb: 2, color: TEXT_PRIMARY }}
            >
              Welcome to Farmers Boot
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
              A comprehensive farm management platform designed to streamline your agricultural
              operations. Manage farms, fields, animals, crops, tasks, inventory, and finances all
              in one place.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/signup')}
                sx={{
                  px: 3,
                  py: 1.5,
                  bgcolor: 'grey.900',
                  '&:hover': { bgcolor: 'grey.800' },
                }}
              >
                Get Started Free
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/login')}
                sx={{ px: 3, py: 1.5 }}
              >
                Sign In
              </Button>
            </Stack>
          </Grid>

          {/* Features Grid */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Grid container spacing={2}>
              {features.map((feature, index) => (
                <Grid size={{ xs: 12, sm: 6 }} key={index}>
                  <Card
                    sx={{
                      height: '100%',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 2,
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2, textAlign: 'center' }}>
                      <Avatar
                        sx={{
                          bgcolor: PRIMARY_ACCENT,
                          width: 40,
                          height: 40,
                          mx: 'auto',
                          mb: 1,
                        }}
                      >
                        {feature.icon}
                      </Avatar>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, mb: 1, color: TEXT_PRIMARY }}
                      >
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          bgcolor: 'grey.50',
          borderTop: '1px solid',
          borderColor: 'divider',
          py: 3,
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: PRIMARY_ACCENT, width: 24, height: 24 }}>
                <Agriculture fontSize="small" />
              </Avatar>
              <Typography variant="body2" sx={{ fontWeight: 600, color: TEXT_PRIMARY }}>
                Farmers Boot
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              © 2025 Farmers Boot. All rights reserved.
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
