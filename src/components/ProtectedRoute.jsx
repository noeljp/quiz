import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

function ProtectedRoute({ children, requiredUserType }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Rediriger vers la page de login en sauvegardant la destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredUserType && user?.user_type !== requiredUserType) {
    // Rediriger vers la page d'accueil si le type d'utilisateur ne correspond pas
    return <Navigate to="/" replace />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredUserType: PropTypes.oneOf(['formateur', 'apprenant']),
};

export default ProtectedRoute;
