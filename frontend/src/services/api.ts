const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_at?: string | null;
}

export interface TaskUpdate {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_at?: string | null;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "Cannot reach the V.A.L.A.A.R. API. Check that the backend is running on port 8000.",
    );
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export interface ChatResponse {
  reply: string;
}

export const api = {
  health: () => request<{ status: string }>("/api/v1/health"),

  chat: (message: string) =>
    request<ChatResponse>("/api/v1/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  listTasks: () => request<Task[]>("/api/v1/tasks"),

  createTask: (task: TaskCreate) =>
    request<Task>("/api/v1/tasks", {
      method: "POST",
      body: JSON.stringify(task),
    }),

  updateTask: (id: number, task: TaskUpdate) =>
    request<Task>(`/api/v1/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(task),
    }),

  deleteTask: (id: number) =>
    request<void>(`/api/v1/tasks/${id}`, {
      method: "DELETE",
    }),
};
