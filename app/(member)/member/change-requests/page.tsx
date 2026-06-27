"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { CheckCircle2, XCircle, Clock, Plus } from "lucide-react";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import styled from "styled-components";
import { memberListChangeRequests, memberCreateChangeRequest } from "@/imports/core/api";

// ─── Styled ───────────────────────────────────────────────────────────────────

const PageTitle = styled.h1`
  font-size: 1.35rem; font-weight: 800; color: #111827; margin: 0 0 0.35rem;
`;

const PageSub = styled.p`
  font-size: 0.875rem; color: #6b7280; margin: 0 0 1.75rem;
`;

const Layout = styled.div`
  display: grid; grid-template-columns: 1fr 360px; gap: 1.5rem; align-items: start;
  @media (max-width: 860px) { grid-template-columns: 1fr; }
`;

const Card = styled.div`
  background: #fff; border-radius: 14px; border: 1px solid #e9e8f4;
  padding: 20px 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.05);
`;

const CardTitle = styled.div`
  font-size: 0.925rem; font-weight: 700; color: #374151; margin-bottom: 1.25rem;
  padding-bottom: 10px; border-bottom: 1px solid #f3f4f6;
`;

const FormField = styled.div`
  display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 1rem;
`;

const FieldLabel = styled.label`
  font-size: 0.875rem; font-weight: 500; color: #374151;
`;

const FormRow = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;
`;

const RequestItem = styled.div`
  border-radius: 12px; border: 1px solid #e9e8f4; padding: 14px 16px; margin-bottom: 0.75rem;
  background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
`;

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px;
  border-radius: 999px; font-size: 0.72rem; font-weight: 700; white-space: nowrap;
  background: ${p => p.$status === "approved" ? "#f0fdf4" : p.$status === "rejected" ? "#fef2f2" : "#fffbeb"};
  color: ${p => p.$status === "approved" ? "#16a34a" : p.$status === "rejected" ? "#dc2626" : "#d97706"};
  border: 1px solid ${p => p.$status === "approved" ? "#bbf7d0" : p.$status === "rejected" ? "#fecaca" : "#fde68a"};
`;

const Pill = styled.span`
  padding: 2px 8px; border-radius: 999px; font-size: 0.68rem; font-weight: 600;
  background: #f5f3ff; color: #7c3aed; border: 1px solid #e9d5ff; margin-right: 4px;
`;

const AddFieldBtn = styled.button`
  display: flex; align-items: center; gap: 6px; padding: 6px 12px;
  border-radius: 8px; border: 1px dashed #d1d5db; background: #fafafa;
  font-size: 0.8rem; color: #6b7280; cursor: pointer;
  &:hover { border-color: #7c3aed; color: #7c3aed; background: #f5f3ff; }
`;

// ─── Constants ────────────────────────────────────────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  name: "Full Name",
  email: "Email Address",
  mobile_no: "Mobile No.",
  gender: "Gender",
  address_line: "Address Line",
  address_city: "City",
  address_state: "State",
  address_pin: "PIN Code",
  sale_date: "Sale Date",
  sales_channel: "Sales Channel",
  branch_code: "Branch Code",
  salesperson_name: "Salesperson Name",
  employee_code: "Employee Code",
  data1: "Data 1",
  data2: "Data 2",
  data3: "Data 3",
};

const FIELD_OPTIONS = Object.entries(FIELD_LABELS).map(([value, label]) => ({ label, value }));

const GENDER_OPTIONS = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
];

