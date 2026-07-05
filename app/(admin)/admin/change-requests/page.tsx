"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";
import { CheckCircle2, XCircle, Clock, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import styled from "styled-components";
import { adminListChangeRequests, adminApproveChangeRequest, adminRejectChangeRequest } from "@/imports/core/api";

// ─── Styled ───────────────────────────────────────────────────────────────────

const PageTitle = styled.h1`
  font-size: 1.35rem;
  font-weight: 800;
  color: #111827;
  margin: 0 0 0.35rem;
`;

const PageSub = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1.75rem;
`;

const FilterBar = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
`;

const FilterBtn = styled.button<{ $active?: boolean }>`
  padding: 6px 16px;
  border-radius: 999px;
  border: 1px solid ${p => p.$active ? "#7c3aed" : "#e5e7eb"};
  background: ${p => p.$active ? "#7c3aed" : "#fff"};
  color: ${p => p.$active ? "#fff" : "#374151"};
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
`;

const Card = styled.div`
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e9e8f4;
  padding: 20px 24px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  margin-bottom: 1rem;
`;

const RequestRow = styled.div`
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e9e8f4;
  padding: 16px 20px;
  margin-bottom: 0.75rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  &:hover {
    border-color: #c4b5fd;
    box-shadow: 0 2px 8px rgba(124,58,237,0.07);
  }
`;

const RowTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
`;

const MemberName = styled.div`
  font-weight: 700;
  color: #111827;
  font-size: 0.95rem;
`;

const MemberEmail = styled.div`
  font-size: 0.78rem;
  color: #6b7280;
  margin-top: 2px;
`;

const FieldPills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
`;

const Pill = styled.span`
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  background: #f5f3ff;
  color: #7c3aed;
  border: 1px solid #e9d5ff;
`;

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  background: ${p => p.$status === "approved" ? "#f0fdf4" : p.$status === "rejected" ? "#fef2f2" : "#fffbeb"};
  color: ${p => p.$status === "approved" ? "#16a34a" : p.$status === "rejected" ? "#dc2626" : "#d97706"};
  border: 1px solid ${p => p.$status === "approved" ? "#bbf7d0" : p.$status === "rejected" ? "#fecaca" : "#fde68a"};
  white-space: nowrap;
`;

const Meta = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 8px;
`;

const FieldsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 1rem;
  margin: 0.75rem 0;
`;

const FieldRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const FLabel = styled.span`
  font-size: 0.68rem;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const FValue = styled.span`
  font-size: 0.875rem;
  color: #111827;
  font-weight: 500;
`;

// ─── Page ─────────────────────────────────────────────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  name: "Full Name", mobile_no: "Mobile No.", gender: "Gender",
  address_line: "Address Line", address_city: "City", address_state: "State",
  address_pin: "PIN Code", sale_date: "Sale Date", sales_channel: "Sales Channel",
  branch_code: "Branch Code", salesperson_name: "Salesperson", employee_code: "Employee Code",
  data1: "Data 1", data2: "Data 2", data3: "Data 3",
};

function requestTypeLabel(cr: any): string {
  if (cr.entity_type === "family_member") {
    return cr.entity_id ? `Edit — ${cr.family_member_name || "Family Member"}` : "New Family Member";
  }
  return "Profile";
}

