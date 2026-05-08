import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import type { Loan, Purchase, PendingRequest } from "../types/index";

interface AdminStats {
  totalBooks: number;
  availableBooks: number;
  loanedBooks: number;
  soldBooks: number;
  totalCustomers: number;
  blockedCustomers: number;
  activeLoans: number;
  totalPurchases: number;
}

interface AdminCustomer {
  id: number;
  username: string;
  email: string;
  isBlocked: boolean;
  blockUntil?: string;
  loanCount: number;
  purchaseCount: number;
}

interface CustomerDetail {
  username: string;
  email: string;
  isBlocked: boolean;
  blockUntil?: string;
  loans: Loan[];
  purchases: Purchase[];
}

const AdminPanel = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"stats" | "customers" | "books" | "requests">("stats");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [customerDetails, setCustomerDetails] = useState<Record<string, CustomerDetail>>({});
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);

  const [requestNotes, setRequestNotes] = useState<Record<number, string>>({});
  const [newBook, setNewBook] = useState({
    name: "", author: "", price: "", loanPrice: ""
  });


  const adminUsername = user?.username ?? "";
  const adminPassword = "admin123";

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

  const refreshStats = async () => {
    try {
      const res = await api.get(`/admin/stats?adminUsername=${adminUsername}&adminPassword=${adminPassword}`);
      setStats(res.data);
    } catch {
      showError("Failed to load stats.");
    }
  };

  const refreshCustomers = async () => {
    try {
      const res = await api.get(`/admin/customers?adminUsername=${adminUsername}&adminPassword=${adminPassword}`);
      setCustomers(res.data);
    } catch {
      showError("Failed to load customers.");
    }
  };

  const refreshRequests = async () => {
    try {
      const res = await api.get(`/wallet/requests?adminUsername=${adminUsername}&adminPassword=${adminPassword}`);
      setPendingRequests(res.data);
    } catch {
      showError("Failed to load requests.");
    }
  };

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await api.get(`/admin/stats?adminUsername=${adminUsername}&adminPassword=${adminPassword}`);
        setStats(res.data);
      } catch {
        showError("Failed to load stats.");
      }
    };

    const loadCustomers = async () => {
      try {
        const res = await api.get(`/admin/customers?adminUsername=${adminUsername}&adminPassword=${adminPassword}`);
        setCustomers(res.data);
      } catch {
        showError("Failed to load customers.");
      }
    };

    const loadRequests = async () => {
      try {
        const res = await api.get(`/wallet/requests?adminUsername=${adminUsername}&adminPassword=${adminPassword}`);
        setPendingRequests(res.data);
      } catch {
        showError("Failed to load requests.");
      }
    };

    const init = async () => {
      await loadStats();
      await loadCustomers();
      await loadRequests();
    };

    init();
  }, [adminUsername, adminPassword]);

  const handleExpandCustomer = async (username: string) => {
    if (expandedCustomer === username) {
      setExpandedCustomer(null);
      return;
    }

    setExpandedCustomer(username);

    if (customerDetails[username]) return;

    setLoadingDetail(username);
    try {
      const res = await api.get(`/admin/customers/${username}?adminUsername=${adminUsername}&adminPassword=${adminPassword}`);
      setCustomerDetails(prev => ({ ...prev, [username]: res.data }));
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) showError(err.response?.data || "Could not load customer details.");
    } finally {
      setLoadingDetail(null);
    }
  };

  const handleBlock = async (username: string) => {
    try {
      await api.post(`/admin/customers/${username}/block?adminUsername=${adminUsername}&adminPassword=${adminPassword}&days=7`);
      showMessage(`${username} blocked for 7 days.`);
      await refreshCustomers();
      await refreshStats();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) showError(err.response?.data || "Could not block user.");
    }
  };

  const handleUnblock = async (username: string) => {
    try {
      await api.post(`/admin/customers/${username}/unblock?adminUsername=${adminUsername}&adminPassword=${adminPassword}`);
      showMessage(`${username} unblocked.`);
      await refreshCustomers();
      await refreshStats();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) showError(err.response?.data || "Could not unblock user.");
    }
  };

  const handleAddBook = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();

    if (!newBook.name.trim()) { showError("Book name is required."); return; }
    if (!newBook.author.trim()) { showError("Author is required."); return; }
    if (!newBook.price || isNaN(Number(newBook.price))) { showError("Valid price is required."); return; }
    if (!newBook.loanPrice || isNaN(Number(newBook.loanPrice))) { showError("Valid loan price is required."); return; }

    try {
      await api.post(
        `/books?adminUsername=${adminUsername}&adminPassword=${adminPassword}`,
        {
          name: newBook.name,
          author: newBook.author,
          price: parseFloat(newBook.price),
          loanPrice: parseFloat(newBook.loanPrice)
        }
      );
      showMessage("Book added successfully!");
      setNewBook({ name: "", author: "", price: "", loanPrice: "" });
      await refreshStats();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) showError(err.response?.data || "Could not add book.");
    }
  };

  const handleCheckOverdue = async () => {
    try {
      const res = await api.post(`/admin/customers/check-overdue?adminUsername=${adminUsername}&adminPassword=${adminPassword}`);
      showMessage(res.data);
      await refreshCustomers();
      await refreshStats();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) showError(err.response?.data || "Could not run overdue check.");
    }
  };

    const handleApprove = async (id: number, username: string, amount: number) => {
        try {
            const note = requestNotes[id] ?? "";
            await api.post(`/wallet/approve/${id}?adminUsername=${adminUsername}&adminPassword=${adminPassword}&note=${encodeURIComponent(note)}`);
            showMessage(`✅ Approved $${amount} for ${username}.`);
            setRequestNotes(prev => { const n = { ...prev }; delete n[id]; return n; });
            await refreshRequests();
            await refreshStats();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) showError(err.response?.data || "Could not approve request.");
        }
    };

    const handleReject = async (id: number, username: string) => {
        try {
            const note = requestNotes[id] ?? "";
            await api.post(`/wallet/reject/${id}?adminUsername=${adminUsername}&adminPassword=${adminPassword}&note=${encodeURIComponent(note)}`);
            showMessage(`❌ Rejected request from ${username}.`);
            setRequestNotes(prev => { const n = { ...prev }; delete n[id]; return n; });
            await refreshRequests();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) showError(err.response?.data || "Could not reject request.");
        }
    };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">⚙️ Admin Panel</h1>

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

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(["stats", "customers", "books", "requests"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition relative ${
              activeTab === tab
                ? "bg-blue-700 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 border"
            }`}
          >
            {tab === "stats" ? "📊 Stats"
              : tab === "customers" ? "👥 Customers"
              : tab === "books" ? "📚 Add Book"
              : "💰 Requests"}

            {/* Badge showing pending count */}
            {tab === "requests" && pendingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendingRequests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Stats tab */}
      {activeTab === "stats" && stats && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Books", value: stats.totalBooks },
              { label: "Available", value: stats.availableBooks },
              { label: "On Loan", value: stats.loanedBooks },
              { label: "Sold", value: stats.soldBooks },
              { label: "Customers", value: stats.totalCustomers },
              { label: "Blocked", value: stats.blockedCustomers },
              { label: "Active Loans", value: stats.activeLoans },
              { label: "Purchases", value: stats.totalPurchases },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl shadow p-4 text-center">
                <p className="text-3xl font-bold text-blue-700">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          <button
            onClick={handleCheckOverdue}
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition text-sm"
          >
            🔍 Run Overdue Check
          </button>
        </div>
      )}

      {/* Customers tab */}
      {activeTab === "customers" && (
        <div className="space-y-3">
          {customers.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No customers found.</div>
          ) : (
            customers.map((customer) => {
              const isExpanded = expandedCustomer === customer.username;
              const detail = customerDetails[customer.username];

              return (
                <div
                  key={customer.id}
                  className={`bg-white rounded-xl shadow border-l-4 ${
                    customer.isBlocked ? "border-red-500" : "border-green-500"
                  }`}
                >
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-800">{customer.username}</p>
                      <p className="text-sm text-gray-500">{customer.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Loans: {customer.loanCount} | Purchases: {customer.purchaseCount}
                      </p>
                      {customer.isBlocked && (
                        <p className="text-xs text-red-500 mt-1">
                          🔒 Blocked {customer.blockUntil
                            ? `until ${new Date(customer.blockUntil).toLocaleDateString()}`
                            : "until books returned"}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleExpandCustomer(customer.username)}
                        className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded hover:bg-blue-200 transition"
                      >
                        {isExpanded ? "Hide ▲" : "Details ▼"}
                      </button>

                      {customer.isBlocked ? (
                        <button
                          onClick={() => handleUnblock(customer.username)}
                          className="bg-green-500 text-white text-sm px-3 py-1 rounded hover:bg-green-600 transition"
                        >
                          Unblock
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBlock(customer.username)}
                          className="bg-red-500 text-white text-sm px-3 py-1 rounded hover:bg-red-600 transition"
                        >
                          Block
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t px-4 py-4 bg-gray-50 rounded-b-xl">
                      {loadingDetail === customer.username ? (
                        <p className="text-gray-400 text-sm">Loading details...</p>
                      ) : detail ? (
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">📖 Active Loans</h4>
                            {detail.loans.filter(l => !l.isReturned).length === 0 ? (
                              <p className="text-xs text-gray-400">No active loans.</p>
                            ) : (
                              detail.loans.filter(l => !l.isReturned).map(loan => {
                                const isOverdue = new Date(loan.dueDate) < new Date();
                                return (
                                  <div key={loan.id} className="text-xs text-gray-600 bg-white rounded p-2 mb-1 border">
                                    <span className="font-medium">{loan.bookName}</span>
                                    <span className="text-gray-400"> by {loan.bookAuthor}</span>
                                    <span className={`ml-2 ${isOverdue ? "text-red-500 font-semibold" : "text-gray-400"}`}>
                                      — Due: {new Date(loan.dueDate).toLocaleDateString()}
                                      {isOverdue && " ⚠️ OVERDUE"}
                                    </span>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">✅ Loan History</h4>
                            {detail.loans.filter(l => l.isReturned).length === 0 ? (
                              <p className="text-xs text-gray-400">No loan history.</p>
                            ) : (
                              detail.loans.filter(l => l.isReturned).map(loan => (
                                <div key={loan.id} className="text-xs text-gray-600 bg-white rounded p-2 mb-1 border">
                                  <span className="font-medium">{loan.bookName}</span>
                                  <span className="text-gray-400"> by {loan.bookAuthor}</span>
                                  <span className="text-gray-400 ml-2">
                                    — Returned: {loan.returnDate ? new Date(loan.returnDate).toLocaleDateString() : "—"}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">🛒 Purchases</h4>
                            {detail.purchases.length === 0 ? (
                              <p className="text-xs text-gray-400">No purchases.</p>
                            ) : (
                              detail.purchases.map(purchase => (
                                <div key={purchase.id} className="text-xs text-gray-600 bg-white rounded p-2 mb-1 border">
                                  <span className="font-medium">{purchase.bookName}</span>
                                  <span className="text-gray-400"> by {purchase.bookAuthor}</span>
                                  <span className="text-gray-400 ml-2">
                                    — ${purchase.price} on {new Date(purchase.purchaseDate).toLocaleDateString()}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">No details available.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add book tab */}
      {activeTab === "books" && (
        <div className="bg-white rounded-xl shadow p-6 max-w-md">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Add New Book</h2>
          <form onSubmit={handleAddBook} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Book Name</label>
              <input
                value={newBook.name}
                onChange={e => setNewBook({ ...newBook, name: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter book name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
              <input
                value={newBook.author}
                onChange={e => setNewBook({ ...newBook, author: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter author name"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newBook.price}
                  onChange={e => setNewBook({ ...newBook, price: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="29.99"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Loan Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newBook.loanPrice}
                  onChange={e => setNewBook({ ...newBook, loanPrice: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="5.99"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-700 text-white py-2 rounded hover:bg-blue-800 transition"
            >
              Add Book
            </button>
          </form>
        </div>
      )}

      {/* Requests tab */}
          {pendingRequests.map(req => (
              <div
                  key={req.id}
                  className="bg-white rounded-xl shadow p-4 border-l-4 border-yellow-400"
              >
                  <div className="flex items-center justify-between mb-3">
                      <div>
                          <p className="font-bold text-gray-800">{req.username}</p>
                          <p className="text-2xl font-bold text-blue-700 my-1">${req.amount.toFixed(2)}</p>
                          <p className="text-xs text-gray-400">
                              Requested: {new Date(req.requestDate).toLocaleDateString()}
                          </p>
                      </div>
                      <div className="flex gap-2">
                          <button
                              onClick={() => handleApprove(req.id, req.username, req.amount)}
                              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition text-sm font-medium"
                          >
                              ✅ Approve
                          </button>
                          <button
                              onClick={() => handleReject(req.id, req.username)}
                              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition text-sm font-medium"
                          >
                              ❌ Reject
                          </button>
                      </div>
                  </div>
                  <input
                      value={requestNotes[req.id] ?? ""}
                      onChange={e => setRequestNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Optional note for customer..."
                  />
              </div>
          ))}
    </div>
  );
};

export default AdminPanel;