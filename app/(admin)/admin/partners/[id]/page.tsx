"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import styled from "styled-components";
import { ArrowLeft, Download, Eye, Users, FileText, User, Calendar, Phone, Mail, MapPin, Building2 } from "lucide-react";
import PlanCard, { PlanData } from "@/components/ui/PlanCard";
import {
  adminGetPartner,
  adminListMembersByPartner,
  adminListPoliciesByPartner,
  adminViewPolicyPdf,
  adminDownloadPolicyPdf,
  adminGetPartnerPlans,
  adminGetMember,
} from "@/imports/core/api";

// ─── Styled ───────────────────────────────────────────────────────────────────

const PageWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const BackRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const InfoCard = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
`;

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
  min-width: 220px;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #374151;

  svg { color: #9ca3af; flex-shrink: 0; }
  strong { color: #111827; }
`;

const SectionCard = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
`;

const SectionHeader = styled.div`
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CountBadge = styled.span`
  background: #ede9fe;
  color: #6d28d9;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
`;

const ExpandedWrap = styled.div`
  padding: 0.75rem 1.25rem 1rem;
  background: #f9fafb;
  border-top: 1px solid #f3f4f6;
`;

const ExpandedTitle = styled.div`
  font-size: 0.78rem;
  font-weight: 700;
  color: #6d28d9;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.5rem;
`;

const EmptyMsg = styled.div`
  color: #9ca3af;
  font-size: 0.8rem;
  padding: 0.5rem 0;
`;

const MemberMeta = styled.div`
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
  font-size: 0.8rem;
  color: #6b7280;

  span { display: flex; align-items: center; gap: 4px; }
  strong { color: #374151; }
`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Partner {
  id: string;
  name: string;
  email?: string;
  mobile_no?: string;
  city?: string;
  partner_type?: string;
  status: string;
  api_key?: string;
  member_count?: number;
  created_at?: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
  mobile_no?: string;
  is_active: boolean;
  enrollment_status?: string;
  plan_id?: string;
  plan_name?: string;
  policy_count: number;
  family_count: number;
}

interface Policy {
  id: string;
  policy_number?: string;
  policy_type?: string;
  insurer?: string;
  sum_insured?: number;
  start_date?: string;
  end_date?: string;
  status?: string;
  file_name?: string;
  has_file?: boolean;
}

// ─── PDF helpers ──────────────────────────────────────────────────────────────

async function openPdf(policyId: string) {
  try {
    const blob = await adminViewPolicyPdf(policyId);
    const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  } catch {
    toast.error("Could not load PDF");
  }
}

async function downloadPdf(policyId: string, fileName?: string) {
  try {
    const blob = await adminDownloadPolicyPdf(policyId);
    const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "policy.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5_000);
  } catch {
    toast.error("Could not download PDF");
  }
}

// ─── Member Row Expansion ─────────────────────────────────────────────────────

