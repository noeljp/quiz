import { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Button,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import PsychologyIcon from '@mui/icons-material/Psychology';
import SchoolIcon from '@mui/icons-material/School';
import { evaluationService } from '../api/evaluation';
import { useAuth } from '../contexts/AuthContext';

function CognitiveProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await evaluationService.getMyCognitiveProfile();
      setProfile(data);
    } catch (err) {
      console.error('Error loading profile:', err);
      if (err.response?.status === 404) {
        setError('Aucun profil cognitif disponible. Complétez une évaluation diagnostique.');
      } else {
        setError('Erreur lors du chargement du profil');
      }
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceLevelColor = (level) => {
    switch (level) {
      case 'élevé':
        return 'success';
      case 'moyen':
        return 'warning';
      case 'faible':
        return 'error';
      default:
        return 'default';
    }
  };

  const getConfidenceLevelLabel = (level) => {
    switch (level) {
      case 'élevé':
        return 'Élevé';
      case 'moyen':
        return 'Moyen';
      case 'faible':
        return 'En développement';
      default:
        return level;
    }
  };

  if (!user || user.user_type !== 'apprenant') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          Seuls les apprenants ont accès à leur profil cognitif
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/diagnostic-evaluation')}
          startIcon={<PsychologyIcon />}
        >
          Commencer une évaluation diagnostique
        </Button>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="info">Aucun profil disponible</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          <PsychologyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Mon profil cognitif
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Découvre tes forces et ton style d'apprentissage unique
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Confidence Level Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">Niveau de confiance</Typography>
                <Chip
                  label={getConfidenceLevelLabel(profile.confidence_level)}
                  color={getConfidenceLevelColor(profile.confidence_level)}
                  size="medium"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Strengths Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StarIcon sx={{ color: 'warning.main', mr: 1 }} />
                <Typography variant="h6">Tes forces</Typography>
              </Box>
              
              {profile.strengths && profile.strengths.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profile.strengths.map((strength, index) => (
                    <Chip
                      key={index}
                      label={strength}
                      color="success"
                      variant="outlined"
                      icon={<StarIcon />}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Aucune force identifiée pour le moment
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Areas to Work On Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon sx={{ color: 'info.main', mr: 1 }} />
                <Typography variant="h6">À travailler</Typography>
              </Box>
              
              {profile.weaknesses && profile.weaknesses.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profile.weaknesses.map((weakness, index) => (
                    <Chip
                      key={index}
                      label={weakness}
                      color="info"
                      variant="outlined"
                      icon={<TrendingUpIcon />}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Aucune zone à travailler identifiée
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Learning Style Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SchoolIcon sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6">Style d'apprentissage</Typography>
              </Box>
              
              {profile.learning_style ? (
                <Paper elevation={0} sx={{ p: 2, backgroundColor: 'primary.50' }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {profile.learning_style}
                  </Typography>
                </Paper>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Style d'apprentissage non déterminé
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recommendations Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LightbulbIcon sx={{ color: 'warning.main', mr: 1 }} />
                <Typography variant="h6">Recommandations pédagogiques</Typography>
              </Box>
              
              {profile.recommendations && profile.recommendations.length > 0 ? (
                <List>
                  {profile.recommendations.map((recommendation, index) => (
                    <Fragment key={index}>
                      <ListItem>
                        <ListItemIcon>
                          <LightbulbIcon color="warning" />
                        </ListItemIcon>
                        <ListItemText
                          primary={recommendation}
                          primaryTypographyProps={{ variant: 'body1' }}
                        />
                      </ListItem>
                      {index < profile.recommendations.length - 1 && <Divider />}
                    </Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Aucune recommandation disponible
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Info Card */}
        <Grid item xs={12}>
          <Alert severity="info" icon={<PsychologyIcon />}>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
              À propos de ce profil
            </Typography>
            <Typography variant="body2">
              Ce profil est généré à partir de tes évaluations et évolue avec tes progrès. 
              Il sert à adapter ton apprentissage et à mettre en valeur tes forces. 
              Ce n'est pas un diagnostic médical, mais un outil pédagogique pour mieux t'accompagner.
            </Typography>
          </Alert>
        </Grid>

        {/* Actions */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/diagnostic-evaluation')}
              startIcon={<PsychologyIcon />}
            >
              Refaire une évaluation
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/apprenant')}
            >
              Retour au tableau de bord
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Metadata */}
      {profile.updated_at && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Dernière mise à jour: {new Date(profile.updated_at).toLocaleDateString('fr-FR')}
          </Typography>
        </Box>
      )}
    </Container>
  );
}

export default CognitiveProfile;
