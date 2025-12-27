import { useState, useEffect } from 'react';
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
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteIcon from '@mui/icons-material/Delete';
import { fileService } from '../api/files';
import { useAuth } from '../contexts/AuthContext';

function DashboardFormateur() {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [theme, setTheme] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadFiles();
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
        // Reset file input
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';
        
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Espace Formateur
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Bienvenue {user?.first_name || user?.username} ! Téléversez vos ressources pédagogiques et gérez votre contenu.
      </Typography>

      <Box sx={{ mt: 4 }}>
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
                    id="file-input"
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
    </Container>
  );
}

export default DashboardFormateur;
