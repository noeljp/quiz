import { useState, useEffect, useRef } from 'react';
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
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import EditIcon from '@mui/icons-material/Edit';
import { quizService } from '../api/quiz';
import TextToSpeech from './TextToSpeech';

function QuizEdit({ open, onClose, onQuizSaved, existingQuiz = null }) {
  const isEditMode = !!existingQuiz;
  
  // Form state
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([
    { question: '', options: { A: '', B: '', C: '', D: '' }, correct_answer: 'A', explanation: '' }
  ]);
  const [selectedLearners, setSelectedLearners] = useState([]);
  const [learners, setLearners] = useState([]);
  
  // UI state
  const [activeTab, setActiveTab] = useState(0); // 0: Manual, 1: AI
  const [activeStep, setActiveStep] = useState(0); // For AI flow
  const [loading, setLoading] = useState(false);
  const [loadingLearners, setLoadingLearners] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // AI generation state
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [extractingText, setExtractingText] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      loadLearners();
      if (isEditMode && existingQuiz) {
        loadExistingQuiz();
      } else {
        resetForm();
      }
    }
  }, [open, existingQuiz]);

  const loadExistingQuiz = () => {
    setTitle(existingQuiz.title || '');
    setSubject(existingQuiz.subject || '');
    setDescription(existingQuiz.description || '');
    
    // Load questions from existing quiz
    const existingQuestions = existingQuiz.questions?.questions || [];
    if (existingQuestions.length > 0) {
      setQuestions(existingQuestions);
    }
    
    // Load assigned learners
    if (existingQuiz.assigned_learners) {
      setSelectedLearners(existingQuiz.assigned_learners);
    }
  };

  const resetForm = () => {
    setTitle('');
    setSubject('');
    setDescription('');
    setQuestions([
      { question: '', options: { A: '', B: '', C: '', D: '' }, correct_answer: 'A', explanation: '' }
    ]);
    setSelectedLearners([]);
    setActiveTab(0);
    setActiveStep(0);
    setSelectedFile(null);
    setExtractedText('');
    setNumQuestions(5);
    setError('');
    setSuccess('');
  };

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

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setError('');
    }
  };

  const validateQuestionCount = (value) => {
    const num = parseInt(value) || 5;
    return Math.max(1, Math.min(20, num));
  };

  const handleExtractText = async () => {
    if (!selectedFile) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    try {
      setExtractingText(true);
      setError('');
      
      const response = await quizService.uploadDocument(selectedFile);
      setExtractedText(response.text);
      setSuccess('Texte extrait avec succès !');
      setActiveStep(1);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error extracting text:', err);
      setError(err.response?.data?.error || 'Erreur lors de l\'extraction du texte');
    } finally {
      setExtractingText(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!extractedText) {
      setError('Aucun texte disponible pour générer des questions');
      return;
    }

    try {
      setGeneratingQuiz(true);
      setError('');
      
      const response = await quizService.generateQuiz(extractedText, numQuestions);
      
      if (response.quiz && response.quiz.questions) {
        setQuestions(response.quiz.questions);
        setSuccess('Questions générées avec succès ! Vous pouvez les modifier avant de sauvegarder.');
        setActiveStep(2);
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError('Format de réponse invalide de l\'API');
      }
    } catch (err) {
      console.error('Error generating quiz:', err);
      setError(err.response?.data?.error || 'Erreur lors de la génération du quiz');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { question: '', options: { A: '', B: '', C: '', D: '' }, correct_answer: 'A', explanation: '' }
    ]);
  };

  const handleRemoveQuestion = (index) => {
    if (questions.length > 1) {
      const newQuestions = questions.filter((_, i) => i !== index);
      setQuestions(newQuestions);
    }
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

  const isQuestionValid = (question) => {
    return question.question && 
           question.options.A && 
           question.options.B && 
           question.options.C && 
           question.options.D && 
           question.correct_answer;
  };

  const validateForm = () => {
    if (!title || !subject) {
      setError('Le titre et le sujet sont requis');
      return false;
    }

    const invalidQuestion = questions.find(q => !isQuestionValid(q));
    if (invalidQuestion) {
      setError('Toutes les questions doivent être complètes');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
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

      let response;
      if (isEditMode) {
        response = await quizService.updateQuiz(existingQuiz.id, quizData);
      } else {
        response = await quizService.createQuiz(quizData);
      }
      
      if (response.warning) {
        setSuccess(`Quiz ${isEditMode ? 'modifié' : 'créé'} avec avertissement: ${response.warning}`);
        setTimeout(() => setSuccess(''), 5000);
      }
      
      onQuizSaved();
      handleClose();
    } catch (err) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} quiz:`, err);
      setError(err.response?.data?.error || `Erreur lors de la ${isEditMode ? 'modification' : 'création'} du quiz`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading && !extractingText && !generatingQuiz) {
      resetForm();
      onClose();
    }
  };

  const renderAIFlow = () => {
    return (
      <Box>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          <Step>
            <StepLabel>Téléverser un document</StepLabel>
          </Step>
          <Step>
            <StepLabel>Générer les questions</StepLabel>
          </Step>
          <Step>
            <StepLabel>Réviser et sauvegarder</StepLabel>
          </Step>
        </Stepper>

        {activeStep === 0 && (
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Téléversez un document (PDF, DOCX, TXT) pour extraire le texte et générer automatiquement des questions.
            </Typography>
            
            <Box sx={{ mt: 2, mb: 2 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadFileIcon />}
                fullWidth
                disabled={extractingText}
              >
                {selectedFile ? selectedFile.name : 'Sélectionner un fichier'}
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.txt"
                />
              </Button>
            </Box>

            <Button
              variant="contained"
              fullWidth
              onClick={handleExtractText}
              disabled={!selectedFile || extractingText}
              startIcon={extractingText ? <CircularProgress size={20} /> : <UploadFileIcon />}
            >
              {extractingText ? 'Extraction en cours...' : 'Extraire le texte'}
            </Button>
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Texte extrait ({extractedText.length} caractères). Générez maintenant des questions basées sur ce contenu.
            </Typography>
            
            <TextField
              fullWidth
              label="Texte extrait"
              value={extractedText}
              multiline
              rows={6}
              margin="normal"
              disabled
              sx={{ mb: 2 }}
            />

            <TextField
              type="number"
              label="Nombre de questions"
              value={numQuestions}
              onChange={(e) => setNumQuestions(validateQuestionCount(e.target.value))}
              inputProps={{ min: 1, max: 20 }}
              fullWidth
              margin="normal"
              disabled={generatingQuiz}
            />

            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(0)}
                disabled={generatingQuiz}
                fullWidth
              >
                Retour
              </Button>
              <Button
                variant="contained"
                onClick={handleGenerateQuestions}
                disabled={generatingQuiz}
                startIcon={generatingQuiz ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
                fullWidth
              >
                {generatingQuiz ? 'Génération...' : 'Générer avec IA'}
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 2 && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Questions générées ! Vérifiez et modifiez-les si nécessaire, puis remplissez les informations du quiz ci-dessous.
            </Alert>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setActiveStep(1)}
              sx={{ mb: 2 }}
            >
              Régénérer les questions
            </Button>
          </Box>
        )}
      </Box>
    );
  };

  const renderQuestions = () => {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Questions ({questions.length})</Typography>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAddQuestion}
            disabled={loading}
          >
            Ajouter
          </Button>
        </Box>

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

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 2 }}>
              <TextField
                fullWidth
                label="Question"
                value={question.question}
                onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                required
                disabled={loading}
                multiline
                rows={2}
              />
              {question.question && (
                <Box sx={{ pt: 1 }}>
                  <TextToSpeech text={question.question} />
                </Box>
              )}
            </Box>

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
              value={question.explanation || ''}
              onChange={(e) => handleQuestionChange(index, 'explanation', e.target.value)}
              margin="normal"
              multiline
              rows={2}
              disabled={loading}
            />
          </Paper>
        ))}
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEditMode ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon />
            Modifier le quiz
          </Box>
        ) : (
          'Créer un nouveau quiz'
        )}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Basic Quiz Information */}
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

        {/* Questions Section - with tabs for manual vs AI */}
        {!isEditMode && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="Créer manuellement" />
              <Tab label="Générer avec IA" icon={<AutoAwesomeIcon />} iconPosition="end" />
            </Tabs>
          </Box>
        )}

        {activeTab === 1 && !isEditMode ? renderAIFlow() : null}
        
        {(activeTab === 0 || isEditMode || activeStep === 2) && renderQuestions()}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading || extractingText || generatingQuiz}>
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || extractingText || generatingQuiz || (activeTab === 1 && activeStep < 2)}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Sauvegarde...' : (isEditMode ? 'Modifier' : 'Créer')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

QuizEdit.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onQuizSaved: PropTypes.func.isRequired,
  existingQuiz: PropTypes.object,
};

export default QuizEdit;
