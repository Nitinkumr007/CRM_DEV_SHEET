import { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface Column<T> {
    header: string;
    accessorKey: keyof T | ((item: T) => React.ReactNode);
    cell?: (item: T) => React.ReactNode;
    className?: string;
    sortable?: boolean;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyField: keyof T;
    onRowClick?: (item: T) => void;
    isLoading?: boolean;
    emptyMessage?: string;
}

export function DataTable<T>({
    data,
    columns,
    keyField,
    onRowClick,
    isLoading = false,
    emptyMessage = "No data found"
}: DataTableProps<T>) {
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    const handleSort = (column: Column<T>) => {
        if (!column.sortable) return;

        // Use header as key for simplicity if accessor is function, otherwise accessorKey
        const key = typeof column.accessorKey === 'string' ? String(column.accessorKey) : column.header;

        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = [...data].sort((a, b) => {
        if (!sortConfig) return 0;

        // Find column to get accessor
        const col = columns.find(c => (typeof c.accessorKey === 'string' ? String(c.accessorKey) : c.header) === sortConfig.key);
        if (!col) return 0;

        const valA = typeof col.accessorKey === 'function' ? col.accessorKey(a) : a[col.accessorKey];
        const valB = typeof col.accessorKey === 'function' ? col.accessorKey(b) : b[col.accessorKey];

        // Handle string comparison nicely
        const strA = String(valA || '').toLowerCase();
        const strB = String(valB || '').toLowerCase();

        if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    return (
        <div className="bg-white border border-slate-200/60 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-200">
                            {columns.map((col, idx) => {
                                const key = typeof col.accessorKey === 'string' ? String(col.accessorKey) : col.header;
                                const isSorted = sortConfig?.key === key;

                                return (
                                    <th
                                        key={idx}
                                        className={cn(
                                            "py-3.5 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 select-none",
                                            col.sortable && "cursor-pointer hover:bg-slate-100/50 transition-colors",
                                            col.className
                                        )}
                                        onClick={() => handleSort(col)}
                                    >
                                        <div className="flex items-center gap-2">
                                            {col.header}
                                            {col.sortable && (
                                                <span className="text-slate-400">
                                                    {isSorted ? (
                                                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-indigo-600" /> : <ChevronDown className="w-3 h-3 text-indigo-600" />
                                                    ) : (
                                                        <ChevronsUpDown className="w-3 h-3 opacity-50" />
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            // Skeleton Rows
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    {columns.map((_, j) => (
                                        <td key={j} className="py-4 px-6">
                                            <div className="h-4 bg-slate-100 rounded w-2/3"></div>
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : sortedData.length > 0 ? (
                            sortedData.map((row) => (
                                <tr
                                    key={String(row[keyField])}
                                    className={cn(
                                        "hover:bg-slate-50/80 transition-colors group",
                                        onRowClick && "cursor-pointer"
                                    )}
                                    onClick={() => onRowClick?.(row)}
                                >
                                    {columns.map((col, idx) => (
                                        <td key={idx} className={cn("py-3 px-6 text-sm text-slate-600", col.className)}>
                                            {col.cell ? col.cell(row) : (
                                                typeof col.accessorKey === 'function'
                                                    ? col.accessorKey(row)
                                                    : String(row[col.accessorKey] || '-')
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="py-12 text-center text-slate-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <Search className="w-8 h-8 opacity-20" />
                                        <p className="text-sm">{emptyMessage}</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {/* Simple Pagination could go here */}
        </div>
    );
}
