"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAllRedirects,
  createRedirect,
  deleteRedirect,
  Redirect,
} from "@/services/redirect.service";
import { useAdminToast } from "@/components/ui/admin-toast";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export default function RedirectsAdmin() {
  const queryClient = useQueryClient();
  const { notify } = useAdminToast();

  const { data: redirects = [], isLoading } = useQuery<Redirect[]>({
    queryKey: ["redirects"],
    queryFn: getAllRedirects,
  });

  const [showForm, setShowForm] = useState(false);
  const [fromPath, setFromPath] = useState("");
  const [toPath, setToPath] = useState("");
  const [statusCode, setStatusCode] = useState<301 | 302>(301);
  const [note, setNote] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      createRedirect({
        fromPath,
        toPath,
        statusCode,
        isActive: true,
        note,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["redirects"] });
      notify({ title: "Success", message: "Redirect created", variant: "success" });
      setShowForm(false);
      setFromPath("");
      setToPath("");
      setNote("");
    },
    onError: (err: any) => {
      notify({
        title: "Error",
        message: err?.response?.data?.message || "Failed to create redirect",
        variant: "error",
      }
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRedirect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["redirects"] });
      notify({ title: "Success", message: "Redirect deleted", variant: "success" });
    },
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-brand-black-950">
          Redirect Manager
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-md bg-brand-black-950 px-4 py-2 text-sm font-medium text-white hover:bg-brand-black-900"
        >
          <Plus className="h-4 w-4" /> Add Redirect
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-slate-200 p-5 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                From Path *
              </label>
              <input
                type="text"
                value={fromPath}
                onChange={(e) => setFromPath(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="/old-page"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                To Path *
              </label>
              <input
                type="text"
                value={toPath}
                onChange={(e) => setToPath(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="/new-page"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Status Code
              </label>
              <select
                value={statusCode}
                onChange={(e) => setStatusCode(Number(e.target.value) as 301 | 302)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              >
                <option value={301}>301 (Permanent)</option>
                <option value={302}>302 (Temporary)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Note
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="Optional note"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => createMutation.mutate()}
              disabled={
                createMutation.isPending || !fromPath.trim() || !toPath.trim()
              }
              className="rounded-md bg-brand-black-950 px-4 py-2 text-sm font-medium text-white hover:bg-brand-black-900 disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : redirects.length === 0 ? (
        <p className="text-sm text-slate-500">No redirects configured.</p>
      ) : (
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  From
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  To
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Code
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Note
                </th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {redirects.map((r) => (
                <tr key={r._id}>
                  <td className="px-4 py-3 font-mono text-xs">{r.fromPath}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.toPath}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.statusCode === 301
                          ? "bg-blue-50 text-blue-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {r.statusCode}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {r.note || "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteMutation.mutate(r._id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
