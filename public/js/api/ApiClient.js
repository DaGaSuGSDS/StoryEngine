/**
 * ApiClient.js
 * Module responsible for all HTTP interactions with the backend API.
 */
/**
 * Client for interacting with the backend API.
 */
export class ApiClient {
  /**
   * @param {string} baseUrl - Base URL of the API.
   */
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  /**
   * Helper to perform JSON fetch requests.
   * @param {string} url - Relative URL path.
   * @param {Object} options - Fetch options.
   * @returns {Promise<any>} Response JSON.
   */
  async _jsonFetch(url, options = {}) {
    const res = await fetch(this.baseUrl + url, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || res.statusText);
    }
    return res.json();
  }

  /**
   * Lists all available projects.
   * @returns {Promise<Array>} List of projects.
   */
  listProjects() {
    return this._jsonFetch("/projects");
  }

  /**
   * Creates a new project.
   * @param {Object} data - Project data (name).
   * @returns {Promise<Object>} Created project.
   */
  createProject({ name }) {
    return this._jsonFetch("/projects", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }

  /**
   * Loads a project by ID.
   * @param {string} id - Project ID.
   * @returns {Promise<Object>} Project data.
   */
  loadProject(id) {
    return this._jsonFetch(`/projects/${encodeURIComponent(id)}`);
  }

  /**
   * Saves a project.
   * @param {Object} project - Project object to save.
   * @returns {Promise<Object>} Response.
   */
  saveProject(project) {
    return this._jsonFetch(`/projects/${encodeURIComponent(project.id)}`, {
      method: "PUT",
      body: JSON.stringify(project),
    });
  }

  /**
   * Uploads an image asset to a project.
   * @param {string} projectId - Project ID.
   * @param {File} file - Image file.
   * @returns {Promise<Object>} Uploaded asset info.
   */
  async uploadImage(projectId, file) {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch(
      `${this.baseUrl}/projects/${encodeURIComponent(
        projectId
      )}/images`,
      {
        method: "POST",
        body: formData,
      }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || res.statusText);
    }
    return res.json();
  }

  /**
   * Deletes an image asset.
   * @param {string} projectId - Project ID.
   * @param {string} imageId - Image ID.
   * @returns {Promise<any>}
   */
  deleteImage(projectId, imageId) {
    return this._jsonFetch(
      `/projects/${encodeURIComponent(
        projectId
      )}/images/${encodeURIComponent(imageId)}`,
      {
        method: "DELETE",
      }
    );
  }

  /**
   * Uploads an audio asset to a project.
   * @param {string} projectId - Project ID.
   * @param {File} file - Audio file.
   * @returns {Promise<Object>} Uploaded asset info.
   */
  async uploadAudio(projectId, file) {
    const formData = new FormData();
    formData.append("audio", file);
    const res = await fetch(
      `${this.baseUrl}/projects/${encodeURIComponent(
        projectId
      )}/audio`,
      {
        method: "POST",
        body: formData,
      }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || res.statusText);
    }
    return res.json();
  }

  /**
   * Deletes an audio asset.
   * @param {string} projectId - Project ID.
   * @param {string} audioId - Audio ID.
   * @returns {Promise<any>}
   */
  deleteAudio(projectId, audioId) {
    return this._jsonFetch(
      `/projects/${encodeURIComponent(
        projectId
      )}/audio/${encodeURIComponent(audioId)}`,
      {
        method: "DELETE",
      }
    );
  }
}
