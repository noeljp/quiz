import api from './config';

export const evaluationService = {
  // Evaluation Sessions
  getEvaluationSessions: async () => {
    const response = await api.get('/evaluation-sessions/');
    return response.data;
  },

  getEvaluationSession: async (sessionId) => {
    const response = await api.get(`/evaluation-sessions/${sessionId}/`);
    return response.data;
  },

  createEvaluationSession: async (sessionData) => {
    const response = await api.post('/evaluation-sessions/', sessionData);
    return response.data;
  },

  completeEvaluationSession: async (sessionId) => {
    const response = await api.post(`/evaluation-sessions/${sessionId}/complete/`);
    return response.data;
  },

  // Question Responses
  getQuestionResponses: async (sessionId = null) => {
    const url = sessionId 
      ? `/question-responses/?session=${sessionId}`
      : '/question-responses/';
    const response = await api.get(url);
    return response.data;
  },

  createQuestionResponse: async (responseData) => {
    const response = await api.post('/question-responses/', responseData);
    return response.data;
  },

  generateFeedback: async (responseId) => {
    const response = await api.post(`/question-responses/${responseId}/generate_feedback/`);
    return response.data;
  },

  // Cognitive Profiles
  getCognitiveProfiles: async () => {
    const response = await api.get('/cognitive-profiles/');
    return response.data;
  },

  getMyCognitiveProfile: async () => {
    const response = await api.get('/cognitive-profiles/my_profile/');
    return response.data;
  },

  getCognitiveProfile: async (profileId) => {
    const response = await api.get(`/cognitive-profiles/${profileId}/`);
    return response.data;
  },

  updateCognitiveProfile: async (profileId, profileData) => {
    const response = await api.patch(`/cognitive-profiles/${profileId}/`, profileData);
    return response.data;
  },
};
