"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { toast } from "react-toastify";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  listPolicyTypes,
  adminCreatePolicyType,
  adminUpdatePolicyType,
  adminTogglePolicyType,
} from "@/imports/core/api";

interface PolicyType {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
}

interface PolicyTypeFormValues {
  name: string;
  code: string;
  description?: string;
}

export default function PolicyTypesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PolicyType | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["policy-types"],
    queryFn: () => listPolicyTypes(),
  });

  const items: PolicyType[] = data?.data ?? [];

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PolicyTypeFormValues>({
    defaultValues: { name: "", code: "", description: "" },
  });

  const createMutation = useMutation({
    mutationFn: (values: PolicyTypeFormValues) => adminCreatePolicyType(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policy-types"] });
      toast.success("Policy type created successfully");
      setDialogOpen(false);
      reset();
    },
    onError: () => {
      toast.error("Failed to create policy type");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: PolicyTypeFormValues }) =>
      adminUpdatePolicyType(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policy-types"] });
      toast.success("Policy type updated successfully");
      setDialogOpen(false);
      reset();
      setEditingItem(null);
    },
    onError: () => {
      toast.error("Failed to update policy type");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      adminTogglePolicyType(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policy-types"] });
      toast.success("Policy type status updated");
      setTogglingId(null);
    },
    onError: () => {
      toast.error("Failed to update status");
      setTogglingId(null);
    },
  });

  const openCreate = () => {
    setEditingItem(null);
    reset({ name: "", code: "", description: "" });
    setDialogOpen(true);
  };

  const openEdit = (item: PolicyType) => {
    setEditingItem(item);
    reset({ name: item.name, code: item.code, description: item.description ?? "" });
    setDialogOpen(true);
  };

  const onSubmit = (values: PolicyTypeFormValues) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleToggle = (item: PolicyType) => {
    setTogglingId(item.id);
    toggleMutation.mutate({ id: item.id, is_active: !item.is_active });
  };

  const actionsBody = (row: PolicyType) => (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <Button
        label="Edit"
        size="small"
        severity="secondary"
        onClick={() => openEdit(row)}
      />
      <Button
        label={row.is_active ? "Deactivate" : "Activate"}
        size="small"
        severity={row.is_active ? "warning" : "success"}
        onClick={() => handleToggle(row)}
        loading={togglingId === row.id}
      />
    </div>
  );

  const isActiveBody = (row: PolicyType) => (
    <StatusBadge value={row.is_active} trueLabel="Active" falseLabel="Inactive" />
  );

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <PageHeader
        title="Policy Types"
        subtitle="Manage insurance policy type definitions"
        actions={
          <Button label="New Policy Type" icon="pi pi-plus" onClick={openCreate} />
        }
      />

      <DataTable
        value={items}
        loading={isLoading}
        paginator
        rows={20}
        emptyMessage="No policy types found"
        style={{ marginTop: "1.5rem" }}
      >
        <Column field="name" header="Name" sortable />
        <Column field="code" header="Code" sortable />
        <Column field="description" header="Description" />
        <Column header="Is Active" body={isActiveBody} />
        <Column header="Actions" body={actionsBody} />
      </DataTable>

      <Dialog
        header={editingItem ? "Edit Policy Type" : "New Policy Type"}
        visible={dialogOpen}
        onHide={() => {
          setDialogOpen(false);
          setEditingItem(null);
          reset();
        }}
        style={{ width: "480px" }}
        modal
      >
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label htmlFor="name" style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500 }}>
              Name <span style={{ color: "red" }}>*</span>
            </label>
            <Controller
              name="name"
              control={control}
              rules={{ required: "Name is required" }}
              render={({ field }) => (
                <InputText
                  {...field}
                  id="name"
                  placeholder="e.g. Health Insurance"
                  style={{ width: "100%" }}
                  className={errors.name ? "p-invalid" : ""}
                />
              )}
            />
            {errors.name && (
              <small style={{ color: "red" }}>{errors.name.message}</small>
            )}
          </div>

          <div>
            <label htmlFor="code" style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500 }}>
              Code <span style={{ color: "red" }}>*</span>
            </label>
            <Controller
              name="code"
              control={control}
              rules={{ required: "Code is required" }}
              render={({ field }) => (
                <InputText
                  {...field}
                  id="code"
                  placeholder="e.g. HEALTH"
                  style={{ width: "100%" }}
                  className={errors.code ? "p-invalid" : ""}
                />
              )}
            />
            {errors.code && (
              <small style={{ color: "red" }}>{errors.code.message}</small>
            )}
            <small style={{ color: "#6b7280" }}>Short uppercase code, e.g. HEALTH</small>
          </div>

          <div>
            <label htmlFor="description" style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500 }}>
              Description
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <InputText
                  {...field}
                  id="description"
                  placeholder="Optional description"
                  style={{ width: "100%" }}
                />
              )}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
            <Button
              type="button"
              label="Cancel"
              severity="secondary"
              onClick={() => {
                setDialogOpen(false);
                setEditingItem(null);
                reset();
              }}
            />
            <Button
              type="submit"
              label={editingItem ? "Save Changes" : "Create"}
              loading={isMutating}
            />
          </div>
        </form>
      </Dialog>
    </>
  );
}
