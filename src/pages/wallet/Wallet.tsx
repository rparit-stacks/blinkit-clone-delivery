import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchWallet, fetchTransactions, fetchWithdrawals, requestWithdrawal, fetchProfile
} from "../../api/deliveryApi";
import {
  Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Clock,
  CheckCircle, XCircle, AlertCircle, Loader2, TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";
import Modal from "../../components/Modal";

const TX_ICONS: Record<string, typeof ArrowDownLeft> = {
  ORDER_EARNING: ArrowDownLeft,
  MANUAL_CREDIT: ArrowDownLeft,
  WITHDRAWAL: ArrowUpRight,
  MANUAL_DEBIT: ArrowUpRight,
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-blue-100 text-blue-700",
  PROCESSED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

interface WdForm {
  amountRupees: string;
  method: "bank" | "upi";
  bankAccountNumber: string;
  bankIfsc: string;
  bankAccountHolderName: string;
  bankName: string;
  upiId: string;
}

export default function Wallet() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<WdForm>({
    amountRupees: "", method: "bank",
    bankAccountNumber: "", bankIfsc: "", bankAccountHolderName: "", bankName: "", upiId: "",
  });

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ["delivery", "wallet"],
    queryFn: fetchWallet,
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["delivery", "wallet", "transactions"],
    queryFn: () => fetchTransactions(0, 30),
  });

  const { data: withdrawals = [] } = useQuery({
    queryKey: ["delivery", "wallet", "withdrawals"],
    queryFn: fetchWithdrawals,
  });

  const { data: profile } = useQuery({
    queryKey: ["delivery", "profile"],
    queryFn: fetchProfile,
  });

  const wdMut = useMutation({
    mutationFn: () => {
      const amountPaise = Math.round(parseFloat(form.amountRupees) * 100);
      return requestWithdrawal({
        amountPaise,
        bankAccountNumber: form.method === "bank" ? form.bankAccountNumber : undefined,
        bankIfsc: form.method === "bank" ? form.bankIfsc : undefined,
        bankAccountHolderName: form.method === "bank" ? form.bankAccountHolderName : undefined,
        bankName: form.method === "bank" ? form.bankName : undefined,
        upiId: form.method === "upi" ? form.upiId : undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["delivery", "wallet"] });
      toast.success("Withdrawal request submitted");
      setShowModal(false);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const prefill = () => {
    if (profile) {
      setForm(f => ({
        ...f,
        bankAccountNumber: profile.bankAccountNumber || "",
        bankIfsc: profile.bankIfsc || "",
        bankAccountHolderName: profile.bankAccountHolderName || "",
        bankName: profile.bankName || "",
        upiId: profile.upiId || "",
      }));
    }
  };

  const balanceRupees = wallet ? wallet.balance / 100 : 0;
  const pendingWd = withdrawals.filter(w => w.status === "PENDING");

  return (
    <div className="min-h-full">
      <div className="px-5 py-4 bg-white border-b border-slate-100">
        <h1 className="text-xl font-bold text-slate-900">Wallet</h1>
        <p className="text-slate-500 text-sm mt-0.5">Earnings & withdrawals</p>
      </div>

      <div className="p-5 space-y-5">
        {/* Balance card */}
        {walletLoading ? (
          <div className="h-44 bg-slate-100 rounded-2xl animate-pulse" />
        ) : wallet && (
          <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl p-5 text-white shadow-lg shadow-orange-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-orange-200 text-xs font-medium uppercase tracking-wide mb-1">Available Balance</p>
                <p className="text-3xl font-bold">₹{balanceRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-3 bg-white/10 rounded-xl">
                <WalletIcon className="w-6 h-6" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/20">
              <div>
                <p className="text-orange-200 text-[10px]">Total Earned</p>
                <p className="text-sm font-bold mt-0.5">₹{(wallet.lifetimeEarned / 100).toFixed(0)}</p>
              </div>
              <div>
                <p className="text-orange-200 text-[10px]">Withdrawn</p>
                <p className="text-sm font-bold mt-0.5">₹{(wallet.lifetimeWithdrawn / 100).toFixed(0)}</p>
              </div>
              <div>
                <p className="text-orange-200 text-[10px]">Pending</p>
                <p className="text-sm font-bold mt-0.5">₹{(wallet.pendingBalance / 100).toFixed(0)}</p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              disabled={balanceRupees < 100}
              className="mt-4 w-full bg-white text-orange-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-orange-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Withdraw Funds
            </button>
            {balanceRupees < 100 && (
              <p className="text-center text-orange-200 text-[10px] mt-1.5">Minimum ₹100 required</p>
            )}
          </div>
        )}

        {/* Pending notice */}
        {pendingWd.length > 0 && (
          <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0" />
            <p className="text-xs text-yellow-800">
              {pendingWd.length} pending withdrawal of ₹{pendingWd.reduce((a, w) => a + w.amount / 100, 0).toFixed(0)}
            </p>
          </div>
        )}

        {/* Withdrawal history */}
        {withdrawals.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-slate-800 mb-3">Withdrawal Requests</p>
            <div className="space-y-2">
              {withdrawals.map(wd => {
                const Icon = wd.status === "PROCESSED" ? CheckCircle : wd.status === "REJECTED" ? XCircle : Clock;
                return (
                  <div key={wd.id} className="bg-white rounded-xl border border-slate-100 p-3 flex items-center gap-3">
                    <div className={clsx("p-2 rounded-lg", STATUS_COLORS[wd.status])}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">₹{(wd.amount / 100).toFixed(2)}</p>
                        <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full", STATUS_COLORS[wd.status])}>
                          {wd.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(wd.createdAt).toLocaleDateString()} ·{" "}
                        {wd.upiId ? `UPI: ${wd.upiId}` : wd.bankAccountNumber ? `···${wd.bankAccountNumber.slice(-4)}` : ""}
                      </p>
                      {wd.utrReference && (
                        <p className="text-[10px] text-green-600 font-medium">UTR: {wd.utrReference}</p>
                      )}
                      {wd.adminNote && <p className="text-[10px] text-red-600">{wd.adminNote}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Transactions */}
        <div>
          <p className="text-sm font-semibold text-slate-800 mb-3">Transaction History</p>
          {txLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-white rounded-xl border animate-pulse" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 py-12 text-center">
              <TrendingUp className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => {
                const isCredit = ["ORDER_EARNING", "MANUAL_CREDIT"].includes(tx.type);
                const Icon = TX_ICONS[tx.type] ?? (isCredit ? ArrowDownLeft : ArrowUpRight);
                return (
                  <div key={tx.id} className="bg-white rounded-xl border border-slate-100 p-3 flex items-center gap-3">
                    <div className={clsx(
                      "p-2 rounded-lg shrink-0",
                      isCredit ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {tx.note || tx.type.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(tx.createdAt).toLocaleString()} · Bal: ₹{(tx.balanceAfter / 100).toFixed(2)}
                      </p>
                    </div>
                    <p className={clsx("text-sm font-bold shrink-0", isCredit ? "text-green-600" : "text-red-600")}>
                      {isCredit ? "+" : "-"}₹{(tx.amount / 100).toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Withdrawal modal */}
      <Modal title="Withdraw Funds" open={showModal} onClose={() => setShowModal(false)} size="sm">
        <div className="space-y-4">
          <div className="bg-orange-50 rounded-xl p-3 text-center">
            <p className="text-xs text-orange-600 font-medium">Available</p>
            <p className="text-2xl font-bold text-orange-700">₹{balanceRupees.toFixed(2)}</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Amount (₹)</label>
            <input
              type="number" min={100} max={balanceRupees} step={1}
              value={form.amountRupees}
              onChange={e => setForm(f => ({ ...f, amountRupees: e.target.value }))}
              placeholder="Min ₹100"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Method</label>
            <div className="flex gap-2">
              {(["bank", "upi"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setForm(f => ({ ...f, method: m }))}
                  className={clsx(
                    "flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors",
                    form.method === m ? "bg-orange-500 text-white border-orange-500" : "bg-white text-slate-600 border-slate-200"
                  )}
                >
                  {m === "bank" ? "Bank Transfer" : "UPI"}
                </button>
              ))}
            </div>
          </div>

          {form.method === "bank" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-700">Bank Details</p>
                {profile?.bankAccountNumber && (
                  <button onClick={prefill} className="text-xs text-orange-500 font-medium">Use saved</button>
                )}
              </div>
              {[
                { key: "bankAccountHolderName", label: "Account Holder", placeholder: "As per bank" },
                { key: "bankAccountNumber", label: "Account Number", placeholder: "Account number" },
                { key: "bankIfsc", label: "IFSC Code", placeholder: "e.g. HDFC0001234" },
                { key: "bankName", label: "Bank Name", placeholder: "e.g. HDFC Bank" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-medium text-slate-600 block mb-1">{label}</label>
                  <input
                    type="text"
                    value={form[key as keyof WdForm] as string}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">UPI ID</label>
              <input
                type="text"
                value={form.upiId}
                onChange={e => setForm(f => ({ ...f, upiId: e.target.value }))}
                placeholder="yourname@upi"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}

          <button
            onClick={() => wdMut.mutate()}
            disabled={wdMut.isPending || !form.amountRupees}
            className="w-full bg-orange-500 text-white font-semibold py-3 rounded-xl text-sm hover:bg-orange-600 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {wdMut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit Request
          </button>
        </div>
      </Modal>
    </div>
  );
}
