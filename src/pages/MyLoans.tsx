import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import type { Loan } from "../types/index";
import axios from "axios";

const MyLoans = () => {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const loadLoans = async () => {
      try {
        const res = await api.get(`/customers/${user?.username}/loans`);
        setLoans(res.data);
      } catch {
        setError("Failed to load loans.");
      } finally {
        setLoading(false);
      }
    };
    loadLoans();
  }, [user]);

  const refreshLoans = async () => {
    try {
      const res = await api.get(`/customers/${user?.username}/loans`);
      setLoans(res.data);
    } catch {
      setError("Failed to refresh loans.");
    }
  };

  const showMessage = (msg: string) => {
    setActionMessage(msg);
    setActionError("");
    setTimeout(() => setActionMessage(""), 3000);
  };

  const showError = (msg: string) => {
    setActionError(msg);
    setActionMessage("");
    setTimeout(() => setActionError(""), 3000);
  };

  const handleReturn = async (bookId: number) => {
    try {
      await api.post(`/books/return/${bookId}?username=${user?.username}`);
      showMessage("Book returned successfully!");
      await refreshLoans();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        showError(err.response?.data || "Could not return book.");
      }
    }
  };

  const activeLoans = loans.filter(l => !l.isReturned);
  const returnedLoans = loans.filter(l => l.isReturned);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <p className="text-gray-500 text-lg">Loading loans...</p>
    </div>
  );

  if (error) return (
    <div className="bg-red-100 text-red-700 px-4 py-3 rounded">{error}</div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📖 My Loans</h1>

      {actionMessage && (
        <div className="bg-green-100 text-green-700 px-4 py-2 rounded mb-4 text-sm">
          ✅ {actionMessage}
        </div>
      )}
      {actionError && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-sm">
          ❌ {actionError}
        </div>
      )}

      {/* Active loans */}
      <h2 className="text-lg font-semibold text-gray-700 mb-3">
        Active Loans ({activeLoans.length})
      </h2>

      {activeLoans.length === 0 ? (
        <div className="bg-gray-50 text-gray-500 text-center py-8 rounded-xl mb-6">
          You have no active loans.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {activeLoans.map((loan) => {
            const isOverdue = new Date(loan.dueDate) < new Date();
            return (
              <div
                key={loan.id}
                className={`bg-white rounded-xl shadow p-5 border-l-4 ${
                  isOverdue ? "border-red-500" : "border-blue-500"
                }`}
              >
                <h3 className="font-bold text-gray-800">{loan.bookName}</h3>
                <p className="text-sm text-gray-500 mb-3">by {loan.bookAuthor}</p>

                <div className="text-sm text-gray-600 space-y-1 mb-4">
                  <p>📅 Borrowed: {new Date(loan.loanDate).toLocaleDateString()}</p>
                  <p className={isOverdue ? "text-red-600 font-semibold" : ""}>
                    ⏰ Due: {new Date(loan.dueDate).toLocaleDateString()}
                    {isOverdue && " — OVERDUE!"}
                  </p>
                </div>

                <button
                  onClick={() => handleReturn(loan.bookId)}
                  className="w-full bg-blue-600 text-white text-sm py-2 rounded hover:bg-blue-700 transition"
                >
                  Return Book
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Returned loans history */}
      <h2 className="text-lg font-semibold text-gray-700 mb-3">
        Return History ({returnedLoans.length})
      </h2>

      {returnedLoans.length === 0 ? (
        <div className="bg-gray-50 text-gray-500 text-center py-8 rounded-xl">
          No return history yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {returnedLoans.map((loan) => (
            <div
              key={loan.id}
              className="bg-white rounded-xl shadow p-5 border-l-4 border-gray-300 opacity-70"
            >
              <h3 className="font-bold text-gray-800">{loan.bookName}</h3>
              <p className="text-sm text-gray-500 mb-3">by {loan.bookAuthor}</p>

              <div className="text-sm text-gray-600 space-y-1">
                <p>📅 Borrowed: {new Date(loan.loanDate).toLocaleDateString()}</p>
                <p>✅ Returned: {loan.returnDate ? new Date(loan.returnDate).toLocaleDateString() : "—"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyLoans;