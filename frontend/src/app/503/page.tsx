import Link from "next/link";
import { Wrench } from "lucide-react";

export default function Maintenance() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-app)] text-center p-4">
            <div className="glass-card max-w-md w-full p-8 flex flex-col items-center border-amber-500/20 shadow-amber-500/10">
                <div className="p-4 bg-amber-500/10 rounded-full text-amber-500 mb-6">
                    <Wrench className="h-12 w-12" />
                </div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">System Maintenance</h1>
                <p className="text-[var(--color-text-secondary)] mb-8">
                    The CRM is currently down for scheduled maintenance. We will be back online shortly.
                </p>
                <div className="text-xs text-[var(--color-text-secondary)]">
                    <p>Please check back later.</p>
                </div>
            </div>
        </div>
    );
}
