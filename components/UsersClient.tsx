"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createUserAction, deleteUserAction, updateUserAction } from "@/app/actions/users";

interface UserRow {
  id: string;
  username: string;
  role: "ADMIN" | "OPERATOR";
  projectId: string | null;
  project: { id: string; projectName: string } | null;
}

interface ProjectOption {
  id: string;
  projectName: string;
}

export function UsersClient({ users, projects }: { users: UserRow[]; projects: ProjectOption[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createUserAction(fd);
        setShowCreate(false);
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error creating user");
      }
    });
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editUser) return;
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateUserAction(editUser.id, fd);
        setEditUser(null);
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error updating user");
      }
    });
  }

  async function handleDelete(id: string, username: string) {
    if (!confirm(`Delete user "${username}"?`)) return;
    startTransition(async () => {
      try {
        await deleteUserAction(id);
        router.refresh();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Error deleting user");
      }
    });
  }

  function ProjectSelect({ defaultValue }: { defaultValue?: string | null }) {
    return (
      <select name="projectId" className="input-field" defaultValue={defaultValue ?? ""}>
        <option value="">— All projects (no restriction) —</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>{p.projectName}</option>
        ))}
      </select>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Accounts</h2>
          <p className="mt-1 text-sm text-slate-400">{users.length} user account(s) total</p>
        </div>
        <button onClick={() => { setError(""); setShowCreate(true); }} className="button-primary">
          + New User
        </button>
      </div>

      <section className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead className="bg-white/5 text-slate-300">
              <tr>
                <th className="px-6 py-4 font-medium">Username</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Assigned Project</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400">No user accounts found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{user.username}</td>
                    <td className="px-6 py-4 text-slate-300">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${user.role === "ADMIN" ? "bg-sky-400/10 text-sky-200" : "bg-emerald-400/10 text-emerald-200"}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {user.project
                        ? <span className="text-amber-200">{user.project.projectName}</span>
                        : <span className="text-slate-500">All projects</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-3 text-xs font-medium">
                        <button onClick={() => { setError(""); setEditUser(user); }} className="text-slate-300 hover:text-white hover:underline">Edit</button>
                        <button onClick={() => handleDelete(user.id, user.username)} className="text-rose-300 hover:text-rose-200 hover:underline">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal title="Create User" open={showCreate} onClose={() => setShowCreate(false)} size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
          <div>
            <label className="label-text" htmlFor="create-username">Username</label>
            <input id="create-username" name="username" required className="input-field" autoComplete="off" />
          </div>
          <div>
            <label className="label-text" htmlFor="create-password">Password</label>
            <input id="create-password" name="password" type="password" required minLength={8} className="input-field" autoComplete="new-password" />
          </div>
          <div>
            <label className="label-text" htmlFor="create-role">Role</label>
            <select id="create-role" name="role" required className="input-field" defaultValue="OPERATOR">
              <option value="OPERATOR">Operator</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div>
            <label className="label-text">Assigned Project</label>
            <p className="mb-1 text-xs text-slate-500">Leave blank to allow access to all projects.</p>
            <ProjectSelect />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="button-secondary">Cancel</button>
            <button type="submit" disabled={isPending} className="button-primary">Create</button>
          </div>
        </form>
      </Modal>

      <Modal title="Edit User" open={!!editUser} onClose={() => setEditUser(null)} size="lg">
        {editUser && (
          <form onSubmit={handleUpdate} className="space-y-4">
            {error && <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
            <div>
              <label className="label-text" htmlFor="edit-username">Username</label>
              <input id="edit-username" name="username" defaultValue={editUser.username} required className="input-field" />
            </div>
            <div>
              <label className="label-text" htmlFor="edit-newPassword">
                New Password <span className="text-xs text-slate-500">(leave blank to keep current)</span>
              </label>
              <input id="edit-newPassword" name="newPassword" type="password" minLength={6} className="input-field" autoComplete="new-password" />
            </div>
            <div>
              <label className="label-text" htmlFor="edit-role">Role</label>
              <select id="edit-role" name="role" defaultValue={editUser.role} required className="input-field">
                <option value="OPERATOR">Operator</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="label-text">Assigned Project</label>
              <p className="mb-1 text-xs text-slate-500">Leave blank to allow access to all projects.</p>
              <ProjectSelect defaultValue={editUser.projectId} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditUser(null)} className="button-secondary">Cancel</button>
              <button type="submit" disabled={isPending} className="button-primary">Save</button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
