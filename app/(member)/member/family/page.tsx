"use client";
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller, useWatch } from "react-hook-form";
import {
  memberGetFamily, memberCreateFamily, memberUpdateFamily, memberDeleteFamily,
  memberCreateFamilyChangeRequest,
} from "@/imports/core/api";
import { getApiError } from "@/imports/core/errors";
import { Users, Pencil, Trash2, Lock, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { toast } from "react-toastify";
import dayjs from "dayjs";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FamilyMember {
  id: string; name: string; relation: string;
  gender?: string; dob?: string | null; coverage_type?: string;
  policy_count: number;
}
interface FamilyFormValues {
  name: string; relation: string; gender: string; dob: string; coverage_type: string;
}
interface CrFormValues {
  name: string; relation: string; gender: string; dob: string; coverage_type: string; reason: string;
}

const GENDER_OPTIONS = [{ label: "Male", value: "Male" }, { label: "Female", value: "Female" }, { label: "Other", value: "Other" }];
const RELATION_OPTIONS = [
  { label: "Spouse", value: "Spouse" },
  { label: "Child", value: "Child" },
  { label: "Parent", value: "Parent" },
  { label: "Other", value: "Other" },
];
const COVERAGE_OPTIONS = [{ label: "Health", value: "Health" }, { label: "Life", value: "Life" }, { label: "Accident", value: "Accident" }, { label: "Critical Illness", value: "Critical Illness" }];
const QUERY_KEY = ["member", "family"];
const DEFAULT_FORM: FamilyFormValues = { name: "", relation: "", gender: "", dob: "", coverage_type: "Health" };

// ─── Styled ───────────────────────────────────────────────────────────────────

const PageWrap = styled.div`max-width: 900px; display: flex; flex-direction: column; gap: 20px;`;
const PageHeader = styled.div`display: flex; align-items: center; justify-content: space-between;`;
const PageTitle = styled.h1`font-family: 'Plus Jakarta Sans', sans-serif; font-size: 19px; font-weight: 800; color: #161d26; margin: 0;`;
const AccentBtn = styled.button<{ disabled?: boolean }>`
  display: inline-flex; align-items: center; gap: 7px;
  background: ${p => p.disabled ? "#e5e7eb" : "#0050b0"}; color: ${p => p.disabled ? "#9ca3af" : "#fff"};
  border: none; border-radius: 9px; padding: 9px 16px; font-size: 13px; font-weight: 600;
  cursor: ${p => p.disabled ? "not-allowed" : "pointer"};
  font-family: 'Plus Jakarta Sans', sans-serif;
`;
const LimitBar = styled.div`
  background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px;
  padding: 10px 16px; display: flex; align-items: center; gap: 10px;
  font-size: 13px; color: #1e40af; font-weight: 600;
`;
const LimitFill = styled.div<{ $pct: number; $full: boolean }>`
  flex: 1; height: 6px; background: #dbeafe; border-radius: 999px; overflow: hidden;
  &::after { content: ''; display: block; height: 100%; width: ${p => p.$pct}%;
    background: ${p => p.$full ? "#ef4444" : "#3b82f6"}; border-radius: 999px; }
`;
const MemberCard = styled.div<{ $locked?: boolean }>`
  background: #fff; border: 1px solid ${p => p.$locked ? "#fde68a" : "#e0e6ec"};
  border-radius: 14px; box-shadow: 0 1px 2px rgba(10,42,87,0.06);
  padding: 18px 20px; display: flex; align-items: center; gap: 16px;
  opacity: ${p => p.$locked ? 0.95 : 1};
`;
const Avatar = styled.div`
  width: 44px; height: 44px; border-radius: 50%; flex: none;
  background: #dbeafe; color: #1e40af; display: flex; align-items: center;
  justify-content: center; font-size: 15px; font-weight: 700;
`;
const MemberName = styled.div`font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px; font-weight: 700; color: #161d26;`;
const Chip = styled.span<{ $color?: string; $bg?: string }>`
  font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px;
  background: ${p => p.$bg || "#f1f5f9"}; color: ${p => p.$color || "#374151"};
`;
const PolicyChip = styled(Chip)`background: #fef9c3; color: #92400e; border: 1px solid #fde68a;`;
const MemberMeta = styled.div`font-size: 12px; color: #6b7a8c; margin-top: 3px;`;
const LockNotice = styled.div`
  display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: #d97706;
  background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px;
  padding: 4px 10px; margin-top: 6px;
`;
const ActionBtn = styled.button<{ $danger?: boolean; disabled?: boolean }>`
  background: none; border: 1px solid #e0e6ec; border-radius: 8px; padding: 6px 9px;
  cursor: ${p => p.disabled ? "not-allowed" : "pointer"};
  display: inline-flex; align-items: center;
  color: ${p => p.disabled ? "#d1d5db" : p.$danger ? "#dc2626" : "#6b7a8c"};
  opacity: ${p => p.disabled ? 0.5 : 1};
  &:hover:not(:disabled) { background: ${p => p.$danger ? "#fee2e2" : "#f1f5f9"}; }
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
const AgeBanner = styled.div<{ $ok: boolean }>`
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; border-radius: 8px; font-size: 12.5px; font-weight: 600;
  background: ${p => p.$ok ? "#f0fdf4" : "#fef2f2"};
  border: 1px solid ${p => p.$ok ? "#bbf7d0" : "#fecaca"};
  color: ${p => p.$ok ? "#166534" : "#dc2626"};
`;

// ─── Age helpers ──────────────────────────────────────────────────────────────

function calcAge(dob: string): number {
  return dayjs().diff(dayjs(dob), "year");
}

// ─── Inner component that watches form fields ─────────────────────────────────

function ChildAgeCheck({ control, childAgeLimit }: { control: any; childAgeLimit: number }) {
  const relation = useWatch({ control, name: "relation" });
  const dob = useWatch({ control, name: "dob" });

  if (relation !== "Child" || !dob) return null;

  const age = calcAge(dob);
  const today = dayjs().format("DD MMM YYYY");
  const ok = age <= childAgeLimit;

  return (
    <AgeBanner $ok={ok}>
      {ok
        ? <CheckCircle size={15} />
        : <AlertCircle size={15} />}
      <span>
        Age: <strong>{age} years</strong> as of {today}
        {ok
          ? ` — within limit (≤ ${childAgeLimit} years)`
          : ` — exceeds child age limit of ${childAgeLimit} years`}
      </span>
    </AgeBanner>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MemberFamilyPage() {
  const queryClient = useQueryClient();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [crDialogVisible, setCrDialogVisible] = useState(false);
  const [crTarget, setCrTarget] = useState<FamilyMember | null>(null);

  const form = useForm<FamilyFormValues>({ defaultValues: DEFAULT_FORM });
  const crForm = useForm<CrFormValues>({
    defaultValues: { name: "", relation: "", gender: "", dob: "", coverage_type: "", reason: "" },
  });

  const { data, isLoading } = useQuery({ queryKey: QUERY_KEY, queryFn: memberGetFamily });
  const familyMembers: FamilyMember[] = (data as any)?.data?.family ?? [];
  const planLimit: number | null = (data as any)?.data?.plan_family_limit ?? null;
  const childAgeLimit: number = (data as any)?.data?.child_age_limit ?? 21;
  const atLimit = planLimit !== null && familyMembers.length >= planLimit;

  // Watch relation + dob in add/edit form to determine if save should be blocked
  const watchedRelation = useWatch({ control: form.control, name: "relation" });
  const watchedDob = useWatch({ control: form.control, name: "dob" });
  const isChildOverLimit =
    watchedRelation === "Child" &&
    !!watchedDob &&
    calcAge(watchedDob) > childAgeLimit;

  const createMutation = useMutation({
    mutationFn: (values: FamilyFormValues) => memberCreateFamily(values),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEY }); toast.success("Family member added!"); closeDialog(); },
    onError: (err: any) => { toast.error(getApiError(err, "Failed to add family member")); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: FamilyFormValues }) => memberUpdateFamily(id, values),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEY }); toast.success("Family member updated!"); closeDialog(); },
    onError: (err: any) => { toast.error(getApiError(err, "Failed to update")); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => memberDeleteFamily(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEY }); toast.success("Family member removed!"); },
    onError: (err: any) => { toast.error(getApiError(err, "Cannot remove")); },
  });
  const crMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: CrFormValues }) => {
      const fields: Record<string, string> = {};
      if (values.name) fields.name = values.name;
      if (values.relation) fields.relation = values.relation;
      if (values.gender) fields.gender = values.gender;
      if (values.dob) fields.dob = values.dob;
      if (values.coverage_type) fields.coverage_type = values.coverage_type;
      if (!Object.keys(fields).length) throw new Error("Enter at least one field to change");
      return memberCreateFamilyChangeRequest(id, { requested_fields: fields, reason: values.reason || undefined });
    },
    onSuccess: () => {
      toast.success("Change request submitted — admin will review shortly");
      setCrDialogVisible(false); setCrTarget(null); crForm.reset();
    },
    onError: (err: any) => { toast.error(getApiError(err, "Failed to submit")); },
  });

  const openAddDialog = () => {
    if (atLimit) { toast.warn(`Your plan allows max ${planLimit} family members.`); return; }
    setEditingMember(null); form.reset(DEFAULT_FORM); setDialogVisible(true);
  };
  const openEditDialog = (member: FamilyMember) => {
    setEditingMember(member);
    form.reset({ name: member.name, relation: member.relation, gender: member.gender ?? "", dob: member.dob ?? "", coverage_type: member.coverage_type || "Health" });
    setDialogVisible(true);
  };
  const closeDialog = () => { setDialogVisible(false); setEditingMember(null); form.reset(DEFAULT_FORM); };
  const openCrDialog = (member: FamilyMember) => {
    setCrTarget(member);
    crForm.reset({ name: member.name, relation: member.relation, gender: member.gender ?? "", dob: member.dob ?? "", coverage_type: member.coverage_type ?? "", reason: "" });
    setCrDialogVisible(true);
  };
  const handleDelete = (member: FamilyMember) => {
    if (window.confirm(`Remove "${member.name}" from family members?`)) deleteMutation.mutate(member.id);
  };
  const onSubmit = (values: FamilyFormValues) => {
    editingMember ? updateMutation.mutate({ id: editingMember.id, values }) : createMutation.mutate(values);
  };
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const initials = (name: string) => name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  return (
    <PageWrap>
      <PageHeader>
        <PageTitle>Family Members</PageTitle>
        <AccentBtn onClick={openAddDialog} disabled={atLimit}>
          <i className="pi pi-plus" style={{ fontSize: 12 }} />
          {atLimit ? `Limit reached (${planLimit})` : "Add member"}
        </AccentBtn>
      </PageHeader>

      {planLimit !== null && (
        <LimitBar>
          <span>{familyMembers.length} of {planLimit} family members used</span>
          <LimitFill $pct={Math.min(100, (familyMembers.length / planLimit) * 100)} $full={atLimit} />
        </LimitBar>
      )}

      {isLoading ? (
        <EmptyState><p style={{ color: "#6b7a8c" }}>Loading…</p></EmptyState>
      ) : familyMembers.length === 0 ? (
        <EmptyState>
          <Users size={32} color="#cbd5e1" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: "#6b7a8c" }}>No family members added</div>
          <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>Add family members to link them to your policies</div>
        </EmptyState>
      ) : familyMembers.map(member => {
        const locked = member.policy_count > 0;
        const isChild = member.relation === "Child";
        const childAge = isChild && member.dob ? calcAge(member.dob) : null;
        const childOverLimit = childAge !== null && childAge > childAgeLimit;

        return (
          <MemberCard key={member.id} $locked={locked}>
            <Avatar>{initials(member.name)}</Avatar>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <MemberName>{member.name}</MemberName>
                <Chip>{member.relation}</Chip>
                {member.coverage_type && <Chip $bg="#dcfce7" $color="#166534">{member.coverage_type}</Chip>}
                {locked && <PolicyChip><Lock size={9} style={{ display: "inline", marginRight: 3 }} />Linked to {member.policy_count} policy{member.policy_count > 1 ? "ies" : ""}</PolicyChip>}
              </div>
              <MemberMeta>
                {member.dob ? (
                  <span style={{ color: isChild ? (childOverLimit ? "#dc2626" : "#16a34a") : undefined, fontWeight: isChild ? 600 : undefined }}>
                    {dayjs(member.dob).format("DD MMM YYYY")}
                    {isChild && childAge !== null && ` (${childAge} yrs)`}
                    {isChild && childOverLimit && " · Over age limit"}
                    {isChild && !childOverLimit && " · Within age limit"}
                  </span>
                ) : "—"}
                {member.gender ? ` · ${member.gender}` : ""}
              </MemberMeta>
              {locked && (
                <LockNotice>
                  <AlertCircle size={13} />
                  Linked to {member.policy_count} policy. Edit/delete disabled — use Request Change.
                </LockNotice>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <ActionBtn
                onClick={() => !locked && openEditDialog(member)}
                disabled={locked}
                title={locked ? "Linked to a policy — use Request Change" : "Edit"}
              ><Pencil size={13} /></ActionBtn>
              <Button
                label="Request Change"
                size="small"
                severity="warning"
                outlined
                style={{ fontSize: 11 }}
                onClick={() => openCrDialog(member)}
              />
              <ActionBtn
                $danger
                onClick={() => !locked && handleDelete(member)}
                disabled={locked}
                title={locked ? "Linked to a policy — cannot remove" : "Remove"}
              ><Trash2 size={13} /></ActionBtn>
            </div>
          </MemberCard>
        );
      })}

      {/* Add/Edit Dialog */}
      <Dialog
        header={editingMember ? "Edit Family Member" : "Add Family Member"}
        visible={dialogVisible} onHide={closeDialog} style={{ width: "480px" }} closable={!isSaving}
        footer={
          <DialogFooterRow>
            <Button label="Cancel" severity="secondary" onClick={closeDialog} disabled={isSaving} />
            <Button
              label="Save"
              loading={isSaving}
              disabled={isChildOverLimit}
              onClick={form.handleSubmit(onSubmit)}
            />
          </DialogFooterRow>
        }
      >
        <FormBody>
          <FormField>
            <FormLabel>Name *</FormLabel>
            <Controller name="name" control={form.control} rules={{ required: "Name is required" }}
              render={({ field, fieldState }) => (
                <><InputText {...field} invalid={!!fieldState.error} style={{ width: "100%" }} placeholder="Full name" />{fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}</>
              )} />
          </FormField>
          <FormField>
            <FormLabel>Relation *</FormLabel>
            <Controller name="relation" control={form.control} rules={{ required: "Relation is required" }}
              render={({ field, fieldState }) => (
                <><Dropdown value={field.value} options={RELATION_OPTIONS} onChange={e => field.onChange(e.value)} invalid={!!fieldState.error} style={{ width: "100%" }} placeholder="Select relation" />{fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}</>
              )} />
          </FormField>
          <FormField>
            <FormLabel>Gender</FormLabel>
            <Controller name="gender" control={form.control}
              render={({ field }) => <Dropdown value={field.value} options={GENDER_OPTIONS} onChange={e => field.onChange(e.value)} placeholder="Select gender" style={{ width: "100%" }} />} />
          </FormField>
          <FormField>
            <FormLabel>Date of Birth</FormLabel>
            <Controller name="dob" control={form.control}
              render={({ field }) => (
                <Calendar value={field.value ? new Date(field.value) : null}
                  onChange={e => { const v = e.value; field.onChange(v instanceof Date ? dayjs(v).format("YYYY-MM-DD") : ""); }}
                  dateFormat="dd M yy" showIcon style={{ width: "100%" }} inputStyle={{ width: "100%" }}
                  placeholder="Select date" maxDate={new Date()} />
              )} />
          </FormField>
          <ChildAgeCheck control={form.control} childAgeLimit={childAgeLimit} />
        </FormBody>
      </Dialog>

      {/* Change Request Dialog */}
      <Dialog
        header={`Request Change — ${crTarget?.name}`}
        visible={crDialogVisible} onHide={() => { setCrDialogVisible(false); setCrTarget(null); crForm.reset(); }}
        style={{ width: "480px" }}
        footer={
          <DialogFooterRow>
            <Button label="Cancel" severity="secondary" onClick={() => { setCrDialogVisible(false); setCrTarget(null); crForm.reset(); }} />
            <Button label="Submit Request" severity="warning" loading={crMutation.isPending}
              onClick={crForm.handleSubmit(v => crTarget && crMutation.mutate({ id: crTarget.id, values: v }))} />
          </DialogFooterRow>
        }
      >
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16, padding: "8px 12px", background: "#fffbeb", borderRadius: 8, border: "1px solid #fde68a" }}>
          Fill in only the fields you want changed. Leave unchanged fields blank.
        </div>
        <FormBody>
          <FormField>
            <FormLabel>Full Name</FormLabel>
            <Controller name="name" control={crForm.control}
              render={({ field }) => <InputText {...field} style={{ width: "100%" }} placeholder={crTarget?.name} />} />
          </FormField>
          <FormField>
            <FormLabel>Relation</FormLabel>
            <Controller name="relation" control={crForm.control}
              render={({ field }) => <Dropdown value={field.value} options={[{ label: "— no change —", value: "" }, ...RELATION_OPTIONS]} onChange={e => field.onChange(e.value)} style={{ width: "100%" }} />} />
          </FormField>
          <FormField>
            <FormLabel>Gender</FormLabel>
            <Controller name="gender" control={crForm.control}
              render={({ field }) => <Dropdown value={field.value} options={[{ label: "— no change —", value: "" }, ...GENDER_OPTIONS]} onChange={e => field.onChange(e.value)} style={{ width: "100%" }} />} />
          </FormField>
          <FormField>
            <FormLabel>Date of Birth</FormLabel>
            <Controller name="dob" control={crForm.control}
              render={({ field }) => (
                <Calendar value={field.value ? new Date(field.value) : null}
                  onChange={e => { const v = e.value; field.onChange(v instanceof Date ? dayjs(v).format("YYYY-MM-DD") : ""); }}
                  dateFormat="dd M yy" showIcon style={{ width: "100%" }} inputStyle={{ width: "100%" }}
                  placeholder="Leave blank for no change" maxDate={new Date()} />
              )} />
          </FormField>
          <FormField>
            <FormLabel>Reason *</FormLabel>
            <Controller name="reason" control={crForm.control} rules={{ required: "Please provide a reason" }}
              render={({ field, fieldState }) => (
                <><InputTextarea {...field} rows={2} style={{ width: "100%" }} placeholder="Why do you need this change?" />
                {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}</>
              )} />
          </FormField>
        </FormBody>
      </Dialog>
    </PageWrap>
  );
}
