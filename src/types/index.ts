export interface Book {
  id: number;
  name: string;
  author: string;
  price: number;
  loanPrice: number;
  isAvailable: boolean;
  isLoaned: boolean;
  loanedBy?: string;
  dueDate?: string;
  boughtBy?: string;
}

export interface Customer {
  id: number;
  username: string;
  email: string;
  isBlocked: boolean;
  blockUntil?: string;
}

export interface Loan {
  id: number;
  customerId: number;
  bookId: number;
  bookName: string;
  bookAuthor: string;
  loanDate: string;
  dueDate: string;
  isReturned: boolean;
  returnDate?: string;
}

export interface Purchase {
  id: number;
  customerId: number;
  bookId: number;
  bookName: string;
  bookAuthor: string;
  price: number;
  purchaseDate: string;
}

export interface AuthUser {
  username: string;
  email: string;
  role: "customer" | "admin";
}

// ── NEW ───────────────────────────────────────────────────────
export interface MoneyRequest {
  id: number;
  amount: number;
  status: "Pending" | "Approved" | "Rejected";
  requestDate: string;
  resolvedDate?: string;
  adminNote?: string;
}

export interface Wallet {
  balance: number;
  requests: MoneyRequest[];
}

export interface PendingRequest {
  id: number;
  username: string;
  amount: number;
  requestDate: string;
}