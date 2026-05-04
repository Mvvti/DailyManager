import { AnimatePresence, motion } from "framer-motion";
import { CSSProperties, FormEvent, useEffect, useMemo, useState } from "react";
import { parseNaturalDate } from "../utils/nlpDate";

type TaskCategory = "praca" | "dom";
type TaskPriority = "high" | "medium" | "low";

type Subtask = {
  id: string;
  text: string;
  done: boolean;
};

type Task = {
  id: string;
  text: string;
  done: boolean;
  category: TaskCategory;
  priority: TaskPriority;
  subtasks: Subtask[];
  deadline?: string;
  calendarEventId?: string;
};

const STORAGE_KEY = "dm_tasks";
const priorityOrder: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

function TaskList() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.reduce<Task[]>((acc, item) => {
        if (typeof item !== "object" || item === null) return acc;
        const candidate = item as Record<string, unknown>;
        if (
          typeof candidate.id !== "string" ||
          typeof candidate.text !== "string" ||
          typeof candidate.done !== "boolean"
        ) {
          return acc;
        }

        const priority: TaskPriority =
          candidate.priority === "high" || candidate.priority === "low" || candidate.priority === "medium"
            ? candidate.priority
            : "medium";

        const subtasks = Array.isArray(candidate.subtasks)
          ? candidate.subtasks.reduce<Subtask[]>((subAcc, subItem) => {
              if (typeof subItem !== "object" || subItem === null) return subAcc;
              const subCandidate = subItem as Record<string, unknown>;
              if (
                typeof subCandidate.id === "string" &&
                typeof subCandidate.text === "string" &&
                typeof subCandidate.done === "boolean"
              ) {
                subAcc.push({
                  id: subCandidate.id,
                  text: subCandidate.text,
                  done: subCandidate.done
                });
              }
              return subAcc;
            }, [])
          : [];

        acc.push({
          id: candidate.id,
          text: candidate.text,
          done: candidate.done,
          category: candidate.category === "dom" ? "dom" : "praca",
          priority,
          subtasks,
          deadline: typeof candidate.deadline === "string" ? candidate.deadline : undefined,
          calendarEventId: typeof candidate.calendarEventId === "string" ? candidate.calendarEventId : undefined
        });
        return acc;
      }, []);
    } catch {
      return [];
    }
  });

  const [newTaskText, setNewTaskText] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<TaskCategory>("praca");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("medium");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [newSubtaskTexts, setNewSubtaskTexts] = useState<Record<string, string>>({});
  const [parsedDeadline, setParsedDeadline] = useState<Date | null>(null);
  const [editingDeadlineId, setEditingDeadlineId] = useState<string | null>(null);
  const [deadlineEditText, setDeadlineEditText] = useState<string>("");

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const formatDeadlinePreview = (date: Date): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const time = date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });

    if (target.getTime() === today.getTime()) return `dziś ${time}`;
    if (target.getTime() === tomorrow.getTime()) return `jutro ${time}`;

    return new Intl.DateTimeFormat("pl-PL", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  };

  const getDeadlineStatus = (isoString: string): "overdue" | "today" | "future" => {
    const d = new Date(isoString);
    const now = new Date();
    if (d < now) return "overdue";
    if (d.toDateString() === now.toDateString()) return "today";
    return "future";
  };

  const handleNewTaskChange = (value: string) => {
    setNewTaskText(value);
    const { deadline } = parseNaturalDate(value);
    setParsedDeadline(deadline);
  };

  const startDeadlineEdit = (task: Task) => {
    setEditingDeadlineId(task.id);
    setDeadlineEditText(task.deadline ? formatDeadlinePreview(new Date(task.deadline)) : "");
  };

  const submitDeadlineEdit = (taskId: string) => {
    const raw = deadlineEditText.trim();
    if (raw === "") {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, deadline: undefined } : t)));
    } else {
      const { deadline } = parseNaturalDate(raw);
      if (deadline) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, deadline: deadline.toISOString() } : t)));
      }
    }
    setEditingDeadlineId(null);
    setDeadlineEditText("");
  };

  const cancelDeadlineEdit = () => {
    setEditingDeadlineId(null);
    setDeadlineEditText("");
  };

  const addTask = () => {
    const trimmed = newTaskText.trim();
    if (!trimmed) return;

    const { text: cleanText, deadline } = parseNaturalDate(trimmed);

    const task: Task = {
      id: crypto.randomUUID(),
      text: cleanText || trimmed,
      done: false,
      category: activeCategory,
      priority: newTaskPriority,
      subtasks: [],
      deadline: deadline ? deadline.toISOString() : undefined,
      calendarEventId: undefined
    };

    setTasks((prev) => [task, ...prev]);
    setNewTaskText("");
    setNewTaskPriority("medium");
    setParsedDeadline(null);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addTask();
  };

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  };

  const removeTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task?.calendarEventId) {
      void window.electronAPI
        ?.deleteCalendarEvent(task.calendarEventId)
        .then((result) => {
          if (result && !result.success && result.error) {
            window.alert(`Nie udało się usunąć eventu z Google Calendar: ${result.error}`);
          }
        })
        .finally(() => {
          window.dispatchEvent(new CustomEvent("calendar-event-created"));
        });
    }

    setTasks((prev) => prev.filter((taskItem) => taskItem.id !== id));
    setNewSubtaskTexts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setExpandedTaskId((prev) => (prev === id ? null : prev));
    setEditingDeadlineId((prev) => (prev === id ? null : prev));
  };

  const addTaskToCalendar = async (task: Task) => {
    if (!task.deadline) return;
    const result = await window.electronAPI?.createCalendarEvent(task.text, task.deadline);
    if (result?.success && result.id) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, calendarEventId: result.id } : t)));
      window.dispatchEvent(new CustomEvent("calendar-event-created"));
      return;
    }
    if (result && "error" in result && result.error) {
      window.alert(`Nie udało się dodać do Google Calendar: ${result.error}`);
    } else {
      window.alert("Nie udało się dodać do Google Calendar.");
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedTaskId((prev) => (prev === id ? null : id));
  };

  const addSubtask = (taskId: string) => {
    const text = (newSubtaskTexts[taskId] ?? "").trim();
    if (!text) return;
    const subtask: Subtask = { id: crypto.randomUUID(), text, done: false };
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, subtasks: [...t.subtasks, subtask] } : t))
    );
    setNewSubtaskTexts((prev) => ({ ...prev, [taskId]: "" }));
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: t.subtasks.map((s) => (s.id === subtaskId ? { ...s, done: !s.done } : s)) }
          : t
      )
    );
  };

  const removeSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId) } : t
      )
    );
  };

  const visibleTasks = useMemo(() => {
    return tasks
      .filter((task) => task.category === activeCategory)
      .sort((a, b) => {
        const doneSort = Number(a.done) - Number(b.done);
        if (doneSort !== 0) return doneSort;
        if (a.done && b.done) return 0;
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  }, [activeCategory, tasks]);

  const pracaTotal = tasks.filter((t) => t.category === "praca").length;
  const pracaDone = tasks.filter((t) => t.category === "praca" && t.done).length;
  const domTotal = tasks.filter((t) => t.category === "dom").length;
  const domDone = tasks.filter((t) => t.category === "dom" && t.done).length;

  const dotClassByPriority = (task: Task): string => {
    if (task.done) return "bg-white/20";
    if (task.priority === "high") return "bg-red-400/70";
    if (task.priority === "low") return "bg-green-400/70";
    return "bg-yellow-400/70";
  };

  const priorityButtonClass = (priority: TaskPriority): string => {
    const isActive = newTaskPriority === priority;
    return isActive
      ? "border-violet-400/70 bg-violet-500/20 text-white/85"
      : "border-white/10 bg-white/5 text-white/45 hover:text-white/65";
  };

  const isInCalendar = (task: Task): boolean => Boolean(task.calendarEventId);

  return (
    <section className="px-4 py-4">
      <h2 className="mb-3 text-[10px] uppercase tracking-[0.12em] text-white/35">Zadania</h2>

      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory("praca")}
          className={`flex-1 rounded-lg px-3 py-1.5 text-xs transition-all ${
            activeCategory === "praca"
              ? "border border-violet-500/40 bg-violet-500/20 text-violet-200"
              : "border border-white/10 bg-white/5 text-white/40 hover:text-white/60"
          }`}
        >
          Praca <span className="opacity-60">{pracaDone}/{pracaTotal}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory("dom")}
          className={`flex-1 rounded-lg px-3 py-1.5 text-xs transition-all ${
            activeCategory === "dom"
              ? "border border-violet-500/40 bg-violet-500/20 text-violet-200"
              : "border border-white/10 bg-white/5 text-white/40 hover:text-white/60"
          }`}
        >
          Dom <span className="opacity-60">{domDone}/{domTotal}</span>
        </button>
      </div>

      <form className="mb-3" onSubmit={onSubmit}>
        <div className="flex gap-2">
          <input
            className="min-w-0 flex-1 rounded-lg border border-white/30 bg-black/35 px-3 py-2 text-sm text-white caret-white outline-none placeholder:text-white/65 transition-all focus:border-violet-400/70 focus:bg-black/45"
            style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
            placeholder="Dodaj zadanie…"
            type="text"
            value={newTaskText}
            onChange={(e) => handleNewTaskChange(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-lg border border-violet-500/30 bg-violet-500/20 px-3 py-2 text-sm text-violet-200 transition-all hover:bg-violet-500/30"
          >
            +
          </button>
        </div>

        <AnimatePresence>
          {parsedDeadline && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="mt-1 flex items-center gap-1 text-[10px] text-violet-300/70"
            >
              <span>📅</span>
              <span>{formatDeadlinePreview(parsedDeadline)}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setNewTaskPriority("high")}
            className={`rounded-full border px-2 py-0.5 text-xs transition-all ${priorityButtonClass("high")}`}
            aria-label="Wysoki priorytet"
          >
            🔴
          </button>
          <button
            type="button"
            onClick={() => setNewTaskPriority("medium")}
            className={`rounded-full border px-2 py-0.5 text-xs transition-all ${priorityButtonClass("medium")}`}
            aria-label="Średni priorytet"
          >
            🟡
          </button>
          <button
            type="button"
            onClick={() => setNewTaskPriority("low")}
            className={`rounded-full border px-2 py-0.5 text-xs transition-all ${priorityButtonClass("low")}`}
            aria-label="Niski priorytet"
          >
            🟢
          </button>
        </div>
      </form>

      <ul
        className="no-scrollbar max-h-52 space-y-1.5 overflow-y-auto"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as CSSProperties}
      >
        <AnimatePresence initial={false}>
          {visibleTasks.map((task) => (
            <motion.li
              key={task.id}
              className="group overflow-hidden rounded-lg border border-white/8 bg-white/5"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12, height: 0, marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
              transition={{ duration: 0.18 }}
              layout
            >
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <label className="flex flex-1 cursor-pointer items-center gap-2.5">
                  <span className={`h-[5px] w-[5px] rounded-full ${dotClassByPriority(task)}`} />
                  <motion.div
                    className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-[5px] border transition-all ${
                      task.done ? "border-violet-500/60 bg-violet-500/30" : "border-white/20 bg-white/5"
                    }`}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => toggleTask(task.id)}
                  >
                    {task.done && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4L3.2 5.8L6.5 2.5" stroke="#c4b5fd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </motion.div>
                  <div className="min-w-0">
                    <span className={`block text-sm transition-colors ${task.done ? "text-white/40 line-through" : "text-white/95"}`}>
                      {task.text}
                    </span>
                    {!task.done && (
                      <>
                        {editingDeadlineId === task.id ? (
                          <form
                            className="mt-1 flex items-center gap-1"
                            onSubmit={(e) => {
                              e.preventDefault();
                              submitDeadlineEdit(task.id);
                            }}
                          >
                            <input
                              autoFocus
                              type="text"
                              value={deadlineEditText}
                              onChange={(e) => setDeadlineEditText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Escape") cancelDeadlineEdit();
                              }}
                              onBlur={() => submitDeadlineEdit(task.id)}
                              placeholder="jutro 14:00 / usuń=puste"
                              className="min-w-0 flex-1 rounded border border-violet-500/30 bg-white/8 px-1.5 py-0.5 text-[10px] text-white/80 outline-none placeholder:text-white/25 transition-all focus:border-violet-500/50"
                            />
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                cancelDeadlineEdit();
                              }}
                              className="text-[10px] leading-none text-white/30 transition-all hover:text-white/60"
                              aria-label="Anuluj"
                            >
                              ×
                            </button>
                          </form>
                        ) : task.deadline ? (
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => startDeadlineEdit(task)}
                              className={`block text-left text-[10px] transition-opacity hover:opacity-80 ${
                                getDeadlineStatus(task.deadline) === "overdue"
                                  ? "text-red-400/70"
                                  : getDeadlineStatus(task.deadline) === "today"
                                    ? "text-yellow-400/70"
                                    : "text-white/30"
                              }`}
                            >
                              📅 {formatDeadlinePreview(new Date(task.deadline))}
                            </button>
                            <button
                              type="button"
                              disabled={isInCalendar(task)}
                              onClick={() => void addTaskToCalendar(task)}
                              className={`rounded px-1.5 py-0.5 text-[10px] transition-all ${
                                isInCalendar(task)
                                  ? "cursor-default text-green-400/80"
                                  : "border border-violet-500/30 text-violet-300/80 hover:bg-violet-500/15"
                              }`}
                            >
                              {isInCalendar(task) ? "✓" : "+ 📅"}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startDeadlineEdit(task)}
                            className="mt-0.5 block text-[10px] text-white/15 opacity-0 transition-all hover:text-white/35 group-hover:opacity-100"
                            aria-label="Dodaj termin"
                          >
                            + termin
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  {task.subtasks.length > 0 && (
                    <span className="ml-1 text-[10px] text-white/30">
                      {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length}
                    </span>
                  )}
                </label>

                <button
                  type="button"
                  onClick={() => toggleExpand(task.id)}
                  className="text-white/30 opacity-0 transition-all hover:text-white/60 group-hover:opacity-100"
                  aria-label="Rozwiń podzadania"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    style={{
                      transform: expandedTaskId === task.id ? "rotate(90deg)" : "rotate(0deg)",
                      transition: "transform 0.2s"
                    }}
                  >
                    <path d="M4 2.5L7.5 6L4 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                <button
                  aria-label="Usuń zadanie"
                  className="text-base leading-none text-white/30 opacity-0 transition-all hover:text-white/60 group-hover:opacity-100"
                  type="button"
                  onClick={() => removeTask(task.id)}
                >
                  ×
                </button>
              </div>

              <AnimatePresence initial={false}>
                {expandedTaskId === task.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-6 mt-1.5 space-y-1 border-l border-white/10 pb-1 pl-3">
                      {task.subtasks.map((subtask) => (
                        <div key={subtask.id} className="group/sub flex items-center gap-2">
                          <div
                            className={`flex h-3.5 w-3.5 flex-shrink-0 cursor-pointer items-center justify-center rounded-[4px] border transition-all ${
                              subtask.done ? "border-violet-500/60 bg-violet-500/30" : "border-white/20 bg-white/5"
                            }`}
                            onClick={() => toggleSubtask(task.id, subtask.id)}
                          >
                            {subtask.done && (
                              <svg width="6" height="6" viewBox="0 0 8 8" fill="none">
                                <path d="M1.5 4L3.2 5.8L6.5 2.5" stroke="#c4b5fd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <span className={`flex-1 text-xs transition-colors ${subtask.done ? "text-white/25 line-through" : "text-white/60"}`}>
                            {subtask.text}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSubtask(task.id, subtask.id)}
                            className="text-sm leading-none text-white/25 opacity-0 transition-all hover:text-white/50 group-hover/sub:opacity-100"
                            aria-label="Usuń podzadanie"
                          >
                            ×
                          </button>
                        </div>
                      ))}

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          addSubtask(task.id);
                        }}
                        className="mt-1 flex gap-1.5"
                      >
                        <input
                          type="text"
                          placeholder="Dodaj krok…"
                          value={newSubtaskTexts[task.id] ?? ""}
                          onChange={(e) => setNewSubtaskTexts((prev) => ({ ...prev, [task.id]: e.target.value }))}
                          className="min-w-0 flex-1 rounded-md border border-white/8 bg-white/5 px-2 py-1 text-xs text-white/70 outline-none placeholder:text-white/20 transition-all focus:border-violet-500/30"
                        />
                        <button
                          type="submit"
                          className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/40 transition-all hover:text-white/70"
                        >
                          +
                        </button>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}

export default TaskList;
