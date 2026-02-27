"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, UserX, UserCheck, Shield } from "lucide-react";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, search],
    queryFn: () => {
      const p = new URLSearchParams({ page: String(page), per_page: "20" });
      if (search) p.set("search", search);
      return api.get(`/admin/users?${p.toString()}`).then((r) => r.data);
    },
  });

  const toggleBlock = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      api.put(`/admin/users/${id}`, { is_active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User updated");
    },
  });

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      api.put(`/admin/users/${id}`, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Role updated");
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-gray-900">User Management</h1>

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="relative w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input pl-8 text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="px-4 py-3 font-semibold text-gray-600">Name</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Email</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Role</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Joined</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              [...Array(10)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded" /></td>
                  ))}
                </tr>
              ))
            ) : data?.items?.map((user: any) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {user.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-800">{user.full_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{user.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    onChange={(e) => changeRole.mutate({ id: user.id, role: e.target.value })}
                    className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none"
                  >
                    <option value="customer">Customer</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${user.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {user.is_active ? "Active" : "Blocked"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{formatDate(user.created_at)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleBlock.mutate({ id: user.id, is_active: !user.is_active })}
                    className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {user.is_active ? (
                      <><UserX size={12} className="text-red-500" /> Block</>
                    ) : (
                      <><UserCheck size={12} className="text-green-500" /> Unblock</>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
