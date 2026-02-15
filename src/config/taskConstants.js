// src/config/taskConstants.js

export const DEFAULT_TASK_COLUMNS = [
  { id: 'todo', label: 'À faire', icon: '📋', color: 'slate' },
  { id: 'in_progress', label: 'En cours', icon: '⚡', color: 'blue' },
  { id: 'blocked', label: 'Bloqué', icon: '❌', color: 'red' },
  { id: 'done', label: 'Terminé', icon: '✅', color: 'green' },
];

export function resolveTaskColumns(columns) {
  if (!columns || !Array.isArray(columns) || columns.length === 0) {
    return DEFAULT_TASK_COLUMNS;
  }
  if (typeof columns[0] === 'string') {
    return columns.map(s => ({ id: s, label: s, icon: '📋', color: 'slate' }));
  }
  return columns;
}

export const COLOR_KPI_MAP = {
  slate: { bg: 'bg-muted/50', text: 'text-muted-foreground' },
  blue: { bg: 'bg-primary/10', text: 'text-primary' },
  red: { bg: 'bg-destructive/10', text: 'text-destructive' },
  green: { bg: 'bg-green-500/10', text: 'text-green-500' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-500' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
  pink: { bg: 'bg-pink-500/10', text: 'text-pink-500' },
  indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-500' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-500' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-500' },
};
