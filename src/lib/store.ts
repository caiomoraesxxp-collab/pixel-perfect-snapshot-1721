import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Task = {
  id: string;
  title: string;
  done: boolean;
  important: boolean;
  date?: string | undefined;
  time?: string | undefined;
  note?: string | undefined;
  notified?: boolean;
  absent?: boolean | undefined;
  shift?: "manha" | "tarde" | "noite" | undefined;
  attDate?: string | undefined;
  createdAt: number;
};

export type TaskList = {
  id: string;
  name: string;
  tasks: Task[];
  groupId?: string | undefined;
  createdAt: number;
};

export type Group = { id: string; name: string; createdAt: number };

export type TaskInput = Pick<Task, "title"> & Partial<Pick<Task, "important" | "date" | "time" | "note" | "shift" | "attDate">>;

type State = {
  lists: TaskList[];
  groups: Group[];
  theme: "light" | "dark";
  addList: (name: string, groupId?: string) => string;
  addGroup: (name: string) => string;
  renameGroup: (id: string, name: string) => void;
  deleteGroup: (id: string) => void;
  setListGroup: (listId: string, groupId: string | undefined) => void;
  renameList: (id: string, name: string) => void;
  deleteList: (id: string) => void;
  addTask: (listId: string, input: TaskInput) => void;
  updateTask: (listId: string, taskId: string, patch: Partial<Task>) => void;
  deleteTask: (listId: string, taskId: string) => void;
  moveTask: (listId: string, fromId: string, toId: string) => void;
  toggleTheme: () => void;
};

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const mapList = (lists: TaskList[], id: string, fn: (l: TaskList) => TaskList) =>
  lists.map((l) => (l.id === id ? fn(l) : l));

export const useStore = create<State>()(
  persist(
    (set) => ({
      lists: [],
      groups: [],
      theme: "light",
      addList: (name, groupId) => {
        const id = uid();
        set((s) => ({ lists: [...s.lists, { id, name, tasks: [], groupId, createdAt: Date.now() }] }));
        return id;
      },
      addGroup: (name) => {
        const id = uid();
        set((s) => ({ groups: [...s.groups, { id, name, createdAt: Date.now() }] }));
        return id;
      },
      renameGroup: (id, name) => set((s) => ({ groups: s.groups.map((g) => (g.id === id ? { ...g, name } : g)) })),
      deleteGroup: (id) =>
        set((s) => ({
          groups: s.groups.filter((g) => g.id !== id),
          lists: s.lists.map((l) => (l.groupId === id ? { ...l, groupId: undefined } : l)),
        })),
      setListGroup: (listId, groupId) =>
        set((s) => ({ lists: mapList(s.lists, listId, (l) => ({ ...l, groupId })) })),
      renameList: (id, name) => set((s) => ({ lists: mapList(s.lists, id, (l) => ({ ...l, name })) })),
      deleteList: (id) => set((s) => ({ lists: s.lists.filter((l) => l.id !== id) })),
      addTask: (listId, input) =>
        set((s) => ({
          lists: mapList(s.lists, listId, (l) => ({
            ...l,
            tasks: [
              ...l.tasks,
              { id: uid(), done: false, important: false, createdAt: Date.now(), ...input },
            ],
          })),
        })),
      updateTask: (listId, taskId, patch) =>
        set((s) => ({
          lists: mapList(s.lists, listId, (l) => ({
            ...l,
            tasks: l.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
          })),
        })),
      deleteTask: (listId, taskId) =>
        set((s) => ({
          lists: mapList(s.lists, listId, (l) => ({ ...l, tasks: l.tasks.filter((t) => t.id !== taskId) })),
        })),
      moveTask: (listId, fromId, toId) =>
        set((s) => ({
          lists: mapList(s.lists, listId, (l) => {
            const tasks = [...l.tasks];
            const from = tasks.findIndex((t) => t.id === fromId);
            const to = tasks.findIndex((t) => t.id === toId);
            if (from < 0 || to < 0) return l;
            const [item] = tasks.splice(from, 1);
            tasks.splice(to, 0, item!);
            return { ...l, tasks };
          }),
        })),
      toggleTheme: () => set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
    }),
    { name: "minhas-listas-v1", skipHydration: true, merge: (p, c) => ({ ...c, ...(p as object), groups: (p as Partial<State>)?.groups ?? [] }) },
  ),
);

export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => {
    if (useStore.persist.hasHydrated()) setH(true);
    return useStore.persist.onFinishHydration(() => setH(true));
  }, []);
  return h;
}
