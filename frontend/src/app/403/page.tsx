import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function AccessDenied() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-app)] text-center p-4">
            <div className="glass-card max-w-md w-full p-8 flex flex-col items-center">
                <div className="p-4 bg-red-500/10 rounded-full text-red-500 mb-6">
                    <ShieldAlert className="h-12 w-12" />
                </div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">Access Denied</h1>
                <p className="text-[var(--color-text-secondary)] mb-8">
                    You do not have permission to view this page. Please contact your administrator if you believe this is an error.
                </p>
                <Link href="/" className="btn-primary w-full block">
                    Return Home
                </Link>
            </div>
        </div>
    );
}
