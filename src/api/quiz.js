import api from './config';

export const quizService = {
  // Get all quizzes (formateur: their quizzes, apprenant: assigned quizzes)
  getQuizzes: async () => {
    const response = await api.get('/quizzes/');
    return response.data;
  },

  // Get a specific quiz by ID
  getQuiz: async (quizId) => {
    const response = await api.get(`/quizzes/${quizId}/`);
    return response.data;
  },

  // Create a new quiz
  createQuiz: async (quizData) => {
    const response = await api.post('/quizzes/', quizData);
    return response.data;
  },

  // Update a quiz
  updateQuiz: async (quizId, quizData) => {
    const response = await api.patch(`/quizzes/${quizId}/`, quizData);
    return response.data;
  },

  // Delete a quiz
  deleteQuiz: async (quizId) => {
    const response = await api.delete(`/quizzes/${quizId}/`);
    return response.data;
  },

  // Get list of all learners (for assignment)
  getLearners: async () => {
    const response = await api.get('/quizzes/learners/');
    return response.data;
  },

  // Generate quiz from text
  generateQuiz: async (text, numQuestions = 5) => {
    const response = await api.post('/quiz/generate/', {
      text,
      num_questions: numQuestions,
    });
    return response.data;
  },

  // Upload document and extract text
  uploadDocument: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/documents/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
