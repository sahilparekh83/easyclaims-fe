"use client";
import React, { useState } from "react";
import styled from "styled-components";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { memberListNominees, memberCreateNominee, memberUpdateNominee, memberDeleteNominee } from "@/imports/core/api";
import { getApiError } from "@/imports/core/errors";
import { Pencil, Trash2, Users } from "lucide-react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { toast } from "react-toastify";

// ─── Styled ───────────────────────────────────────────────────────────────────

const PageWrap = styled.div`max-width: 900px; display: flex; flex-direction: column; gap: 20px;`;

const PageHeader = styled.div`display: flex; align-items: center; justify-content: space-between;`;

const PageTitle = styled.h1`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 19px; font-weight: 800; color: #161d26; margin: 0;
`;

const AccentBtn = styled.button`
  display: inline-flex; align-items: center; gap: 7px;
  background: #0050b0; color: #fff; border: none; border-radius: 9px;
  padding: 9px 16px; font-size: 13px; font-weight: 600; cursor: pointer;
  font-family: 'Plus Jakarta Sans', sans-serif;
  &:hover { background: #0046a0; }
`;

const NomineeCard = styled.div`
  background: #fff; border: 1px solid #e0e6ec; border-radius: 14px;
  box-shadow: 0 1px 2px rgba(10,42,87,0.06), 0 2px 6px rgba(10,42,87,0.06);
  padding: 18px 20px; display: flex; align-items: center; gap: 16px;
`;

const Avatar = styled.div`
  width: 44px; height: 44px; border-radius: 50%; flex: none;
  background: #fef3c7; color: #92400e;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 700; font-family: 'Plus Jakarta Sans', sans-serif;
`;

const NomineeName = styled.div`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 15px; font-weight: 700; color: #161d26;
`;

const RelationBadge = styled.span`
  font-size: 11.5px; font-weight: 600; padding: 2px 9px; border-radius: 999px;
  background: #f1f5f9; color: #374151;
`;

const SharePill = styled.span`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 12px; font-weight: 600; padding: 3px 11px; border-radius: 999px;
  background: #eff6ff; color: #1d4ed8;
`;

const ShareValue = styled.div`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 18px; font-weight: 700; color: #0050b0;
`;

const ActionBtn = styled.button<{ $danger?: boolean }>`
  background: none; border: 1px solid #e0e6ec; border-radius: 8px;
  padding: 6px 9px; cursor: pointer; display: inline-flex; align-items: center;
  color: ${p => p.$danger ? "#dc2626" : "#6b7a8c"};
  &:hover { background: ${p => p.$danger ? "#fee2e2" : "#f1f5f9"}; border-color: ${p => p.$danger ? "#fca5a5" : "#cbd5e1"}; }
`;

const ShareSummary = styled.div<{ $ok: boolean }>`
  border-radius: 10px; padding: 12px 18px;
  background: ${p => p.$ok ? "#f0fdf4" : "#fffbeb"};
  border: 1px solid ${p => p.$ok ? "#86efac" : "#fcd34d"};
  color: ${p => p.$ok ? "#166534" : "#92400e"};
  font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px;
`;

const EmptyState = styled.div`
  background: #fff; border: 1px solid #e0e6ec; border-radius: 14px;
  padding: 48px 20px; text-align: center;
`;

const FieldWrapper = styled.div`
  display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 1rem;
  label { font-size: 0.875rem; font-weight: 500; color: #3a4756; }
  .p-inputtext, .p-inputnumber-input { width: 100%; }
  .error-msg { font-size: 0.8rem; color: #dc2626; }
`;
const DialogFooter = styled.div`display: flex; justify-content: flex-end; gap: 0.5rem;`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Nominee { id: string; name: string; relation: string; share_percent: number; }
interface FormValues { name: string; relation: string; share_percent: number | null; }