export default function AdminChangeRequestsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [skip, setSkip] = useState(0);
  const limit = 20;
  const [selected, setSelected] = useState<any | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "change-requests", statusFilter, skip],
    queryFn: () => adminListChangeRequests({ status: statusFilter || undefined, skip, limit }),
  });

  const rows: any[] = data?.data?.items ?? [];
  const total: number = data?.data?.total ?? 0;

  const approveMutation = useMutation({
    mutationFn: () => adminApproveChangeRequest(selected!.id, adminNote),
    onSuccess: () => {
      toast.success("Change request approved — member data updated");
      setSelected(null);
      setAdminNote("");
      queryClient.invalidateQueries({ queryKey: ["admin", "change-requests"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || "Approval failed"),
  });

  const rejectMutation = useMutation({
    mutationFn: () => adminRejectChangeRequest(selected!.id, adminNote),
    onSuccess: () => {
      toast.success("Change request rejected");
      setSelected(null);
      setAdminNote("");
      queryClient.invalidateQueries({ queryKey: ["admin", "change-requests"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || "Rejection failed"),
  });

  const isPending = selected?.status === "pending";

  const dialogFooter = (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
      <Button label="Close" severity="secondary" onClick={() => { setSelected(null); setAdminNote(""); }} />
      {isPending && (
        <>
          <Button
            label="Reject"
            severity="danger"
            outlined
            loading={rejectMutation.isPending}
            onClick={() => rejectMutation.mutate()}
          />
          <Button
            label="Approve"
            severity="success"
            loading={approveMutation.isPending}
            onClick={() => approveMutation.mutate()}
          />
        </>
      )}
    </div>
  );

  return (
    <div style={{ maxWidth: "900px" }}>
      <PageTitle>Member Change Requests</PageTitle>
      <PageSub>Members raise these when they want to update their data. Review and approve or reject.</PageSub>

      <FilterBar>
        {["pending", "approved", "rejected", ""].map((s) => (
          <FilterBtn
            key={s || "all"}
            $active={statusFilter === s}
            onClick={() => { setStatusFilter(s); setSkip(0); }}
          >
            {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </FilterBtn>
        ))}
      </FilterBar>

      {isLoading && (
        <Card>
          <p style={{ color: "#9ca3af" }}>Loading...</p>
        </Card>
      )}

      {!isLoading && rows.length === 0 && (
        <Card>
          <p style={{ color: "#9ca3af", margin: 0 }}>No change requests found.</p>
        </Card>
      )}

      {rows.map((cr) => (
        <RequestRow key={cr.id} onClick={() => { setSelected(cr); setAdminNote(""); }}>
          <RowTop>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <MemberName>{cr.member_name || "Member"}</MemberName>
                <span style={{ fontSize: 10.5, fontWeight: 700, padding: "1px 8px", borderRadius: 999, background: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb" }}>
                  {requestTypeLabel(cr)}
                </span>
              </div>
              <MemberEmail>{cr.member_email || cr.user_id?.slice(-8)?.toUpperCase()}</MemberEmail>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <StatusBadge $status={cr.status}>
                {cr.status === "approved" && <CheckCircle2 size={10} />}
                {cr.status === "rejected" && <XCircle size={10} />}
                {cr.status === "pending" && <Clock size={10} />}
                {cr.status}
              </StatusBadge>
              <ChevronRight size={14} color="#9ca3af" />
            </div>
          </RowTop>
          <FieldPills>
            {Object.keys(cr.requested_fields ?? {}).map((k) => (
              <Pill key={k}>{FIELD_LABELS[k] || k}</Pill>
            ))}
          </FieldPills>
          <Meta>
            {cr.reason && <span>Reason: {cr.reason} · </span>}
            Submitted {dayjs(cr.created_at).format("DD MMM YYYY")}
          </Meta>
        </RequestRow>
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

      <Dialog
        header="Change Request Details"
        visible={!!selected}
        onHide={() => { setSelected(null); setAdminNote(""); }}
        style={{ width: "520px" }}
        footer={dialogFooter}
      >
        {selected && (
          <>
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: "1rem", color: "#111827" }}>{selected.member_name || "Member"}</div>
                <span style={{ fontSize: 10.5, fontWeight: 700, padding: "1px 8px", borderRadius: 999, background: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb" }}>
                  {requestTypeLabel(selected)}
                </span>
              </div>
              <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>{selected.member_email}</div>
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                Requested Changes
              </div>
              <FieldsGrid>
                {Object.entries(selected.requested_fields ?? {}).map(([k, v]) => (
                  <FieldRow key={k}>
                    <FLabel>{FIELD_LABELS[k] || k}</FLabel>
                    <FValue>{String(v) || "—"}</FValue>
                  </FieldRow>
                ))}
              </FieldsGrid>
            </div>

            {selected.reason && (
              <div style={{ marginBottom: "0.75rem", padding: "10px 14px", background: "#f8fafc", borderRadius: 8, fontSize: "0.85rem", color: "#374151" }}>
                <span style={{ fontWeight: 700 }}>Member&apos;s reason: </span>{selected.reason}
              </div>
            )}

            {isPending && (
              <div style={{ marginBottom: "0.5rem" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#374151", marginBottom: "0.35rem" }}>
                  Admin note (optional)
                </label>
                <InputTextarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={2}
                  style={{ width: "100%" }}
                  placeholder="Add a note visible to the member..."
                />
              </div>
            )}

            {!isPending && (
              <div style={{ padding: "10px 14px", background: selected.status === "approved" ? "#f0fdf4" : "#fef2f2", borderRadius: 8, fontSize: "0.85rem" }}>
                <span style={{ fontWeight: 700 }}>
                  {selected.status === "approved" ? "Approved" : "Rejected"}
                </span>
                {selected.reviewed_at && <span style={{ color: "#6b7280" }}> on {dayjs(selected.reviewed_at).format("DD MMM YYYY")}</span>}
                {selected.admin_note && <div style={{ marginTop: 4, color: "#374151" }}>{selected.admin_note}</div>}
              </div>
            )}
          </>
        )}
      </Dialog>
    </div>
  );
}
