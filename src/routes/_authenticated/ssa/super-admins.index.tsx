import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Eye, Pencil, Plus } from "lucide-react";
import { SsaShell } from "@/components/ssa/SsaShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SSA_META } from "@/lib/ssa";
import { fetchSaTenantRows } from "@/lib/ssa-queries";
import { formatDay } from "@/lib/superadmin";

export const Route = createFileRoute("/_authenticated/ssa/super-admins/")({
  head: () =>
    SSA_META("Super admins", "Create and manage super admin tenants on Marriage Database."),
  component: SuperAdminsPage,
});

function SuperAdminsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");

  const { data, isLoading } = useQuery({
    queryKey: ["ssa", "super-admins"],
    queryFn: fetchSaTenantRows,
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? []).filter((row) => {
      if (status === "active" && !row.is_active) return false;
      if (status === "inactive" && row.is_active) return false;
      if (!term) return true;
      return [row.circle_name, row.email ?? "", row.first_name ?? "", row.last_name ?? "", row.phone ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [data, search, status]);

  return (
    <SsaShell
      title="Super admins"
      description="Each super admin owns a circle of mosques and members."
      actions={
        <Button asChild>
          <Link to="/ssa/super-admins/new">
            <Plus aria-hidden="true" />
            New super admin
          </Link>
        </Button>
      }
    >
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[220px] max-w-md flex-1">
          <Label htmlFor="sa-search">Search</Label>
          <Input
            id="sa-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Circle, name, email or phone"
            className="mt-1"
          />
        </div>
        <div className="w-44">
          <Label htmlFor="sa-status">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger id="sa-status" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="surface-card mt-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Super admin list</caption>
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">
                Circle
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Super admin
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Contact
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Status
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Counts
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Created
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-4">
                  <Skeleton className="h-6 w-full" />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-muted-foreground">
                  No super admins match your filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{row.circle_name}</td>
                  <td className="px-4 py-3 text-foreground">
                    {[row.first_name, row.last_name].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div>{row.email ?? "—"}</div>
                    {row.phone ? <div className="text-xs">{row.phone}</div> : null}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={row.is_active ? "success" : "secondary"}>
                      {row.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.mosque_count} mosques · {row.member_count} members
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDay(row.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" asChild title="View">
                        <Link
                          to="/ssa/super-admins/$saId"
                          params={{ saId: row.super_admin_id }}
                          aria-label="View super admin"
                        >
                          <Eye className="size-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon-sm" asChild title="Edit">
                        <Link
                          to="/ssa/super-admins/$saId"
                          params={{ saId: row.super_admin_id }}
                          aria-label="Edit super admin"
                        >
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </SsaShell>
  );
}
