import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import type { Book } from "../types";
import axios from "axios";

const Books = () => {
    const { user, isAdmin } = useAuth();
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionMessage, setActionMessage] = useState("");
    const [actionError, setActionError] = useState("");
    const [editingBook, setEditingBook] = useState<Book | null>(null);
    const [editForm, setEditForm] = useState({
        name: "", author: "", price: "", loanPrice: ""
    });

    const refreshBooks = async () => {
        try {
            const res = await api.get("/books");
            setBooks(res.data.items);
        } catch {
            setError("Failed to refresh books.");
        }
    };

    useEffect(() => {
        const loadBooks = async () => {
            try {
                const res = await api.get("/books");
                setBooks(res.data.items);
            } catch {
                setError("Failed to load books.");
            } finally {
                setLoading(false);
            }
        };
        loadBooks();
    }, []);

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

    const handleBorrow = async (bookId: number) => {
        try {
            const res = await api.post(`/books/borrow/${bookId}?username=${user?.username}`);
            showMessage(res.data.message ?? "Book borrowed successfully!");
            await refreshBooks();
            window.dispatchEvent(new Event("balanceUpdated"));
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                showError(err.response?.data || "Could not borrow book.");
            }
        }
    };

    const handleBuy = async (bookId: number) => {
        try {
            const res = await api.post(`/books/buy/${bookId}?username=${user?.username}`);
            showMessage(res.data.message ?? "Book purchased successfully!");
            await refreshBooks();
            window.dispatchEvent(new Event("balanceUpdated"));
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                showError(err.response?.data || "Could not buy book.");
            }
        }
    };

    const handleDelete = async (bookId: number) => {
        if (!confirm("Are you sure you want to delete this book?")) return;
        try {
            await api.delete(`/books/${bookId}?adminUsername=${user?.username}&adminPassword=admin123`);
            showMessage("Book deleted.");
            await refreshBooks();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                showError(err.response?.data || "Could not delete book.");
            }
        }
    };

    const handleRestock = async (bookId: number) => {
        if (!confirm("Make this book available again?")) return;
        try {
            await api.post(`/books/restock/${bookId}?adminUsername=${user?.username}&adminPassword=admin123`);
            showMessage("Book restocked successfully!");
            await refreshBooks();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                showError(err.response?.data || "Could not restock book.");
            }
        }
    };

    const handleEditOpen = (book: Book) => {
        setEditingBook(book);
        setEditForm({
            name: book.name,
            author: book.author,
            price: book.price.toString(),
            loanPrice: book.loanPrice.toString()
        });
    };

    const handleEditClose = () => {
        setEditingBook(null);
        setEditForm({ name: "", author: "", price: "", loanPrice: "" });
    };

    const handleEditSubmit = async (e: React.BaseSyntheticEvent) => {
        e.preventDefault();
        if (!editForm.name.trim()) { showError("Book name is required."); return; }
        if (!editForm.author.trim()) { showError("Author is required."); return; }
        if (!editForm.price || isNaN(Number(editForm.price))) { showError("Valid price is required."); return; }
        if (!editForm.loanPrice || isNaN(Number(editForm.loanPrice))) { showError("Valid loan price is required."); return; }

        try {
            await api.put(
                `/books?adminUsername=${user?.username}&adminPassword=admin123`,
                {
                    id: editingBook?.id,
                    name: editForm.name,
                    author: editForm.author,
                    price: parseFloat(editForm.price),
                    loanPrice: parseFloat(editForm.loanPrice)
                }
            );
            showMessage("Book updated successfully!");
            handleEditClose();
            await refreshBooks();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                showError(err.response?.data || "Could not update book.");
            }
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <p className="text-gray-500 text-lg">Loading books...</p>
        </div>
    );

    if (error) return (
        <div className="bg-red-100 text-red-700 px-4 py-3 rounded">{error}</div>
    );

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">📚 Available Books</h1>
                <span className="text-sm text-gray-500">{books.length} book(s) total</span>
            </div>

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

            {books.length === 0 ? (
                <div className="text-center text-gray-500 mt-20">
                    No books in the store yet.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {books.map((book) => (
                        <div
                            key={book.id}
                            className={`bg-white rounded-xl shadow p-5 flex flex-col justify-between border-l-4 ${book.boughtBy
                                    ? "border-gray-300 opacity-60"
                                    : book.isLoaned
                                        ? "border-yellow-400"
                                        : "border-blue-500"
                                }`}
                        >
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">{book.name}</h2>
                                <p className="text-sm text-gray-500 mb-3">by {book.author}</p>

                                <div className="flex justify-between text-sm text-gray-700 mb-2">
                                    <span>💰 Buy: <strong>${book.price}</strong></span>
                                    <span>📖 Loan: <strong>${book.loanPrice}</strong></span>
                                </div>

                                <div className="mt-2">
                                    {book.boughtBy ? (
                                        <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                                            Sold
                                        </span>
                                    ) : book.isLoaned ? (
                                        <div>
                                            <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">
                                                On Loan
                                            </span>
                                            {book.dueDate && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Returns: {new Date(book.dueDate).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                                            Available
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 flex gap-2">
                                {!isAdmin() && book.isAvailable && !book.isLoaned && !book.boughtBy && (
                                    <>
                                        <button
                                            onClick={() => handleBorrow(book.id)}
                                            className="flex-1 bg-blue-600 text-white text-sm py-2 rounded hover:bg-blue-700 transition"
                                        >
                                            Borrow
                                        </button>
                                        <button
                                            onClick={() => handleBuy(book.id)}
                                            className="flex-1 bg-green-600 text-white text-sm py-2 rounded hover:bg-green-700 transition"
                                        >
                                            Buy
                                        </button>
                                    </>
                                )}

                                {isAdmin() && (
                                    <>
                                        <button
                                            onClick={() => handleEditOpen(book)}
                                            className="flex-1 bg-yellow-500 text-white text-sm py-2 rounded hover:bg-yellow-600 transition"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(book.id)}
                                            className="flex-1 bg-red-500 text-white text-sm py-2 rounded hover:bg-red-600 transition"
                                        >
                                            Delete
                                        </button>
                                        {book.boughtBy && (
                                            <button
                                                onClick={() => handleRestock(book.id)}
                                                className="flex-1 bg-purple-500 text-white text-sm py-2 rounded hover:bg-purple-600 transition"
                                            >
                                                Restock
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {editingBook && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">
                            ✏️ Edit Book
                        </h2>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Book Name</label>
                                <input
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                                <input
                                    value={editForm.author}
                                    onChange={e => setEditForm({ ...editForm, author: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editForm.price}
                                        onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Loan Price ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editForm.loanPrice}
                                        onChange={e => setEditForm({ ...editForm, loanPrice: e.target.value })}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-700 text-white py-2 rounded hover:bg-blue-800 transition"
                                >
                                    Save Changes
                                </button>
                                <button
                                    type="button"
                                    onClick={handleEditClose}
                                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Books;