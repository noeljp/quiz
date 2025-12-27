import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';

function Header() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Plateforme Pédagogique
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            color="inherit"
            component={RouterLink}
            to="/"
            startIcon={<HomeIcon />}
          >
            Accueil
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/formateur"
            startIcon={<SchoolIcon />}
          >
            Formateurs
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/apprenant"
            startIcon={<PersonIcon />}
          >
            Apprenants
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
