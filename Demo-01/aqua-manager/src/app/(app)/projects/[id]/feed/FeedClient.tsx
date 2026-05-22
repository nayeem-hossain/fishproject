"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createFeedLog, updateFeedLog, deleteFeedLog } from "@/actions/feedActions";

interface FeedLog {
  id: string;
  entryDate: Date;
  openingBalance: number;
  additionAmount: number;
  dailyUse: number;
  closingBalance: number;
}

interface Props { projectId: string; feedLogs: FeedLog[]; role: string }

function FeedForm({ defaultValues, error }: { defaultValues?: FeedLog; error?: string }) {
  const [opening, setOpening] = useState(defaultValues?.openingBalance ?? 0);
  const [addition, setAddition] = useState(defaultValues?.additionAmount ?? 0);
  const [use, setUse] = useState(defaultValues?.dailyUse ?? 0);
  const closing = opening + addition - use;

  const defaultDate = defaultValues
    ? new Date(defaultValues.entryDate).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
      <div>
        <label className="label">Entry Date</label>
        <input name="entryDate" type="date" defaultValue={defaultDate} required className="input" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Opening Balance (kg)</label>
          <input name="openingBalance" type="number" step="0.01" value={opening}
            onChange={(e) => setOpening(parseFloat(e.target.value) || 0)} required className="input" />
        </div>
        <div>
          <label className="label">Addition (kg)</label>
          <input name="additionAmount" type="number" step="0.01" value={addition}
            onChange={(e) => setAddition(parseFloat(e.target.value) || 0)} required className="input" />
        </div>
        <div>
          <label className="label">Daily Use (kg)</label>
          <input name="dailyUse" type="number" step="0.01" value={use}
            onChange={(e) => setUse(parseFloat(e.target.value) || 0)} required className="input" />
        </div>
      </div>
      <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
        <div>
          <p className="text-xs text-green-500 font-medium uppercase tracking-wide">Closing Balance</p>
          <p className="text-2xl font-bold text-green-700">{closing.toFixed(2)} kg</p>
        </div>
        <div className="text-xs text-green-400">Opening + Addition − Daily Use</div>
      </div>
    </div>
  );
}

export function FeedClient({ projectId, feedLogs, role }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [editLog, setEditLog] = useState<FeedLog | null>(null);
  const [error, setError] = useState("");

  const totalUse = feedLogs.reduce((s, l) => s + l.dailyUse, 0);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createFeedLog(projectId, fd);
        setShowCreate(false);
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error");
      }
    });
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editLog) return;
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateFeedLog(editLog.id, projectId, fd);
        setEditLog(null);
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error");
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this feed log entry?")) return;
    startTransition(async () => {
      await deleteFeedLog(id, projectId);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-700">Feed Consumption Log</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {feedLogs.length} entries · Total used: {totalUse.toFixed(2)} kg
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">+ Log Entry</button>
      </div>

      <div className="card p-0 overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">Date</th>
              <th className="table-th text-right">Opening (kg)</th>
              <th className="table-th text-right">Added (kg)</th>
              <th className="table-th text-right">Used (kg)</th>
              <th className="table-th text-right">Closing (kg)</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {feedLogs.length === 0 && (
              <tr><td colSpan={6} className="table-td text-center text-gray-400 py-8">No feed logs yet.</td></tr>
            )}
            {feedLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="table-td font-medium">
                  {new Date(log.entryDate).toLocaleDateString("en-GB")}
                </td>
                <td className="table-td text-right">{log.openingBalance.toFixed(2)}</td>
                <td className="table-td text-right text-green-600">+{log.additionAmount.toFixed(2)}</td>
                <td className="table-td text-right text-red-500">−{log.dailyUse.toFixed(2)}</td>
                <td className="table-td text-right font-semibold">{log.closingBalance.toFixed(2)}</td>
                <td className="table-td">
                  <div className="flex gap-2">
                    <button onClick={() => setEditLog(log)} className="text-xs text-gray-500 hover:underline">Edit</button>
                    {role === "ADMIN" && (
                      <button onClick={() => handleDelete(log.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal title="Log Feed Entry" open={showCreate} onClose={() => setShowCreate(false)} size="lg">
        <form onSubmit={handleCreate}>
          <FeedForm error={error} />
          <div className="flex justify-end gap-2 mt-5">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isPending} className="btn-primary">Save</button>
          </div>
        </form>
      </Modal>

      <Modal title="Edit Feed Entry" open={!!editLog} onClose={() => setEditLog(null)} size="lg">
        {editLog && (
          <form onSubmit={handleUpdate}>
            <FeedForm defaultValues={editLog} error={error} />
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" onClick={() => setEditLog(null)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={isPending} className="btn-primary">Save</button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
