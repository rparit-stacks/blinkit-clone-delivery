import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchWallet, fetchTransactions, fetchWithdrawals, requestWithdrawal, fetchProfile
} from "../../api/deliveryApi";
import {
  ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle,
  AlertCircle, Loader2, Wallet as WalletIcon, TrendingUp, IndianRupee
} from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";
import Modal from "../../components/Modal";

const TX_ICONS: Record<string, typeof ArrowDownLeft> = {
  ORDER_EARNING:  ArrowDownLeft,
  MANUAL_CREDIT:  ArrowDownLeft,
  WITHDRAWAL:     ArrowUpRight,
  MANUAL_DEBIT:   ArrowUpRight,
};

const WD_STATUS: Record<string, { bg: string; text: string; icon: typeof Clock }> = {
  PENDING:   { bg: "bg-yellow-50",  text: "text-yellow-700", icon: Clock },
  APPROVED:  { bg: "bg-blue-50",    text: "text-blue-700",   icon: Clock },
  PROCESSED: { bg: "bg-green-50",   text: "text-green-700",  icon: CheckCircle },
  REJECTED:  { bg: "bg-red-50",     text: "text-red-700",    icon: XCircle },
};

interface WdForm {
  amountRupees: string;
  method: "bank" | "upi";
  bankAccountNumber: string; bankIfsc: string;
  bankAccountHolderName: string; bankName: string; upiId: string;
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
    if (profile) setForm(f => ({
      ...f,
      bankAccountNumber: profile.bankAccountNumber || "",
      bankIfsc: profile.bankIfsc || "",
      bankAccountHolderName: profile.bankAccountHolderName || "",
      bankName: profile.bankName || "",
      upiId: profile.upiId || "",
    }));
  };

  const balanceRupees = wallet ? wallet.balance / 100 : 0;
  const pendingWd = withdrawals.filter(w => w.status === "PENDING");

  return (
    <div className="min-h-full">
      <div className="space-y-4 px-4 py-4">
        {/* Balance card */}
        {walletLoading ? (
          <div className="skeleton h-48 rounded-3xl" />
        ) : wallet ? (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 shadow-xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,rgba(251,146,60,0.12),transparent)]" />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Available Balance</p>
                  <p className="text-4xl font-bold text-white">
                    ₹{balanceRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/20">
                  <WalletIcon className="h-6 w-6 text-orange-400" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-4 mb-4">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Earned</p>
                  <p className="text-sm font-bold text-white mt-0.5">₹{(wallet.lifetimeEarned / 100).toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Withdrawn</p>
                  <p className="text-sm font-bold text-white mt-0.5">₹{(wallet.lifetimeWithdrawn / 100).toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Pending</p>
                  <p className="text-sm font-bold text-white mt-0.5">₹{(wallet.pendingBalance / 100).toFixed(0)}</p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(true)}
                disabled={balanceRupees < 100}
                className="w-full rounded-2xl bg-orange-500 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-orange-400"
              >
                Withdraw Funds
              </button>
              {balanceRupees < 100 && (
                <p className="text-center text-[10px] text-slate-500 mt-1.5">Minimum ₹100 required</p>
              )}
            </div>
          </div>
        ) : null}

        {/* Pending notice */}
        {pendingWd.length > 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs font-medium text-amber-800">
              {pendingWd.length} pending withdrawal — ₹{pendingWd.reduce((a, w) => a + w.amount / 100, 0).toFixed(0)} processing
            </p>
          </div>
        )}

        {/* Withdrawals */}
        {withdrawals.length > 0 && (
          <section>
            <p className="text-sm font-bold text-slate-800 mb-2.5">Withdrawal Requests</p>
            <div className="space-y-2">
              {withdrawals.map(wd => {
                const ws = WD_STATUS[wd.status] ?? WD_STATUS.PENDING;
                const Icon = ws.icon;
                return (
                  <div key={wd.id} className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-3.5 shadow-sm">
                    <div className={clsx("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", ws.bg)}>
                      <Icon className={clsx("h-4 w-4", ws.text)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-slate-900">₹{(wd.amount / 100).toFixed(2)}</p>
                        <span className={clsx("text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide", ws.bg, ws.text)}>
                          {wd.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {new Date(wd.createdAt).toLocaleDateString("en-IN")}
                        {wd.upiId ? ` · UPI: ${wd.upiId}` : wd.bankAccountNumber ? ` · ···${wd.bankAccountNumber.slice(-4)}` : ""}
                      </p>
                      {wd.utrReference && <p className="text-[10px] font-medium text-green-600 mt-0.5">UTR: {wd.utrReference}</p>}
                      {wd.adminNote && <p className="text-[10px] text-red-600 mt-0.5">{wd.adminNote}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Transactions */}
        <section>
          <p className="text-sm font-bold text-slate-800 mb-2.5">Transaction History</p>
          {txLoading ? (
            <div className="space-y-2">
              {[0,1,2,3,4].map(i => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-white border" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center shadow-sm">
              <TrendingUp className="mb-2 h-8 w-8 text-slate-300" />
              <p className="text-sm text-slate-500">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => {
                const isCredit = ["ORDER_EARNING", "MANUAL_CREDIT"].includes(tx.type);
                const Icon = TX_ICONS[tx.type] ?? (isCredit ? ArrowDownLeft : ArrowUpRight);
                return (
                  <div key={tx.id} className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-3.5 shadow-sm">
                    <div className={clsx(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                      isCredit ? "bg-green-50" : "bg-red-50"
                    )}>
                      <Icon className={clsx("h-4 w-4", isCredit ? "text-green-600" : "text-red-600")} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {tx.note || tx.type.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(tx.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                        {" · "}Bal: ₹{(tx.balanceAfter / 100).toFixed(2)}
                      </p>
                    </div>
                    <p className={clsx("text-sm font-bold shrink-0", isCredit ? "text-green-600" : "text-red-600")}>
                      {isCredit ? "+" : "−"}₹{(tx.amount / 100).toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Withdrawal modal */}
      <Modal title="Withdraw Funds" open={showModal} onClose={() => setShowModal(false)} size="sm">
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3.5">
            <div>
              <p className="text-xs font-medium text-orange-100">Available</p>
              <p className="text-2xl font-bold text-white">₹{balanceRupees.toFixed(2)}</p>
            </div>
            <IndianRupee className="h-8 w-8 text-orange-200" />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Amount (₹)</label>
            <input
              type="number" min={100} max={balanceRupees} step={1}
              value={form.amountRupees}
              onChange={e => setForm(f => ({ ...f, amountRupees: e.target.value }))}
              placeholder="Min ₹100"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Payment Method</label>
            <div className="flex gap-2">
              {(["bank", "upi"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setForm(f => ({ ...f, method: m }))}
                  className={clsx(
                    "flex-1 rounded-xl py-2.5 text-sm font-semibold border transition-all",
                    form.method === m
                      ? "border-orange-500 bg-orange-500 text-white"
                      : "border-slate-200 bg-white text-slate-600"
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
                  <button onClick={prefill} className="text-xs font-semibold text-orange-500">Use saved</button>
                )}
              </div>
              {[
                { key: "bankAccountHolderName", label: "Account Holder", placeholder: "As per bank" },
                { key: "bankAccountNumber",     label: "Account Number", placeholder: "Account number" },
                { key: "bankIfsc",              label: "IFSC Code",      placeholder: "e.g. HDFC0001234" },
                { key: "bankName",              label: "Bank Name",      placeholder: "e.g. HDFC Bank" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
                  <input
                    type="text"
                    value={form[key as keyof WdForm] as string}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">UPI ID</label>
              <input
                type="text"
                value={form.upiId}
                onChange={e => setForm(f => ({ ...f, upiId: e.target.value }))}
                placeholder="yourname@upi"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}

          <button
            onClick={() => wdMut.mutate()}
            disabled={wdMut.isPending || !form.amountRupees}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3.5 text-sm font-bold text-white shadow-md shadow-orange-500/25 transition-all active:scale-[0.98] disabled:opacity-60 hover:bg-orange-600"
          >
            {wdMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit Request
          </button>
        </div>
      </Modal>
    </div>
  );
}
