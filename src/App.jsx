import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardFormateur from './pages/DashboardFormateur';
import DashboardApprenant from './pages/DashboardApprenant';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
          }}
        >
          <Header />
          <Box component="main" sx={{ flexGrow: 1 }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/formateur"
                element={
                  <ProtectedRoute requiredUserType="formateur">
                    <DashboardFormateur />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/apprenant"
                element={
                  <ProtectedRoute requiredUserType="apprenant">
                    <DashboardApprenant />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Box>
          <Footer />
        </Box>
      </AuthProvider>
    </Router>
  );
}

export default App;
