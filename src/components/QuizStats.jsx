import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import PersonIcon from '@mui/icons-material/Person';
import QuizIcon from '@mui/icons-material/Quiz';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { quizService } from '../api/quiz';

function QuizStats({ open, onClose, quizId, quizTitle }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && quizId) {
      loadStats();
    }
  }, [open, quizId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await quizService.getQuizStats(quizId);
      setStats(response);
    } catch (err) {
      console.error('Error loading quiz stats:', err);
      setError(err.response?.data?.error || 'Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Statistiques du quiz: {quizTitle || 'Chargement...'}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : stats ? (
          <Box>
            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <QuizIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Questions
                      </Typography>
                    </Box>
                    <Typography variant="h4">{stats.num_questions}</Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PersonIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Apprenants assignés
                      </Typography>
                    </Box>
                    <Typography variant="h4">{stats.total_assigned}</Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Taux de complétion
                      </Typography>
                    </Box>
                    <Typography variant="h4">{stats.completion_rate}%</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={stats.completion_rate}
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Score moyen
                      </Typography>
                    </Box>
                    <Typography variant="h4">{stats.average_score}%</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Learner Statistics Table */}
            <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
              Détails par apprenant
            </Typography>

            {stats.learner_stats && stats.learner_stats.length > 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Apprenant</TableCell>
                      <TableCell>Date d'assignation</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Date de complétion</TableCell>
                      <TableCell align="right">Score</TableCell>
                      <TableCell align="right">Pourcentage</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.learner_stats.map((learnerStat) => (
                      <TableRow key={learnerStat.learner_id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {learnerStat.learner_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              @{learnerStat.learner_username}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {formatDate(learnerStat.assigned_at)}
                        </TableCell>
                        <TableCell>
                          {learnerStat.completed ? (
                            <Chip
                              icon={<CheckCircleIcon />}
                              label="Terminé"
                              color="success"
                              size="small"
                            />
                          ) : (
                            <Chip
                              icon={<PendingIcon />}
                              label="En cours"
                              color="warning"
                              size="small"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {learnerStat.completed_at 
                            ? formatDate(learnerStat.completed_at)
                            : 'N/A'
                          }
                        </TableCell>
                        <TableCell align="right">
                          {learnerStat.completed 
                            ? `${learnerStat.score} / ${learnerStat.max_score}`
                            : 'N/A'
                          }
                        </TableCell>
                        <TableCell align="right">
                          {learnerStat.completed ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                              <Typography
                                variant="body2"
                                fontWeight="bold"
                                color={`${getScoreColor(learnerStat.percentage)}.main`}
                              >
                                {learnerStat.percentage}%
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={learnerStat.percentage}
                                color={getScoreColor(learnerStat.percentage)}
                                sx={{ width: 60, height: 6, borderRadius: 1 }}
                              />
                            </Box>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Aucun apprenant assigné à ce quiz
                </Typography>
              </Paper>
            )}
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
}

QuizStats.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  quizId: PropTypes.number,
  quizTitle: PropTypes.string,
};

export default QuizStats;
