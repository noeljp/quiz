import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Button,
  Tabs,
  Tab,
} from '@mui/material';
import QuizIcon from '@mui/icons-material/Quiz';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PsychologyIcon from '@mui/icons-material/Psychology';
import { progressService } from '../api/progress';
import { quizService } from '../api/quiz';
import { useAuth } from '../contexts/AuthContext';

function DashboardApprenant() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [progress, setProgress] = useState([]);
  const [assignedQuizzes, setAssignedQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [statsData, progressData, quizzesData] = await Promise.all([
        progressService.getStats(),
        progressService.getProgress(),
        quizService.getQuizzes(),
      ]);
      setStats(statsData);
      setProgress(progressData);
      setAssignedQuizzes(quizzesData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Erreur lors du chargement des données. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (completed, percentage) => {
    if (completed) {
      return (
        <Chip
          label={`${percentage}%`}
          color="success"
          size="small"
          icon={<CheckCircleIcon />}
        />
      );
    }
    return (
      <Chip
        label="En cours"
        color="primary"
        size="small"
        icon={<AccessTimeIcon />}
      />
    );
  };

  const formatProgressSecondary = (item) => {
    const scoreText = `${item.quiz_subject} - Score: ${item.score}/${item.max_score}`;
    const statusText = item.completed 
      ? `Complété le ${new Date(item.completed_at).toLocaleDateString()}` 
      : 'En cours';
    return `${scoreText} | ${statusText}`;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const progressPercentage = stats?.total_quizzes > 0 
    ? (stats.completed_quizzes / stats.total_quizzes) * 100 
    : 0;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Espace Apprenant
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Bienvenue {user?.first_name || user?.username} ! Consultez vos quiz et suivez votre progression.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Evaluation Features */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', backgroundColor: 'primary.50' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PsychologyIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Évaluation diagnostique</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Découvre ton style d'apprentissage et tes forces cognitives
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/diagnostic-evaluation')}
                startIcon={<PsychologyIcon />}
              >
                Commencer l'évaluation
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', backgroundColor: 'success.50' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">Mon profil cognitif</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Consulte tes forces, ton style d'apprentissage et les recommandations
              </Typography>
              <Button
                variant="outlined"
                color="success"
                onClick={() => navigate('/cognitive-profile')}
                startIcon={<TrendingUpIcon />}
              >
                Voir mon profil
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Progress Overview */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <QuizIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Quiz Complétés</Typography>
              </Box>
              <Typography variant="h3" color="primary">
                {stats?.completed_quizzes || 0}/{stats?.total_quizzes || 0}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={progressPercentage}
                sx={{ mt: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">Score Moyen</Typography>
              </Box>
              <Typography variant="h3" color="success.main">
                {stats?.average_score?.toFixed(1) || 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {stats?.average_score >= 75 ? 'Excellent travail !' : 'Continue tes efforts !'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleIcon sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">Progression</Typography>
              </Box>
              <Typography variant="h3" color="info.main">
                {progressPercentage.toFixed(0)}%
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Continue comme ça !
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 4, mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Quiz Assignés" icon={<AssignmentIcon />} iconPosition="start" />
          <Tab label="Progression" icon={<TrendingUpIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Assigned Quizzes Tab */}
      {tabValue === 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h5" gutterBottom>
            Quiz Assignés
          </Typography>
          {assignedQuizzes.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Aucun quiz assigné pour le moment.
              </Typography>
            </Box>
          ) : (
            <List>
              {assignedQuizzes.map((quiz, index) => (
                <Box key={quiz.id}>
                  {index > 0 && <Divider />}
                  <ListItem sx={{ py: 2 }}>
                    <QuizIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {quiz.title}
                          <Chip
                            label={`${quiz.num_questions} questions`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={`${quiz.subject}${quiz.description ? ' - ' + quiz.description : ''}`}
                    />
                    <Button
                      variant="contained"
                      size="small"
                      disabled
                    >
                      Démarrer
                    </Button>
                  </ListItem>
                </Box>
              ))}
            </List>
          )}
        </Paper>
      )}

      {/* Progress Tab */}
      {tabValue === 1 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h5" gutterBottom>
            Ma Progression
          </Typography>
          {progress.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
              Aucun quiz complété pour le moment.
            </Typography>
          ) : (
            <List>
              {progress.map((item, index) => (
                <Box key={item.id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <QuizIcon sx={{ mr: 2, color: 'primary.main' }} />
                      <ListItemText
                        primary={item.quiz_title}
                        secondary={formatProgressSecondary(item)}
                      />
                    </Box>
                    <Box>{getStatusChip(item.completed, item.percentage)}</Box>
                  </ListItem>
                </Box>
              ))}
            </List>
          )}
        </Paper>
      )}
    </Container>
  );
}

export default DashboardApprenant;
