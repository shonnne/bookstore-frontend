import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ username: "", password: "" });
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError("");
    };

    const validate = () => {
        if (!form.username.trim()) return "Username is required.";
        if (!form.password.trim()) return "Password is required.";
        return null;
    };

    const handleSubmit = async (e: React.BaseSyntheticEvent) => {
        e.preventDefault();

        const validationError = validate();
        if (validationError) { setError(validationError); return; }

        setLoading(true);
        try {
            try {
                const res = await api.post("/auth/login", form);
                login(
                    { username: res.data.username, email: res.data.email, role: "customer" },
                    res.data.token,
                    remember // pass remember choice
                );
                navigate("/books");
                return;
            } catch {
                // try admin
            }

            const adminRes = await api.post("/admin/login", form);
            login(
                { username: adminRes.data.username, email: "", role: "admin" },
                "",
                remember // pass remember choice
            );
            navigate("/books");

        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data || "Login failed. Please try again.");
            } else {
                setError("An unexpected error occurred.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold text-center text-blue-700 mb-6">
                    📚 BookStore Login
                </h1>

                {error && (
                    <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <input
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="Enter username"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="Enter password"
                        />
                    </div>

                    {/* Remember Me checkbox */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="remember"
                            checked={remember}
                            onChange={e => setRemember(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                        />
                        <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                            Keep me logged in
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-700 text-white py-2 rounded hover:bg-blue-800 transition disabled:opacity-50"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-4">
                    Don't have an account?{" "}
                    <Link to="/register" className="text-blue-600 hover:underline">
                        Register here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;