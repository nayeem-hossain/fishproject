"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createProject, updateProject, deleteProject } from "@/actions/projectActions";

interface Project {
  id: string;
  projectName: string;
  ownerName: string;
  mobileNo: string;
  createdAt: Date;
}

interface Props {
  projects: Project[];
  role: string;
}

export function ProjectsClient({ projects, role }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createProject(fd);
        setShowCreate(false);
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error creating project");
      }
    });
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editProject) return;
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateProject(editProject.id, fd);
        setEditProject(null);
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error updating project");
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this project and all its data?")) return;
    startTransition(async () => {
      await deleteProject(id);
      router.refresh();
    });
  }

  return (
    <>
      {role === "ADMIN" && (
        <div className="mb-4">
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            + New Project
          </button>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">Project Name</th>
              <th className="table-th">Owner</th>
              <th className="table-th">Mobile</th>
              <th className="table-th">Created</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projects.length === 0 && (
              <tr>
                <td colSpan={5} className="table-td text-center text-gray-400 py-10">
                  No projects yet. {role === "ADMIN" && "Create one to get started."}
                </td>
              </tr>
            )}
            {projects.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="table-td font-medium">
                  <button
                    onClick={() => router.push(`/projects/${p.id}`)}
                    className="text-blue-600 hover:underline text-left"
                  >
                    {p.projectName}
                  </button>
                </td>
                <td className="table-td">{p.ownerName}</td>
                <td className="table-td">{p.mobileNo}</td>
                <td className="table-td text-gray-400 text-xs">
                  {new Date(p.createdAt).toLocaleDateString()}
                </td>
                <td className="table-td">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/projects/${p.id}`)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View
                    </button>
                    <button
                      onClick={() => setEditProject(p)}
                      className="text-xs text-gray-500 hover:underline"
                    >
                      Edit
                    </button>
                    {role === "ADMIN" && (
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      <Modal title="New Project" open={showCreate} onClose={() => setShowCreate(false)}>
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="label">Project Name</label>
            <input name="projectName" required className="input" />
          </div>
          <div>
            <label className="label">Owner Name</label>
            <input name="ownerName" required className="input" />
          </div>
          <div>
            <label className="label">Mobile No.</label>
            <input name="mobileNo" required className="input" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isPending} className="btn-primary">Create</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal title="Edit Project" open={!!editProject} onClose={() => setEditProject(null)}>
        {editProject && (
          <form onSubmit={handleEdit} className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div>
              <label className="label">Project Name</label>
              <input name="projectName" defaultValue={editProject.projectName} required className="input" />
            </div>
            <div>
              <label className="label">Owner Name</label>
              <input name="ownerName" defaultValue={editProject.ownerName} required className="input" />
            </div>
            <div>
              <label className="label">Mobile No.</label>
              <input name="mobileNo" defaultValue={editProject.mobileNo} required className="input" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditProject(null)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={isPending} className="btn-primary">Save</button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
