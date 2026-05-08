import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Books from "./pages/Books";
import MyLoans from "./pages/MyLoans";
import MyPurchases from "./pages/MyPurchases";
import AdminPanel from "./pages/AdminPanel";
import MyWallet from "./pages/MyWallet";
import type { ReactNode } from "react";

const ProtectedRoute = ({ children, adminOnly = false }: { children: ReactNode, adminOnly?: boolean }) => {
    const { user, isAdmin } = useAuth();

    if (!user) return <Navigate to="/login" />;
    if (adminOnly && !isAdmin()) return <Navigate to="/books" />;

    return <>{children}</>;
};

function App() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 py-8">
                <Routes>
                    <Route path="/login" element={!user ? <Login /> : <Navigate to="/books" />} />
                    <Route path="/register" element={!user ? <Register /> : <Navigate to="/books" />} />

                    <Route path="/books" element={
                        <ProtectedRoute><Books /></ProtectedRoute>
                    } />
                    <Route path="/my-loans" element={
                        <ProtectedRoute><MyLoans /></ProtectedRoute>
                    } />
                    <Route path="/my-purchases" element={
                        <ProtectedRoute><MyPurchases /></ProtectedRoute>
                    } />
                    <Route path="/my-wallet" element={
                        <ProtectedRoute><MyWallet /></ProtectedRoute>
                    } />
                    <Route path="/admin" element={
                        <ProtectedRoute adminOnly={true}><AdminPanel /></ProtectedRoute>
                    } />

                    {/* catch-all must always be last */}
                    <Route path="*" element={<Navigate to={user ? "/books" : "/login"} />} />
                </Routes>
            </div>
        </div>
    );
}

export default App;