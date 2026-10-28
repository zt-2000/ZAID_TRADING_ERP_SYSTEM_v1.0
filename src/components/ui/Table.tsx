import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  render?: (row: T) => React.ReactNode;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyState?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyState,
  isLoading = false,
  className = '',
}: TableProps<T>) {
  return (
    <div className={`w-full overflow-x-auto border border-slate-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-[#181f1b] ${className}`}>
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-slate-200 dark:border-neutral-800 bg-[#F4F6F4]/80 dark:bg-[#131916]/90 uppercase tracking-wider text-[11px] font-semibold text-slate-600 dark:text-neutral-400">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                style={{ width: col.width }}
                className={`px-4 py-3 ${
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left'
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/60">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 bg-slate-200 dark:bg-[#202924] rounded w-3/4" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length > 0 ? (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className="hover:bg-slate-50/80 dark:hover:bg-[#1f2923]/60 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-slate-800 dark:text-neutral-200 ${
                      col.align === 'right'
                        ? 'text-right font-mono tabular-nums'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                    }`}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          ) : null}
        </tbody>
      </table>

      {!isLoading && data.length === 0 && emptyState && (
        <div className="py-12 px-4 text-center">{emptyState}</div>
      )}
    </div>
  );
}