interface FieldEntry { field: string; value: string; }

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MemberChangeRequestsPage() {
  const queryClient = useQueryClient();
  const [fields, setFields] = useState<FieldEntry[]>([{ field: "name", value: "" }]);
  const [reason, setReason] = useState("");
  const [skip, setSkip] = useState(0);
  const limit = 10;

  const { data, isLoading } = useQuery({
    queryKey: ["member", "change-requests", skip],
    queryFn: () => memberListChangeRequests({ skip, limit }),
  });

  const [crTab, setCrTab] = useState<"profile" | "family">("profile");

  const rows: any[] = data?.data?.data ?? [];
  const total: number = data?.data?.total ?? 0;

  const profileRows = rows.filter((cr: any) => !cr.entity_type || cr.entity_type === "profile");
  const familyRows  = rows.filter((cr: any) => cr.entity_type === "family_member");
  const displayRows = crTab === "profile" ? profileRows : familyRows;

  const createMutation = useMutation({
    mutationFn: () => {
      const requested_fields: Record<string, string> = {};
      fields.forEach(f => { if (f.field && f.value) requested_fields[f.field] = f.value; });
      if (Object.keys(requested_fields).length === 0) throw new Error("Add at least one field to change");
      return memberCreateChangeRequest({ requested_fields, reason: reason || undefined });
    },
    onSuccess: () => {
      toast.success("Change request submitted — admin will review shortly");
      setFields([{ field: "name", value: "" }]);
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["member", "change-requests"] });
    },
    onError: (e: any) => toast.error(e?.message || e?.response?.data?.detail || "Submission failed"),
  });

  const addField = () => {
    if (fields.length >= 7) return;
    setFields(prev => [...prev, { field: "", value: "" }]);
  };

  const updateField = (idx: number, key: "field" | "value", val: string) => {
    setFields(prev => prev.map((f, i) => i === idx ? { ...f, [key]: val } : f));
  };

  const removeField = (idx: number) => {
    setFields(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div style={{ maxWidth: "1000px" }}>
      <PageTitle>Change Requests</PageTitle>
      <PageSub>Submit a request to update your profile. An admin will review and apply the change.</PageSub>

      <Layout>
        {/* History */}
        <div>
          <Card>
            <CardTitle>My Requests ({total})</CardTitle>

            {isLoading && <p style={{ color: "#9ca3af" }}>Loading...</p>}

            {/* Tab switcher */}
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {(["profile", "family"] as const).map(t => (
                <button key={t} onClick={() => setCrTab(t)} style={{
                  padding: "4px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: "pointer",
                  border: "1px solid", background: crTab === t ? "#1d4ed8" : "#fff",
                  color: crTab === t ? "#fff" : "#6b7280",
                  borderColor: crTab === t ? "#1d4ed8" : "#e5e7eb",
                }}>
                  {t === "profile" ? `Profile (${profileRows.length})` : `Family Members (${familyRows.length})`}
                </button>
              ))}
            </div>

            {!isLoading && displayRows.length === 0 && (
              <p style={{ color: "#9ca3af", margin: 0, fontSize: "0.875rem" }}>
                No change requests yet.
              </p>
            )}

            {displayRows.map((cr: any) => (
              <RequestItem key={cr.id}>
                {cr.entity_type === "family_member" && cr.family_member_name && (
                  <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>
                    Family member: <strong>{cr.family_member_name}</strong>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>
                    {dayjs(cr.created_at).format("DD MMM YYYY")}
                  </div>
                  <StatusBadge $status={cr.status}>
                    {cr.status === "approved" && <CheckCircle2 size={10} />}
                    {cr.status === "rejected" && <XCircle size={10} />}
                    {cr.status === "pending" && <Clock size={10} />}
                    {cr.status}
                  </StatusBadge>
                </div>

                <div style={{ marginBottom: 6 }}>
                  {Object.keys(cr.requested_fields ?? {}).map((k) => (
                    <Pill key={k}>{FIELD_LABELS[k] || k}: {cr.requested_fields[k]}</Pill>
                  ))}
                </div>

                {cr.reason && (
                  <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>Reason: {cr.reason}</div>
                )}

                {cr.admin_note && (
                  <div style={{ marginTop: 6, padding: "6px 10px", background: cr.status === "approved" ? "#f0fdf4" : "#fef2f2", borderRadius: 6, fontSize: "0.78rem", color: "#374151" }}>
                    Admin: {cr.admin_note}
                  </div>
                )}
              </RequestItem>
            ))}

            {total > limit && (
              <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1rem" }}>
                <Button label="Previous" size="small" outlined disabled={skip === 0} onClick={() => setSkip(Math.max(0, skip - limit))} />
                <span style={{ padding: "6px 12px", fontSize: "0.8rem", color: "#6b7280" }}>
                  {skip + 1}–{Math.min(skip + limit, total)} of {total}
                </span>
                <Button label="Next" size="small" outlined disabled={skip + limit >= total} onClick={() => setSkip(skip + limit)} />
              </div>
            )}
          </Card>
        </div>

        {/* New request form */}
        <Card>
          <CardTitle>New Change Request</CardTitle>

          {fields.map((entry, idx) => (
            <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "0.75rem", padding: "10px 12px", background: "#fafafa", borderRadius: 8, border: "1px solid #f3f4f6", position: "relative" }}>
              {fields.length > 1 && (
                <button
                  onClick={() => removeField(idx)}
                  style={{ position: "absolute", top: 8, right: 8, border: "none", background: "none", cursor: "pointer", color: "#9ca3af", fontSize: 16, padding: 0, lineHeight: 1 }}
                >×</button>
              )}
              <FormField style={{ marginBottom: 0 }}>
                <FieldLabel>Field to change</FieldLabel>
                <Dropdown
                  value={entry.field}
                  options={FIELD_OPTIONS}
                  onChange={(e) => updateField(idx, "field", e.value)}
                  placeholder="Select field"
                  style={{ width: "100%" }}
                />
              </FormField>
              <FormField style={{ marginBottom: 0 }}>
                <FieldLabel>New value</FieldLabel>
                {entry.field === "gender" ? (
                  <Dropdown
                    value={entry.value}
                    options={GENDER_OPTIONS}
                    onChange={(e) => updateField(idx, "value", e.value)}
                    placeholder="Select gender"
                    style={{ width: "100%" }}
                  />
                ) : (
                  <InputText
                    value={entry.value}
                    onChange={(e) => updateField(idx, "value", e.target.value)}
                    placeholder="Enter new value"
                    style={{ width: "100%" }}
                  />
                )}
              </FormField>
            </div>
          ))}

          {fields.length < 7 && (
            <AddFieldBtn onClick={addField} style={{ marginBottom: "1rem" }}>
              <Plus size={13} /> Add another field
            </AddFieldBtn>
          )}

          <FormField>
            <FieldLabel>Reason (optional)</FieldLabel>
            <InputTextarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              style={{ width: "100%" }}
              placeholder="Why do you need this change?"
            />
          </FormField>

          <Button
            label="Submit Request"
            icon="pi pi-send"
            loading={createMutation.isPending}
            onClick={() => createMutation.mutate()}
            style={{ width: "100%" }}
          />
        </Card>
      </Layout>
    </div>
  );
}
