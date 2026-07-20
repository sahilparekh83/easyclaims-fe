"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { toast } from "react-toastify";
import { ChevronRight, User, Bot, ShieldCheck, FileText, Upload, Eye, Download, Users } from "lucide-react";
import dayjs from "dayjs";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { getApiError } from "@/imports/core/errors";
import { useAuthStore } from "@/stores/AuthStore";
import {
  adminGetClaim, adminListClaimAgents, adminUpdateClaimStatus,
  adminReassignClaim, adminAddClaimRemark, adminUploadClaimDocument,
  adminViewPolicyPdf, adminDownloadPolicyPdf,
  adminViewClaimDocument, adminDownloadClaimDocument,
} from "@/imports/core/api";

const STATUS_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
];

function titleCase(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

export default function AdminClaimDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const claimId = params.id as string;
  const isSuperadmin = useAuthStore(s => s.isSuperadmin);

  const fromMemberId = searchParams.get("member_id") ?? "";
  const fromMemberName = searchParams.get("member_name") ? decodeURIComponent(searchParams.get("member_name")!) : "";
  const fromAgentId = searchParams.get("agent_id") ?? "";
  const fromAgentName = searchParams.get("agent_name") ? decodeURIComponent(searchParams.get("agent_name")!) : "";

  const [newStatus, setNewStatus] = useState("");
  const [remark, setRemark] = useState("");
  const [reassignAgentId, setReassignAgentId] = useState("");
  const [plainRemark, setPlainRemark] = useState("");
  const [docType, setDocType] = useState("Other");
  const [docLoading, setDocLoading] = useState(false);
  const [docActionId, setDocActionId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "claim", claimId],
    queryFn: () => adminGetClaim(claimId),
  });
  const { data: agentsData } = useQuery({
    queryKey: ["admin", "claim-agents"], queryFn: adminListClaimAgents, enabled: isSuperadmin,
  });

  const claim: any = data?.data;
  const timeline = claim?.timeline ?? [];
  const documents = claim?.documents ?? [];
  const agents: { id: string; name: string }[] = agentsData?.data ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "claim", claimId] });

  const statusMutation = useMutation({
    mutationFn: () => adminUpdateClaimStatus(claimId, newStatus, remark || undefined),
    onSuccess: () => { toast.success("Status updated"); setNewStatus(""); setRemark(""); invalidate(); },
    onError: (err: any) => toast.error(getApiError(err, "Failed to update status")),
  });

  const reassignMutation = useMutation({
    mutationFn: () => adminReassignClaim(claimId, reassignAgentId),
    onSuccess: () => { toast.success("Claim reassigned"); setReassignAgentId(""); invalidate(); },
    onError: (err: any) => toast.error(getApiError(err, "Failed to reassign")),
  });

  const remarkMutation = useMutation({
    mutationFn: () => adminAddClaimRemark(claimId, plainRemark),
    onSuccess: () => { toast.success("Remark added"); setPlainRemark(""); invalidate(); },
    onError: (err: any) => toast.error(getApiError(err, "Failed to add remark")),
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      await adminUploadClaimDocument(claimId, docType, file);
      toast.success("Document uploaded");
      invalidate();
    } catch (err: any) {
      toast.error(getApiError(err, "Failed to upload document"));
    }
  };

  const handleViewPolicy = async () => {
    if (!claim?.policy_id) return;
    setDocLoading(true);
    try {
      const blob = await adminViewPolicyPdf(claim.policy_id);
      const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch {
      toast.error("Could not load the original policy document");
    } finally {
      setDocLoading(false);
    }
  };

  const handleDownloadPolicy = async () => {
    if (!claim?.policy_id) return;
    setDocLoading(true);
    try {
      const blob = await adminDownloadPolicyPdf(claim.policy_id);
      const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url; a.download = claim.policy_file_name || "policy.pdf";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5_000);
    } catch {
      toast.error("Could not download the original policy document");
    } finally {
      setDocLoading(false);
    }
  };

  const handleViewDocument = async (doc: any) => {
    setDocActionId(doc.id);
    try {
      const blob = await adminViewClaimDocument(claimId, doc.id);
      const url = URL.createObjectURL(new Blob([blob]));
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch {
      toast.error("Could not load the document");
    } finally {
      setDocActionId(null);
    }
  };

  const handleDownloadDocument = async (doc: any) => {
    setDocActionId(doc.id);
    try {
      const blob = await adminDownloadClaimDocument(claimId, doc.id);
      const url = URL.createObjectURL(new Blob([blob]));
      const a = document.createElement("a");
      a.href = url; a.download = doc.file_name || "document";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5_000);
    } catch {
      toast.error("Could not download the document");
    } finally {
      setDocActionId(null);
    }
  };

  if (isLoading) return <div>Loading…</div>;
  if (!claim) return <div>Claim not found.</div>;

  return (
    <div style={{ maxWidth: 980, display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7a8c" }}>
        {fromMemberId ? (
          <>
            <span style={{ cursor: "pointer" }} onClick={() => router.push("/admin/members")}>Members</span>
            <ChevronRight size={13} />
            <span style={{ cursor: "pointer" }} onClick={() => router.push(`/admin/members/${fromMemberId}`)}>
              {fromMemberName || "Member"}
            </span>
            <ChevronRight size={13} />
            <span style={{ color: "#161d26", fontWeight: 600 }}>{claim.claim_number}</span>
          </>
        ) : fromAgentId ? (
          <>
            <span style={{ cursor: "pointer" }} onClick={() => router.push("/admin/claim-agents")}>Claim Agents</span>
            <ChevronRight size={13} />
            <span style={{ cursor: "pointer" }} onClick={() => router.push(`/admin/claim-agents/${fromAgentId}`)}>
              {fromAgentName || "Agent"}
            </span>
            <ChevronRight size={13} />
            <span style={{ color: "#161d26", fontWeight: 600 }}>{claim.claim_number}</span>
          </>
        ) : (
          <>
            <span style={{ cursor: "pointer" }} onClick={() => router.push("/admin/claim-tickets")}>Claim Tickets</span>
            <ChevronRight size={13} />
            <span style={{ color: "#161d26", fontWeight: 600 }}>{claim.claim_number}</span>
          </>
        )}
      </div>

      <PageHeader
        title={claim.claim_number}
        subtitle={`${claim.member_name} · Policy ${claim.policy_number ?? "—"}${claim.family_member_name ? ` · for ${claim.family_member_name}` : ""}`}
        actions={<StatusBadge value={titleCase(claim.status)} />}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
        <InfoTile
          label="Claimed Amount"
          value={claim.claimed_amount ? `₹${Number(claim.claimed_amount).toLocaleString("en-IN")}` : "—"}
          warn={claim.exceeds_max_claim_value}
        />
        <InfoTile
          label="Plan Max Claim Value"
          value={claim.max_claim_value ? `₹${Number(claim.max_claim_value).toLocaleString("en-IN")}` : "No cap"}
          sub={claim.plan_name}
        />
        <InfoTile label="Incident Date" value={claim.incident_date ? dayjs(claim.incident_date).format("DD MMM YYYY") : "—"} />
        <InfoTile label="Assigned Agent" value={claim.assigned_agent_name || "Unassigned"} />
      </div>

      {claim.exceeds_max_claim_value && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#b91c1c", fontWeight: 600 }}>
          ⚠ Claimed amount exceeds this member's plan cap of ₹{Number(claim.max_claim_value).toLocaleString("en-IN")}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card>
          <SectionTitle>Member Details</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13.5 }}>
            <DetailRow label="Name" value={claim.member_name} />
            <DetailRow label="Email" value={claim.member_email} />
            <DetailRow label="Mobile" value={claim.member_mobile_no} />
            {claim.family_member_name && (
              <DetailRow label="Claim is for" value={`${claim.family_member_name} (${claim.family_member_relation})`} />
            )}
          </div>
        </Card>
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <SectionTitle>Policy Details</SectionTitle>
            {claim.has_policy_file && (
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                <button
                  onClick={handleViewPolicy} disabled={docLoading} title="View original policy document"
                  style={{ background: "none", border: "1px solid #e0e6ec", borderRadius: 7, padding: "5px 8px", cursor: "pointer", color: "#6b7a8c", display: "inline-flex", alignItems: "center" }}
                >
                  <Eye size={14} />
                </button>
                <button
                  onClick={handleDownloadPolicy} disabled={docLoading} title="Download original policy document"
                  style={{ background: "none", border: "1px solid #e0e6ec", borderRadius: 7, padding: "5px 8px", cursor: "pointer", color: "#6b7a8c", display: "inline-flex", alignItems: "center" }}
                >
                  <Download size={14} />
                </button>
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13.5 }}>
            <DetailRow label="Policy Number" value={claim.policy_number} />
            <DetailRow label="Policy Type" value={claim.policy_type} />
            <DetailRow label="Insurer" value={claim.insurer} />
            <DetailRow label="Sum Insured" value={claim.sum_insured ? `₹${Number(claim.sum_insured).toLocaleString("en-IN")}` : "—"} />
            <DetailRow label="Policy Period" value={claim.policy_start_date && claim.policy_end_date
              ? `${dayjs(claim.policy_start_date).format("DD MMM YYYY")} – ${dayjs(claim.policy_end_date).format("DD MMM YYYY")}`
              : "—"} />
            <DetailRow label="Policy Status" value={claim.policy_status} />
            {!claim.has_policy_file && (
              <div style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>No original document on file.</div>
            )}
          </div>
        </Card>
      </div>

      {claim.policy_extracted_fields && Object.keys(claim.policy_extracted_fields).length > 0 && (
        <Card>
          <SectionTitle>Policy Extraction Data</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px", fontSize: 13 }}>
            {Object.entries(claim.policy_extracted_fields)
              .filter(([k]) => k !== "family_members")
              .map(([k, v]) => (
                <DetailRow
                  key={k}
                  label={k.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                  value={typeof v === "number" ? v.toLocaleString("en-IN") : String(v ?? "—")}
                />
              ))}
          </div>
        </Card>
      )}

      {claim.family_members && claim.family_members.length > 0 && (
        <Card>
          <SectionTitle>Family Members</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {claim.family_members.map((fm: any) => (
              <div
                key={fm.id}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8,
                  background: fm.is_claim_subject ? "#eff6ff" : "#f8fafc",
                  border: fm.is_claim_subject ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                }}
              >
                <Users size={15} color={fm.is_claim_subject ? "#0050b0" : "#6b7280"} />
                <div style={{ flex: 1, fontSize: 13.5 }}>
                  <strong style={{ color: "#161d26" }}>{fm.name}</strong>
                  <span style={{ color: "#9ca3af", marginLeft: 6 }}>({fm.relation}{fm.dob ? `, ${dayjs(fm.dob).format("DD MMM YYYY")}` : ""})</span>
                </div>
                {fm.is_claim_subject && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#0050b0", background: "#dbeafe", borderRadius: 999, padding: "2px 8px" }}>
                    This claim is for them
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {claim.description && (
        <Card>
          <SectionTitle>Description</SectionTitle>
          <div style={{ fontSize: 13.5, color: "#374151" }}>{claim.description}</div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: isSuperadmin ? "1fr 1fr" : "1fr", gap: 14 }}>
        <Card>
          <SectionTitle>Change Status</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Dropdown
              value={newStatus} onChange={e => setNewStatus(e.value)}
              options={STATUS_OPTIONS} placeholder="Select new status" style={{ width: "100%" }}
            />
            <InputTextarea
              value={remark} onChange={e => setRemark(e.target.value)}
              placeholder="Remark (visible to member) — e.g. 'documents pending', 'rejected — policy lapsed'"
              rows={3}
            />
            <Button
              label="Update Status" disabled={!newStatus}
              loading={statusMutation.isPending}
              onClick={() => statusMutation.mutate()}
            />
          </div>
        </Card>

        {/* Only a superadmin can reassign a claim to a different agent — claim agents
            never see this control, matching the backend's 403 for anyone else. */}
        {isSuperadmin && (
          <Card>
            <SectionTitle>Reassign Agent</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Dropdown
                value={reassignAgentId} onChange={e => setReassignAgentId(e.value)}
                options={agents.map(a => ({ label: a.name, value: a.id }))}
                placeholder="Select claim agent" style={{ width: "100%" }}
              />
              <Button
                label="Reassign" severity="secondary" disabled={!reassignAgentId}
                loading={reassignMutation.isPending}
                onClick={() => reassignMutation.mutate()}
              />
            </div>
          </Card>
        )}
      </div>

      <Card>
        <SectionTitle>Add a Remark (no status change)</SectionTitle>
        <div style={{ display: "flex", gap: 10 }}>
          <InputTextarea
            value={plainRemark} onChange={e => setPlainRemark(e.target.value)}
            placeholder="e.g. 'Called customer, waiting for hospital bill copy.'"
            rows={2} style={{ flex: 1 }}
          />
          <Button label="Add" disabled={!plainRemark.trim()} loading={remarkMutation.isPending} onClick={() => remarkMutation.mutate()} />
        </div>
      </Card>

      <Card>
        <SectionTitle>Documents</SectionTitle>
        {documents.length === 0 ? (
          <div style={{ fontSize: 13, color: "#9ca3af" }}>No documents uploaded yet.</div>
        ) : (
          documents.map((d: any) => (
            <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: "1px solid #f1f2f6" }}>
              <FileText size={15} color="#6b7280" />
              <div style={{ flex: 1, fontSize: 13.5 }}>
                <strong>{d.file_name}</strong>
                <div style={{ fontSize: 11.5, color: "#9ca3af" }}>{d.doc_type} · uploaded by {d.uploaded_by} · {dayjs(d.created_at).format("DD MMM YYYY")}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => handleViewDocument(d)} disabled={docActionId === d.id} title="View document"
                  style={{ background: "none", border: "1px solid #e0e6ec", borderRadius: 7, padding: "5px 8px", cursor: "pointer", color: "#6b7a8c", display: "inline-flex", alignItems: "center" }}
                >
                  <Eye size={14} />
                </button>
                <button
                  onClick={() => handleDownloadDocument(d)} disabled={docActionId === d.id} title="Download document"
                  style={{ background: "none", border: "1px solid #e0e6ec", borderRadius: 7, padding: "5px 8px", cursor: "pointer", color: "#6b7a8c", display: "inline-flex", alignItems: "center" }}
                >
                  <Download size={14} />
                </button>
              </div>
            </div>
          ))
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <Dropdown
            value={docType} onChange={e => setDocType(e.value)}
            options={["Hospital Bill", "Discharge Summary", "Prescription", "Medical Report", "ID Proof", "FIR / Accident Report", "Repair Estimate", "Death Certificate", "Other"].map(t => ({ label: t, value: t }))}
            style={{ width: 200 }}
          />
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#0a2257", color: "#fff", borderRadius: 8, padding: "0 14px", height: 38, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Upload size={14} /> Upload document
            <input type="file" style={{ display: "none" }} onChange={handleFileSelect} />
          </label>
        </div>
      </Card>

      <Card>
        <SectionTitle>Timeline</SectionTitle>
        {timeline.map((t: any) => (
          <div key={t.id} style={{ display: "flex", gap: 12, padding: "10px 0", borderTop: "1px solid #f1f2f6" }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%", flex: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: t.actor_type === "member" ? "#eff6ff" : t.actor_type === "system" ? "#f1f5f9" : "#f0fdf4",
              color: t.actor_type === "member" ? "#0050b0" : t.actor_type === "system" ? "#64748b" : "#16a34a",
            }}>
              {t.actor_type === "member" ? <User size={12} /> : t.actor_type === "system" ? <Bot size={12} /> : <ShieldCheck size={12} />}
            </div>
            <div>
              <div style={{ fontSize: 13.5, color: "#161d26" }}>{t.message}</div>
              <div style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 2 }}>
                {dayjs(t.created_at).format("DD MMM YYYY, h:mm A")}{t.actor_name ? ` · ${t.actor_name}` : ""}
              </div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e8eaf0", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: 14.5, fontWeight: 700, color: "#161d26", margin: "0 0 12px" }}>{children}</h3>;
}

function InfoTile({ label, value, sub, warn }: { label: string; value: React.ReactNode; sub?: string | null; warn?: boolean }) {
  return (
    <div style={{
      background: warn ? "#fef2f2" : "#fff",
      border: `1px solid ${warn ? "#fecaca" : "#e8eaf0"}`,
      borderRadius: 12, padding: "12px 14px",
    }}>
      <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.04em", color: "#9ca3af", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: warn ? "#b91c1c" : "#161d26" }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ color: "#9ca3af" }}>{label}</span>
      <span style={{ fontWeight: 600, color: "#161d26", textAlign: "right" }}>{value ?? "—"}</span>
    </div>
  );
}
