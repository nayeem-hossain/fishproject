"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { calcTotalWeightKg } from "@/lib/math";
import { createInventoryAction, deleteInventoryAction, updateInventoryAction } from "@/app/actions/inventory";

interface InventoryRow {
  id: string;
  subProject: string;
  fishQuantity: number;
  sizeMon: number;
  totalWeightKg: number;
}

function InventoryForm({ defaultValues }: { defaultValues?: InventoryRow }) {
  const [qty, setQty] = useState(defaultValues?.fishQuantity ?? 0);
  const [size, setSize] = useState(defaultValues?.sizeMon ?? 0);

  let preview: number | null = null;

  try {
    if (qty > 0 && size > 0) {
      preview = calcTotalWeightKg(qty, size);
    }
  } catch {
    preview = null;
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label-text" htmlFor="subProject">Sub Project / Pond ID</label>
        <input name="subProject" defaultValue={defaultValues?.subProject} required className="input-field" placeholder="e.g. Pond A" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label-text" htmlFor="fishQuantity">Fish Quantity (pieces)</label>
          <input
            name="fishQuantity"
            type="number"
            value={qty}
            min={1}
            onChange={(e) => setQty(parseInt(e.target.value, 10) || 0)}
            required
            className="input-field"
          />
        </div>
        <div>
          <label className="label-text" htmlFor="sizeMon">Size (Mon)</label>
          <input
            name="sizeMon"
            type="number"
            value={size}
            step="0.001"
            min="0.001"
            onChange={(e) => setSize(parseFloat(e.target.value) || 0)}
            required
            className="input-field"
          />
        </div>
      </div>
      <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-200/80">Calculated Total Weight</p>
        <p className="mt-2 text-2xl font-semibold text-white">{preview !== null ? `${preview.toLocaleString()} kg` : "—"}</p>
        <p className="mt-1 text-xs text-sky-100/70">Formula: (40 ÷ size) × quantity</p>
      </div>
    </div>
  );
}

export function InventoryClient({ projectId, inventories, role }: { projectId: string; inventories: InventoryRow[]; role: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<InventoryRow | null>(null);
  const [error, setError] = useState("");

  const totalFish = inventories.reduce((sum, item) => sum + item.fishQuantity, 0);
  const totalWeight = inventories.reduce((sum, item) => sum + item.totalWeightKg, 0);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createInventoryAction(fd);
        setShowCreate(false);
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error creating inventory entry");
      }
    });
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editItem) return;
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateInventoryAction(editItem.id, projectId, fd);
        setEditItem(null);
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error updating inventory entry");
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this inventory entry?")) return;
    startTransition(async () => {
      try {
        await deleteInventoryAction(id, projectId);
        router.refresh();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Error deleting inventory entry");
      }
    });
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Inventory ({inventories.length} ponds)</h2>
          <p className="mt-1 text-sm text-slate-400">Total fish: {totalFish.toLocaleString()} · Total weight: {totalWeight.toLocaleString()} kg</p>
        </div>
        <button onClick={() => { setError(""); setShowCreate(true); }} className="button-primary">
          + Add Entry
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="surface p-6 text-center">
          <p className="text-sm text-slate-400">Total Fish (pieces)</p>
          <p className="mt-2 text-3xl font-semibold text-white">{totalFish.toLocaleString()}</p>
        </article>
        <article className="surface p-6 text-center">
          <p className="text-sm text-slate-400">Total Weight (kg)</p>
          <p className="mt-2 text-3xl font-semibold text-white">{totalWeight.toLocaleString()}</p>
        </article>
      </div>

      <section className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead className="bg-white/5 text-slate-300">
              <tr>
                <th className="px-6 py-4 font-medium">Sub Project</th>
                <th className="px-6 py-4 font-medium">Fish (pcs)</th>
                <th className="px-6 py-4 font-medium">Size (Mon)</th>
                <th className="px-6 py-4 font-medium">Weight (kg)</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {inventories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">No inventory entries yet.</td>
                </tr>
              ) : (
                inventories.map((inventory) => (
                  <tr key={inventory.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{inventory.subProject}</td>
                    <td className="px-6 py-4 text-slate-300">{inventory.fishQuantity.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-300">{inventory.sizeMon}</td>
                    <td className="px-6 py-4 font-semibold text-emerald-200">{inventory.totalWeightKg.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-3 text-xs font-medium">
                        <button onClick={() => { setError(""); setEditItem(inventory); }} className="text-slate-300 hover:text-white hover:underline">Edit</button>
                        {role === "ADMIN" && (
                          <button onClick={() => handleDelete(inventory.id)} className="text-rose-300 hover:text-rose-200 hover:underline">Delete</button>
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

      <Modal title="Add Inventory Entry" open={showCreate} onClose={() => setShowCreate(false)} size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
          <InventoryForm />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="button-secondary">Cancel</button>
            <button type="submit" disabled={isPending} className="button-primary">Save</button>
          </div>
        </form>
      </Modal>

      <Modal title="Edit Inventory" open={!!editItem} onClose={() => setEditItem(null)} size="lg">
        {editItem && (
          <form onSubmit={handleUpdate} className="space-y-4">
            {error && <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
            <InventoryForm defaultValues={editItem} />
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditItem(null)} className="button-secondary">Cancel</button>
              <button type="submit" disabled={isPending} className="button-primary">Save</button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}