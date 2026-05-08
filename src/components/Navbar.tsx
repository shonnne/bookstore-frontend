import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import api from "../api/axios";

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number | null>(null);

  // Load balance for customers
  useEffect(() => {
    if (!user || isAdmin()) return;

    const loadBalance = async () => {
      try {
        const res = await api.get(`/wallet/${user.username}`);
        setBalance(res.data.balance);
      } catch {
        // silently fail
      }
    };

    loadBalance();
  }, [user, isAdmin]);

  const handleLogout = async () => {
    try {
      await api.post(`/auth/logout?username=${user?.username}`);
    } catch {
      // logout always succeeds client side
    }
    logout();
    navigate("/login");
    };

    useEffect(() => {
        const handleBalanceUpdate = async () => {
            try {
                const res = await api.get(`/wallet/${user?.username}`);
                setBalance(res.data.balance);
            } catch {
                // silently fail
            }
        };

        window.addEventListener("balanceUpdated", handleBalanceUpdate);
        return () => window.removeEventListener("balanceUpdated", handleBalanceUpdate);
    }, [user]);

  if (!user) return null;

  return (
    <nav className="bg-blue-700 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link to="/books" className="text-xl font-bold tracking-wide">
          📚 BookStore
        </Link>

        {/* Links */}
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link to="/books" className="hover:text-blue-200 transition">
            All Books
          </Link>

          {/* Customer only */}
          {!isAdmin() && (
            <>
              <Link to="/my-loans" className="hover:text-blue-200 transition">
                My Loans
              </Link>
              <Link to="/my-purchases" className="hover:text-blue-200 transition">
                My Purchases
              </Link>
              <Link to="/my-wallet" className="hover:text-blue-200 transition">
                My Wallet
              </Link>
            </>
          )}

          {/* Admin only */}
          {isAdmin() && (
            <Link to="/admin" className="hover:text-blue-200 transition">
              Admin Panel
            </Link>
          )}

          <span className="text-blue-200">|</span>

          {/* Balance display for customers */}
          {!isAdmin() && balance !== null && (
            <span className="bg-blue-800 text-white px-3 py-1 rounded-full text-xs font-bold">
              💰 ${balance.toFixed(2)}
            </span>
          )}

          <span className="text-blue-100">
            {user.username} ({user.role})
          </span>

          <button
            onClick={handleLogout}
            className="bg-white text-blue-700 px-3 py-1 rounded hover:bg-blue-100 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;