const RELATION_OPTIONS = [
  { label: "Spouse", value: "Spouse" }, { label: "Child", value: "Child" },
  { label: "Parent", value: "Parent" }, { label: "Sibling", value: "Sibling" },
  { label: "In-Law", value: "In-Law" }, { label: "Other", value: "Other" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MemberNomineesPage() {
  const queryClient = useQueryClient();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingNominee, setEditingNominee] = useState<Nominee | null>(null);

  const { data: nomineesData, isLoading } = useQuery({ queryKey: ["member", "nominees"], queryFn: memberListNominees });
  const nominees: Nominee[] = nomineesData?.data ?? [];
  const totalShare = nominees.reduce((sum, n) => sum + Number(n.share_percent), 0);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { name: "", relation: "", share_percent: null },
  });

  const openAddDialog = () => { setEditingNominee(null); reset({ name: "", relation: "", share_percent: null }); setDialogVisible(true); };
  const openEditDialog = (n: Nominee) => { setEditingNominee(n); reset({ name: n.name, relation: n.relation, share_percent: n.share_percent }); setDialogVisible(true); };
  const closeDialog = () => { setDialogVisible(false); setEditingNominee(null); reset({ name: "", relation: "", share_percent: null }); };
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["member", "nominees"] });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; relation: string; share_percent: number }) => memberCreateNominee(data),
    onSuccess: () => { toast.success("Nominee added."); invalidate(); closeDialog(); },
    onError: (err: any) => { toast.error(getApiError(err, "Failed to add nominee")); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; relation: string; share_percent: number } }) => memberUpdateNominee(id, data),
    onSuccess: () => { toast.success("Nominee updated."); invalidate(); closeDialog(); },
    onError: (err: any) => { toast.error(getApiError(err, "Failed to update nominee")); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => memberDeleteNominee(id),
    onSuccess: () => { toast.success("Nominee deleted."); invalidate(); },
    onError: (err: any) => { toast.error(getApiError(err, "Failed to delete nominee")); },
  });

  const onSubmit = (values: FormValues) => {
    const payload = { name: values.name, relation: values.relation, share_percent: Math.round(Number(values.share_percent ?? 0)) };
    editingNominee ? updateMutation.mutate({ id: editingNominee.id, data: payload }) : createMutation.mutate(payload);
  };
  const handleDelete = (n: Nominee) => { if (confirm(`Delete nominee "${n.name}"?`)) deleteMutation.mutate(n.id); };
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const initials = (name: string) => name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  return (
    <PageWrap>
      <PageHeader>
        <PageTitle>Nominees</PageTitle>
        <AccentBtn onClick={openAddDialog}><i className="pi pi-plus" style={{ fontSize: 12 }} />Add nominee</AccentBtn>
      </PageHeader>

      {isLoading ? (
        <EmptyState><p style={{ color: "#6b7a8c" }}>Loading…</p></EmptyState>
      ) : nominees.length === 0 ? (
        <EmptyState>
          <Users size={32} color="#cbd5e1" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: "#6b7a8c" }}>No nominees added</div>
          <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>Add nominees to designate beneficiaries</div>
        </EmptyState>
      ) : nominees.map(n => (
        <NomineeCard key={n.id}>
          <Avatar>{initials(n.name)}</Avatar>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <NomineeName>{n.name}</NomineeName>
              <RelationBadge>{n.relation}</RelationBadge>
              <SharePill>Share: {n.share_percent}%</SharePill>
            </div>
          </div>
          <ShareValue>{n.share_percent}%</ShareValue>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <ActionBtn onClick={() => openEditDialog(n)} title="Edit"><Pencil size={13} /></ActionBtn>
            <ActionBtn $danger onClick={() => handleDelete(n)} title="Delete"><Trash2 size={13} /></ActionBtn>
          </div>
        </NomineeCard>
      ))}

      {nominees.length > 0 && (
        <ShareSummary $ok={totalShare === 100}>
          {totalShare === 100 ? "✓" : "⚠"} Total share: {totalShare}%{totalShare !== 100 && " — should sum to 100%"}
        </ShareSummary>
      )}

      <Dialog header={editingNominee ? "Edit Nominee" : "Add Nominee"} visible={dialogVisible} onHide={closeDialog} style={{ width: "32rem" }}
        footer={
          <DialogFooter>
            <Button label="Cancel" severity="secondary" outlined onClick={closeDialog} disabled={isSaving} />
            <Button label="Save" icon="pi pi-check" loading={isSaving} onClick={handleSubmit(onSubmit)} />
          </DialogFooter>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldWrapper>
            <label htmlFor="nom-name">Name *</label>
            <Controller name="name" control={control} rules={{ required: "Name is required." }} render={({ field }) => (
              <InputText id="nom-name" {...field} placeholder="Enter nominee name" className={errors.name ? "p-invalid" : ""} style={{ width: "100%" }} />
            )} />
            {errors.name && <span className="error-msg">{errors.name.message}</span>}
          </FieldWrapper>
          <FieldWrapper>
            <label htmlFor="nom-relation">Relation *</label>
            <Controller name="relation" control={control} rules={{ required: "Relation is required." }} render={({ field }) => (
              <Dropdown id="nom-relation" value={field.value} options={RELATION_OPTIONS} onChange={e => field.onChange(e.value)} placeholder="Select relation" className={errors.relation ? "p-invalid" : ""} style={{ width: "100%" }} />
            )} />
            {errors.relation && <span className="error-msg">{errors.relation.message}</span>}
          </FieldWrapper>
          <FieldWrapper>
            <label htmlFor="nom-share">Share % *</label>
            <Controller name="share_percent" control={control} rules={{ required: "Share % is required.", min: { value: 0, message: "Min 0" }, max: { value: 100, message: "Max 100" } }} render={({ field }) => (
              <InputNumber id="nom-share" value={field.value} onValueChange={e => field.onChange(e.value)} min={0} max={100} maxFractionDigits={0} suffix="%" placeholder="e.g. 25" className={errors.share_percent ? "p-invalid" : ""} />
            )} />
            {errors.share_percent && <span className="error-msg">{errors.share_percent.message}</span>}
          </FieldWrapper>
        </form>
      </Dialog>
    </PageWrap>
  );
}
