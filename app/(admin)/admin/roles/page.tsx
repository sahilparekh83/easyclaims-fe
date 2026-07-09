"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { toast } from "react-toastify";
import { Lock, ShieldCheck, Trash2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { getApiError } from "@/imports/core/errors";
import {
  adminListRoles,
  adminGetPermissionCatalog,
  adminCreateRole,
  adminUpdateRole,
  adminSetRolePermissions,
  adminDeleteRole,
} from "@/imports/core/api";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PermissionAction {
  id: string;
  action: string; // view | add | edit | delete
  label: string;
}

interface PermissionModule {
  module: string;
  module_label: string;
  actions: PermissionAction[];
}

interface Role {
  id: string;
  role_name: string;
  role_type: string;
  is_active: boolean;
  permissions: string[]; // ["partners:view", ...]
}

const ACTION_ORDER = ["view", "add", "edit", "delete"];
const ACTION_LABEL: Record<string, string> = { view: "View", add: "Add", edit: "Edit", delete: "Delete" };

// ─── Component ────────────────────────────────────────────────────────────────

export default function RolesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set()); // set of permission IDs

  const { data: rolesData, isLoading } = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: adminListRoles,
  });
  const roles: Role[] = rolesData?.data ?? [];

  const { data: catalogData } = useQuery({
    queryKey: ["admin", "permission-catalog"],
    queryFn: adminGetPermissionCatalog,
  });
  const catalog: PermissionModule[] = useMemo(() => {
    const raw: PermissionModule[] = catalogData?.data ?? [];
    return raw.map((m) => ({
      ...m,
      actions: [...m.actions].sort((a, b) => ACTION_ORDER.indexOf(a.action) - ACTION_ORDER.indexOf(b.action)),
    }));
  }, [catalogData]);

  // Map "module:action" -> permission id, and id -> "module:action", for translating
  // a role's granted key list into checked checkbox ids and back.
  const { keyToId, idToKey } = useMemo(() => {
    const keyToId = new Map<string, string>();
    const idToKey = new Map<string, string>();
    catalog.forEach((m) => m.actions.forEach((a) => {
      const key = `${m.module}:${a.action}`;
      keyToId.set(key, a.id);
      idToKey.set(a.id, key);
    }));
    return { keyToId, idToKey };
  }, [catalog]);

  const nameForm = useForm<{ role_name: string }>({ defaultValues: { role_name: "" } });

  const isSuperadminRole = editingRole?.role_name === "SUPERADMIN";

  const createMutation = useMutation({
    mutationFn: (vars: { role_name: string; permission_ids: string[] }) =>
      adminCreateRole({ role_name: vars.role_name, role_type: "ADMIN", permission_ids: vars.permission_ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      toast.success("Role created");
      closeDialog();
    },
    onError: (err: any) => toast.error(getApiError(err, "Failed to create role")),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, role_name }: { id: string; role_name: string }) => adminUpdateRole(id, { role_name }),
    onError: (err: any) => toast.error(getApiError(err, "Failed to rename role")),
  });

  const permsMutation = useMutation({
    mutationFn: ({ id, permission_ids }: { id: string; permission_ids: string[] }) =>
      adminSetRolePermissions(id, permission_ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      toast.success("Role saved");
      closeDialog();
    },
    onError: (err: any) => toast.error(getApiError(err, "Failed to save permissions")),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => adminUpdateRole(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      toast.success("Role status updated");
    },
    onError: (err: any) => toast.error(getApiError(err, "Failed to update status")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      toast.success("Role deleted");
    },
    onError: (err: any) => toast.error(getApiError(err, "Failed to delete role")),
  });

  const openCreate = () => {
    setEditingRole(null);
    nameForm.reset({ role_name: "" });
    setChecked(new Set());
    setDialogOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    nameForm.reset({ role_name: role.role_name });
    const ids = new Set<string>();
    role.permissions.forEach((key) => {
      const id = keyToId.get(key);
      if (id) ids.add(id);
    });
    setChecked(ids);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingRole(null);
    nameForm.reset();
    setChecked(new Set());
  };

  const toggleCell = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleModuleRow = (mod: PermissionModule, allOn: boolean) => {
    setChecked((prev) => {
      const next = new Set(prev);
      mod.actions.forEach((a) => (allOn ? next.delete(a.id) : next.add(a.id)));
      return next;
    });
  };

  const isSaving = createMutation.isPending || permsMutation.isPending || renameMutation.isPending;

  const onSave = async (values: { role_name: string }) => {
    if (isSuperadminRole) { closeDialog(); return; }
    const permissionIds = Array.from(checked);
    if (editingRole) {
      if (values.role_name !== editingRole.role_name) {
        await renameMutation.mutateAsync({ id: editingRole.id, role_name: values.role_name });
      }
      permsMutation.mutate({ id: editingRole.id, permission_ids: permissionIds });
    } else {
      createMutation.mutate({ role_name: values.role_name, permission_ids: permissionIds });
    }
  };

  const handleDelete = (role: Role) => {
    if (role.role_name === "SUPERADMIN") return;
    if (window.confirm(`Delete role "${role.role_name}"? Users with only this role will lose all admin access.`)) {
      deleteMutation.mutate(role.id);
    }
  };

  return (
    <>
      <PageHeader
        title="Roles & Permissions"
        subtitle="Create roles and tick which screens each one can view, add, edit, or delete — no code needed."
        actions={<Button label="New Role" icon="pi pi-plus" onClick={openCreate} />}
      />

      {isLoading ? (
        <div style={{ color: "#9ca3af", fontSize: 14 }}>Loading roles…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {roles.map((role) => (
            <div
              key={role.id}
              style={{
                background: "#fff", border: "1px solid #e8eaf0", borderRadius: 12,
                padding: "14px 18px", display: "flex", alignItems: "center", gap: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 220 }}>
                {role.role_name === "SUPERADMIN" ? <Lock size={15} color="#9ca3af" /> : <ShieldCheck size={15} color="#2563eb" />}
                <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{role.role_name}</span>
              </div>
              <StatusBadge value={role.is_active} />
              <div style={{ flex: 1, fontSize: 12.5, color: "#6b7280" }}>
                {role.role_name === "SUPERADMIN"
                  ? "Full access to everything — cannot be changed"
                  : `${role.permissions.length} permission${role.permissions.length === 1 ? "" : "s"} granted`}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Button label="Edit access" size="small" severity="secondary" onClick={() => openEdit(role)} disabled={role.role_name === "SUPERADMIN"} />
                {role.role_name !== "SUPERADMIN" && (
                  <>
                    <Button
                      label={role.is_active ? "Deactivate" : "Activate"}
                      size="small"
                      severity={role.is_active ? "warning" : "success"}
                      onClick={() => toggleActiveMutation.mutate({ id: role.id, is_active: !role.is_active })}
                    />
                    <button
                      onClick={() => handleDelete(role)}
                      title="Delete role"
                      style={{
                        background: "none", border: "1px solid #fecaca", borderRadius: 8,
                        padding: "0 10px", cursor: "pointer", color: "#dc2626",
                        display: "inline-flex", alignItems: "center",
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        header={editingRole ? `Edit access — ${editingRole.role_name}` : "New Role"}
        visible={dialogOpen}
        onHide={closeDialog}
        style={{ width: "760px", maxWidth: "95vw" }}
        modal
      >
        <form onSubmit={nameForm.handleSubmit(onSave)} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
              Role name <span style={{ color: "red" }}>*</span>
            </label>
            <Controller
              name="role_name"
              control={nameForm.control}
              rules={{ required: "Role name is required" }}
              render={({ field }) => (
                <InputText {...field} placeholder="e.g. Finance Officer" style={{ width: "100%" }} disabled={isSuperadminRole} />
              )}
            />
          </div>

          <div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>What can this role do?</div>
            <div style={{ border: "1px solid #e8eaf0", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr repeat(4, 0.8fr)", background: "#f8f9fb", borderBottom: "1px solid #e8eaf0" }}>
                <div style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Screen</div>
                {ACTION_ORDER.map((a) => (
                  <div key={a} style={{ padding: "8px 6px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", textAlign: "center" }}>
                    {ACTION_LABEL[a]}
                  </div>
                ))}
              </div>
              <div style={{ maxHeight: 380, overflowY: "auto" }}>
                {catalog.map((mod) => {
                  const allOn = mod.actions.every((a) => checked.has(a.id));
                  return (
                    <div key={mod.module} style={{ display: "grid", gridTemplateColumns: "1.4fr repeat(4, 0.8fr)", borderBottom: "1px solid #f1f2f6", alignItems: "center" }}>
                      <div
                        style={{ padding: "9px 12px", fontSize: 13, fontWeight: 600, color: "#111827", cursor: isSuperadminRole ? "default" : "pointer" }}
                        onClick={() => !isSuperadminRole && toggleModuleRow(mod, allOn)}
                        title="Click to toggle all actions for this screen"
                      >
                        {mod.module_label}
                      </div>
                      {ACTION_ORDER.map((actionKey) => {
                        const action = mod.actions.find((a) => a.action === actionKey);
                        if (!action) return <div key={actionKey} />;
                        return (
                          <div key={actionKey} style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={isSuperadminRole || checked.has(action.id)}
                              onChange={() => toggleCell(action.id)}
                              disabled={isSuperadminRole}
                              style={{ width: 16, height: 16, cursor: isSuperadminRole ? "default" : "pointer" }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <Button type="button" label="Cancel" severity="secondary" onClick={closeDialog} />
            <Button type="submit" label={editingRole ? "Save Changes" : "Create Role"} loading={isSaving} disabled={isSuperadminRole} />
          </div>
        </form>
      </Dialog>
    </>
  );
}
