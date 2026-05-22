"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { calcClosingBalance } from "@/lib/math";
import { createFeedLogAction, deleteFeedLogAction, updateFeedLogAction } from "@/app/actions/feed";

interface FeedLogRow {
  id: string;
  entryDate: string;
  openingBalance: number;
  additionAmount: number;
  dailyUse: number;
  closingBalance: number;
}

function FeedForm({ defaultValues, error }: { defaultValues?: FeedLogRow; error?: string }) {
  const [opening, setOpening] = useState(defaultValues?.openingBalance ?? 0);
  const [addition, setAddition] = useState(defaultValues?.additionAmount ?? 0);
  const [use, setUse] = useState(defaultValues?.dailyUse ?? 0);
  const closing = calcClosingBalance(opening, addition, use);

  const defaultDate = defaultValues
    ? new Date(defaultValues.entryDate).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-4">
      {error && <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
      <div>
        <label className="label-text" htmlFor="entryDate">Entry Date</label>
        <input name="entryDate" type="date" defaultValue={defaultDate} required className="input-field" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="label-text" htmlFor="openingBalance">Opening Balance (kg)</label>
          <input name="openingBalance" type="number" step="0.001" value={opening} onChange={(e) => setOpening(parseFloat(e.target.value) || 0)} required className="input-field" />
        </div>
        <div>
          <label className="label-text" htmlFor="additionAmount">Addition (kg)</label>
          <input name="additionAmount" type="number" step="0.001" value={addition} onChange={(e) => setAddition(parseFloat(e.target.value) || 0)} required className="input-field" />
        </div>
        <div>
          <label className="label-text" htmlFor="dailyUse">Daily Use (kg)</label>
          <input name="dailyUse" type="number" step="0.001" value={use} onChange={(e) => setUse(parseFloat(e.target.value) || 0)} required className="input-field" />
        </div>
      </div>
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200/80">Closing Balance</p>
          <p className="mt-2 text-2xl font-semibold text-white">{closing.toFixed(3)} kg</p>
        </div>
        <div className="text-xs text-emerald-100/70">Opening + Addition − Daily Use</div>
      </div>
    </div>
  );
}

export function FeedClient({ projectId, feedLogs, role }: { projectId: string; feedLogs: FeedLogRow[]; role: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [editLog, setEditLog] = useState<FeedLogRow | null>(null);
  const [error, setError] = useState("");

  const totalUse = feedLogs.reduce((sum, row) => sum + row.dailyUse, 0);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createFeedLogAction(fd);
        setShowCreate(false);
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error creating feed log");
      }
    });
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editLog) return;
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateFeedLogAction(editLog.id, projectId, fd);
        setEditLog(null);
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error updating feed log");
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this feed log entry?")) return;
    startTransition(async () => {
      try {
        await deleteFeedLogAction(id, projectId);
        router.refresh();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Error deleting feed log");
      }
    });
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Feed Consumption Log</h2>
          <p className="mt-1 text-sm text-slate-400">{feedLogs.length} entries · Total used: {totalUse.toFixed(3)} kg</p>
        </div>
        <button onClick={() => { setError(""); setShowCreate(true); }} className="button-primary">
          + Log Entry
        </button>
      </div>

      <section className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead className="bg-white/5 text-slate-300">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Opening (kg)</th>
                <th className="px-6 py-4 font-medium text-right">Added (kg)</th>
                <th className="px-6 py-4 font-medium text-right">Used (kg)</th>
                <th className="px-6 py-4 font-medium text-right">Closing (kg)</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {feedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">No feed logs yet.</td>
                </tr>
              ) : (
                feedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{new Date(log.entryDate).toLocaleDateString("en-GB")}</td>
                    <td className="px-6 py-4 text-right text-slate-300">{log.openingBalance.toFixed(3)}</td>
                    <td className="px-6 py-4 text-right text-emerald-200">+{log.additionAmount.toFixed(3)}</td>
                    <td className="px-6 py-4 text-right text-rose-200">−{log.dailyUse.toFixed(3)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-white">{log.closingBalance.toFixed(3)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-3 text-xs font-medium">
                        <button onClick={() => { setError(""); setEditLog(log); }} className="text-slate-300 hover:text-white hover:underline">Edit</button>
                        {role === "ADMIN" && (
                          <button onClick={() => handleDelete(log.id)} className="text-rose-300 hover:text-rose-200 hover:underline">Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal title="Log Feed Entry" open={showCreate} onClose={() => setShowCreate(false)} size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <FeedForm error={error} />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="button-secondary">Cancel</button>
            <button type="submit" disabled={isPending} className="button-primary">Save</button>
          </div>
        </form>
      </Modal>

      <Modal title="Edit Feed Entry" open={!!editLog} onClose={() => setEditLog(null)} size="lg">
        {editLog && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <FeedForm defaultValues={editLog} error={error} />
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditLog(null)} className="button-secondary">Cancel</button>
              <button type="submit" disabled={isPending} className="button-primary">Save</button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}