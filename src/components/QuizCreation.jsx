import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
  CircularProgress,
  Typography,
  IconButton,
  Divider,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { quizService } from '../api/quiz';

function QuizCreation({ open, onClose, onQuizCreated }) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([
    { question: '', options: { A: '', B: '', C: '', D: '' }, correct_answer: 'A', explanation: '' }
  ]);
  const [selectedLearners, setSelectedLearners] = useState([]);
  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingLearners, setLoadingLearners] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      loadLearners();
    }
  }, [open]);

  const loadLearners = async () => {
    try {
      setLoadingLearners(true);
      const data = await quizService.getLearners();
      setLearners(data);
    } catch (err) {
      console.error('Error loading learners:', err);
      setError('Erreur lors du chargement des apprenants');
    } finally {
      setLoadingLearners(false);
    }
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { question: '', options: { A: '', B: '', C: '', D: '' }, correct_answer: 'A', explanation: '' }
    ]);
  };

  const handleRemoveQuestion = (index) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    if (field.startsWith('option_')) {
      const optionKey = field.split('_')[1];
      newQuestions[index].options[optionKey] = value;
    } else {
      newQuestions[index][field] = value;
    }
    setQuestions(newQuestions);
  };

  const handleSubmit = async () => {
    // Validate form
    if (!title || !subject) {
      setError('Le titre et le sujet sont requis');
      return;
    }

    const invalidQuestion = questions.find(
      q => !q.question || !q.options.A || !q.options.B || !q.options.C || !q.options.D || !q.correct_answer
    );
    if (invalidQuestion) {
      setError('Toutes les questions doivent être complètes');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const quizData = {
        title,
        subject,
        description,
        questions: { questions },
        learner_ids: selectedLearners,
      };

      const response = await quizService.createQuiz(quizData);
      
      // Check for warnings
      if (response.warning) {
        setError(response.warning);
        // Still consider it a success but show the warning
        setTimeout(() => setError(''), 5000);
      }
      
      // Reset form
      setTitle('');
      setSubject('');
      setDescription('');
      setQuestions([
        { question: '', options: { A: '', B: '', C: '', D: '' }, correct_answer: 'A', explanation: '' }
      ]);
      setSelectedLearners([]);
      
      onQuizCreated();
      onClose();
    } catch (err) {
      console.error('Error creating quiz:', err);
      setError(err.response?.data?.error || 'Erreur lors de la création du quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Créer un nouveau quiz</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Titre du quiz"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          margin="normal"
          required
          disabled={loading}
        />

        <TextField
          fullWidth
          label="Sujet"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          margin="normal"
          required
          disabled={loading}
        />

        <TextField
          fullWidth
          label="Description (optionnel)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal"
          multiline
          rows={2}
          disabled={loading}
        />

        <FormControl fullWidth margin="normal" disabled={loading || loadingLearners}>
          <InputLabel>Assigner aux apprenants</InputLabel>
          <Select
            multiple
            value={selectedLearners}
            onChange={(e) => setSelectedLearners(e.target.value)}
            input={<OutlinedInput label="Assigner aux apprenants" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((learnerId) => {
                  const learner = learners.find(l => l.id === learnerId);
                  return (
                    <Chip
                      key={learnerId}
                      label={learner?.username || learnerId}
                      size="small"
                    />
                  );
                })}
              </Box>
            )}
          >
            {loadingLearners ? (
              <MenuItem disabled>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Chargement...
              </MenuItem>
            ) : (
              learners.map((learner) => (
                <MenuItem key={learner.id} value={learner.id}>
                  {learner.username}
                  {learner.first_name && learner.last_name && ` (${learner.first_name} ${learner.last_name})`}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Questions
        </Typography>

        {questions.map((question, index) => (
          <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">Question {index + 1}</Typography>
              {questions.length > 1 && (
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleRemoveQuestion(index)}
                  disabled={loading}
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>

            <TextField
              fullWidth
              label="Question"
              value={question.question}
              onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
              margin="normal"
              required
              disabled={loading}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
              <TextField
                label="Option A"
                value={question.options.A}
                onChange={(e) => handleQuestionChange(index, 'option_A', e.target.value)}
                required
                disabled={loading}
              />
              <TextField
                label="Option B"
                value={question.options.B}
                onChange={(e) => handleQuestionChange(index, 'option_B', e.target.value)}
                required
                disabled={loading}
              />
              <TextField
                label="Option C"
                value={question.options.C}
                onChange={(e) => handleQuestionChange(index, 'option_C', e.target.value)}
                required
                disabled={loading}
              />
              <TextField
                label="Option D"
                value={question.options.D}
                onChange={(e) => handleQuestionChange(index, 'option_D', e.target.value)}
                required
                disabled={loading}
              />
            </Box>

            <FormControl fullWidth margin="normal">
              <InputLabel>Bonne réponse</InputLabel>
              <Select
                value={question.correct_answer}
                onChange={(e) => handleQuestionChange(index, 'correct_answer', e.target.value)}
                label="Bonne réponse"
                disabled={loading}
              >
                <MenuItem value="A">A</MenuItem>
                <MenuItem value="B">B</MenuItem>
                <MenuItem value="C">C</MenuItem>
                <MenuItem value="D">D</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Explication (optionnel)"
              value={question.explanation}
              onChange={(e) => handleQuestionChange(index, 'explanation', e.target.value)}
              margin="normal"
              multiline
              rows={2}
              disabled={loading}
            />
          </Paper>
        ))}

        <Button
          startIcon={<AddIcon />}
          onClick={handleAddQuestion}
          disabled={loading}
          sx={{ mt: 1 }}
        >
          Ajouter une question
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Création...' : 'Créer le quiz'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

QuizCreation.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onQuizCreated: PropTypes.func.isRequired,
};

export default QuizCreation;
