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
} from '@mui/material';
import QuizIcon from '@mui/icons-material/Quiz';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

function DashboardApprenant() {
  // Mock data for quizzes and progress
  const quizzes = [
    {
      id: 1,
      title: 'Quiz Algèbre - Niveau 1',
      subject: 'Mathématiques',
      status: 'completed',
      score: 85,
      questions: 10,
    },
    {
      id: 2,
      title: 'Quiz Révolution Française',
      subject: 'Histoire',
      status: 'completed',
      score: 92,
      questions: 15,
    },
    {
      id: 3,
      title: 'Quiz Sciences Physiques',
      subject: 'Sciences',
      status: 'available',
      score: null,
      questions: 12,
    },
    {
      id: 4,
      title: 'Quiz Géométrie',
      subject: 'Mathématiques',
      status: 'available',
      score: null,
      questions: 8,
    },
  ];

  const overallProgress = {
    completed: 2,
    total: 4,
    averageScore: 88.5,
  };

  const progressPercentage = (overallProgress.completed / overallProgress.total) * 100;

  const getStatusChip = (status, score) => {
    if (status === 'completed') {
      return (
        <Chip
          label={`${score}%`}
          color="success"
          size="small"
          icon={<CheckCircleIcon />}
        />
      );
    }
    return (
      <Chip
        label="Disponible"
        color="primary"
        size="small"
        icon={<AccessTimeIcon />}
      />
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Espace Apprenant
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Consultez vos quiz et suivez votre progression.
      </Typography>

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
                {overallProgress.completed}/{overallProgress.total}
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
                {overallProgress.averageScore}%
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Excellent travail !
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

      {/* Quiz List */}
      <Paper sx={{ mt: 4, p: 2 }}>
        <Typography variant="h5" gutterBottom>
          Quiz Disponibles
        </Typography>
        <List>
          {quizzes.map((quiz, index) => (
            <Box key={quiz.id}>
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
                    primary={quiz.title}
                    secondary={`${quiz.subject} - ${quiz.questions} questions`}
                  />
                </Box>
                <Box>{getStatusChip(quiz.status, quiz.score)}</Box>
              </ListItem>
            </Box>
          ))}
        </List>
      </Paper>
    </Container>
  );
}

export default DashboardApprenant;
