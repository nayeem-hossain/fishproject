"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createUser, updateUser, deleteUser } from "@/actions/userActions";

interface User {
  id: string;
  username: string;
  role: "ADMIN" | "OPERATOR";
  createdAt: Date;
}

export function UsersClient({ users }: { users: User[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createUser(fd);
        setShowCreate(false);
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error");
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
        await updateUser(editUser.id, fd);
        setEditUser(null);
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error");
      }
    });
  }

  async function handleDelete(id: string, username: string) {
    if (!confirm(`Delete user "${username}"?`)) return;
    startTransition(async () => {
      try {
        await deleteUser(id);
        router.refresh();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Error");
      }
    });
  }

  return (
    <>
      <div className="mb-4">
        <button onClick={() => { setError(""); setShowCreate(true); }} className="btn-primary">
          + New User
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">Username</th>
              <th className="table-th">Role</th>
              <th className="table-th">Created</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="table-td font-medium">{u.username}</td>
                <td className="table-td">
                  <span className={u.role === "ADMIN" ? "badge-admin" : "badge-operator"}>
                    {u.role}
                  </span>
                </td>
                <td className="table-td text-gray-400 text-xs">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="table-td">
                  <div className="flex gap-2">
                    <button onClick={() => { setError(""); setEditUser(u); }} className="text-xs text-gray-500 hover:underline">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(u.id, u.username)} className="text-xs text-red-500 hover:underline">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create */}
      <Modal title="Create User" open={showCreate} onClose={() => setShowCreate(false)}>
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
          <div>
            <label className="label">Username</label>
            <input name="username" required className="input" autoComplete="off" />
          </div>
          <div>
            <label className="label">Password</label>
            <input name="password" type="password" required minLength={6} className="input" autoComplete="new-password" />
          </div>
          <div>
            <label className="label">Role</label>
            <select name="role" required className="input">
              <option value="OPERATOR">Operator</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isPending} className="btn-primary">Create</button>
          </div>
        </form>
      </Modal>

      {/* Edit */}
      <Modal title="Edit User" open={!!editUser} onClose={() => setEditUser(null)}>
        {editUser && (
          <form onSubmit={handleUpdate} className="space-y-4">
            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
            <div>
              <label className="label">Username</label>
              <input name="username" defaultValue={editUser.username} required className="input" />
            </div>
            <div>
              <label className="label">New Password <span className="text-gray-400 text-xs">(leave blank to keep current)</span></label>
              <input name="newPassword" type="password" minLength={6} className="input" autoComplete="new-password" />
            </div>
            <div>
              <label className="label">Role</label>
              <select name="role" defaultValue={editUser.role} required className="input">
                <option value="OPERATOR">Operator</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setEditUser(null)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={isPending} className="btn-primary">Save</button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