function MemberPolicies({ partnerId, member }: { partnerId: string; member: Member }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "partner-member-policies", partnerId, member.id],
    queryFn: () => adminListPoliciesByPartner(partnerId, {
      user_id: member.id, skip: 0, limit: 50,
    }),
    enabled: !!partnerId && !!member.id,
  });

  const { data: memberDetail } = useQuery({
    queryKey: ["admin", "member-detail", member.id],
    queryFn: () => adminGetMember(member.id),
    enabled: !!member.id,
  });

  const policies: Policy[] = data?.data?.data ?? [];
  const familyMembers: any[] = memberDetail?.data?.family ?? [];

  const statusSeverity = (s?: string) => {
    if (s === "Active") return "success";
    if (s === "Expired") return "warning";
    if (s === "Cancelled") return "danger";
    return "secondary";
  };

  const pdfActions = (row: Policy) => (
    <div style={{ display: "flex", gap: "0.25rem" }}>
      {row.has_file && (
        <>
          <Button
            icon={<Eye size={13} />}
            text
            size="small"
            severity="info"
            title="View PDF"
            onClick={() => openPdf(row.id)}
          />
          <Button
            icon={<Download size={13} />}
            text
            size="small"
            severity="secondary"
            title="Download PDF"
            onClick={() => downloadPdf(row.id, row.file_name)}
          />
        </>
      )}
      {!row.has_file && (
        <span style={{ color: "#d1d5db", fontSize: "0.75rem" }}>No file</span>
      )}
    </div>
  );

  return (
    <ExpandedWrap>
      <MemberMeta>
        <span><Mail size={12} /><strong>{member.email}</strong></span>
        {member.mobile_no && <span><Phone size={12} />{member.mobile_no}</span>}
        {member.plan_name && <span><FileText size={12} />Plan: <strong>{member.plan_name}</strong></span>}
        <span>Family: <strong>{member.family_count}</strong></span>
        <span>Status: <strong>{member.enrollment_status ?? "—"}</strong></span>
      </MemberMeta>

      {familyMembers.length > 0 && (
        <>
          <ExpandedTitle>Family Members ({familyMembers.length})</ExpandedTitle>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
            {familyMembers.map((f: any) => (
              <span key={f.id} style={{
                fontSize: "0.78rem", padding: "3px 10px", borderRadius: "999px",
                background: "#f5f3ff", color: "#6d28d9", border: "1px solid #ede9fe", fontWeight: 500,
              }}>
                {f.name} <span style={{ color: "#9ca3af", fontWeight: 400 }}>({f.relation})</span>
              </span>
            ))}
          </div>
        </>
      )}

      <ExpandedTitle>Policies ({policies.length})</ExpandedTitle>

      {isLoading ? (
        <EmptyMsg>Loading policies…</EmptyMsg>
      ) : policies.length === 0 ? (
        <EmptyMsg>No policies under this partner for this member.</EmptyMsg>
      ) : (
        <DataTable
          value={policies}
          size="small"
          stripedRows
          style={{ fontSize: "0.8rem" }}
        >
          <Column field="policy_number" header="Policy #" style={{ minWidth: "130px" }} />
          <Column field="policy_type" header="Type" />
          <Column field="insurer" header="Insurer" />
          <Column
            header="Sum Insured"
            body={(r: Policy) => r.sum_insured ? `₹${Number(r.sum_insured).toLocaleString("en-IN")}` : "—"}
          />
          <Column
            header="Valid"
            body={(r: Policy) =>
              r.start_date && r.end_date
                ? `${dayjs(r.start_date).format("DD MMM YY")} – ${dayjs(r.end_date).format("DD MMM YY")}`
                : r.start_date ? dayjs(r.start_date).format("DD MMM YY") : "—"
            }
          />
          <Column
            header="Status"
            body={(r: Policy) =>
              r.status ? <Tag severity={statusSeverity(r.status)} value={r.status} style={{ fontSize: "0.7rem" }} /> : "—"
            }
          />
          <Column header="PDF" body={pdfActions} style={{ width: "90px" }} />
        </DataTable>
      )}
    </ExpandedWrap>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PartnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [expandedRows, setExpandedRows] = useState<any>(null);
  const [previewPlan, setPreviewPlan] = useState<any>(null);

  const { data: partnerRes, isLoading: partnerLoading } = useQuery({
    queryKey: ["admin", "partner", id],
    queryFn: () => adminGetPartner(id),
    enabled: !!id,
  });

  const { data: membersRes, isLoading: membersLoading } = useQuery({
    queryKey: ["admin", "partner-members", id],
    queryFn: () => adminListMembersByPartner(id, { skip: 0, limit: 200 }),
    enabled: !!id,
  });

  const { data: plansRes } = useQuery({
    queryKey: ["admin", "partner-plans", id],
    queryFn: () => adminGetPartnerPlans(id),
    enabled: !!id,
  });

  const partner: Partner | null = partnerRes?.data ?? null;
  const members: Member[] = membersRes?.data?.data ?? [];
  const linkedPlans: any[] = (plansRes as any)?.data ?? [];

  // ── Column templates ──────────────────────────────────────────────────────

  const nameBody = (row: Member) => (
    <div>
      <div style={{ fontWeight: 600, color: "#111827", fontSize: "0.875rem" }}>{row.name || "—"}</div>
      <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{row.email}</div>
    </div>
  );

  const planBody = (row: Member) => (
    <div>
      <div style={{ fontSize: "0.85rem", color: "#111827" }}>{row.plan_name || <span style={{ color: "#9ca3af" }}>No plan</span>}</div>
      {row.enrollment_status && (
        <div style={{ fontSize: "0.72rem", color: row.enrollment_status === "Active" ? "#059669" : "#6b7280" }}>
          {row.enrollment_status}
        </div>
      )}
    </div>
  );

  const policyCountBody = (row: Member) => (
    <span style={{
      fontWeight: 600,
      color: row.policy_count > 0 ? "#6366f1" : "#9ca3af",
      fontSize: "0.875rem",
    }}>
      {row.policy_count}
    </span>
  );

  const familyCountBody = (row: Member) => (
    <span style={{ color: "#374151", fontSize: "0.875rem" }}>{row.family_count}</span>
  );

  const activeBody = (row: Member) => (
    <span style={{
      fontSize: "0.7rem", fontWeight: 600, padding: "2px 8px", borderRadius: "999px",
      background: row.is_active ? "#dcfce7" : "#fee2e2",
      color: row.is_active ? "#166534" : "#991b1b",
    }}>
      {row.is_active ? "Active" : "Inactive"}
    </span>
  );

  const rowExpansionTemplate = (row: Member) => (
    <MemberPolicies partnerId={id} member={row} />
  );

  const expanderBody = (row: Member) => (
    <Button
      text
      size="small"
      icon={expandedRows?.[row.id] ? "pi pi-chevron-down" : "pi pi-chevron-right"}
      onClick={() => {
        setExpandedRows((prev: any) => {
          const next = { ...prev };
          if (next?.[row.id]) delete next[row.id];
          else next[row.id] = true;
          return next;
        });
      }}
    />
  );

  if (partnerLoading) {
    return (
      <PageWrap>
        <BackRow>
          <Button text icon={<ArrowLeft size={16} />} label="Partners" onClick={() => router.push("/admin/partners")} />
        </BackRow>
        <div style={{ color: "#9ca3af", padding: "2rem" }}>Loading partner…</div>
      </PageWrap>
    );
  }

  if (!partner) {
    return (
      <PageWrap>
        <BackRow>
          <Button text icon={<ArrowLeft size={16} />} label="Partners" onClick={() => router.push("/admin/partners")} />
        </BackRow>
        <div style={{ color: "#dc2626", padding: "2rem" }}>Partner not found.</div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      {/* Back */}
      <BackRow>
        <Button
          text
          size="small"
          style={{ color: "#6b7280", padding: "0.25rem 0" }}
          onClick={() => router.push("/admin/partners")}
          label="← Back to Partners"
        />
      </BackRow>

      {/* Partner Info */}
      <InfoCard>
        <InfoSection>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.25rem" }}>
            <Building2 size={20} color="#6366f1" />
            <span style={{ fontSize: "1.15rem", fontWeight: 700, color: "#111827" }}>{partner.name}</span>
            <span style={{
              fontSize: "0.7rem", fontWeight: 600, padding: "2px 8px", borderRadius: "999px",
              background: partner.status === "Active" ? "#dcfce7" : "#fee2e2",
              color: partner.status === "Active" ? "#166534" : "#991b1b",
            }}>
              {partner.status}
            </span>
          </div>

          {partner.email && (
            <InfoRow><Mail size={14} /> <strong>{partner.email}</strong></InfoRow>
          )}
          {partner.mobile_no && (
            <InfoRow><Phone size={14} /> {partner.mobile_no}</InfoRow>
          )}
          {partner.city && (
            <InfoRow><MapPin size={14} /> {partner.city}</InfoRow>
          )}
          {partner.partner_type && (
            <InfoRow><Building2 size={14} /> {partner.partner_type}</InfoRow>
          )}
          {partner.created_at && (
            <InfoRow><Calendar size={14} /> Joined {dayjs(partner.created_at).format("DD MMM YYYY")}</InfoRow>
          )}
        </InfoSection>

        <InfoSection>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#6366f1" }}>{members.length}</div>
              <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "2px" }}>Members</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#059669" }}>
                {members.reduce((s, m) => s + (m.policy_count ?? 0), 0)}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "2px" }}>Policies</div>
            </div>
          </div>
          {partner.api_key && (
            <InfoRow style={{ marginTop: "0.5rem", flexDirection: "column", alignItems: "flex-start", gap: "0.25rem" }}>
              <span style={{ fontSize: "0.72rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>API Key</span>
              <span style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: "0.75rem", color: "#374151", wordBreak: "break-all" }}>
                {partner.api_key}
              </span>
            </InfoRow>
          )}
        </InfoSection>
      </InfoCard>

      {/* Linked Plans */}
      <SectionCard>
        <SectionHeader>
          <SectionTitle>
            <FileText size={16} color="#7c3aed" />
            Linked Plans
            <CountBadge>{linkedPlans.length}</CountBadge>
          </SectionTitle>
          <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>
            Plans assigned to this partner by superadmin
          </span>
        </SectionHeader>
        {linkedPlans.length === 0 ? (
          <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: 0 }}>
            No plans linked yet. Assign plans from the Plans page.
          </p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", padding: "0.75rem 1.25rem 1.25rem" }}>
            {linkedPlans.map((p: any) => (
              <div key={p.id} style={{
                border: "1px solid #e5e7eb", borderRadius: "10px",
                padding: "0.625rem 1rem", background: "#fafafa", minWidth: "200px",
              }}>
                <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#111827" }}>{p.name}</div>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "4px", alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{
                    fontSize: "0.65rem", fontWeight: 700, padding: "1px 7px", borderRadius: "999px",
                    background: p.plan_type === "partner" ? "#f5f3ff" : "#e0f2fe",
                    color: p.plan_type === "partner" ? "#6d28d9" : "#0369a1",
                    border: "1px solid",
                    borderColor: p.plan_type === "partner" ? "#ede9fe" : "#bae6fd",
                  }}>
                    {p.plan_type === "partner" ? "Partner" : "Global"}
                  </span>
                  <span style={{
                    fontSize: "0.65rem", fontWeight: 700, padding: "1px 7px", borderRadius: "999px",
                    background: p.status === "Active" ? "#dcfce7" : p.status === "Draft" ? "#dbeafe" : "#fee2e2",
                    color: p.status === "Active" ? "#166534" : p.status === "Draft" ? "#1d4ed8" : "#991b1b",
                  }}>
                    {p.status}
                  </span>
                </div>
                {p.price != null && (
                  <div style={{ fontSize: "0.78rem", color: "#7c3aed", fontWeight: 600, marginTop: "4px" }}>
                    ₹{Number(p.price).toLocaleString("en-IN")} / {p.cycle ?? "year"}
                  </div>
                )}
                <Button
                  label="View Details"
                  size="small"
                  text
                  icon={<Eye size={12} />}
                  style={{ padding: "2px 0", fontSize: "0.72rem", marginTop: "6px", color: "#6366f1" }}
                  onClick={() => setPreviewPlan(p)}
                />
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Members */}
      <SectionCard>
        <SectionHeader>
          <SectionTitle>
            <Users size={16} color="#6366f1" />
            Members
            <CountBadge>{members.length}</CountBadge>
          </SectionTitle>
          <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>
            Click the arrow to see member policies
          </span>
        </SectionHeader>

        <DataTable
          value={members}
          loading={membersLoading}
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionTemplate={rowExpansionTemplate}
          dataKey="id"
          emptyMessage="No members enrolled under this partner."
          stripedRows
          style={{ fontSize: "0.875rem" }}
        >
          <Column expander={false} body={expanderBody} style={{ width: "44px" }} />
          <Column header="Member" body={nameBody} style={{ minWidth: "200px" }} />
          <Column field="mobile_no" header="Mobile" style={{ minWidth: "120px" }}
            body={(r: Member) => r.mobile_no || "—"} />
          <Column header="Plan" body={planBody} style={{ minWidth: "150px" }} />
          <Column header="Policies" body={policyCountBody} style={{ width: "80px", textAlign: "center" }} />
          <Column header="Family" body={familyCountBody} style={{ width: "70px", textAlign: "center" }} />
          <Column header="Status" body={activeBody} style={{ width: "90px" }} />
        </DataTable>
      </SectionCard>

      {/* Plan Preview Dialog */}
      {previewPlan && (
        <Dialog
          visible={!!previewPlan}
          onHide={() => setPreviewPlan(null)}
          header="Plan Details"
          style={{ width: "420px" }}
          modal
          draggable={false}
          footer={
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button label="Close" severity="secondary" text onClick={() => setPreviewPlan(null)} />
            </div>
          }
        >
          <div style={{ paddingTop: "0.75rem" }}>
            <PlanCard plan={previewPlan as PlanData} />
          </div>
        </Dialog>
      )}
    </PageWrap>
  );
}
