const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string;
  isFormData?: boolean;
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, token, isFormData = false } = options;

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Erreur inconnue" }));
    throw new Error(error.detail || `Erreur ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

// --- Auth ---

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  tenant_id: string;
  full_name: string | null;
}

export function login(email: string, password: string) {
  return apiFetch<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

// --- Documents ---

export interface Document {
  id: string;
  tenant_id: string;
  filename: string;
  file_type: string;
  file_size_bytes: number | null;
  source_url: string | null;
  status: string;
  chunk_count: number;
  created_at: string;
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
}

export function listDocuments(tenantId: string, token: string) {
  return apiFetch<DocumentListResponse>(
    `/api/v1/documents?tenant_id=${tenantId}`,
    { token }
  );
}

export function uploadDocument(tenantId: string, file: File, token: string) {
  const formData = new FormData();
  formData.append("tenant_id", tenantId);
  formData.append("file", file);

  return apiFetch<Document>("/api/v1/documents", {
    method: "POST",
    body: formData,
    token,
    isFormData: true,
  });
}

export function deleteDocument(
  documentId: string,
  tenantId: string,
  token: string
) {
  return apiFetch<void>(
    `/api/v1/documents/${documentId}?tenant_id=${tenantId}`,
    { method: "DELETE", token }
  );
}

export function indexUrl(tenantId: string, url: string, token: string) {
  return apiFetch<Document>("/api/v1/documents/index-url", {
    method: "POST",
    body: { tenant_id: tenantId, url },
    token,
  });
}

// --- Conversations ---

export interface Conversation {
  id: string;
  tenant_id: string;
  messages: Array<{ role: string; content: string }>;
  created_at: string;
}

export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
}

export function listConversations(tenantId: string, token: string) {
  return apiFetch<ConversationListResponse>(
    `/api/v1/conversations?tenant_id=${tenantId}`,
    { token }
  );
}

export function deleteConversation(
  conversationId: string,
  tenantId: string,
  token: string
) {
  return apiFetch<void>(
    `/api/v1/conversations/${conversationId}?tenant_id=${tenantId}`,
    { method: "DELETE", token }
  );
}

// --- Chat ---

export interface ChatResponse {
  answer: string;
  sources: string[];
  chunks_used: number;
}

export function chat(tenantId: string, message: string) {
  return apiFetch<ChatResponse>("/api/v1/chat", {
    method: "POST",
    body: { tenant_id: tenantId, message },
  });
}
