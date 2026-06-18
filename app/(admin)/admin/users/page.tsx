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
import {
  adminListUsers,
  adminCreateUser,
  adminUpdateUser,
  adminDeleteUser,
} from "@/imports/core/api";

interface User {
  id: string;
  name: string;
  email: string;
  user_type: string;
  is_active: boolean;
  created_at: string;
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

const USER_TYPE_OPTIONS = [
  { label: "Super Admin", value: "SUPERADMIN" },
  { label: "Partner", value: "PARTNER" },
  { label: "Member", value: "MEMBER" },
];

type DialogMode = "create" | "edit" | null;

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => adminListUsers(0, 100),
  });

  // Handle both paginated { data: { data: [...] } } and array { data: [...] } responses
  const rawData = data?.data;
  const items: User[] = Array.isArray(rawData)
    ? rawData
    : rawData?.data ?? [];

  const createForm = useForm<CreateUserFormValues>({
    defaultValues: { name: "", email: "", user_type: "MEMBER", password: "" },
  });

  const editForm = useForm<EditUserFormValues>({
    defaultValues: { name: "", email: "", is_active: true },
  });

  const createMutation = useMutation({
    mutationFn: (values: CreateUserFormValues) => adminCreateUser(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User created successfully");
      setDialogMode(null);
      createForm.reset();
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
    createForm.reset({ name: "", email: "", user_type: "MEMBER", password: "" });
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
  };

  const onCreateSubmit = (values: CreateUserFormValues) => {
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

  const actionsBody = (row: User) => (
    <div style={{ display: "flex", gap: "0.5rem" }}>
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

      <DataTable
        value={items}
        loading={isLoading}
        paginator
        rows={20}
        emptyMessage="No users found"
        style={{ marginTop: "1.5rem" }}
      >
        <Column field="name" header="Name" sortable />
        <Column field="email" header="Email" sortable />
        <Column field="user_type" header="User Type" sortable />
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
            <label htmlFor="c-user-type" style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500 }}>
              User Type <span style={{ color: "red" }}>*</span>
            </label>
            <Controller
              name="user_type"
              control={createForm.control}
              rules={{ required: "User type is required" }}
              render={({ field }) => (
                <Dropdown
                  {...field}
                  inputId="c-user-type"
                  options={USER_TYPE_OPTIONS}
                  placeholder="Select user type"
                  style={{ width: "100%" }}
                  className={createErrors.user_type ? "p-invalid" : ""}
                />
              )}
            />
            {createErrors.user_type && (
              <small style={{ color: "red" }}>{createErrors.user_type.message}</small>
            )}
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
    </>
  );
}
