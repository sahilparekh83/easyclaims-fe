"use client";
import React, { useState } from "react";
import styled from "styled-components";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { memberListFamily, memberCreateFamily, memberUpdateFamily, memberDeleteFamily } from "@/imports/core/api";
import { getApiError } from "@/imports/core/errors";
import { Users, Pencil, Trash2 } from "lucide-react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { toast } from "react-toastify";
import dayjs from "dayjs";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FamilyMember {
  id: string; name: string; relation: string;
  gender?: string; dob?: string | null; coverage_type?: string;
  [key: string]: unknown;
}
interface FamilyFormValues {
  name: string; relation: string; gender: string; dob: string; coverage_type: string;
}

const GENDER_OPTIONS = [{ label: "Male", value: "Male" }, { label: "Female", value: "Female" }, { label: "Other", value: "Other" }];
const RELATION_OPTIONS = [{ label: "Spouse", value: "Spouse" }, { label: "Child", value: "Child" }, { label: "Parent", value: "Parent" }, { label: "Sibling", value: "Sibling" }, { label: "In-Law", value: "In-Law" }, { label: "Other", value: "Other" }];
const COVERAGE_OPTIONS = [{ label: "Health", value: "Health" }, { label: "Life", value: "Life" }, { label: "Accident", value: "Accident" }, { label: "Critical Illness", value: "Critical Illness" }];
const QUERY_KEY = ["member", "family"];
const DEFAULT_FORM: FamilyFormValues = { name: "", relation: "", gender: "", dob: "", coverage_type: "Health" };

// ─── Styled ───────────────────────────────────────────────────────────────────

const PageWrap = styled.div`max-width: 900px; display: flex; flex-direction: column; gap: 20px;`;

const PageHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between;
`;

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

const MemberCard = styled.div`
  background: #fff; border: 1px solid #e0e6ec; border-radius: 14px;
  box-shadow: 0 1px 2px rgba(10,42,87,0.06), 0 2px 6px rgba(10,42,87,0.06);
  padding: 18px 20px;
  display: flex; align-items: center; gap: 16px;
`;

const Avatar = styled.div`
  width: 44px; height: 44px; border-radius: 50%; flex: none;
  background: #dbeafe; color: #1e40af;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 700;
  font-family: 'Plus Jakarta Sans', sans-serif;
`;

const MemberName = styled.div`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 15px; font-weight: 700; color: #161d26;
`;

const RelationBadge = styled.span`
  font-size: 11.5px; font-weight: 600; padding: 2px 9px; border-radius: 999px;
  background: #f1f5f9; color: #374151;
`;

const CoverageBadge = styled.span`
  font-size: 11.5px; font-weight: 600; padding: 2px 9px; border-radius: 999px;
  background: #dcfce7; color: #166534;
`;

const MemberMeta = styled.div`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 12px; color: #6b7a8c; margin-top: 3px;
`;

const ActionBtn = styled.button<{ $danger?: boolean }>`
  background: none; border: 1px solid #e0e6ec; border-radius: 8px;
  padding: 6px 9px; cursor: pointer; display: inline-flex; align-items: center;
  color: ${p => p.$danger ? "#dc2626" : "#6b7a8c"};
  &:hover { background: ${p => p.$danger ? "#fee2e2" : "#f1f5f9"}; border-color: ${p => p.$danger ? "#fca5a5" : "#cbd5e1"}; }
`;

const EmptyState = styled.div`
  background: #fff; border: 1px solid #e0e6ec; border-radius: 14px;
  padding: 48px 20px; text-align: center;
