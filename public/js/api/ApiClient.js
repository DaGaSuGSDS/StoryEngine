export class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

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

  listProjects() {
    return this._jsonFetch("/projects");
  }

  createProject({ name }) {
    return this._jsonFetch("/projects", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }

  loadProject(id) {
    return this._jsonFetch(`/projects/${encodeURIComponent(id)}`);
  }

  saveProject(project) {
    return this._jsonFetch(`/projects/${encodeURIComponent(project.id)}`, {
      method: "PUT",
      body: JSON.stringify(project),
    });
  }

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
