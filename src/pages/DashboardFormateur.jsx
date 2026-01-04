import { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  IconButton,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import QuizIcon from '@mui/icons-material/Quiz';
import PeopleIcon from '@mui/icons-material/People';
import EditIcon from '@mui/icons-material/Edit';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { fileService } from '../api/files';
import { quizService } from '../api/quiz';
import { useAuth } from '../contexts/AuthContext';
import QuizEdit from '../components/QuizEdit';
import QuizStats from '../components/QuizStats';
import TextToSpeech from '../components/TextToSpeech';

function DashboardFormateur() {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [theme, setTheme] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [statsQuiz, setStatsQuiz] = useState(null);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadFiles();
    loadQuizzes();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const data = await fileService.getFiles();
      setUploadedFiles(data);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadQuizzes = async () => {
    try {
      const data = await quizService.getQuizzes();
      setQuizzes(data);
    } catch (error) {
      console.error('Error loading quizzes:', error);
    }
  };

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (title && subject && theme && selectedFile) {
      setUploading(true);
      setUploadError('');
      setUploadSuccess(false);

      try {
        await fileService.uploadFile({
          title,
          subject,
          theme,
          file: selectedFile,
        });
        
        setUploadSuccess(true);
        
        // Reset form
        setTitle('');
        setSubject('');
        setTheme('');
        setSelectedFile(null);
        // Reset file input using ref
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Reload files list
        await loadFiles();
        
        // Clear success message after 3 seconds
        setTimeout(() => setUploadSuccess(false), 3000);
      } catch (error) {
        console.error('Upload error:', error);
        setUploadError(
          error.response?.data?.detail || 
          'Erreur lors du téléversement. Veuillez réessayer.'
        );
      } finally {
        setUploading(false);
      }
    }
  };

  const handleDelete = async (fileId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
      try {
        await fileService.deleteFile(fileId);
        await loadFiles();
      } catch (error) {
        console.error('Delete error:', error);
        alert('Erreur lors de la suppression du fichier.');
      }
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce quiz ?')) {
      try {
        await quizService.deleteQuiz(quizId);
        await loadQuizzes();
      } catch (error) {
        console.error('Delete quiz error:', error);
        alert('Erreur lors de la suppression du quiz.');
      }
    }
  };

  const handleQuizCreated = () => {
    loadQuizzes();
  };

  const handleEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setQuizDialogOpen(true);
  };

  const handleViewStats = (quiz) => {
    setStatsQuiz(quiz);
    setStatsDialogOpen(true);
  };

  const handleCloseQuizDialog = () => {
    setQuizDialogOpen(false);
    setEditingQuiz(null);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Espace Formateur
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Bienvenue {user?.first_name || user?.username} ! Gérez vos ressources pédagogiques et créez des quiz.
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Documents" icon={<DescriptionIcon />} iconPosition="start" />
          <Tab label="Quiz" icon={<QuizIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Documents Tab */}
      {tabValue === 0 && (
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Téléverser un document
              </Typography>
              
              {uploadSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Document téléversé avec succès !
                </Alert>
              )}

              {uploadError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {uploadError}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Titre"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  margin="normal"
                  placeholder="Ex: Cours d'algèbre niveau 1"
                  disabled={uploading}
                />

                <TextField
                  fullWidth
                  label="Sujet"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  margin="normal"
                  placeholder="Ex: Mathématiques, Histoire, Sciences..."
                  disabled={uploading}
                />
                
                <TextField
                  fullWidth
                  label="Thème"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  required
                  margin="normal"
                  placeholder="Ex: Algèbre, Révolution Française..."
                  disabled={uploading}
                />

                <Box sx={{ mt: 2, mb: 2 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadFileIcon />}
                    fullWidth
                    disabled={uploading}
                  >
                    {selectedFile ? selectedFile.name : 'Sélectionner un fichier'}
                    <input
                      ref={fileInputRef}
                      type="file"
                      hidden
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.ppt,.pptx"
                    />
                  </Button>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={!title || !subject || !theme || !selectedFile || uploading}
                  startIcon={uploading ? <CircularProgress size={20} /> : <UploadFileIcon />}
                >
                  {uploading ? 'Téléversement...' : 'Téléverser le document'}
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Paper sx={{ mt: 4, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Documents téléversés
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : uploadedFiles.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                Aucun document téléversé pour le moment.
              </Typography>
            ) : (
              <List>
                {uploadedFiles.map((file, index) => (
                  <Box key={file.id}>
                    {index > 0 && <Divider />}
                    <ListItem
                      secondaryAction={
                        file.uploaded_by === user?.id && (
                          <IconButton 
                            edge="end" 
                            aria-label="delete"
                            onClick={() => handleDelete(file.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        )
                      }
                    >
                      <DescriptionIcon sx={{ mr: 2, color: 'primary.main' }} />
                      <ListItemText
                        primary={file.title}
                        secondary={`${file.subject} - ${file.theme} | Uploadé le ${new Date(file.uploaded_at).toLocaleDateString()}`}
                      />
                    </ListItem>
                  </Box>
                ))}
              </List>
            )}
          </Paper>
        </Box>
      )}

      {/* Quiz Tab */}
      {tabValue === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h2">
              Mes Quiz
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setQuizDialogOpen(true)}
            >
              Créer un quiz
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : quizzes.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <QuizIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Aucun quiz créé
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Créez votre premier quiz pour commencer
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setQuizDialogOpen(true)}
              >
                Créer un quiz
              </Button>
            </Paper>
          ) : (
            <List>
              {quizzes.map((quiz, index) => (
                <Box key={quiz.id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    sx={{ py: 2 }}
                    secondaryAction={
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton 
                          aria-label="stats"
                          onClick={() => handleViewStats(quiz)}
                          color="primary"
                        >
                          <AssessmentIcon />
                        </IconButton>
                        <IconButton 
                          aria-label="edit"
                          onClick={() => handleEditQuiz(quiz)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          aria-label="delete"
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    }
                  >
                    <QuizIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {quiz.title}
                          <TextToSpeech 
                            text={`${quiz.title}. ${quiz.subject}. ${quiz.description || ''}`} 
                          />
                          <Chip
                            icon={<QuizIcon />}
                            label={`${quiz.num_questions} questions`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          {quiz.num_assigned_learners > 0 && (
                            <Chip
                              icon={<PeopleIcon />}
                              label={`${quiz.num_assigned_learners} apprenants`}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          {quiz.subject}
                          {quiz.description && ` - ${quiz.description}`}
                          {` | Créé le ${new Date(quiz.created_at).toLocaleDateString()}`}
                        </>
                      }
                    />
                  </ListItem>
                </Box>
              ))}
            </List>
          )}
        </Box>
      )}

      <QuizEdit
        open={quizDialogOpen}
        onClose={handleCloseQuizDialog}
        onQuizSaved={handleQuizCreated}
        existingQuiz={editingQuiz}
      />

      <QuizStats
        open={statsDialogOpen}
        onClose={() => setStatsDialogOpen(false)}
        quizId={statsQuiz?.id}
        quizTitle={statsQuiz?.title}
      />
    </Container>
  );
}

export default DashboardFormateur;
