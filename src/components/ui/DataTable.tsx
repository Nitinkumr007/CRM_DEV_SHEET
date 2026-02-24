import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface Column<T = any> {
    header: string;
    accessorKey: keyof T | string;
    sortable?: boolean;
    className?: string;
    cell?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyField: keyof T | string;
    onRowClick?: (item: T) => void;
    className?: string;
}

export function DataTable<T = any>({
    data,
    columns,
    keyField,
    onRowClick,
    className
}: DataTableProps<T>) {
    return (
        <div className={cn("w-full overflow-x-auto custom-scrollbar", className)}>
            <table className="w-full text-left text-sm border-collapse">
                <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                        {columns.map((column, idx) => (
                            <th
                                key={idx}
                                className={cn(
                                    "px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-500",
                                    column.sortable && "cursor-pointer hover:text-slate-700 transition-colors"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    {column.header}
                                    {column.sortable && (
                                        <div className="flex flex-col -space-y-1">
                                            <ChevronUp className="w-2.5 h-2.5" />
                                            <ChevronDown className="w-2.5 h-2.5" />
                                        </div>
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {data.map((item: any) => (
                        <tr
                            key={String(item[keyField])}
                            onClick={() => onRowClick?.(item)}
                            className={cn(
                                "group transition-colors",
                                onRowClick ? "cursor-pointer hover:bg-indigo-50/30" : "hover:bg-slate-50/30"
                            )}
                        >
                            {columns.map((column, idx) => (
                                <td
                                    key={idx}
                                    className={cn(
                                        "px-6 py-4 text-slate-600 transition-colors",
                                        column.className
                                    )}
                                >
                                    {column.cell ? column.cell(item) : (item[column.accessorKey] || '—')}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
