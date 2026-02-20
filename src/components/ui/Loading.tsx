import { Loader2 } from "lucide-react";

export function Loading() {
    return (
        <div className="h-full w-full flex items-center justify-center min-h-[50vh]">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
                <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Loading...</p>
            </div>
        </div>
    );
}
