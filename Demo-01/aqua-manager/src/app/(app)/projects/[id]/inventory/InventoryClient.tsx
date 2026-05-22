"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createInventory, updateInventory, deleteInventory } from "@/actions/inventoryActions";
import { calcTotalWeightKg } from "@/lib/math";

interface Inventory {
  id: string;
  subProject: string;
  fishQuantity: number;
  sizeMon: number;
  totalWeightKg: number;
}

interface Props { projectId: string; inventories: Inventory[]; role: string }

export function InventoryClient({ projectId, inventories, role }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<Inventory | null>(null);
  const [error, setError] = useState("");

  const totalFish = inventories.reduce((s, i) => s + i.fishQuantity, 0);
  const totalWeight = inventories.reduce((s, i) => s + i.totalWeightKg, 0);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createInventory(projectId, fd);
        setShowCreate(false);
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error");
      }
    });
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editItem) return;
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateInventory(editItem.id, projectId, fd);
        setEditItem(null);
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error");
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this inventory entry?")) return;
    startTransition(async () => {
      await deleteInventory(id, projectId);
      router.refresh();
    });
  }

  function InventoryForm({ defaultValues }: { defaultValues?: Inventory }) {
    const [qty, setQty] = useState(defaultValues?.fishQuantity ?? 0);
    const [size, setSize] = useState(defaultValues?.sizeMon ?? 0);

    let preview: number | null = null;
    try {
      if (qty > 0 && size > 0) preview = calcTotalWeightKg(qty, size);
    } catch { /* ignore */ }

    return (
      <div className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
        <div>
          <label className="label">Sub Project / Pond ID</label>
          <input name="subProject" defaultValue={defaultValues?.subProject} required className="input" placeholder="e.g. Pond A" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Fish Quantity (pieces)</label>
            <input name="fishQuantity" type="number" value={qty} min={0}
              onChange={(e) => setQty(parseInt(e.target.value) || 0)}
              required className="input" />
          </div>
          <div>
            <label className="label">Size (Mon)</label>
            <input name="sizeMon" type="number" value={size} step="0.1" min="0.1"
              onChange={(e) => setSize(parseFloat(e.target.value) || 0)}
              required className="input" />
          </div>
        </div>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-500 font-medium uppercase tracking-wide mb-1">Calculated Total Weight</p>
          <p className="text-2xl font-bold text-blue-700">
            {preview !== null ? `${preview.toLocaleString()} kg` : "—"}
          </p>
          <p className="text-xs text-blue-400 mt-1">Formula: (40 ÷ size) × quantity</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-700">Inventory ({inventories.length} ponds)</h2>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">+ Add Entry</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-blue-600">{totalFish.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Total Fish (pieces)</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-green-600">{totalWeight.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Total Weight (kg)</p>
        </div>
      </div>

      <div className="card p-0 overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">Sub Project</th>
              <th className="table-th text-right">Fish (pcs)</th>
              <th className="table-th text-right">Size (Mon)</th>
              <th className="table-th text-right">Weight (kg)</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {inventories.length === 0 && (
              <tr><td colSpan={5} className="table-td text-center text-gray-400 py-8">No inventory entries yet.</td></tr>
            )}
            {inventories.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="table-td font-medium">{inv.subProject}</td>
                <td className="table-td text-right">{inv.fishQuantity.toLocaleString()}</td>
                <td className="table-td text-right">{inv.sizeMon}</td>
                <td className="table-td text-right font-semibold text-green-600">{inv.totalWeightKg.toLocaleString()}</td>
                <td className="table-td">
                  <div className="flex gap-2">
                    <button onClick={() => setEditItem(inv)} className="text-xs text-gray-500 hover:underline">Edit</button>
                    {role === "ADMIN" && (
                      <button onClick={() => handleDelete(inv.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal title="Add Inventory Entry" open={showCreate} onClose={() => setShowCreate(false)}>
        <form onSubmit={handleCreate}>
          <InventoryForm />
          <div className="flex justify-end gap-2 mt-5">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isPending} className="btn-primary">Save</button>
          </div>
        </form>
      </Modal>

      <Modal title="Edit Inventory" open={!!editItem} onClose={() => setEditItem(null)}>
        {editItem && (
          <form onSubmit={handleUpdate}>
            <InventoryForm defaultValues={editItem} />
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" onClick={() => setEditItem(null)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={isPending} className="btn-primary">Save</button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
