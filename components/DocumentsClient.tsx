"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
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

const FILE_FIELDS = [
  { name: "deedFile",            label: "Deed File" },
  { name: "guarantorChequeFile", label: "Guarantor Cheque" },
  { name: "nidFile",             label: "NID File" },
  { name: "tradeLicenseFile",    label: "Trade License" },
] as const;

type FileFieldName = typeof FILE_FIELDS[number]["name"];

function FileInputField({ name, label }: { name: FileFieldName; label: string }) {
  const [fileName, setFileName] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  const inputId = `file-input-${name}`;
  return (
    <div>
      <label htmlFor={inputId} className="label-text block mb-1">
        {label} <span className="text-slate-500 font-normal">(optional)</span>
      </label>
      <div className="flex items-center gap-2">
        <label htmlFor={inputId} className="cursor-pointer flex-1 min-w-0">
          <span className="input-field py-2 block text-sm text-slate-400 truncate">
            {fileName ?? "Choose file…"}
          </span>
        </label>
        <input
          ref={ref}
          id={inputId}
          name={name}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="sr-only"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
        {fileName && (
          <button
            type="button"
            onClick={() => {
              if (ref.current) ref.current.value = "";
              setFileName(null);
            }}
            className="shrink-0 whitespace-nowrap text-xs text-rose-300 hover:text-rose-200 hover:underline"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
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
    const form = e.currentTarget;
    const fd = new FormData(form);

    // Upload each file directly to Blob from the browser, then pass URLs to action
    const fileFields = [
      { inputName: "deedFile",            urlName: "deedFileUrl" },
      { inputName: "guarantorChequeFile", urlName: "guarantorChequeFileUrl" },
      { inputName: "nidFile",             urlName: "nidFileUrl" },
      { inputName: "tradeLicenseFile",    urlName: "tradeLicenseFileUrl" },
    ] as const;

    setError("Uploading files…");
    try {
      for (const field of fileFields) {
        const file = fd.get(field.inputName);
        if (file instanceof File && file.size > 0) {
          const blob = await upload(file.name, file, {
            access: "private",
            handleUploadUrl: "/api/blob/upload",
          });
          fd.set(field.urlName, blob.url);
        } else {
          fd.set(field.urlName, "");
        }
        fd.delete(field.inputName);
      }
    } catch (err) {
      setError(err instanceof Error ? `Upload failed: ${err.message}` : "File upload failed.");
      return;
    }

    setError("");
    startTransition(async () => {
      const result = await createDocumentAction(fd);
      if ("error" in result) { setError(result.error); return; }
      setShowCreate(false);
      router.refresh();
    });
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editDoc) return;
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateDocumentAction(editDoc.id, projectId, fd);
      if ("error" in result) { setError(result.error); return; }
      setEditDoc(null);
      router.refresh();
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this document record?")) return;
    startTransition(async () => {
      const result = await deleteDocumentAction(id, projectId);
      if ("error" in result) { alert(result.error); return; }
      router.refresh();
    });
  }

  function FileLink({ url, label }: { url?: string | null; label: string }) {
    if (!url) return <span className="text-xs text-slate-500">—</span>;
    const href = `/api/blob/download?url=${encodeURIComponent(url)}`;
    return (
      <a href={href} target="_blank" rel="noreferrer" className="block text-xs text-sky-300 hover:text-sky-200 hover:underline">
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
        {role === "ADMIN" && (
          <button onClick={() => { setError(""); setShowCreate(true); }} className="button-primary">
            + Add Document
          </button>
        )}
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
                        {role === "ADMIN" && (
                          <button onClick={() => { setError(""); setEditDoc(doc); }} className="text-slate-300 hover:text-white hover:underline">Edit</button>
                        )}
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
          <input type="hidden" name="projectId" value={projectId} />
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
            {FILE_FIELDS.map((f) => (
              <FileInputField key={f.name} name={f.name} label={f.label} />
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