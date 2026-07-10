const BASE_URL = '/api';

const api = {
  // Helper interno
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('vgc_token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, config);

      // El backend devuelve JSON en /api/*. Si llega otra cosa (p. ej. el
      // index.html de una ruta mal formada), no intentamos parsear JSON.
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        if (!response.ok) {
          throw new Error(`Error ${response.status}: recurso no disponible.`);
        }
        throw new Error('Respuesta inesperada del servidor.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Algo salió mal');
      }

      return data;
    } catch (error) {
      console.error(`API Error on ${endpoint}:`, error);
      throw error;
    }
  },

  // HTTP GET
  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  // HTTP POST
  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  // HTTP PUT
  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  // HTTP DELETE
  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};

export default api;
