import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../contexts/AuthContext';

function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Plateforme Pédagogique
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            color="inherit"
            component={RouterLink}
            to="/"
            startIcon={<HomeIcon />}
          >
            Accueil
          </Button>
          {isAuthenticated ? (
            <>
              {user?.user_type === 'formateur' && (
                <Button
                  color="inherit"
                  component={RouterLink}
                  to="/formateur"
                  startIcon={<SchoolIcon />}
                >
                  Mon Espace
                </Button>
              )}
              {user?.user_type === 'apprenant' && (
                <Button
                  color="inherit"
                  component={RouterLink}
                  to="/apprenant"
                  startIcon={<PersonIcon />}
                >
                  Mon Espace
                </Button>
              )}
              <Typography variant="body2" sx={{ mx: 1 }}>
                {user?.username}
              </Typography>
              <Button
                color="inherit"
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
              >
                Déconnexion
              </Button>
            </>
          ) : (
            <>
              <Button
                color="inherit"
                component={RouterLink}
                to="/login"
                startIcon={<LoginIcon />}
              >
                Connexion
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
