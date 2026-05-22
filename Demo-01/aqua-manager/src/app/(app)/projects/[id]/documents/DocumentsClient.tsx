"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createDocument, updateDocument, deleteDocument } from "@/actions/documentActions";

interface Document {
  id: string;
  subProject: string;
  quantity: number;
  chequeNumber: string;
  guarantorName: string;
  deedFileUrl?: string | null;
  guarantorChequeFileUrl?: string | null;
  nidFileUrl?: string | null;
  tradeLicenseFileUrl?: string | null;
}

interface Props { projectId: string; documents: Document[]; role: string }

export function DocumentsClient({ projectId, documents, role }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [editDoc, setEditDoc] = useState<Document | null>(null);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createDocument(projectId, fd);
        setShowCreate(false);
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error");
      }
    });
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editDoc) return;
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateDocument(editDoc.id, projectId, fd);
        setEditDoc(null);
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error");
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this document record?")) return;
    startTransition(async () => {
      await deleteDocument(id, projectId);
      router.refresh();
    });
  }

  function FileLink({ url, label }: { url?: string | null; label: string }) {
    if (!url) return <span className="text-gray-300 text-xs">—</span>;
    return (
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="text-blue-500 hover:underline text-xs">
        {label}
      </a>
    );
  }

  function DocumentForm({ defaultValues }: { defaultValues?: Document }) {
    return (
      <div className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Sub Project</label>
            <input name="subProject" defaultValue={defaultValues?.subProject} required className="input" />
          </div>
          <div>
            <label className="label">Quantity</label>
            <input name="quantity" type="number" defaultValue={defaultValues?.quantity} required className="input" />
          </div>
          <div>
            <label className="label">Cheque Number</label>
            <input name="chequeNumber" defaultValue={defaultValues?.chequeNumber} required className="input" />
          </div>
          <div>
            <label className="label">Guarantor Name</label>
            <input name="guarantorName" defaultValue={defaultValues?.guarantorName} required className="input" />
          </div>
        </div>
        {!defaultValues && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: "deedFile", label: "Deed File" },
              { name: "guarantorChequeFile", label: "Guarantor Cheque" },
              { name: "nidFile", label: "NID File" },
              { name: "tradeLicenseFile", label: "Trade License" },
            ].map((f) => (
              <div key={f.name}>
                <label className="label">{f.label}</label>
                <input name={f.name} type="file" accept=".pdf,.jpg,.jpeg,.png"
                  className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer" />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-700">Documents ({documents.length})</h2>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">+ Add Document</button>
      </div>

      <div className="card p-0 overflow-auto">
        <table className="w-full min-w-[700px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">Sub Project</th>
              <th className="table-th">Qty</th>
              <th className="table-th">Cheque #</th>
              <th className="table-th">Guarantor</th>
              <th className="table-th">Files</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {documents.length === 0 && (
              <tr><td colSpan={6} className="table-td text-center text-gray-400 py-8">No documents yet.</td></tr>
            )}
            {documents.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="table-td font-medium">{d.subProject}</td>
                <td className="table-td">{d.quantity.toLocaleString()}</td>
                <td className="table-td">{d.chequeNumber}</td>
                <td className="table-td">{d.guarantorName}</td>
                <td className="table-td">
                  <div className="flex flex-wrap gap-2">
                    <FileLink url={d.deedFileUrl} label="Deed" />
                    <FileLink url={d.guarantorChequeFileUrl} label="Cheque" />
                    <FileLink url={d.nidFileUrl} label="NID" />
                    <FileLink url={d.tradeLicenseFileUrl} label="License" />
                  </div>
                </td>
                <td className="table-td">
                  <div className="flex gap-2">
                    <button onClick={() => setEditDoc(d)} className="text-xs text-gray-500 hover:underline">Edit</button>
                    {role === "ADMIN" && (
                      <button onClick={() => handleDelete(d.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal title="Add Document" open={showCreate} onClose={() => setShowCreate(false)} size="xl">
        <form onSubmit={handleCreate}>
          <DocumentForm />
          <div className="flex justify-end gap-2 mt-5">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isPending} className="btn-primary">Save</button>
          </div>
        </form>
      </Modal>

      <Modal title="Edit Document" open={!!editDoc} onClose={() => setEditDoc(null)} size="xl">
        {editDoc && (
          <form onSubmit={handleUpdate}>
            <DocumentForm defaultValues={editDoc} />
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" onClick={() => setEditDoc(null)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={isPending} className="btn-primary">Save</button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
