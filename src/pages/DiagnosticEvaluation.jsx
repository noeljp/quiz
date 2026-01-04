import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  LinearProgress,
  Alert,
  Chip,
  IconButton,
  Collapse,
  Stack,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { evaluationService } from '../api/evaluation';
import { useAuth } from '../contexts/AuthContext';

// Sample diagnostic questions (15-20 items with various competence types)
const DIAGNOSTIC_QUESTIONS = [
  {
    id: 'q1',
    text: 'Quel est le résultat de 15 + 27 ?',
    options: { A: '32', B: '42', C: '52', D: '62' },
    correct: 'B',
    competence: 'calcul',
    type: 'qcm',
    help: 'Essaie de décomposer: 15 + 20 = 35, puis ajoute 7'
  },
  {
    id: 'q2',
    text: 'Lis cette phrase: "Le chat dort sur le canapé". Que fait le chat ?',
    options: { A: 'Il mange', B: 'Il dort', C: 'Il court', D: 'Il joue' },
    correct: 'B',
    competence: 'lecture',
    type: 'qcm',
    help: 'Relis lentement la phrase et cherche le verbe d\'action'
  },
  {
    id: 'q3',
    text: 'Si Marie a 3 pommes et Paul lui en donne 5 de plus, combien en a-t-elle maintenant ?',
    options: { A: '5', B: '6', C: '7', D: '8' },
    correct: 'D',
    competence: 'logique',
    type: 'qcm',
    help: 'Pense: combien elle en avait au début + combien elle en reçoit'
  },
  {
    id: 'q4',
    text: 'Complète la suite: 2, 4, 6, 8, ?',
    options: { A: '9', B: '10', C: '11', D: '12' },
    correct: 'B',
    competence: 'logique',
    type: 'qcm',
    help: 'Regarde la différence entre chaque nombre'
  },
  {
    id: 'q5',
    text: 'Quel mot signifie le contraire de "grand" ?',
    options: { A: 'Petit', B: 'Énorme', C: 'Moyen', D: 'Large' },
    correct: 'A',
    competence: 'comprehension',
    type: 'qcm',
    help: 'Le contraire de grand, c\'est ce qui n\'est pas grand du tout'
  },
  {
    id: 'q6',
    text: 'Combien de voyelles y a-t-il dans le mot "MAISON" ?',
    options: { A: '2', B: '3', C: '4', D: '5' },
    correct: 'B',
    competence: 'lecture',
    type: 'qcm',
    help: 'Les voyelles sont: A, E, I, O, U. Compte-les dans MAISON'
  },
  {
    id: 'q7',
    text: 'Si un livre coûte 12 euros et j\'ai 20 euros, combien me reste-t-il ?',
    options: { A: '6 euros', B: '7 euros', C: '8 euros', D: '9 euros' },
    correct: 'C',
    competence: 'calcul',
    type: 'qcm',
    help: 'Soustrais le prix du livre de ce que tu as: 20 - 12'
  },
  {
    id: 'q8',
    text: 'Quel animal vit dans l\'eau et a des écailles ?',
    options: { A: 'Le chien', B: 'Le chat', C: 'Le poisson', D: 'L\'oiseau' },
    correct: 'C',
    competence: 'comprehension',
    type: 'qcm',
    help: 'Pense aux animaux aquatiques avec une peau spéciale'
  },
  {
    id: 'q9',
    text: 'Dans quelle phrase le mot est-il bien orthographié ?',
    options: {
      A: 'Je manje une pomme',
      B: 'Je mange une pomme',
      C: 'Je mangé une pomme',
      D: 'Je manges une pomme'
    },
    correct: 'B',
    competence: 'attention',
    type: 'qcm',
    help: 'Lis chaque option attentivement et cherche celle qui te semble correcte'
  },
  {
    id: 'q10',
    text: 'Quel est le double de 9 ?',
    options: { A: '16', B: '17', C: '18', D: '19' },
    correct: 'C',
    competence: 'calcul',
    type: 'qcm',
    help: 'Le double, c\'est multiplier par 2: 9 × 2'
  },
  {
    id: 'q11',
    text: 'Si Pierre est plus grand que Jacques, et Jacques est plus grand que Léa, qui est le plus petit ?',
    options: { A: 'Pierre', B: 'Jacques', C: 'Léa', D: 'On ne sait pas' },
    correct: 'C',
    competence: 'logique',
    type: 'qcm',
    help: 'Compare les trois personnes: Pierre > Jacques > ?'
  },
  {
    id: 'q12',
    text: 'Trouve l\'intrus: chat, chien, oiseau, table',
    options: { A: 'chat', B: 'chien', C: 'oiseau', D: 'table' },
    correct: 'D',
    competence: 'logique',
    type: 'qcm',
    help: 'Trois mots sont des animaux, lequel ne l\'est pas ?'
  },
  {
    id: 'q13',
    text: 'Combien font 5 × 3 ?',
    options: { A: '12', B: '13', C: '14', D: '15' },
    correct: 'D',
    competence: 'calcul',
    type: 'qcm',
    help: 'Tu peux compter: 5 + 5 + 5'
  },
  {
    id: 'q14',
    text: 'Lis: "Le soleil brille dans le ciel". De quelle couleur est généralement le ciel quand le soleil brille ?',
    options: { A: 'Gris', B: 'Bleu', C: 'Rouge', D: 'Noir' },
    correct: 'B',
    competence: 'comprehension',
    type: 'qcm',
    help: 'Pense à une belle journée ensoleillée'
  },
  {
    id: 'q15',
    text: 'Quelle est la bonne suite logique: lundi, mardi, mercredi, ?',
    options: { A: 'vendredi', B: 'samedi', C: 'jeudi', D: 'dimanche' },
    correct: 'C',
    competence: 'attention',
    type: 'qcm',
    help: 'Récite les jours de la semaine dans l\'ordre'
  },
];

