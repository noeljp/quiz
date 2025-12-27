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
