import api from './config';

export const userService = {
  // Obtenir les informations de l'utilisateur connecté
  getMe: async () => {
    const response = await api.get('/users/me/');
    return response.data;
  },

  // Lister tous les utilisateurs
  getUsers: async () => {
    const response = await api.get('/users/');
    return response.data;
  },

  // Obtenir un utilisateur par ID
  getUser: async (userId) => {
    const response = await api.get(`/users/${userId}/`);
    return response.data;
  },

  // Mettre à jour un utilisateur
  updateUser: async (userId, userData) => {
    const response = await api.put(`/users/${userId}/`, userData);
    return response.data;
  },

  // Supprimer un utilisateur
  deleteUser: async (userId) => {
    const response = await api.delete(`/users/${userId}/`);
    return response.data;
  },
};
