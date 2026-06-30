"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { ChevronLeft, Upload, CheckCircle2, XCircle, AlertCircle, Download } from "lucide-react";
import { toast } from "react-toastify";
import styled from "styled-components";
import * as XLSX from "xlsx";
import { adminListPartners, adminBulkUploadMembers, adminGetPartnerPlansOverview } from "@/imports/core/api";

// ─── Styled ───────────────────────────────────────────────────────────────────

const Breadcrumb = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1.25rem;
  cursor: pointer;
  width: fit-content;
  &:hover { color: #374151; }
`;

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

const Card = styled.div`
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e9e8f4;
  padding: 24px 28px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  margin-bottom: 1.25rem;
`;

const CardTitle = styled.div`
  font-size: 0.925rem;
  font-weight: 700;
  color: #374151;
  margin-bottom: 1.25rem;
  padding-bottom: 10px;
  border-bottom: 1px solid #f3f4f6;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const FieldLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`;

const DropZone = styled.div<{ $active?: boolean; $hasFile?: boolean }>`
  border: 2px dashed ${p => p.$active ? "#7c3aed" : p.$hasFile ? "#22c55e" : "#d1d5db"};
  border-radius: 12px;
  padding: 2.5rem;
  text-align: center;
  background: ${p => p.$active ? "#f5f3ff" : p.$hasFile ? "#f0fdf4" : "#fafafa"};
  transition: all 0.15s;
  cursor: pointer;
  margin-bottom: 1.25rem;
`;

const ResultSection = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.25rem;
`;

const StatCard = styled.div<{ $color: string }>`
  border-radius: 12px;
  border: 1px solid ${p => p.$color}33;
  background: ${p => p.$color}0d;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const StatValue = styled.div`
  font-size: 1.65rem;
  font-weight: 800;
  color: #111827;
  line-height: 1;
  margin-top: 2px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
`;

const Th = styled.th`
  text-align: left;
  font-size: 0.7rem;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 8px 12px;
  border-bottom: 1px solid #f3f4f6;
`;

const Td = styled.td`
  padding: 8px 12px;
  color: #374151;
  border-bottom: 1px solid #f9fafb;
`;

const ColBadge = styled.span<{ $ok?: boolean }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${p => p.$ok ? "#f0fdf4" : "#fef2f2"};
  color: ${p => p.$ok ? "#16a34a" : "#dc2626"};
  border: 1px solid ${p => p.$ok ? "#bbf7d0" : "#fecaca"};
`;

// ─── Page ─────────────────────────────────────────────────────────────────────

interface UploadResult {
  total_rows: number;
  created: Array<{ row: number; email: string; id: string }>;
  skipped: Array<{ row: number; email?: string; reason: string }>;
  errors: Array<{ row: number; email?: string; reason: string }>;
}

function downloadSampleExcel() {
  const headers = [
    "Sale Date", "Primary Member Full Name", "Gender", "Primary Mobile No.",
    "Primary Email ID", "Address Line1", "City", "State", "Pin Code",
    "Sales Channel", "Partner Branch Code", "Sales Person Name", "Employee Code",
    "Data 1", "Data 2", "Data 3",
  ];
  const sample = [
    ["2024-01-15", "Rajesh Kumar", "Male", "9876543210", "rajesh@example.com",
     "123 MG Road", "Mumbai", "Maharashtra", "400001",
     "Direct", "BR001", "Amit Shah", "EMP123", "", "", ""],
    ["2024-02-20", "Priya Sharma", "Female", "9123456780", "priya@example.com",
     "45 Gandhi Nagar", "Pune", "Maharashtra", "411001",
     "Online", "BR002", "Ritu Mehta", "EMP456", "", "", ""],
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, ...sample]);
  ws["!cols"] = headers.map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Members");
  XLSX.writeFile(wb, "easyclaims_member_upload_template.xlsx");
}

export default function BulkUploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [partnerId, setPartnerId] = useState<string>("");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const { data: partnersData } = useQuery({
    queryKey: ["admin", "partners", "list"],
    queryFn: () => adminListPartners({ skip: 0, limit: 200 }),
  });

  const partners = (partnersData?.data?.data ?? []).map((p: any) => ({
    label: p.name,
    value: p.id,
  }));

  const { data: partnerPlansData } = useQuery({
    queryKey: ["admin", "partner-plans-overview", partnerId],
    queryFn: () => adminGetPartnerPlansOverview(partnerId),
    enabled: !!partnerId,
  });

  const planOptions = ((partnerPlansData as any)?.data ?? [])
    .filter((p: any) => p.linked && p.status === "Active")
    .map((p: any) => ({ label: p.name, value: p.id }));

  // Pre-select partner from URL query param
  useEffect(() => {
    const pid = searchParams.get("partner_id");
    if (pid && !partnerId) setPartnerId(pid);
  }, [searchParams, partnersData]);

  const uploadMutation = useMutation({
    mutationFn: () => adminBulkUploadMembers(selectedFile!, partnerId, selectedPlanId || undefined),
    onSuccess: (res) => {
      setResult(res.data);
      toast.success(`Upload complete: ${res.data.created?.length ?? 0} members created`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Upload failed");
    },
  });

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setSelectedFile(null);
      setResult(null);
      toast.error("Please upload an Excel file (.xlsx or .xls)");
      return;
    }
    setSelectedFile(file);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const canUpload = !!selectedFile && !!partnerId && !!selectedPlanId && !uploadMutation.isPending;

  return (
    <div style={{ maxWidth: "860px" }}>
      <Breadcrumb onClick={() => router.push("/admin/members")}>
        <ChevronLeft size={15} />
        Members
      </Breadcrumb>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.35rem" }}>
        <PageTitle>Bulk Upload Members</PageTitle>
        <Button
          label="Download Sample Template"
          icon="pi pi-download"
          size="small"
          outlined
          severity="secondary"
          onClick={downloadSampleExcel}
          style={{ fontSize: 12 }}
        />
      </div>
      <PageSub>Upload an Excel sheet provided by the partner to onboard members in bulk.</PageSub>

      <Card>
        <CardTitle>Upload Settings</CardTitle>

        <FormRow>
          <Field>
            <FieldLabel>Partner <span style={{ color: "#ef4444" }}>*</span></FieldLabel>
            <Dropdown
              inputId="admin-member-bulk-partner-select"
              value={partnerId}
              options={partners}
              onChange={(e) => { setPartnerId(e.value); setSelectedPlanId(""); }}
              placeholder="Select partner"
              filter
              style={{ width: "100%" }}
            />
          </Field>
          <Field>
            <FieldLabel>Membership Plan <span style={{ color: "#ef4444" }}>*</span></FieldLabel>
            <Dropdown
              inputId="admin-member-bulk-plan-select"
              value={selectedPlanId}
              options={planOptions}
              onChange={(e) => setSelectedPlanId(e.value)}
              placeholder={partnerId ? (planOptions.length === 0 ? "No active plans linked" : "Select plan") : "Select a partner first"}
              disabled={!partnerId || planOptions.length === 0}
              filter
              style={{ width: "100%" }}
            />
            {partnerId && planOptions.length === 0 && (
              <span style={{ fontSize: 11.5, color: "#d97706" }}>No active plans linked to this partner</span>
            )}
          </Field>
        </FormRow>

        <DropZone
          $active={dragOver}
          $hasFile={!!selectedFile}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
          {selectedFile ? (
            <>
              <CheckCircle2 size={28} color="#22c55e" style={{ marginBottom: 8 }} />
              <div style={{ fontWeight: 700, color: "#111827", fontSize: 15 }}>{selectedFile.name}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                {(selectedFile.size / 1024).toFixed(1)} KB · Click to change
              </div>
            </>
          ) : (
            <>
              <Upload size={28} color="#9ca3af" style={{ marginBottom: 8 }} />
              <div style={{ fontWeight: 600, color: "#374151", fontSize: 15 }}>
                Drag &amp; drop or click to select
              </div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                Supports .xlsx, .xls
              </div>
            </>
          )}
        </DropZone>

        <div style={{ marginBottom: "1rem", padding: "12px 16px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
            Required Excel columns
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {[
              "Sale Date", "Primary Member Full Name", "Gender", "Primary Mobile No.",
              "Primary Email ID", "Address Line1", "City", "State", "Pin Code",
            ].map(c => (
              <span key={c} style={{ fontSize: 11.5, padding: "2px 8px", borderRadius: 6, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", fontWeight: 600 }}>
                {c}
              </span>
            ))}
            <span style={{ fontSize: 11.5, color: "#9ca3af", padding: "2px 4px" }}>+ optional:</span>
            {["Sales Channel", "Partner Branch Code", "Sales Person Name", "Employee Code", "Data 1", "Data 2", "Data 3"].map(c => (
              <span key={c} style={{ fontSize: 11.5, padding: "2px 8px", borderRadius: 6, background: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb" }}>
                {c}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            label="Upload &amp; Process"
            icon="pi pi-upload"
            disabled={!canUpload}
            loading={uploadMutation.isPending}
            onClick={() => uploadMutation.mutate()}
          />
        </div>
      </Card>

      {result && (
        <>
          <ResultSection>
            <StatCard $color="#22c55e">
              <CheckCircle2 size={28} color="#22c55e" />
              <div>
                <StatLabel>Created</StatLabel>
                <StatValue>{result.created?.length ?? 0}</StatValue>
              </div>
            </StatCard>
            <StatCard $color="#f59e0b">
              <AlertCircle size={28} color="#f59e0b" />
              <div>
                <StatLabel>Skipped</StatLabel>
                <StatValue>{result.skipped?.length ?? 0}</StatValue>
              </div>
            </StatCard>
            <StatCard $color="#ef4444">
              <XCircle size={28} color="#ef4444" />
              <div>
                <StatLabel>Errors</StatLabel>
                <StatValue>{result.errors?.length ?? 0}</StatValue>
              </div>
            </StatCard>
          </ResultSection>

          {result.created?.length > 0 && (
            <Card>
              <CardTitle>Created ({result.created.length})</CardTitle>
              <Table>
                <thead>
                  <tr>
                    <Th>Row</Th>
                    <Th>Email</Th>
                    <Th>Member ID</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {result.created.map((r) => (
                    <tr key={r.id}>
                      <Td style={{ color: "#9ca3af" }}>{r.row}</Td>
                      <Td>{r.email}</Td>
                      <Td style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{r.id?.slice(-8)?.toUpperCase()}</Td>
                      <Td><ColBadge $ok>Created</ColBadge></Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          )}

          {(result.skipped?.length > 0 || result.errors?.length > 0) && (
            <Card>
              <CardTitle>Skipped &amp; Errors ({(result.skipped?.length ?? 0) + (result.errors?.length ?? 0)})</CardTitle>
              <Table>
                <thead>
                  <tr>
                    <Th>Row</Th>
                    <Th>Email</Th>
                    <Th>Reason</Th>
                    <Th>Type</Th>
                  </tr>
                </thead>
                <tbody>
                  {[...result.skipped.map(r => ({ ...r, type: "skipped" })), ...result.errors.map(r => ({ ...r, type: "error" }))].map((r, i) => (
                    <tr key={i}>
                      <Td style={{ color: "#9ca3af" }}>{r.row}</Td>
                      <Td>{r.email || "—"}</Td>
                      <Td style={{ color: "#6b7280" }}>{r.reason}</Td>
                      <Td><ColBadge>{r.type === "skipped" ? "Skipped" : "Error"}</ColBadge></Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
