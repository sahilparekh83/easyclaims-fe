"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputSwitch } from "primereact/inputswitch";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { getApiError } from "@/imports/core/errors";
import {
  adminListUsers,
  adminCreateUser,
  adminUpdateUser,
  adminDeleteUser,
  adminListRoles,
  adminAssignUserRole,
  adminRemoveUserRole,
} from "@/imports/core/api";

interface User {
  id: string;
  name: string;
  email: string;
  user_type: string;
  is_active: boolean;
  created_at: string;
  roles?: string[];
}

interface RoleOption {
  id: string;
  role_name: string;
  is_active: boolean;
}

interface CreateUserFormValues {
  name: string;
  email: string;
  user_type: string;
  password: string;
}

interface EditUserFormValues {
  name: string;
  email: string;
  is_active: boolean;
}

type DialogMode = "create" | "edit" | null;

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [rolesDialogUser, setRolesDialogUser] = useState<User | null>(null);
  const [selectedRoleName, setSelectedRoleName] = useState<string | null>(null);
  const [createRoleName, setCreateRoleName] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => adminListUsers(0, 100),
  });

  // Handle both paginated { data: { data: [...] } } and array { data: [...] } responses
  const rawData = data?.data;
  const allItems: User[] = Array.isArray(rawData)
    ? rawData
    : rawData?.data ?? [];

  // This page is "Internal Users" — partner/member accounts are managed on their own pages.
  const items = allItems.filter((u) => u.user_type === "SUPERADMIN" || u.user_type === "ADMIN");

  const { data: rolesData } = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: adminListRoles,
  });
  // Full list (including inactive) so a currently-assigned-but-now-inactive role can still be
  // looked up for removal; the dropdown options below are active-only, per role_name.
  const availableRoles: RoleOption[] = rolesData?.data ?? [];
  const roleOptions = availableRoles
    .filter((r) => r.is_active)
    .map((r) => ({ label: r.role_name, value: r.role_name }));

  const setRolesMutation = useMutation({
    mutationFn: async ({ user, nextRoleName }: { user: User; nextRoleName: string | null }) => {
      // One role per user: remove every currently-assigned role, then assign
      // the single selected one (if any).
      const current = availableRoles.filter((r) => (user.roles ?? []).includes(r.role_name));
      for (const r of current) {
        if (r.role_name !== nextRoleName) await adminRemoveUserRole(user.id, r.id);
      }
      const next = nextRoleName ? availableRoles.find((r) => r.role_name === nextRoleName) : null;
      if (next && !current.some((r) => r.role_name === nextRoleName)) {
        await adminAssignUserRole(user.id, next.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Role updated");
      setRolesDialogUser(null);
    },
    onError: (err: any) => toast.error(getApiError(err, "Failed to update role")),
  });

  const openRolesDialog = (user: User) => {
    setRolesDialogUser(user);
    setSelectedRoleName((user.roles ?? [])[0] ?? null);
  };

  const createForm = useForm<CreateUserFormValues>({
    defaultValues: { name: "", email: "", user_type: "MEMBER", password: "" },
  });

  const editForm = useForm<EditUserFormValues>({
    defaultValues: { name: "", email: "", is_active: true },
  });

  const createMutation = useMutation({
    mutationFn: async (values: CreateUserFormValues) => {
      const res: any = await adminCreateUser(values);
      const newUser = res?.data;
      // Backend always auto-assigns a default role matching user_type (e.g. a role
      // literally named "ADMIN"). If a different role was picked in the dialog,
      // swap it in — remove the auto-assigned default, assign the picked one —
      // so the user ends up with exactly the one role that was selected.
      if (newUser?.id && createRoleName) {
        const currentRoles: string[] = newUser.roles ?? [];
        if (!currentRoles.includes(createRoleName)) {
          for (const roleName of currentRoles) {
            const r = availableRoles.find((r) => r.role_name === roleName);
            if (r) { try { await adminRemoveUserRole(newUser.id, r.id); } catch { /* ignore */ } }
          }
          const picked = availableRoles.find((r) => r.role_name === createRoleName);
          if (picked) { try { await adminAssignUserRole(newUser.id, picked.id); } catch { /* ignore */ } }
        }
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User created successfully");
      setDialogMode(null);
      createForm.reset();
      setCreateRoleName(null);
    },
    onError: () => {
      toast.error("Failed to create user");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: EditUserFormValues }) =>
      adminUpdateUser(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User updated successfully");
      setDialogMode(null);
      setEditingUser(null);
      editForm.reset();
    },
    onError: () => {
      toast.error("Failed to update user");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete user");
    },
  });

  const openCreate = () => {
    // This page only manages internal (admin) users — user_type is always ADMIN
    // here; the actual access level is set via the role picked below instead.
    createForm.reset({ name: "", email: "", user_type: "ADMIN", password: "" });
    setCreateRoleName(null);
    setDialogMode("create");
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    editForm.reset({ name: user.name, email: user.email, is_active: user.is_active });
    setDialogMode("edit");
  };

  const handleDelete = (user: User) => {
    if (window.confirm(`Delete user "${user.name}"? This cannot be undone.`)) {
      deleteMutation.mutate(user.id);
    }
  };

  const closeDialog = () => {
    setDialogMode(null);
    setEditingUser(null);
    createForm.reset();
    editForm.reset();
    setCreateRoleName(null);
  };

  const onCreateSubmit = (values: CreateUserFormValues) => {
    if (!createRoleName) {
      toast.error("Please select a role");
      return;
    }
    createMutation.mutate(values);
  };

  const onEditSubmit = (values: EditUserFormValues) => {
    if (!editingUser) return;
    updateMutation.mutate({ id: editingUser.id, values });
  };

  const isActiveBody = (row: User) => (
    <StatusBadge value={row.is_active} trueLabel="Active" falseLabel="Inactive" />
  );

  const createdAtBody = (row: User) =>
    dayjs(row.created_at).format("DD MMM YYYY");

  const rolesBody = (row: User) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {(row.roles ?? []).length === 0 && <span style={{ color: "#9ca3af", fontSize: 12.5 }}>No roles</span>}
      {(row.roles ?? []).map((r) => (
        <span
          key={r}
          style={{
            background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe",
            borderRadius: 999, padding: "2px 9px", fontSize: 11.5, fontWeight: 600,
          }}
        >
          {r}
        </span>
      ))}
    </div>
  );

  const actionsBody = (row: User) => (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <Button
        label="Roles"
        size="small"
        severity="info"
        onClick={() => openRolesDialog(row)}
      />
      <Button
        label="Edit"
        size="small"
        severity="secondary"
        onClick={() => openEdit(row)}
      />
      <Button
        label="Delete"
        size="small"
        severity="danger"
        onClick={() => handleDelete(row)}
        loading={deleteMutation.isPending}
      />
    </div>
  );

  const createErrors = createForm.formState.errors;
  const editErrors = editForm.formState.errors;

  return (
    <>
      <PageHeader
        title="Internal Users"
        subtitle="Manage admin and internal user accounts"
        actions={
          <Button label="New User" icon="pi pi-plus" onClick={openCreate} />
        }
      />

      <span className="p-input-icon-left" style={{ position: "relative", display: "inline-block", marginTop: "1.5rem" }}>
        <i className="pi pi-search" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 13 }} />
        <InputText
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search by name, email, or user type…"
          style={{ paddingLeft: 30, height: 34, fontSize: 13, width: 280, borderRadius: 7 }}
        />
      </span>

      <DataTable
        value={items}
        loading={isLoading}
        paginator
        rows={20}
        emptyMessage="No users found"
        globalFilter={globalFilter}
        globalFilterFields={["name", "email", "user_type"]}
        style={{ marginTop: "0.75rem" }}
      >
        <Column field="name" header="Name" sortable />
        <Column field="email" header="Email" sortable />
        <Column field="user_type" header="User Type" sortable />
        <Column header="Roles" body={rolesBody} />
        <Column header="Is Active" body={isActiveBody} />
        <Column header="Created At" body={createdAtBody} sortable sortField="created_at" />
        <Column header="Actions" body={actionsBody} />
      </DataTable>

      {/* Create User Dialog */}
      <Dialog
        header="New User"
        visible={dialogMode === "create"}
        onHide={closeDialog}
        style={{ width: "480px" }}
        modal
      >
        <form
          onSubmit={createForm.handleSubmit(onCreateSubmit)}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <div>
            <label htmlFor="c-name" style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500 }}>
              Name <span style={{ color: "red" }}>*</span>
            </label>
            <Controller
              name="name"
              control={createForm.control}
              rules={{ required: "Name is required" }}
              render={({ field }) => (
                <InputText
                  {...field}
                  id="c-name"
                  placeholder="Full name"
                  style={{ width: "100%" }}
                  className={createErrors.name ? "p-invalid" : ""}
                />
              )}
            />
            {createErrors.name && (
              <small style={{ color: "red" }}>{createErrors.name.message}</small>
            )}
          </div>

          <div>
            <label htmlFor="c-email" style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500 }}>
              Email <span style={{ color: "red" }}>*</span>
            </label>
            <Controller
              name="email"
              control={createForm.control}
              rules={{ required: "Email is required", pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email" } }}
              render={({ field }) => (
                <InputText
                  {...field}
                  id="c-email"
                  type="email"
                  placeholder="user@example.com"
                  style={{ width: "100%" }}
                  className={createErrors.email ? "p-invalid" : ""}
                />
              )}
            />
            {createErrors.email && (
              <small style={{ color: "red" }}>{createErrors.email.message}</small>
            )}
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500 }}>
              Role <span style={{ color: "red" }}>*</span>
            </label>
            <Dropdown
              value={createRoleName}
              onChange={(e) => setCreateRoleName(e.value)}
              options={roleOptions}
              placeholder="Select a role"
              filter
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label htmlFor="c-password" style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500 }}>
              Password <span style={{ color: "red" }}>*</span>
            </label>
            <Controller
              name="password"
              control={createForm.control}
              rules={{ required: "Password is required" }}
              render={({ field }) => (
                <InputText
                  {...field}
                  id="c-password"
                  type="password"
                  placeholder="Password"
                  style={{ width: "100%" }}
                  className={createErrors.password ? "p-invalid" : ""}
                />
              )}
            />
            {createErrors.password && (
              <small style={{ color: "red" }}>{createErrors.password.message}</small>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
            <Button type="button" label="Cancel" severity="secondary" onClick={closeDialog} />
            <Button type="submit" label="Create User" loading={createMutation.isPending} />
          </div>
        </form>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        header="Edit User"
        visible={dialogMode === "edit"}
        onHide={closeDialog}
        style={{ width: "480px" }}
        modal
      >
        <form
          onSubmit={editForm.handleSubmit(onEditSubmit)}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <div>
            <label htmlFor="e-name" style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500 }}>
              Name
            </label>
            <Controller
              name="name"
              control={editForm.control}
              render={({ field }) => (
                <InputText
                  {...field}
                  id="e-name"
                  placeholder="Full name"
                  style={{ width: "100%" }}
                  className={editErrors.name ? "p-invalid" : ""}
                />
              )}
            />
          </div>

          <div>
            <label htmlFor="e-email" style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500 }}>
              Email
            </label>
            <Controller
              name="email"
              control={editForm.control}
              rules={{ pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email" } }}
              render={({ field }) => (
                <InputText
                  {...field}
                  id="e-email"
                  type="email"
                  placeholder="user@example.com"
                  style={{ width: "100%" }}
                  className={editErrors.email ? "p-invalid" : ""}
                />
              )}
            />
            {editErrors.email && (
              <small style={{ color: "red" }}>{editErrors.email.message}</small>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <label htmlFor="e-is-active" style={{ fontWeight: 500 }}>
              Active
            </label>
            <Controller
              name="is_active"
              control={editForm.control}
              render={({ field }) => (
                <InputSwitch
                  inputId="e-is-active"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.value)}
                />
              )}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
            <Button type="button" label="Cancel" severity="secondary" onClick={closeDialog} />
            <Button type="submit" label="Save Changes" loading={updateMutation.isPending} />
          </div>
        </form>
      </Dialog>

      {/* Manage Roles Dialog */}
      <Dialog
        header={rolesDialogUser ? `Roles — ${rolesDialogUser.name}` : "Roles"}
        visible={!!rolesDialogUser}
        onHide={() => setRolesDialogUser(null)}
        style={{ width: "480px" }}
        modal
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ fontSize: 12.5, color: "#6b7280" }}>
            What this user can access is controlled by their role. Manage what each role can do
            on the <strong>Roles &amp; Permissions</strong> page.
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500 }}>Assigned role</label>
            <Dropdown
              value={selectedRoleName}
              onChange={(e) => setSelectedRoleName(e.value)}
              options={roleOptions}
              placeholder="Select a role"
              filter
              showClear
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
            <Button type="button" label="Cancel" severity="secondary" onClick={() => setRolesDialogUser(null)} />
            <Button
              type="button"
              label="Save"
              loading={setRolesMutation.isPending}
              onClick={() => rolesDialogUser && setRolesMutation.mutate({ user: rolesDialogUser, nextRoleName: selectedRoleName })}
            />
          </div>
        </div>
      </Dialog>
    </>
  );
}
