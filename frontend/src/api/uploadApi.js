import { useAuthStore } from "../store/useAuthStore";

const API_BASE_URL = "http://localhost:8000";

export async function uploadStudyFiles(files) {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  const token = useAuthStore.getState().session?.access_token;
  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: "POST",
    headers: token ? { "Authorization": `Bearer ${token}` } : {},
    body: formData
  });

  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Upload failed");
    } catch (e) {
      throw new Error(e.message || "Upload failed");
    }
  }

  return response.json();
}
