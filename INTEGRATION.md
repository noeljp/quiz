# Guide d'Intégration Frontend-Backend

Ce guide explique comment intégrer le backend Django avec le frontend React existant.

## Architecture

```
quiz/
├── backend/              # Backend Django
│   ├── config/          # Configuration Django
│   ├── pedagogical/     # Application principale
│   ├── media/           # Fichiers téléversés
│   └── manage.py
│
└── frontend/            # Frontend React (existant)
    ├── src/
    ├── public/
    └── package.json
```

## Configuration CORS

Le backend est déjà configuré pour accepter les requêtes du frontend React sur:
- `http://localhost:5173` (dev Vite)
- `http://127.0.0.1:5173`

Voir `backend/config/settings.py` pour modifier ces paramètres.

## Démarrage des Serveurs

### Terminal 1 - Backend Django
```bash
cd backend
source venv/bin/activate
python manage.py runserver
# Accessible sur http://localhost:8000
```

### Terminal 2 - Frontend React
```bash
npm run dev
# Accessible sur http://localhost:5173
```

## Intégration dans React

### 1. Installation des dépendances

Ajouter axios pour les requêtes HTTP:
```bash
npm install axios
```

### 2. Configuration de l'API

Créer un fichier `src/api/config.js`:
```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Créer une instance axios avec configuration de base
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer le rafraîchissement du token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(
          `${API_BASE_URL}/auth/token/refresh/`,
          { refresh: refreshToken }
        );

        const { access } = response.data;
        localStorage.setItem('accessToken', access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Token de rafraîchissement invalide, déconnecter l'utilisateur
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### 3. Service d'authentification

Créer `src/api/auth.js`:
```javascript
import api from './config';

