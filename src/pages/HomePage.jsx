import { Container, Typography, Box, Card, CardContent, CardActions, Button, Grid } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';

function HomePage() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Bienvenue sur la Plateforme Pédagogique
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Une solution complète pour les formateurs et les apprenants
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Notre plateforme permet aux formateurs de partager des ressources pédagogiques
          et aux apprenants de suivre leur progression à travers des quiz interactifs.
        </Typography>
      </Box>

      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <SchoolIcon sx={{ fontSize: 60, color: 'primary.main' }} />
              </Box>
              <Typography gutterBottom variant="h5" component="h2" align="center">
                Espace Formateur
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Téléversez et gérez vos ressources pédagogiques, créez des quiz
                et suivez les progrès de vos apprenants.
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
              <Button
                size="large"
                variant="contained"
                component={RouterLink}
                to="/formateur"
                startIcon={<SchoolIcon />}
              >
                Accéder
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <PersonIcon sx={{ fontSize: 60, color: 'secondary.main' }} />
              </Box>
              <Typography gutterBottom variant="h5" component="h2" align="center">
                Espace Apprenant
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Consultez les quiz disponibles, suivez votre progression
                et accédez aux ressources pédagogiques.
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
              <Button
                size="large"
                variant="contained"
                color="secondary"
                component={RouterLink}
                to="/apprenant"
                startIcon={<PersonIcon />}
              >
                Accéder
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default HomePage;
