import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import type { Wallet } from "../types/index";
import axios from "axios";

const MyWallet = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const showMessage = (msg: string) => {
    setActionMessage(msg);
    setActionError("");
    setTimeout(() => setActionMessage(""), 4000);
  };

  const showError = (msg: string) => {
    setActionError(msg);
    setActionMessage("");
    setTimeout(() => setActionError(""), 4000);
  };

  const refreshWallet = async () => {
    try {
      const res = await api.get(`/wallet/${user?.username}`);
      setWallet(res.data);
    } catch {
      showError("Failed to refresh wallet.");
    }
  };

  useEffect(() => {
    const loadWallet = async () => {
      try {
        const res = await api.get(`/wallet/${user?.username}`);
        setWallet(res.data);
      } catch {
        setError("Failed to load wallet.");
      } finally {
        setLoading(false);
      }
    };
    loadWallet();
  }, [user]);

  // Front end validation
  const validate = () => {
    const num = parseFloat(amount);
    if (!amount.trim()) return "Please enter an amount.";
    if (isNaN(num)) return "Amount must be a number.";
    if (num < 1) return "Minimum request is $1.";
    if (num > 10000) return "Maximum request is $10,000.";
    return null;
  };

  const handleRequest = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) { showError(validationError); return; }

    // Check if already has pending request
    const hasPending = wallet?.requests.some(r => r.status === "Pending");
    if (hasPending) {
      showError("You already have a pending request. Wait for admin to resolve it.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/wallet/request", {
        username: user?.username,
        amount: parseFloat(amount)
      });
      showMessage(`Request for $${amount} submitted! Waiting for admin approval.`);
      setAmount("");
      await refreshWallet();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        showError(err.response?.data || "Could not submit request.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "Approved") return "bg-green-100 text-green-700";
    if (status === "Rejected") return "bg-red-100 text-red-700";
    return "bg-yellow-100 text-yellow-700";
  };

  const getStatusIcon = (status: string) => {
    if (status === "Approved") return "✅";
    if (status === "Rejected") return "❌";
    return "⏳";
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <p className="text-gray-500 text-lg">Loading wallet...</p>
    </div>
  );

  if (error) return (
    <div className="bg-red-100 text-red-700 px-4 py-3 rounded">{error}</div>
  );

  const hasPending = wallet?.requests.some(r => r.status === "Pending");

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">💰 My Wallet</h1>

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

      {/* Balance card */}
      <div className="bg-blue-700 text-white rounded-xl shadow p-6 mb-6">
        <p className="text-sm text-blue-200 mb-1">Current Balance</p>
        <p className="text-4xl font-bold">${wallet?.balance.toFixed(2)}</p>
        <p className="text-xs text-blue-200 mt-2">
          Funds are deducted when you borrow or buy a book
        </p>
      </div>

      {/* Request money form */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Request Money
        </h2>

        {hasPending && (
          <div className="bg-yellow-50 text-yellow-700 px-4 py-3 rounded mb-4 text-sm">
            ⏳ You have a pending request. Wait for admin to resolve it before submitting a new one.
          </div>
        )}

        <form onSubmit={handleRequest} className="flex gap-3">
          <div className="flex-1">
            <input
              type="number"
              step="0.01"
              min="1"
              max="10000"
              value={amount}
              onChange={e => { setAmount(e.target.value); setActionError(""); }}
              disabled={hasPending ?? false}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:bg-gray-50"
              placeholder="Enter amount (e.g. 50.00)"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || (hasPending ?? false)}
            className="bg-blue-700 text-white px-6 py-2 rounded hover:bg-blue-800 transition disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Request"}
          </button>
        </form>
      </div>

      {/* Request history */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Request History
        </h2>

        {wallet?.requests.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">
            No requests yet.
          </p>
        ) : (
          <div className="space-y-3">
            {wallet?.requests.map(req => (
              <div
                key={req.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    ${req.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Requested: {new Date(req.requestDate).toLocaleDateString()}
                  </p>
                  {req.resolvedDate && (
                    <p className="text-xs text-gray-400">
                      Resolved: {new Date(req.resolvedDate).toLocaleDateString()}
                    </p>
                  )}
                  {req.adminNote && (
                    <p className="text-xs text-gray-500 mt-1">
                      Note: {req.adminNote}
                    </p>
                  )}
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(req.status)}`}>
                  {getStatusIcon(req.status)} {req.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyWallet;