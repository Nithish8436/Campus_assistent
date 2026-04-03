import { createParser } from "eventsource-parser";
import { useAuthStore } from "../store/useAuthStore";

const API_BASE_URL = "http://localhost:8000";

export async function fetchFileList() {
  const token = useAuthStore.getState().session?.access_token;
  const response = await fetch(`${API_BASE_URL}/api/upload/files`, {
    headers: token ? { "Authorization": `Bearer ${token}` } : {}
  });
  if (!response.ok) {
    throw new Error("Failed to fetch files");
  }
  return response.json();
}

export async function fetchUsage() {
  const token = useAuthStore.getState().session?.access_token;
  const response = await fetch(`${API_BASE_URL}/api/usage`, {
    headers: token ? { "Authorization": `Bearer ${token}` } : {}
  });
  if (!response.ok) {
    throw new Error("Failed to fetch usage");
  }
  return response.json();
}

export async function sendChatMessage(question, fileIds, onChunk) {
  const token = useAuthStore.getState().session?.access_token;
  const response = await fetch(`${API_BASE_URL}/api/chat/`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    },
    body: JSON.stringify({
      question,
      file_ids: fileIds,
      history: []
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Chat request failed" }));
    // Normalize FastAPI detail structure
    const error = typeof errorData.detail === "object" ? errorData.detail : { message: errorData.detail };
    throw error;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let fullText = "";

  console.log("Starting chat stream parser...");

  const parser = createParser({
    onEvent: (event) => {
      console.log("SSE Event Object:", JSON.stringify(event));

      // Some versions/configurations might use different property names
      // but 'data' is standard for SSE eventsource-parser
      const data = event.data;
      const type = event.type || "unknown";

      if (data === "[DONE]") {
        console.log("SSE [DONE] signal detected");
        return;
      }

      if (data) {
        fullText += data;
        if (onChunk) onChunk(fullText);
      }
    }
  });

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log("Stream reader done signal");
        break;
      }

      const chunkText = decoder.decode(value, { stream: true });
      if (chunkText) {
        console.log("Feeding chunk to parser (bytes):", value.length);
        parser.feed(chunkText);
      }
    }
  } catch (readError) {
    console.error("Stream reader exception:", readError);
    throw readError;
  }

  return fullText;
}

export async function fetchSummary(fileId, mode = "detailed") {
  const token = useAuthStore.getState().session?.access_token;
  const response = await fetch(`${API_BASE_URL}/api/summarize`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ file_id: fileId, mode })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw err; // Throw the whole error object so we can check it
  }
  return response.json();
}

export async function fetchQuiz(fileIds, difficulty = "medium", count = 5) {
  const token = useAuthStore.getState().session?.access_token;
  const response = await fetch(`${API_BASE_URL}/api/quiz`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ file_ids: fileIds, difficulty, count })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw err;
  }
  return response.json();
}
