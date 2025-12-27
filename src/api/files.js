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

  // Obtenir un fichier par ID
  getFile: async (fileId) => {
    const response = await api.get(`/files/${fileId}/`);
    return response.data;
  },

  // Mettre à jour un fichier
  updateFile: async (fileId, fileData) => {
    const response = await api.put(`/files/${fileId}/`, fileData);
    return response.data;
  },

  // Supprimer un fichier
  deleteFile: async (fileId) => {
    const response = await api.delete(`/files/${fileId}/`);
    return response.data;
  },
};