export const authService = {
  // Inscription
  register: async (userData) => {
    const response = await api.post('/auth/register/', userData);
    if (response.data.tokens) {
      localStorage.setItem('accessToken', response.data.tokens.access);
      localStorage.setItem('refreshToken', response.data.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Connexion
  login: async (username, password) => {
    const response = await api.post('/auth/login/', { username, password });
    if (response.data.tokens) {
      localStorage.setItem('accessToken', response.data.tokens.access);
      localStorage.setItem('refreshToken', response.data.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Déconnexion
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  // Obtenir l'utilisateur courant
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated: () => {
    return !!localStorage.getItem('accessToken');
  },
};
```

### 4. Service pour les fichiers

Créer `src/api/files.js`:
```javascript
import api from './config';

export const fileService = {
  // Lister tous les fichiers
  getFiles: async () => {
    const response = await api.get('/files/');
    return response.data;
  },

  // Téléverser un fichier
  uploadFile: async (fileData) => {
    const formData = new FormData();
    formData.append('title', fileData.title);
    formData.append('subject', fileData.subject);
    formData.append('theme', fileData.theme);
    formData.append('file', fileData.file);

    const response = await api.post('/files/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Supprimer un fichier
  deleteFile: async (fileId) => {
    const response = await api.delete(`/files/${fileId}/`);
    return response.data;
  },
};
```

### 5. Service pour la progression

Créer `src/api/progress.js`:
```javascript
import api from './config';

export const progressService = {
  // Obtenir toute la progression
  getProgress: async () => {
    const response = await api.get('/progress/');
    return response.data;
  },

  // Obtenir les statistiques
  getStats: async () => {
    const response = await api.get('/progress/stats/');
    return response.data;
  },

  // Créer une nouvelle entrée de progression
  createProgress: async (progressData) => {
    const response = await api.post('/progress/', progressData);
    return response.data;
  },

  // Mettre à jour la progression
  updateProgress: async (progressId, progressData) => {
    const response = await api.patch(`/progress/${progressId}/`, progressData);
    return response.data;
  },

  // Marquer un quiz comme complété
  completeQuiz: async (progressId, score) => {
    const response = await api.patch(`/progress/${progressId}/`, {
      completed: true,
      score: score,
    });
    return response.data;
  },
};
```

## Exemples d'utilisation dans les composants React

### Exemple 1: Page de connexion

```javascript
import { useState } from 'react';
import { authService } from '../api/auth';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await authService.login(username, password);
      const user = authService.getCurrentUser();
      
      // Rediriger selon le type d'utilisateur
      if (user.user_type === 'formateur') {
        navigate('/formateur');
      } else {
        navigate('/apprenant');
      }
    } catch (err) {
      setError('Identifiants invalides');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Nom d'utilisateur"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mot de passe"
      />
      <button type="submit">Se connecter</button>
      {error && <div>{error}</div>}
    </form>
  );
}
```

### Exemple 2: Dashboard Formateur avec téléversement

```javascript
import { useState, useEffect } from 'react';
import { fileService } from '../api/files';

function DashboardFormateur() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const data = await fileService.getFiles();
      setFiles(data);
    } catch (err) {
      console.error('Erreur chargement fichiers:', err);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    setUploading(true);
    try {
      await fileService.uploadFile({
        title: formData.get('title'),
        subject: formData.get('subject'),
        theme: formData.get('theme'),
        file: formData.get('file'),
      });
      loadFiles(); // Recharger la liste
      e.target.reset();
    } catch (err) {
      console.error('Erreur téléversement:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1>Espace Formateur</h1>
      
      <form onSubmit={handleFileUpload}>
        <input name="title" placeholder="Titre" required />
        <input name="subject" placeholder="Sujet" required />
        <input name="theme" placeholder="Thème" required />
        <input name="file" type="file" required />
        <button type="submit" disabled={uploading}>
          {uploading ? 'Téléversement...' : 'Téléverser'}
        </button>
      </form>

      <div>
        <h2>Fichiers téléversés</h2>
        {files.map(file => (
          <div key={file.id}>
            <h3>{file.title}</h3>
            <p>{file.subject} - {file.theme}</p>
            <a href={file.file_url} target="_blank" rel="noopener noreferrer">
              Télécharger
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Exemple 3: Dashboard Apprenant avec statistiques

```javascript
import { useState, useEffect } from 'react';
import { progressService } from '../api/progress';

function DashboardApprenant() {
  const [stats, setStats] = useState(null);
  const [progress, setProgress] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, progressData] = await Promise.all([
        progressService.getStats(),
        progressService.getProgress(),
      ]);
      setStats(statsData);
      setProgress(progressData);
    } catch (err) {
      console.error('Erreur chargement données:', err);
    }
  };

  return (
    <div>
      <h1>Espace Apprenant</h1>
      
      {stats && (
        <div>
          <h2>Statistiques</h2>
          <p>Quiz complétés: {stats.completed_quizzes} / {stats.total_quizzes}</p>
          <p>Score moyen: {stats.average_score}%</p>
          <p>Progression: {stats.completion_percentage}%</p>
        </div>
      )}

      <div>
        <h2>Mes Quiz</h2>
        {progress.map(item => (
          <div key={item.id}>
            <h3>{item.quiz_title}</h3>
            <p>Sujet: {item.quiz_subject}</p>
            <p>Score: {item.score}/{item.max_score} ({item.percentage}%)</p>
            <p>Statut: {item.completed ? '✓ Complété' : 'En cours'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Protection des routes

Créer un composant `ProtectedRoute.jsx`:
```javascript
import { Navigate } from 'react-router-dom';
import { authService } from '../api/auth';

function ProtectedRoute({ children, requiredUserType }) {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getCurrentUser();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredUserType && user.user_type !== requiredUserType) {
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;
```

Utilisation dans `App.jsx`:
```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardFormateur from './pages/DashboardFormateur';
import DashboardApprenant from './pages/DashboardApprenant';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route
          path="/formateur"
          element={
            <ProtectedRoute requiredUserType="formateur">
              <DashboardFormateur />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/apprenant"
          element={
            <ProtectedRoute requiredUserType="apprenant">
              <DashboardApprenant />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

## Variables d'environnement

Créer `.env` dans le dossier frontend:
```
VITE_API_BASE_URL=http://localhost:8000/api
```

Utiliser dans `src/api/config.js`:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
```

## Tests et Débogage

### Tester l'API directement
```bash
cd backend
chmod +x test_api.sh
./test_api.sh
```

### Vérifier CORS
Ouvrir la console navigateur (F12) et vérifier qu'il n'y a pas d'erreurs CORS.

### Déboguer les requêtes
Dans le composant React:
```javascript
api.interceptors.request.use(request => {
  console.log('Starting Request', request);
  return request;
});

api.interceptors.response.use(response => {
  console.log('Response:', response);
  return response;
});
```

## Points d'attention

1. **CORS**: Assurez-vous que le frontend et le backend tournent sur les ports corrects
2. **Tokens JWT**: Les tokens expirent, le système gère automatiquement le rafraîchissement
3. **Fichiers**: Les fichiers sont stockés dans `backend/media/`, assurez-vous que le dossier existe
4. **Types de fichiers**: Configurez les types acceptés dans le frontend selon vos besoins
5. **Sécurité**: Ne commitez jamais les tokens ou le SECRET_KEY Django

## Prochaines étapes

- [ ] Implémenter la gestion complète des utilisateurs
- [ ] Ajouter la validation des formulaires
- [ ] Implémenter la recherche et les filtres
- [ ] Ajouter des notifications toast
- [ ] Implémenter la pagination
- [ ] Ajouter des tests end-to-end