function DiagnosticEvaluation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [sessionId, setSessionId] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [showHelp, setShowHelp] = useState({});
  const [attempts, setAttempts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    try {
      const session = await evaluationService.createEvaluationSession({
        session_type: 'diagnostic',
      });
      setSessionId(session.id);
      setStartTime(Date.now());
      setQuestionStartTime(Date.now());
    } catch (err) {
      console.error('Error creating session:', err);
      setError('Erreur lors de la création de la session');
    }
  };

  const handleAnswer = async (selectedAnswer) => {
    if (!sessionId) return;

    const question = DIAGNOSTIC_QUESTIONS[currentQuestion];
    const isCorrect = selectedAnswer === question.correct;
    const responseTime = Date.now() - questionStartTime;
    const questionAttempts = attempts[question.id] || 0;
    const helpUsed = showHelp[question.id] || false;

    // Record the answer locally
    setAnswers({ ...answers, [question.id]: selectedAnswer });
    setAttempts({ ...attempts, [question.id]: questionAttempts + 1 });

    // Send response to backend
    try {
      await evaluationService.createQuestionResponse({
        session: sessionId,
        question_id: question.id,
        question_text: question.text,
        question_type: question.type,
        competence_type: question.competence,
        answer: selectedAnswer,
        correct_answer: question.correct,
        is_correct: isCorrect,
        response_time_ms: responseTime,
        attempts: questionAttempts + 1,
        help_used: helpUsed,
        help_type: helpUsed ? 'progressive_hint' : '',
      });

      // Move to next question
      if (currentQuestion < DIAGNOSTIC_QUESTIONS.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setQuestionStartTime(Date.now());
      } else {
        // Complete the session
        await completeSession();
      }
    } catch (err) {
      console.error('Error recording response:', err);
      setError('Erreur lors de l\'enregistrement de la réponse');
    }
  };

  const completeSession = async () => {
    if (!sessionId) return;

    setLoading(true);
    try {
      const result = await evaluationService.completeEvaluationSession(sessionId);
      setCompleted(true);
      
      // Navigate to profile after a short delay
      setTimeout(() => {
        navigate('/cognitive-profile');
      }, 3000);
    } catch (err) {
      console.error('Error completing session:', err);
      setError('Erreur lors de la finalisation de l\'évaluation');
    } finally {
      setLoading(false);
    }
  };

  const toggleHelp = (questionId) => {
    setShowHelp({ ...showHelp, [questionId]: !showHelp[questionId] });
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">Vous devez être connecté pour passer une évaluation</Alert>
      </Container>
    );
  }

  if (completed) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h4" gutterBottom>
                Évaluation terminée !
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Ton profil cognitif est en cours de génération...
              </Typography>
              <LinearProgress />
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (currentQuestion >= DIAGNOSTIC_QUESTIONS.length) {
    return null;
  }

  const question = DIAGNOSTIC_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / DIAGNOSTIC_QUESTIONS.length) * 100;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="h5">Évaluation diagnostique</Typography>
          <Chip 
            label={`Question ${currentQuestion + 1}/${DIAGNOSTIC_QUESTIONS.length}`} 
            color="primary" 
            size="small"
          />
        </Stack>
        <LinearProgress variant="determinate" value={progress} sx={{ mb: 2 }} />
        <Typography variant="caption" color="text.secondary">
          Cette évaluation nous aide à comprendre ton style d'apprentissage
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                {question.text}
              </Typography>
              <IconButton
                size="small"
                onClick={() => toggleHelp(question.id)}
                color={showHelp[question.id] ? 'primary' : 'default'}
              >
                <HelpOutlineIcon />
              </IconButton>
            </Stack>

            <Collapse in={showHelp[question.id]}>
              <Alert severity="info" sx={{ mt: 2 }}>
                💡 {question.help}
              </Alert>
            </Collapse>
          </Box>

          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswer(e.target.value)}
            >
              {Object.entries(question.options).map(([key, value]) => (
                <FormControlLabel
                  key={key}
                  value={key}
                  control={<Radio />}
                  label={`${key}. ${value}`}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    p: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                />
              ))}
            </RadioGroup>
          </FormControl>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Prends ton temps, il n'y a pas de mauvaise réponse
            </Typography>
            {currentQuestion > 0 && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => setCurrentQuestion(currentQuestion - 1)}
              >
                Question précédente
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {loading && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Analyse en cours...
          </Typography>
        </Box>
      )}
    </Container>
  );
}

export default DiagnosticEvaluation;
