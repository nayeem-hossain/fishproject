"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createProjectAction, deleteProjectAction, updateProjectAction } from "@/app/actions/projects";

interface Project {
  id: string;
  projectName: string;
  ownerName: string;
  mobileNo: string;
}

export function ProjectsClient({ projects, role }: { projects: Project[]; role: string }) {
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
        await createProjectAction(fd);
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
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateProjectAction(editProject.id, fd);
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
      try {
        await deleteProjectAction(id);
        router.refresh();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Error deleting project");
      }
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">All projects</h2>
          <p className="mt-1 text-sm text-slate-400">{projects.length} parent project(s) total</p>
        </div>
        {role === "ADMIN" && (
          <button onClick={() => { setError(""); setShowCreate(true); }} className="button-primary">
            + New Project
          </button>
        )}
      </div>

      <section className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead className="bg-white/5 text-slate-300">
              <tr>
                <th className="px-6 py-4 font-medium">Project</th>
                <th className="px-6 py-4 font-medium">Owner</th>
                <th className="px-6 py-4 font-medium">Mobile</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                    No projects yet. {role === "ADMIN" && "Create one to get started."}
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">
                      <button onClick={() => router.push(`/projects/${project.id}`)} className="text-left text-sky-300 hover:text-sky-200 hover:underline">
                        {project.projectName}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{project.ownerName}</td>
                    <td className="px-6 py-4 text-slate-300">{project.mobileNo}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-3 text-xs font-medium">
                        <button onClick={() => router.push(`/projects/${project.id}`)} className="text-sky-300 hover:text-sky-200 hover:underline">
                          View
                        </button>
                        <button onClick={() => { setError(""); setEditProject(project); }} className="text-slate-300 hover:text-white hover:underline">
                          Edit
                        </button>
                        {role === "ADMIN" && (
                          <button onClick={() => handleDelete(project.id)} className="text-rose-300 hover:text-rose-200 hover:underline">
                            Delete
                          </button>
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

      <Modal title="New Project" open={showCreate} onClose={() => setShowCreate(false)} size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
          <div>
            <label className="label-text" htmlFor="create-projectName">Project Name</label>
            <input id="create-projectName" name="projectName" required className="input-field" />
          </div>
          <div>
            <label className="label-text" htmlFor="create-ownerName">Owner Name</label>
            <input id="create-ownerName" name="ownerName" required className="input-field" />
          </div>
          <div>
            <label className="label-text" htmlFor="create-mobileNo">Mobile No.</label>
            <input id="create-mobileNo" name="mobileNo" required className="input-field" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="button-secondary">Cancel</button>
            <button type="submit" disabled={isPending} className="button-primary">Create</button>
          </div>
        </form>
      </Modal>

      <Modal title="Edit Project" open={!!editProject} onClose={() => setEditProject(null)} size="lg">
        {editProject && (
          <form onSubmit={handleEdit} className="space-y-4">
            {error && <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
            <div>
              <label className="label-text" htmlFor="edit-projectName">Project Name</label>
              <input id="edit-projectName" name="projectName" defaultValue={editProject.projectName} required className="input-field" />
            </div>
            <div>
              <label className="label-text" htmlFor="edit-ownerName">Owner Name</label>
              <input id="edit-ownerName" name="ownerName" defaultValue={editProject.ownerName} required className="input-field" />
            </div>
            <div>
              <label className="label-text" htmlFor="edit-mobileNo">Mobile No.</label>
              <input id="edit-mobileNo" name="mobileNo" defaultValue={editProject.mobileNo} required className="input-field" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditProject(null)} className="button-secondary">Cancel</button>
              <button type="submit" disabled={isPending} className="button-primary">Save</button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}