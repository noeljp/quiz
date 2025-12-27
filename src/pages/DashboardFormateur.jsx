import { useState } from 'react';
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
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DescriptionIcon from '@mui/icons-material/Description';

function DashboardFormateur() {
  const [subject, setSubject] = useState('');
  const [theme, setTheme] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([
    { id: 1, subject: 'Mathématiques', theme: 'Algèbre', fileName: 'algebre_cours.pdf' },
    { id: 2, subject: 'Histoire', theme: 'Révolution Française', fileName: 'histoire_revolution.pdf' },
  ]);

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    
    if (subject && theme && selectedFile) {
      // Mock upload - in a real app, this would upload to a server
      const newFile = {
        id: Date.now(), // Use timestamp for unique ID
        subject,
        theme,
        fileName: selectedFile.name,
      };
      
      setUploadedFiles([...uploadedFiles, newFile]);
      setUploadSuccess(true);
      
      // Reset form
      setSubject('');
      setTheme('');
      setSelectedFile(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Espace Formateur
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Téléversez vos ressources pédagogiques et gérez votre contenu.
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

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Sujet"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                margin="normal"
                placeholder="Ex: Mathématiques, Histoire, Sciences..."
              />
              
              <TextField
                fullWidth
                label="Thème"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                required
                margin="normal"
                placeholder="Ex: Algèbre, Révolution Française..."
              />

              <Box sx={{ mt: 2, mb: 2 }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadFileIcon />}
                  fullWidth
                >
                  {selectedFile ? selectedFile.name : 'Sélectionner un fichier'}
                  <input
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
                disabled={!subject || !theme || !selectedFile}
                startIcon={<UploadFileIcon />}
              >
                Téléverser le document
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Paper sx={{ mt: 4, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Documents téléversés
          </Typography>
          <List>
            {uploadedFiles.map((file, index) => (
              <Box key={file.id}>
                {index > 0 && <Divider />}
                <ListItem>
                  <DescriptionIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <ListItemText
                    primary={file.fileName}
                    secondary={`${file.subject} - ${file.theme}`}
                  />
                </ListItem>
              </Box>
            ))}
          </List>
        </Paper>
      </Box>
    </Container>
  );
}

export default DashboardFormateur;
