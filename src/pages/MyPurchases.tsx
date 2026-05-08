import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import type { Purchase } from "../types/index";

const MyPurchases = () => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPurchases = async () => {
      try {
        const res = await api.get(`/customers/${user?.username}/purchases`);
        setPurchases(res.data);
      } catch {
        setError("Failed to load purchases.");
      } finally {
        setLoading(false);
      }
    };
    loadPurchases();
  }, [user]);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <p className="text-gray-500 text-lg">Loading purchases...</p>
    </div>
  );

  if (error) return (
    <div className="bg-red-100 text-red-700 px-4 py-3 rounded">{error}</div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">🛒 My Purchases</h1>

      {purchases.length === 0 ? (
        <div className="bg-gray-50 text-gray-500 text-center py-16 rounded-xl">
          You haven't bought any books yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {purchases.map((purchase) => (
            <div
              key={purchase.id}
              className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500"
            >
              <h3 className="font-bold text-gray-800">{purchase.bookName}</h3>
              <p className="text-sm text-gray-500 mb-3">by {purchase.bookAuthor}</p>

              <div className="text-sm text-gray-600 space-y-1">
                <p>💰 Paid: <strong>${purchase.price}</strong></p>
                <p>📅 Date: {new Date(purchase.purchaseDate).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPurchases;