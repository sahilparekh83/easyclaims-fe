"use client";

import React, { useCallback, useRef, useState } from "react";
import styled from "styled-components";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { toast } from "react-toastify";

// ─── Styled ───────────────────────────────────────────────────────────────────

const Page = styled.div`
  max-width: 800px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Card = styled.div`
  background: #fff;
  border: 1px solid #e0e6ec;
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(10,42,87,0.06);
  overflow: hidden;
`;

const CardHeader = styled.div`
  padding: 18px 22px;
  border-bottom: 1px solid #f1f2f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CardTitle = styled.h3`
  font-size: 15px;
  font-weight: 700;
  color: #161d26;
  margin: 0;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
`;

const CardBody = styled.div`
  padding: 22px;
`;

const DropZone = styled.div<{ $active: boolean; $hasFile: boolean }>`
  border: 2px dashed ${p => p.$active ? "#2563eb" : p.$hasFile ? "#16a34a" : "#d1d5db"};
  border-radius: 12px;
  padding: 40px 24px;
  text-align: center;
  background: ${p => p.$active ? "#eff6ff" : p.$hasFile ? "#f0fdf4" : "#f8fafc"};
  cursor: pointer;
  transition: all 0.2s;
`;

const DropIcon = styled.div`
  font-size: 32px;
  margin-bottom: 8px;
`;

const DropText = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #3a4756;
  margin-bottom: 4px;
`;

const DropSub = styled.div`
  font-size: 12px;
  color: #9ca3af;
`;

const ResultGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
`;

const StatCard = styled.div<{ $color: string }>`
  background: ${p => p.$color}15;
  border: 1px solid ${p => p.$color}40;
  border-radius: 10px;
  padding: 14px 16px;
  text-align: center;
`;

const StatValue = styled.div<{ $color: string }>`
  font-size: 28px;
  font-weight: 800;
  color: ${p => p.$color};
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
`;

const StatLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7a8c;
  margin-top: 4px;
`;

const ErrorTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
`;

const ETh = styled.th`
  padding: 9px 12px;
  text-align: left;
  background: #f7f9fb;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7a8c;
`;

const ETd = styled.td`
  padding: 10px 12px;
  border-top: 1px solid #f1f2f6;
  color: #3a4756;
`;

const ErrorBadge = styled.span`
  display: inline-block;
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 11px;
  margin: 2px;
`;

const RequiredCols = styled.div`
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 10px;
  padding: 14px 18px;
  font-size: 13px;
  color: #0369a1;
`;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadResult {
  total_rows: number;
  created: Array<{ row: number; email: string }>;
  skipped: Array<{ row: number; email?: string; reason: string }>;
  errors: Array<{ row: number; email?: string; errors: string[] }>;
}

export interface PlanOption {
  label: string;
  value: string;
}

export interface MemberBulkUploadProps {
  title: string;
  subtitle: string;
  dropdownInputId: string;
  dropdownPlaceholder: string;
  noPlansMessage: string;
  planOptions: PlanOption[];
  onBack: () => void;
  uploadFn: (file: File, planId: string) => Promise<any>;
  downloadSampleFn: () => Promise<Blob>;
  downloadReportFn: (file: File) => Promise<Blob>;
  /** When true, each row assigns its own plan via a mandatory "Plan Code" column —
   *  hides the Default Plan dropdown and updates the required-columns copy. */
  planCodeMode?: boolean;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MemberBulkUpload({
  title,
  subtitle,
  dropdownInputId,
  dropdownPlaceholder,
  noPlansMessage,
  planOptions,
  onBack,
  uploadFn,
  downloadSampleFn,
  downloadReportFn,
  planCodeMode = false,
}: MemberBulkUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingSample, setDownloadingSample] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFile = (f: File) => {
    if (!f.name.endsWith(".xlsx") && !f.name.endsWith(".xls")) {
      setSelectedFile(null);
      setResult(null);
      setUploadError("Please upload an Excel file (.xlsx or .xls)");
      return;
    }
    setSelectedFile(f);
    setResult(null);
    setUploadError(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError(null);
    try {
      const res = await uploadFn(selectedFile, selectedPlanId);
      const payload: UploadResult = (res as any)?.data ?? res;
      setResult(payload);
      toast.success(`Upload complete — ${payload.created?.length ?? 0} member(s) created`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: unknown } }; message?: string };
      const detail = axiosErr?.response?.data?.detail ?? axiosErr?.message ?? "Upload failed";
      setUploadError(typeof detail === "string" ? detail : JSON.stringify(detail));
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadSample = async () => {
    setDownloadingSample(true);
    try {
      const blob = await downloadSampleFn();
      triggerDownload(blob, "member_upload_sample.xlsx");
    } catch {
      setUploadError("Failed to download sample file");
    } finally {
      setDownloadingSample(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!selectedFile) return;
    setDownloading(true);
    try {
      const blob = await downloadReportFn(selectedFile);
      triggerDownload(blob, "member_upload_report.xlsx");
    } catch {
      setUploadError("Failed to generate error report");
    } finally {
      setDownloading(false);
    }
  };

  const hasErrors = result && ((result.errors?.length ?? 0) > 0 || (result.skipped?.length ?? 0) > 0);

  return (
    <Page>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Button icon="pi pi-arrow-left" severity="secondary" text onClick={onBack} />
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#161d26", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
            {title}
          </h1>
          <div style={{ fontSize: 13, color: "#6b7a8c", marginTop: 2 }}>{subtitle}</div>
        </div>
      </div>

      {/* Required columns */}
      <Card>
        <CardHeader><CardTitle>Required Excel Columns</CardTitle></CardHeader>
        <CardBody>
          <RequiredCols>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Mandatory columns:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(planCodeMode ? ["Email ID", "Name", "Mobile Number", "Plan Code"] : ["Email ID", "Name", "Mobile Number"]).map(col => (
                <span key={col} style={{ background: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd", borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>
                  {col}
                </span>
              ))}
            </div>
            <div style={{ marginTop: 10, color: "#0369a1", fontSize: 12 }}>
              Optional columns:{" "}
              {!planCodeMode && <><strong>Plan Name</strong>, </>}
              <strong>Gender</strong>, <strong>Address</strong>, <strong>City</strong>, <strong>State</strong>, <strong>PIN Code</strong>,{" "}
              <strong>Sale Date</strong>, <strong>Sales Channel</strong>, <strong>Branch Code</strong>, <strong>Salesperson Name</strong>,{" "}
              <strong>Employee Code</strong>, <strong>Data 1</strong>, <strong>Data 2</strong>, <strong>Data 3</strong>
            </div>
            {planCodeMode ? (
              <div style={{ marginTop: 8, color: "#0369a1", fontSize: 12 }}>
                Every row must set its own <strong>Plan Code</strong> — one member, one plan. See the
                "Partner Plans" tab in the downloaded sample for this partner's plan names and codes.
              </div>
            ) : (
              <div style={{ marginTop: 8, color: "#0369a1", fontSize: 12 }}>
                Add a <strong>Plan Name</strong> column to enroll different rows into different plans — a row's own
                Plan Name overrides the default plan selected below. Copy exact plan names from the Plans page.
              </div>
            )}
          </RequiredCols>
        </CardBody>
      </Card>

      {/* Upload */}
      <Card>
        <CardHeader><CardTitle>Upload File</CardTitle></CardHeader>
        <CardBody>
          <Button
            label={downloadingSample ? "Downloading…" : "↓ Download Sample Excel"}
            icon="pi pi-file-excel"
            severity="secondary"
            outlined
            size="small"
            loading={downloadingSample}
            disabled={downloadingSample}
            onClick={handleDownloadSample}
            style={{ marginBottom: 16 }}
          />
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
          />
          <DropZone
            $active={dragActive}
            $hasFile={!!selectedFile}
            onDragOver={e => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
          >
            <DropIcon>{selectedFile ? "📄" : "📂"}</DropIcon>
            {selectedFile ? (
              <>
                <DropText style={{ color: "#16a34a" }}>{selectedFile.name}</DropText>
                <DropSub>{(selectedFile.size / 1024).toFixed(1)} KB — click to replace</DropSub>
              </>
            ) : (
              <>
                <DropText>Drop Excel file here or click to browse</DropText>
                <DropSub>Supports .xlsx and .xls files</DropSub>
              </>
            )}
          </DropZone>

          {!planCodeMode && (
            <div style={{ marginTop: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                Default Plan <span style={{ color: "#9ca3af", fontWeight: 500 }}>(optional — used only for rows without a Plan Name)</span>
              </label>
              <Dropdown
                inputId={dropdownInputId}
                value={selectedPlanId}
                onChange={e => setSelectedPlanId(e.value)}
                options={planOptions}
                placeholder={dropdownPlaceholder}
                filter
                showClear
                style={{ width: "100%" }}
              />
              {planOptions.length === 0 && (
                <div style={{ fontSize: 12, color: "#d97706", marginTop: 4 }}>{noPlansMessage}</div>
              )}
            </div>
          )}

          {uploadError && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 13 }}>
              {uploadError}
            </div>
          )}

          <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
            <Button
              label={uploading ? "Uploading…" : "Upload & Import"}
              icon="pi pi-upload"
              loading={uploading}
              disabled={!selectedFile || uploading}
              onClick={handleUpload}
            />
            {selectedFile && (
              <Button
                label={downloading ? "Generating…" : "Download Error Report"}
                icon="pi pi-download"
                severity="secondary"
                outlined
                loading={downloading}
                disabled={downloading}
                onClick={handleDownloadReport}
                title="Download Excel with error rows highlighted red"
              />
            )}
          </div>
        </CardBody>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Results</CardTitle>
            {hasErrors && (
              <Button
                label="Download Error Report"
                icon="pi pi-download"
                severity="warning"
                outlined
                size="small"
                loading={downloading}
                onClick={handleDownloadReport}
              />
            )}
          </CardHeader>
          <CardBody>
            <ResultGrid>
              <StatCard $color="#16a34a">
                <StatValue $color="#16a34a">{result.created?.length ?? 0}</StatValue>
                <StatLabel>Created</StatLabel>
              </StatCard>
              <StatCard $color="#d97706">
                <StatValue $color="#d97706">{result.skipped?.length ?? 0}</StatValue>
                <StatLabel>Skipped (duplicate)</StatLabel>
              </StatCard>
              <StatCard $color="#dc2626">
                <StatValue $color="#dc2626">{result.errors?.length ?? 0}</StatValue>
                <StatLabel>Errors</StatLabel>
              </StatCard>
            </ResultGrid>

            {(result.errors?.length ?? 0) > 0 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#dc2626", marginBottom: 10 }}>
                  Rows with errors — fix and re-upload, or download the highlighted report:
                </div>
                <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid #fecaca" }}>
                  <ErrorTable>
                    <thead><tr><ETh>Row</ETh><ETh>Email</ETh><ETh>Errors</ETh></tr></thead>
                    <tbody>
                      {(result.errors ?? []).map((e, i) => (
                        <tr key={i}>
                          <ETd style={{ fontFamily: "monospace", color: "#dc2626", fontWeight: 600 }}>#{e.row}</ETd>
                          <ETd>{e.email ?? "—"}</ETd>
                          <ETd>{e.errors.map((msg, j) => <ErrorBadge key={j}>{msg}</ErrorBadge>)}</ETd>
                        </tr>
                      ))}
                    </tbody>
                  </ErrorTable>
                </div>
              </div>
            )}

            {(result.skipped?.length ?? 0) > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#d97706", marginBottom: 10 }}>
                  Skipped rows (member already exists):
                </div>
                <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid #fed7aa" }}>
                  <ErrorTable>
                    <thead><tr><ETh>Row</ETh><ETh>Email</ETh><ETh>Reason</ETh></tr></thead>
                    <tbody>
                      {(result.skipped ?? []).map((s, i) => (
                        <tr key={i}>
                          <ETd style={{ fontFamily: "monospace", fontWeight: 600 }}>#{s.row}</ETd>
                          <ETd>{s.email ?? "—"}</ETd>
                          <ETd style={{ color: "#d97706" }}>{s.reason}</ETd>
                        </tr>
                      ))}
                    </tbody>
                  </ErrorTable>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </Page>
  );
}
