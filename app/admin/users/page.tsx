"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Search, UserX, UserCheck,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown,
} from "lucide-react";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useDebounce } from "@/lib/hooks";
import toast from "react-hot-toast";

type SortDir = "asc" | "desc";
interface SortState { field: string; dir: SortDir; }

const ROLES = [
  { value: "customer",    label: "Customer",    color: "bg-gray-100 text-gray-700" },
  { value: "staff",       label: "Staff",       color: "bg-blue-100 text-blue-700" },
  { value: "admin",       label: "Admin",       color: "bg-purple-100 text-purple-700" },
  { value: "super_admin", label: "Super Admin", color: "bg-red-100 text-red-700" },
];

function SortHeader({
  label, field, sort, onSort, className = "",
}: {
  label: string; field: string; sort: SortState;
  onSort: (f: string) => void; className?: string;
}) {
  const active = sort.field === field;
  return (
    <th
      className={`px-4 py-3 font-semibold text-gray-600 cursor-pointer select-none group text-left ${className}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1.5">
        <span className={active ? "text-brand-600" : ""}>{label}</span>
        <span className="text-gray-300 group-hover:text-gray-500 transition-colors">
          {active
            ? sort.dir === "asc"
              ? <ChevronUp size={13} className="text-brand-600" />
              : <ChevronDown size={13} className="text-brand-600" />
            : <ChevronsUpDown size={13} />
          }
        </span>
      </div>
    </th>
  );
}

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [searchInput,   setSearchInput]   = useState("");
  const [roleFilter,    setRoleFilter]    = useState("");
  const [statusFilter,  setStatusFilter]  = useState("");
  const [page,          setPage]          = useState(1);
  const [sort,          setSort]          = useState<SortState>({ field: "created_at", dir: "desc" });

  // Debounce search — API fires only 400 ms after typing stops
  const search = useDebounce(searchInput, 400);

  const handleSort = (field: string) => {
    setSort(prev =>
      prev.field === field
        ? { field, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { field, dir: "asc" }
    );
    setPage(1);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, search, roleFilter, statusFilter, sort],
    queryFn: () => {
      const p = new URLSearchParams({ page: String(page), per_page: "20" });
      if (search)       p.set("search",    search);
      if (roleFilter)   p.set("role",      roleFilter);
      if (statusFilter) p.set("is_active", statusFilter);
      if (sort.field)   p.set("sort",      `${sort.field}_${sort.dir}`);
      return api.get(`/admin/users?${p.toString()}`).then(r => r.data);
    },
  });

  const updateUser = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, any> }) =>
      api.put(`/admin/users/${id}`, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-user", id] });
      toast.success("User updated");
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Update failed"),
  });

  const getRoleStyle = (role: string) =>
    ROLES.find(r => r.value === role)?.color ?? "bg-gray-100 text-gray-700";

  const shProps = { sort, onSort: handleSort };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">User Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">{data?.total ?? "–"} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap items-center gap-3">
        {/* Search — debounced */}
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name or email…"
            value={searchInput}
            onChange={e => { setSearchInput(e.target.value); setPage(1); }}
            className="input pl-8 text-sm w-full"
          />
        </div>
        {searchInput && searchInput !== search && (
          <span className="text-xs text-brand-500">searching…</span>
        )}

        {/* Role filter */}
        <select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Blocked</option>
        </select>

        {/* Clear filters */}
        {(searchInput || roleFilter || statusFilter) && (
          <button
            onClick={() => { setSearchInput(""); setRoleFilter(""); setStatusFilter(""); setPage(1); }}
            className="text-xs text-gray-500 hover:text-red-500 transition-colors underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left bg-gray-50">
              <SortHeader label="Name"    field="full_name"   {...shProps} />
              <SortHeader label="Email"   field="email"       {...shProps} />
              <SortHeader label="Role"    field="role"        {...shProps} />
              <SortHeader label="Status"  field="is_active"   {...shProps} />
              <SortHeader label="Joined"  field="created_at"  {...shProps} />
              <th className="px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading
              ? [...Array(10)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-full" /></td>
                  ))}
                </tr>
              ))
              : data?.items?.map((user: any) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">

                  {/* Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-black shrink-0">
                        {user.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-gray-800">{user.full_name}</span>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3 text-gray-500">{user.email}</td>

                  {/* Role */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wide ${getRoleStyle(user.role)}`}>
                        {ROLES.find(r => r.value === user.role)?.label ?? user.role}
                      </span>
                      <select
                        value={user.role}
                        onChange={e => updateUser.mutate({ id: user.id, payload: { role: e.target.value } })}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-400 bg-white cursor-pointer"
                        title="Change role"
                      >
                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`badge ${user.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {user.is_active ? "Active" : "Blocked"}
                    </span>
                  </td>

                  {/* Joined */}
                  <td className="px-4 py-3 text-gray-400">{formatDate(user.created_at)}</td>

                  {/* Block / Unblock */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => updateUser.mutate({ id: user.id, payload: { is_active: !user.is_active } })}
                      disabled={updateUser.isLoading}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                        user.is_active
                          ? "border-red-200 text-red-600 hover:bg-red-50"
                          : "border-green-200 text-green-600 hover:bg-green-50"
                      }`}
                    >
                      {user.is_active
                        ? <><UserX size={12} /> Block</>
                        : <><UserCheck size={12} /> Unblock</>
                      }
                    </button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Page {data.page} of {data.total_pages} · {data.total} users
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft size={13} /> Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(data.total_pages, p + 1))}
                disabled={page === data.total_pages}
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
