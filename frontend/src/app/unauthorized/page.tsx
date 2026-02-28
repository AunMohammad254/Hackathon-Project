import Link from "next/link";

export default function UnauthorizedPage() {
    return (
        <div className="flex h-screen flex-col items-center justify-center bg-gray-50">
            <h1 className="text-6xl font-bold text-red-600">403</h1>
            <h2 className="mt-4 text-2xl font-semibold text-gray-800">Access Denied</h2>
            <p className="mt-2 text-gray-600">
                You do not have permission to view this page.
            </p>
            <Link
                href="/login"
                className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
                Return to Login
            </Link>
        </div>
    );
}
