"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createDocumentAction, deleteDocumentAction, updateDocumentAction } from "@/app/actions/documents";

interface DocumentRow {
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

export function DocumentsClient({ projectId, documents, role }: { projectId: string; documents: DocumentRow[]; role: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [editDoc, setEditDoc] = useState<DocumentRow | null>(null);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createDocumentAction(fd);
        setShowCreate(false);
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error creating document");
      }
    });
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editDoc) return;
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateDocumentAction(editDoc.id, projectId, fd);
        setEditDoc(null);
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error updating document");
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this document record?")) return;
    startTransition(async () => {
      try {
        await deleteDocumentAction(id, projectId);
        router.refresh();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Error deleting document");
      }
    });
  }

  function FileLink({ url, label }: { url?: string | null; label: string }) {
    if (!url) return <span className="text-xs text-slate-500">—</span>;

    return (
      <a href={url} target="_blank" rel="noreferrer" className="block text-xs text-sky-300 hover:text-sky-200 hover:underline">
        {label}
      </a>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Documents ({documents.length})</h2>
          <p className="mt-1 text-sm text-slate-400">Upload and retrieve project records on demand.</p>
        </div>
        <button onClick={() => { setError(""); setShowCreate(true); }} className="button-primary">
          + Add Document
        </button>
      </div>

      <section className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead className="bg-white/5 text-slate-300">
              <tr>
                <th className="px-6 py-4 font-medium">Sub Project</th>
                <th className="px-6 py-4 font-medium">Qty</th>
                <th className="px-6 py-4 font-medium">Cheque #</th>
                <th className="px-6 py-4 font-medium">Guarantor</th>
                <th className="px-6 py-4 font-medium">Files</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">No documents yet.</td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="align-top hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{doc.subProject}</td>
                    <td className="px-6 py-4 text-slate-300">{doc.quantity.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-300">{doc.chequeNumber}</td>
                    <td className="px-6 py-4 text-slate-300">{doc.guarantorName}</td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <FileLink url={doc.deedFileUrl} label="Deed" />
                        <FileLink url={doc.guarantorChequeFileUrl} label="Guarantor cheque" />
                        <FileLink url={doc.nidFileUrl} label="NID" />
                        <FileLink url={doc.tradeLicenseFileUrl} label="Trade license" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-3 text-xs font-medium">
                        <button onClick={() => { setError(""); setEditDoc(doc); }} className="text-slate-300 hover:text-white hover:underline">Edit</button>
                        {role === "ADMIN" && (
                          <button onClick={() => handleDelete(doc.id)} className="text-rose-300 hover:text-rose-200 hover:underline">Delete</button>
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

      <Modal title="New Document" open={showCreate} onClose={() => setShowCreate(false)} size="xl">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label-text" htmlFor="create-subProject">Sub Project</label>
              <input id="create-subProject" name="subProject" required className="input-field" />
            </div>
            <div>
              <label className="label-text" htmlFor="create-quantity">Quantity</label>
              <input id="create-quantity" name="quantity" type="number" required className="input-field" min="1" />
            </div>
            <div>
              <label className="label-text" htmlFor="create-chequeNumber">Cheque Number</label>
              <input id="create-chequeNumber" name="chequeNumber" required className="input-field" />
            </div>
            <div>
              <label className="label-text" htmlFor="create-guarantorName">Guarantor Name</label>
              <input id="create-guarantorName" name="guarantorName" required className="input-field" />
            </div>
            {[
              { name: "deedFile", label: "Deed File" },
              { name: "guarantorChequeFile", label: "Guarantor Cheque" },
              { name: "nidFile", label: "NID File" },
              { name: "tradeLicenseFile", label: "Trade License" }
            ].map((fileField) => (
              <div key={fileField.name}>
                <label className="label-text" htmlFor={`create-${fileField.name}`}>{fileField.label}</label>
                <input id={`create-${fileField.name}`} name={fileField.name} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="input-field py-2" required />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="button-secondary">Cancel</button>
            <button type="submit" disabled={isPending} className="button-primary">Create</button>
          </div>
        </form>
      </Modal>

      <Modal title="Edit Document" open={!!editDoc} onClose={() => setEditDoc(null)} size="xl">
        {editDoc && (
          <form onSubmit={handleEdit} className="space-y-4">
            {error && <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label-text" htmlFor="edit-subProject">Sub Project</label>
                <input id="edit-subProject" name="subProject" defaultValue={editDoc.subProject} required className="input-field" />
              </div>
              <div>
                <label className="label-text" htmlFor="edit-quantity">Quantity</label>
                <input id="edit-quantity" name="quantity" type="number" defaultValue={editDoc.quantity} required className="input-field" min="1" />
              </div>
              <div>
                <label className="label-text" htmlFor="edit-chequeNumber">Cheque Number</label>
                <input id="edit-chequeNumber" name="chequeNumber" defaultValue={editDoc.chequeNumber} required className="input-field" />
              </div>
              <div>
                <label className="label-text" htmlFor="edit-guarantorName">Guarantor Name</label>
                <input id="edit-guarantorName" name="guarantorName" defaultValue={editDoc.guarantorName} required className="input-field" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditDoc(null)} className="button-secondary">Cancel</button>
              <button type="submit" disabled={isPending} className="button-primary">Save</button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}