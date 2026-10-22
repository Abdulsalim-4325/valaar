import { useCallback, useEffect, useMemo, useState } from "react";
import {
  api,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "./services/api";
import "./App.css";

type View = "Overview" | "My Tasks" | "Completed";

const navItems: { name: View; icon: string }[] = [
  { name: "Overview", icon: "◫" },
  { name: "My Tasks", icon: "☷" },
  { name: "Completed", icon: "✓" },
];

const priorityLabels: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const statusLabels: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Completed",
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<View>("Overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(false);
  const [error, setError] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [newStatus, setNewStatus] = useState<TaskStatus>("todo");

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [result] = await Promise.all([
        api.listTasks(),
        api.health(),
      ]);
      setTasks(result);
      setApiOnline(true);
    } catch (err) {
      setApiOnline(false);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load tasks. Check your API connection.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const counts = useMemo(
    () => ({
      total: tasks.length,
      todo: tasks.filter((task) => task.status === "todo").length,
      progress: tasks.filter((task) => task.status === "in_progress").length,
      done: tasks.filter((task) => task.status === "done").length,
      high: tasks.filter(
        (task) => task.priority === "high" && task.status !== "done",
      ).length,
    }),
    [tasks],
  );

  const visibleTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = `${task.title} ${task.description ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesView =
        view === "Completed"
          ? task.status === "done"
          : view === "My Tasks"
            ? task.status !== "done"
            : true;

      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;

      return matchesSearch && matchesView && matchesStatus;
    });
  }, [tasks, view, search, statusFilter]);

  async function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    setError("");

    try {
      await api.createTask({
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status: newStatus,
      });

      setTitle("");
      setDescription("");
      setPriority("medium");
      setNewStatus("todo");
      setShowComposer(false);
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create task.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(task: Task, status: TaskStatus) {
    setError("");
    try {
      const updated = await api.updateTask(task.id, { status });
      setTasks((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update task.");
    }
  }

  async function deleteTask(task: Task) {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) {
      return;
    }

    setError("");
    try {
      await api.deleteTask(task.id);
      setTasks((current) => current.filter((item) => item.id !== task.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete task.");
    }
  }

  const completion =
    counts.total === 0 ? 0 : Math.round((counts.done / counts.total) * 100);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={() => setView("Overview")}>
          <span className="brand-mark">V.</span>
          <span className="brand-copy">
            <strong>V.A.L.A.A.R.</strong>
            <small>PERSONAL COMMAND CENTER</small>
          </span>
        </a>

        <div className="nav-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${view === item.name ? "active" : ""}`}
              onClick={() => setView(item.name)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.name}</span>
              {item.name === "My Tasks" && counts.total - counts.done > 0 && (
                <span className="nav-count">{counts.total - counts.done}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />
        <div className="system-card">
          <div className="system-heading">
            <span className={`status-dot ${apiOnline ? "online" : ""}`} />
            <span>System status</span>
          </div>
          <strong>{apiOnline ? "All systems operational" : "API disconnected"}</strong>
          <p>
            {apiOnline
              ? "Connected to your local workspace."
              : "Start the FastAPI server to sync your tasks."}
          </p>
          <button className="text-button" onClick={() => void loadTasks()}>
            ↻ Check connection
          </button>
        </div>
        <div className="sidebar-footer">
          <span className="avatar">AS</span>
          <span className="profile-copy">
            <strong>Personal workspace</strong>
            <small>Local development</small>
          </span>
          <span className="footer-dots">···</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>Workspace</span>
            <span className="crumb-separator">/</span>
            <strong>{view}</strong>
          </div>
          <div className="topbar-actions">
            <span className="local-pill">
              <span className="status-dot online" />
              Local environment
            </span>
            <button
              className="icon-button"
              aria-label="Refresh tasks"
              title="Refresh tasks"
              onClick={() => void loadTasks()}
            >
              ↻
            </button>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" />
                YOUR SPACE. YOUR SYSTEM.
              </div>
              <h1>
                {view === "Overview"
                  ? "Good to have you here."
                  : view === "My Tasks"
                    ? "Your tasks."
                    : "Things you've finished."}
              </h1>
              <p className="page-subtitle">
                {view === "Overview"
                  ? "One command center for the things that move you forward."
                  : view === "My Tasks"
                    ? "Stay focused. Make progress, one task at a time."
                    : "A record of the progress you've made."}
              </p>
            </div>
            <button
              className="primary-button"
              onClick={() => setShowComposer((current) => !current)}
            >
              <span className="plus">+</span> New task
            </button>
          </section>

          {error && (
            <div className="error-banner" role="alert">
              <span>!</span>
              <div>
                <strong>Something needs attention</strong>
                <p>{error}</p>
              </div>
              <button onClick={() => void loadTasks()}>Retry</button>
            </div>
          )}

          {showComposer && (
            <section className="composer panel">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">CAPTURE YOUR NEXT MOVE</span>
                  <h2>Create a task</h2>
                </div>
                <button
                  className="icon-button"
                  onClick={() => setShowComposer(false)}
                  aria-label="Close task form"
                >
                  ×
                </button>
              </div>
              <form onSubmit={createTask}>
                <label htmlFor="task-title">Task title</label>
                <input
                  id="task-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="What do you want to accomplish?"
                  maxLength={200}
                  required
                  autoFocus
                />
                <label htmlFor="task-description">Description <span>(optional)</span></label>
                <textarea
                  id="task-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Add a little context..."
                  rows={3}
                  maxLength={5000}
                />
                <div className="form-row">
                  <div className="field-group">
                    <label htmlFor="task-priority">Priority</label>
                    <select
                      id="task-priority"
                      value={priority}
                      onChange={(event) =>
                        setPriority(event.target.value as TaskPriority)
                      }
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="field-group">
                    <label htmlFor="task-status">Status</label>
                    <select
                      id="task-status"
                      value={newStatus}
                      onChange={(event) =>
                        setNewStatus(event.target.value as TaskStatus)
                      }
                    >
                      <option value="todo">To do</option>
                      <option value="in_progress">In progress</option>
                      <option value="done">Completed</option>
                    </select>
                  </div>
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setShowComposer(false)}
                  >
                    Cancel
                  </button>
                  <button className="primary-button" disabled={saving}>
                    {saving ? "Saving..." : "Create task →"}
                  </button>
                </div>
              </form>
            </section>
          )}

          {view === "Overview" && (
            <>
              <section className="stats-grid">
                <article className="stat-card panel">
                  <div className="stat-top">
                    <span className="stat-icon purple">◫</span>
                    <span className="stat-caption">ALL TIME</span>
                  </div>
                  <div className="stat-value">{loading ? "—" : counts.total}</div>
                  <div className="stat-label">Total tasks</div>
                  <div className="stat-foot">Across your workspace</div>
                </article>
                <article className="stat-card panel">
                  <div className="stat-top">
                    <span className="stat-icon blue">◷</span>
                    <span className="stat-caption">IN MOTION</span>
                  </div>
                  <div className="stat-value">{loading ? "—" : counts.progress}</div>
                  <div className="stat-label">In progress</div>
                  <div className="stat-foot">Work currently underway</div>
                </article>
                <article className="stat-card panel">
                  <div className="stat-top">
                    <span className="stat-icon green">✓</span>
                    <span className="stat-caption">ACCOMPLISHED</span>
                  </div>
                  <div className="stat-value">{loading ? "—" : counts.done}</div>
                  <div className="stat-label">Completed</div>
                  <div className="stat-foot">Every finished task counts</div>
                </article>
                <article className="stat-card panel">
                  <div className="stat-top">
                    <span className="stat-icon orange">↗</span>
                    <span className="stat-caption">NEEDS ATTENTION</span>
                  </div>
                  <div className="stat-value">{loading ? "—" : counts.high}</div>
                  <div className="stat-label">High priority</div>
                  <div className="stat-foot">Unfinished priority tasks</div>
                </article>
              </section>

              <section className="progress-panel panel">
                <div className="progress-copy">
                  <span className="eyebrow">YOUR MOMENTUM</span>
                  <h2>Progress, not perfection.</h2>
                  <p>Every completed task is a step in the right direction.</p>
                </div>
                <div className="progress-ring" style={{ "--progress": `${completion}%` } as React.CSSProperties}>
                  <div className="progress-ring-inner">
                    <strong>{loading ? "—" : `${completion}%`}</strong>
                    <span>complete</span>
                  </div>
                </div>
              </section>
            </>
          )}

          <section className="tasks-section">
            <div className="section-heading tasks-heading">
              <div>
                <span className="eyebrow">
                  {view === "Completed" ? "YOUR WINS" : "THE WORK THAT MATTERS"}
                </span>
                <h2>{view === "Overview" ? "Recent tasks" : view}</h2>
              </div>
              <span className="task-total">{visibleTasks.length} tasks</span>
            </div>

            <div className="task-toolbar">
              <div className="search-box">
                <span>⌕</span>
                <input
                  aria-label="Search tasks"
                  placeholder="Search your tasks..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <kbd>⌘ K</kbd>
              </div>
              <select
                className="filter-select"
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="done">Completed</option>
              </select>
            </div>

            <div className="task-list panel">
              {loading ? (
                <div className="empty-state">
                  <div className="loading-spinner" />
                  <strong>Loading your workspace</strong>
                  <p>Connecting to your task database...</p>
                </div>
              ) : visibleTasks.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">{error ? "!" : "✳"}</span>
                  <strong>{error ? "Your tasks couldn't load" : "A little room to begin"}</strong>
                  <p>
                    {error
                      ? "Check the backend connection and try again."
                      : search
                        ? "No tasks match your search. Try another phrase."
                        : "Create a task and give your next idea somewhere to go."}
                  </p>
                  {!error && !search && (
                    <button
                      className="secondary-button"
                      onClick={() => setShowComposer(true)}
                    >
                      + Create your first task
                    </button>
                  )}
                  {error && (
                    <button className="secondary-button" onClick={() => void loadTasks()}>
                      Retry connection
                    </button>
                  )}
                </div>
              ) : (
                visibleTasks.map((task) => (
                  <article className="task-row" key={task.id}>
                    <button
                      className={`task-check ${task.status === "done" ? "checked" : ""}`}
                      aria-label={
                        task.status === "done"
                          ? `Reopen ${task.title}`
                          : `Complete ${task.title}`
                      }
                      title="Toggle completion"
                      onClick={() =>
                        void changeStatus(
                          task,
                          task.status === "done" ? "todo" : "done",
                        )
                      }
                    >
                      {task.status === "done" ? "✓" : ""}
                    </button>
                    <div className="task-main">
                      <strong className={task.status === "done" ? "task-done" : ""}>
                        {task.title}
                      </strong>
                      {task.description && <p>{task.description}</p>}
                      <div className="task-meta">
                        <span className={`status-badge status-${task.status}`}>
                          <span />
                          {statusLabels[task.status]}
                        </span>
                        <span className={`priority-badge priority-${task.priority}`}>
                          {priorityLabels[task.priority]} priority
                        </span>
                        <span className="task-date">
                          Created {formatDate(task.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="task-actions">
                      <select
                        aria-label={`Change status for ${task.title}`}
                        value={task.status}
                        onChange={(event) =>
                          void changeStatus(task, event.target.value as TaskStatus)
                        }
                      >
                        <option value="todo">To do</option>
                        <option value="in_progress">In progress</option>
                        <option value="done">Completed</option>
                      </select>
                      <button
                        className="delete-button"
                        aria-label={`Delete ${task.title}`}
                        title="Delete task"
                        onClick={() => void deleteTask(task)}
                      >
                        ×
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <footer className="page-footer">
            <span>V.A.L.A.A.R. <span className="footer-version">v0.1.0</span></span>
            <span>Built for clarity. Designed for momentum.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