`;

const FormBody = styled.div`display: flex; flex-direction: column; gap: 1rem; margin-top: 0.5rem;`;
const FormField = styled.div`display: flex; flex-direction: column; gap: 4px;`;
const FormLabel = styled.label`font-size: 0.875rem; font-weight: 500; color: #3a4756;`;
const FieldError = styled.small`color: #ef4444; font-size: 0.75rem;`;
const DialogFooterRow = styled.div`display: flex; justify-content: flex-end; gap: 0.5rem;`;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MemberFamilyPage() {
  const queryClient = useQueryClient();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FamilyFormValues>({ defaultValues: DEFAULT_FORM });

  const { data, isLoading } = useQuery({ queryKey: QUERY_KEY, queryFn: memberListFamily });
  const familyMembers: FamilyMember[] = Array.isArray(data?.data) ? data.data : [];

  const createMutation = useMutation({
    mutationFn: (values: FamilyFormValues) => memberCreateFamily(values),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEY }); toast.success("Family member added!"); closeDialog(); },
    onError: (err: any) => { toast.error(getApiError(err, "An error occurred")); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: FamilyFormValues }) => memberUpdateFamily(id, values),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEY }); toast.success("Family member updated!"); closeDialog(); },
    onError: (err: any) => { toast.error(getApiError(err, "An error occurred")); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => memberDeleteFamily(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEY }); toast.success("Family member removed!"); },
    onError: (err: any) => { toast.error(getApiError(err, "An error occurred")); },
  });

  const openAddDialog = () => { setEditingMember(null); reset(DEFAULT_FORM); setDialogVisible(true); };
  const openEditDialog = (member: FamilyMember) => { setEditingMember(member); reset({ name: member.name ?? "", relation: member.relation ?? "", gender: member.gender ?? "", dob: member.dob ?? "", coverage_type: member.coverage_type || "Health" }); setDialogVisible(true); };
  const closeDialog = () => { setDialogVisible(false); setEditingMember(null); reset(DEFAULT_FORM); };
  const handleDelete = (member: FamilyMember) => { if (window.confirm(`Remove "${member.name}" from family members?`)) deleteMutation.mutate(member.id); };
  const onSubmit = (values: FamilyFormValues) => { editingMember ? updateMutation.mutate({ id: editingMember.id, values }) : createMutation.mutate(values); };
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const initials = (name: string) => name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  return (
    <PageWrap>
      <PageHeader>
        <PageTitle>Family Members</PageTitle>
        <AccentBtn onClick={openAddDialog}><i className="pi pi-plus" style={{ fontSize: 12 }} />Add member</AccentBtn>
      </PageHeader>

      {isLoading ? (
        <EmptyState><p style={{ color: "#6b7a8c" }}>Loading…</p></EmptyState>
      ) : familyMembers.length === 0 ? (
        <EmptyState>
          <Users size={32} color="#cbd5e1" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: "#6b7a8c" }}>No family members added</div>
          <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>Add family members to link them to your policies</div>
        </EmptyState>
      ) : familyMembers.map(member => (
        <MemberCard key={member.id}>
          <Avatar>{initials(member.name)}</Avatar>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <MemberName>{member.name}</MemberName>
              <RelationBadge>{member.relation}</RelationBadge>
              {member.coverage_type && <CoverageBadge>{member.coverage_type}</CoverageBadge>}
            </div>
            <MemberMeta>
              {member.dob ? dayjs(member.dob).format("DD MMM YYYY") : "—"}
              {member.gender ? ` · ${member.gender}` : ""}
            </MemberMeta>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <ActionBtn onClick={() => openEditDialog(member)} title="Edit"><Pencil size={13} /></ActionBtn>
            <ActionBtn $danger onClick={() => handleDelete(member)} title="Remove"><Trash2 size={13} /></ActionBtn>
          </div>
        </MemberCard>
      ))}

      <Dialog header={editingMember ? "Edit Family Member" : "Add Family Member"} visible={dialogVisible} onHide={closeDialog} style={{ width: "480px" }} closable={!isSaving}
        footer={
          <DialogFooterRow>
            <Button label="Cancel" severity="secondary" onClick={closeDialog} disabled={isSaving} />
            <Button label="Save" loading={isSaving} onClick={handleSubmit(onSubmit)} />
          </DialogFooterRow>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormBody>
            <FormField>
              <FormLabel htmlFor="fm-name">Name *</FormLabel>
              <Controller name="name" control={control} rules={{ required: "Name is required" }} render={({ field, fieldState }) => (
                <><InputText id="fm-name" {...field} className={fieldState.error ? "p-invalid" : ""} style={{ width: "100%" }} placeholder="Full name" />{fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}</>
              )} />
            </FormField>
            <FormField>
              <FormLabel htmlFor="fm-relation">Relation *</FormLabel>
              <Controller name="relation" control={control} rules={{ required: "Relation is required" }} render={({ field, fieldState }) => (
                <><Dropdown id="fm-relation" value={field.value} options={RELATION_OPTIONS} onChange={e => field.onChange(e.value)} className={fieldState.error ? "p-invalid" : ""} style={{ width: "100%" }} placeholder="Select relation" />{fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}</>
              )} />
            </FormField>
            <FormField>
              <FormLabel htmlFor="fm-gender">Gender</FormLabel>
              <Controller name="gender" control={control} render={({ field }) => (
                <Dropdown id="fm-gender" value={field.value} options={GENDER_OPTIONS} onChange={e => field.onChange(e.value)} placeholder="Select gender" style={{ width: "100%" }} />
              )} />
            </FormField>
            <FormField>
              <FormLabel htmlFor="fm-dob">Date of Birth</FormLabel>
              <Controller name="dob" control={control} render={({ field }) => (
                <Calendar id="fm-dob" value={field.value ? new Date(field.value) : null} onChange={e => { const v = e.value; field.onChange(v instanceof Date ? dayjs(v).format("YYYY-MM-DD") : ""); }} dateFormat="dd M yy" showIcon style={{ width: "100%" }} inputStyle={{ width: "100%" }} placeholder="Select date" maxDate={new Date()} />
              )} />
            </FormField>
            <FormField>
              <FormLabel htmlFor="fm-coverage">Coverage Type</FormLabel>
              <Controller name="coverage_type" control={control} render={({ field }) => (
                <Dropdown id="fm-coverage" value={field.value || "Health"} options={COVERAGE_OPTIONS} onChange={e => field.onChange(e.value)} style={{ width: "100%" }} placeholder="Select coverage type" />
              )} />
            </FormField>
          </FormBody>
        </form>
      </Dialog>
    </PageWrap>
  );
}
