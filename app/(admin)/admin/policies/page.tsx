"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Eye, Download, FileSearch, FileText, CheckCircle, AlertTriangle, Sparkles, Upload, X, ChevronRight, Check, Info } from "lucide-react";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import styled from "styled-components";
import { adminListPolicies, adminViewPolicyPdf, adminDownloadPolicyPdf } from "@/imports/core/api";
import { useDebounce } from "@/hooks/useDebounce";

const ROWS = 20;

// ─── Styled ───────────────────────────────────────────────────────────────────

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1240px;
`;

const AiStatsRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
`;

const AiStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, auto);
  gap: 36px;
`;

const AiStat = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const StatIconBox = styled.div<{ $bg: string; $color: string }>`
  width: 40px; height: 40px; border-radius: 10px;
  background: ${p => p.$bg};
  color: ${p => p.$color};
  display: flex; align-items: center; justify-content: center;
  flex: none;
`;

const StatValue = styled.div`
  font-size: 22px; font-weight: 800; letter-spacing: -0.02em;
  color: #0f172a; line-height: 1;
`;

const StatLabel = styled.div`
  font-size: 12px; color: #64748b; margin-top: 4px;
`;

const UploadBtn = styled.button`
  display: inline-flex; align-items: center; gap: 8px;
  height: 42px; padding: 0 18px; border-radius: 10px;
  background: #0a2257; color: #fff; border: none; cursor: pointer;
  font-size: 14px; font-weight: 700; white-space: nowrap;
  transition: background 0.15s;
  &:hover { background: #0d2d6e; }
`;

const SectionCard = styled.div`
  background: #fff;
  border: 1px solid #e8eaf0;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  overflow: hidden;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid #f1f2f6;
`;

const CardTitle = styled.h3`
  font-size: 16px; font-weight: 700; color: #0f172a; margin: 0;
`;

const CountMono = styled.span`
  font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 12px; color: #64748b;
`;

const Table = styled.table`
  width: 100%; border-collapse: collapse; font-size: 13.5px;
`;

const Th = styled.th`
  padding: 11px 22px; text-align: left; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; background: #f8f9fb;
`;

const ThSm = styled(Th)` padding: 11px 8px; `;

const Td = styled.td`
  padding: 12px 22px; border-top: 1px solid #f1f2f6; vertical-align: middle;
`;

const TdSm = styled(Td)` padding: 12px 8px; `;

const PolicyMono = styled.div`
  font-family: 'IBM Plex Mono', ui-monospace, monospace; font-weight: 600; color: #0f172a; font-size: 13px;
`;

const PolicySub = styled.div`
  font-size: 12px; color: #64748b; margin-top: 1px;
`;

const TypeBadge = styled.span<{ $type: string }>`
  display: inline-flex; align-items: center;
  font-size: 11.5px; font-weight: 700;
  padding: 3px 10px; border-radius: 999px;
  background: ${p => p.$type === 'Health' ? '#eff6ff' : p.$type === 'Life' ? '#fdf4ff' : '#f8fafc'};
  color: ${p => p.$type === 'Health' ? '#1d4ed8' : p.$type === 'Life' ? '#9333ea' : '#475569'};
`;

const ExtractTag = styled.span<{ $low: boolean }>`
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11.5px; font-weight: 600; padding: 3px 10px 3px 8px; border-radius: 999px;
  color: ${p => p.$low ? '#b45309' : '#16a34a'};
  background: ${p => p.$low ? '#fffbeb' : '#f0fdf4'};
`;

const StatusPill = styled.span<{ $status: string }>`
  display: inline-flex; align-items: center;
  font-size: 11.5px; font-weight: 700;
  padding: 3px 10px; border-radius: 999px;
  background: ${p => p.$status === 'Active' ? '#f0fdf4' : p.$status === 'Expired' ? '#fef9c3' : p.$status === 'Cancelled' ? '#fef2f2' : '#f8fafc'};
  color: ${p => p.$status === 'Active' ? '#16a34a' : p.$status === 'Expired' ? '#854d0e' : p.$status === 'Cancelled' ? '#b91c1c' : '#64748b'};
`;

const ActionBtns = styled.div`
  display: flex; gap: 2px;
`;

const IconBtn = styled.button<{ $color?: string }>`
  width: 30px; height: 30px; border-radius: 8px; border: none;
  background: transparent; cursor: pointer; display: inline-flex;
  align-items: center; justify-content: center;
  color: ${p => p.$color || '#64748b'};
  transition: background 0.12s;
  &:hover { background: #f1f5f9; }
`;

// Pagination
const Pager = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 22px; border-top: 1px solid #f1f2f6;
  font-size: 13px; color: #64748b;
`;

const PagerBtn = styled.button`
  padding: 5px 14px; border-radius: 8px; border: 1px solid #e8eaf0;
  background: #fff; cursor: pointer; font-size: 13px; color: #374151;
  &:disabled { opacity: 0.4; cursor: not-allowed; }
  &:not(:disabled):hover { background: #f8f9fb; }
`;

const Skeleton = styled.div`
  height: 44px; background: linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);
  background-size: 200% 100%; border-radius: 6px;
  animation: shimmer 1.4s infinite;
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
`;

// KV Dialog
const KVTable = styled.table`
  width: 100%; border-collapse: collapse; font-size: 0.875rem;
  td { padding: 7px 10px; border-bottom: 1px solid #f3f4f6; }
  td:first-child { font-weight: 600; color: #6b7280; width: 45%; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; }
  td:last-child { color: #111827; }
  tr:last-child td { border-bottom: none; }
`;

// ─── Upload Modal ─────────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed; inset: 0; z-index: 1100;
  background: rgba(10,34,87,0.45);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  animation: fadeIn 0.2s ease;
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
`;

const ModalBox = styled.div`
  width: 840px; max-width: 100%; max-height: 92vh;
  overflow-y: auto; background: #fff;
  border-radius: 18px;
  box-shadow: 0 25px 60px rgba(0,0,0,0.25);
`;

const ModalHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 24px; border-bottom: 1px solid #f1f2f6;
`;

const ModalTitle = styled.h3`
  font-size: 16px; font-weight: 800; margin: 0; color: #0f172a;
`;

const ModalStepLabel = styled.p`
  font-size: 12px; color: #64748b; margin: 2px 0 0;
`;

const CloseBtn = styled.button`
  width: 34px; height: 34px; border-radius: 50%;
  border: 1px solid #e8eaf0; background: #fff; cursor: pointer;
  color: #64748b; display: inline-flex; align-items: center; justify-content: center;
  &:hover { background: #f8f9fb; }
`;

const ModalFooter = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  gap: 10px; padding: 16px 24px;
  border-top: 1px solid #f1f2f6; background: #f8f9fb;
`;

// Step 1: Upload
const DropZone = styled.div`
  border: 2px dashed #e2e8f0; border-radius: 16px;
  padding: 48px; text-align: center; cursor: pointer;
  background: #f8fafc;
  transition: border-color 0.15s;
  &:hover { border-color: #2563eb; }
`;

const DropIconBox = styled.div`
  display: inline-flex; width: 56px; height: 56px; border-radius: 14px;
  background: #eff6ff; color: #2563eb;
  align-items: center; justify-content: center; margin-bottom: 14px;
`;

// Step 2: Extracting
const Spinner = styled.span`
  width: 46px; height: 46px; border-radius: 50%;
  border: 4px solid #dbeafe; border-top-color: #2563eb;
  display: inline-block;
  animation: spin 0.7s linear infinite;
  @keyframes spin { to { transform: rotate(360deg) } }
`;

// Step 3: Review
const ReviewGrid = styled.div`
  display: grid; grid-template-columns: 230px 1fr; gap: 22px;
  align-items: start; padding: 22px 24px;
`;

const DocPreview = styled.div`
  background: #f1f5f9; border: 1px solid #e8eaf0;
  border-radius: 12px; padding: 16px; position: relative;
`;

const DocCard = styled.div`
  background: #fff; border: 1px solid #e8eaf0; border-radius: 6px;
  padding: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);
`;

const DocLine = styled.div<{ $w: string; $color?: string }>`
  height: 5px; width: ${p => p.$w}; border-radius: 2px;
  background: ${p => p.$color || '#e2e8f0'}; margin-bottom: 6px;
`;

const PdfBadge = styled.span`
  position: absolute; top: 10px; right: 10px;
  font-size: 10px; font-weight: 700; color: #fff;
  background: #ef4444; border-radius: 4px; padding: 2px 6px;
`;

const DocFilename = styled.div`
  font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 11.5px; color: #64748b;
  margin-top: 10px; text-align: center;
`;

const ToggleRow = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 8px;
`;

const ToggleLabel = styled.label`
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 13px; color: #64748b; cursor: pointer;
`;

const ToggleTrack = styled.span<{ $on: boolean }>`
  width: 36px; height: 20px; border-radius: 999px;
  background: ${p => p.$on ? '#22c55e' : '#e2e8f0'};
  position: relative; transition: background 0.2s;
  flex: none; display: inline-block; cursor: pointer;
  &::after {
    content: ''; position: absolute;
    width: 16px; height: 16px; border-radius: 50%;
    background: #fff; top: 2px;
    left: ${p => p.$on ? '18px' : '2px'};
    transition: left 0.2s;
    box-shadow: 0 1px 2px rgba(0,0,0,0.15);
  }
`;

const AlertBanner = styled.div`
  background: #fffbeb; border: 1px solid #fcd34d; border-radius: 10px;
  padding: 10px 14px; margin-bottom: 10px;
  font-size: 12.5px; color: #92400e; display: flex; gap: 8px; align-items: flex-start;
`;

const FieldRow = styled.div`
  display: flex; align-items: center; gap: 12px;
  padding: 9px 0; border-top: 1px solid #f1f2f6;
`;

const FieldLabel = styled.div`
  width: 118px; flex: none;
  font-size: 12px; font-weight: 600; color: #64748b;
`;

const FieldInput = styled.input`
  flex: 1; height: 36px; border-radius: 8px;
  border: 1px solid #e2e8f0; padding: 0 10px;
  font-size: 13px; color: #0f172a;
  outline: none;
  &:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
`;

const ConfChip = styled.span<{ $low: boolean }>`
  display: inline-flex; align-items: center; gap: 4px;
  flex: none; font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 11px; font-weight: 600;
  padding: 3px 8px; border-radius: 999px;
  color: ${p => p.$low ? '#b45309' : '#16a34a'};
  background: ${p => p.$low ? '#fffbeb' : '#f0fdf4'};
`;

// Step 4: Summary
const SummaryBlock = styled.div`
  background: #eff6ff; border: 1px solid #bfdbfe;
  border-radius: 12px; padding: 18px 20px;
  font-size: 14px; color: #374151; line-height: 1.65;
`;

const SummaryGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; margin-top: 18px;
`;

const SummaryPoint = styled.div`
  display: flex; align-items: flex-start; gap: 9px;
  padding: 8px 0; border-top: 1px solid #f1f2f6;
`;

const InfoNote = styled.div`
  display: flex; align-items: flex-start; gap: 8px;
  margin-top: 18px; padding: 12px 14px;
  background: #f8fafc; border-radius: 10px;
  font-size: 12px; color: #64748b; line-height: 1.5;
`;

// ─── Ghost button ─────────────────────────────────────────────────────────────
const GhostBtn = styled.button`
  display: inline-flex; align-items: center; gap: 6px;
  height: 42px; padding: 0 16px; border-radius: 10px;
  background: transparent; border: 1px solid #e8eaf0;
  cursor: pointer; font-size: 14px; font-weight: 600; color: #374151;
  &:hover { background: #f8f9fb; }
`;

const AccentBtn = styled.button`
  display: inline-flex; align-items: center; gap: 8px;
  height: 42px; padding: 0 20px; border-radius: 10px;
  background: #0a2257; color: #fff; border: none; cursor: pointer;
  font-size: 14px; font-weight: 700;
  &:hover { background: #0d2d6e; }
`;

// ─── Data ─────────────────────────────────────────────────────────────────────

const EXTRACT_FIELDS = [
  { key: 'policyType',   label: 'Policy type',   value: 'Health',                             conf: 99 },
  { key: 'policyNumber', label: 'Policy number',  value: 'HFL/2026/8841902',                   conf: 97 },
  { key: 'insuredName',  label: 'Insured name',   value: 'Rohan Mehta',                        conf: 95 },
  { key: 'insurer',      label: 'Insurer name',   value: 'Star Health & Allied Insurance',     conf: 92 },
  { key: 'sumInsured',   label: 'Sum insured',    value: '₹10,00,000',                         conf: 88 },
  { key: 'policyPeriod', label: 'Policy period',  value: '14 Apr 2026 – 13 Apr 2027',          conf: 61 },
];

const SUMMARY_POINTS = [
  { label: 'Sum insured',        value: '₹10,00,000' },
  { label: 'Policy period',      value: '14 Apr 2026 – 13 Apr 2027' },
  { label: 'Room rent',          value: 'Up to 1% of SI / day' },
  { label: 'No-claim bonus',     value: '10% per claim-free year' },
];

const STEP_LABELS: Record<string, string> = {
  upload:     'Step 1 of 3 · Upload document',
  extracting: 'Working…',
  review:     'Step 2 of 3 · Review & confirm',
  summary:    'Step 3 of 3 · Policy summary',
};

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PoliciesPage() {
  const [search, setSearch] = useState("");
  const [first, setFirst] = useState(0);
  const [detailPolicy, setDetailPolicy] = useState<any>(null);
  const debouncedSearch = useDebounce(search, 300);

  // Upload modal state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [step, setStep] = useState<'upload' | 'extracting' | 'review' | 'summary'>('upload');
  const [manualMode, setManualMode] = useState(false);
  const [editedFields, setEditedFields] = useState<Record<string, string>>({});
  const extractTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setFirst(0); }, [debouncedSearch]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "policies", debouncedSearch, first],
    queryFn: () => adminListPolicies({
      global_filter: debouncedSearch,
      sort_field: "created_at",
      sort_order: -1,
      limit: ROWS,
      skip: first,
    }),
  });

  const policies: any[] = data?.data?.data ?? [];
  const total: number = data?.data?.total ?? 0;
  const totalPages = Math.ceil(total / ROWS);
  const currentPage = Math.floor(first / ROWS);

  const openUploadModal = () => {
    setStep('upload');
    setManualMode(false);
    setEditedFields({});
    setUploadOpen(true);
  };

  const closeUploadModal = () => {
    setUploadOpen(false);
    if (extractTimerRef.current) clearTimeout(extractTimerRef.current);
  };

  const runExtract = () => {
    setStep('extracting');
    extractTimerRef.current = setTimeout(() => {
      setStep('review');
    }, 1700);
  };

  const confirmPolicy = () => {
    setUploadOpen(false);
    toast.success("Policy added — member notified");
  };

  const flaggedCount = EXTRACT_FIELDS.filter(f => f.conf < 80).length;

  const extractedFields: Record<string, string> = detailPolicy?.extracted_fields ?? {};
  const hasFields = Object.keys(extractedFields).length > 0;

  return (
    <Page>
      {/* ── AI Stats Row ──────────────────────────────────────────────── */}
      <AiStatsRow>
        <AiStats>
          <AiStat>
            <StatIconBox $bg="#eff6ff" $color="#2563eb">
              <FileText size={18} />
            </StatIconBox>
            <div>
              <StatValue>{total}</StatValue>
              <StatLabel>Total policies</StatLabel>
            </div>
          </AiStat>

          <AiStat>
            <StatIconBox $bg="#f0fdf4" $color="#16a34a">
              <CheckCircle size={18} />
            </StatIconBox>
            <div>
              <StatValue>{policies.filter((p: any) => p.status === "Active" || p.status === "active").length || "—"}</StatValue>
              <StatLabel>Active policies</StatLabel>
            </div>
          </AiStat>

          <AiStat>
            <StatIconBox $bg="#fffbeb" $color="#d97706">
              <AlertTriangle size={18} />
            </StatIconBox>
            <div>
              <StatValue>{policies.filter((p: any) => p.status === "Expired" || p.status === "expired").length || "—"}</StatValue>
              <StatLabel>Expired policies</StatLabel>
            </div>
          </AiStat>
        </AiStats>

        <UploadBtn onClick={openUploadModal}>
          <Upload size={16} />
          Upload policy
        </UploadBtn>
      </AiStatsRow>

      {/* ── Policy Repository ─────────────────────────────────────────── */}
      <SectionCard>
        <CardHeader>
          <CardTitle>Policy repository</CardTitle>
          <CountMono>{total} policies</CountMono>
        </CardHeader>

        {/* Search */}
        <div style={{ padding: "14px 22px 0", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative", width: 280 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx={11} cy={11} r={7} /><path d="M21 21l-4-4" />
              </svg>
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search policies…"
              style={{ width: "100%", height: 36, paddingLeft: 32, paddingRight: 10, borderRadius: 999, border: "1px solid #e8eaf0", fontSize: 13, outline: "none", background: "#f8f9fb" }}
            />
          </div>
        </div>

        <Table style={{ marginTop: 4 }}>
          <thead>
            <tr>
              <Th>Policy</Th>
              <ThSm>Type</ThSm>
              <ThSm>Insurer</ThSm>
              <ThSm>Sum Insured</ThSm>
              <ThSm>AI Extraction</ThSm>
              <Th style={{ paddingLeft: 8 }}>Status</Th>
              <Th style={{ paddingLeft: 8 }}>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <Td colSpan={7}><Skeleton /></Td>
                </tr>
              ))
            ) : policies.length === 0 ? (
              <tr>
                <Td colSpan={7} style={{ textAlign: "center", color: "#94a3b8", padding: "32px 22px" }}>
                  No policies found.
                </Td>
              </tr>
            ) : policies.map((row: any) => {
              const hasExtracted = row.extracted_fields && Object.keys(row.extracted_fields).length > 0;
              const policyType: string = row.policy_type || "";
              return (
                <tr
                  key={row.id}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fb")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}
                >
                  <Td>
                    <PolicyMono>{row.policy_number || "—"}</PolicyMono>
                    <PolicySub>{row.member_name || ""}</PolicySub>
                  </Td>
                  <TdSm>
                    {policyType
                      ? <TypeBadge $type={policyType}>{policyType}</TypeBadge>
                      : <span style={{ color: "#94a3b8" }}>—</span>}
                  </TdSm>
                  <TdSm style={{ color: "#374151" }}>{row.insurer || "—"}</TdSm>
                  <TdSm style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontWeight: 500, color: "#0f172a" }}>
                    {row.sum_insured != null ? `₹${Number(row.sum_insured).toLocaleString("en-IN")}` : "—"}
                  </TdSm>
                  <TdSm>
                    <ExtractTag $low={!hasExtracted}>
                      {hasExtracted
                        ? <><Check size={12} /> Extracted</>
                        : <><AlertTriangle size={12} /> Needs review</>}
                    </ExtractTag>
                  </TdSm>
                  <Td style={{ paddingLeft: 8 }}>
                    {row.status
                      ? <StatusPill $status={row.status}>{row.status}</StatusPill>
                      : <span style={{ color: "#94a3b8" }}>—</span>}
                  </Td>
                  <Td style={{ paddingLeft: 8 }}>
                    <ActionBtns>
                      {row.has_file && (
                        <>
                          <IconBtn $color="#2563eb" title="View PDF" onClick={() => openPdf(row.id)}>
                            <Eye size={14} />
                          </IconBtn>
                          <IconBtn title="Download" onClick={() => downloadPdf(row.id, row.file_name)}>
                            <Download size={14} />
                          </IconBtn>
                        </>
                      )}
                      <IconBtn $color="#7c3aed" title="Extracted Details" onClick={() => setDetailPolicy(row)}>
                        <FileSearch size={14} />
                      </IconBtn>
                    </ActionBtns>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>

        {/* Pagination */}
        {total > ROWS && (
          <Pager>
            <span>Showing {first + 1}–{Math.min(first + ROWS, total)} of {total}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <PagerBtn disabled={currentPage === 0} onClick={() => setFirst(first - ROWS)}>← Prev</PagerBtn>
              <PagerBtn disabled={currentPage >= totalPages - 1} onClick={() => setFirst(first + ROWS)}>Next →</PagerBtn>
            </div>
          </Pager>
        )}
      </SectionCard>

      {/* ── Upload Modal ──────────────────────────────────────────────── */}
      {uploadOpen && (
        <Overlay onClick={closeUploadModal}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Sparkles size={17} color="#2563eb" />
                <div>
                  <ModalTitle>Upload policy — AI extraction</ModalTitle>
                  <ModalStepLabel>{STEP_LABELS[step]}</ModalStepLabel>
                </div>
              </div>
              <CloseBtn onClick={closeUploadModal}><X size={16} /></CloseBtn>
            </ModalHeader>

            {/* Step 1: Upload */}
            {step === 'upload' && (
              <>
                <div style={{ padding: 28 }}>
                  <DropZone onClick={runExtract}>
                    <DropIconBox><Upload size={24} /></DropIconBox>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                      Drop a policy PDF, or click to browse
                    </div>
                    <div style={{ fontSize: 13, color: "#64748b", marginTop: 5 }}>
                      Health, Motor or Life policy documents · up to 20 MB
                    </div>
                  </DropZone>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 18 }}>
                    <span style={{ fontSize: 12.5, color: "#64748b" }}>For this demo:</span>
                    <GhostBtn style={{ height: 34, padding: "0 14px", fontSize: 13 }} onClick={runExtract}>
                      <Sparkles size={14} color="#2563eb" />
                      Use a sample policy
                    </GhostBtn>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Extracting */}
            {step === 'extracting' && (
              <div style={{ padding: "56px 28px", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
                <Spinner />
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>AI is reading the document…</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 5 }}>
                    Detecting fields · extracting policy number, insured name, sum insured &amp; period
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 'review' && (
              <>
                <ReviewGrid>
                  {/* Doc preview */}
                  <div>
                    <DocPreview>
                      <DocCard>
                        <div style={{ height: 7, width: "55%", background: "#0a2257", borderRadius: 2, marginBottom: 10 }} />
                        <DocLine $w="90%" /><DocLine $w="80%" /><DocLine $w="88%" style={{ marginBottom: 14 }} />
                        <DocLine $w="40%" $color="#86efac" /><DocLine $w="70%" /><DocLine $w="60%" style={{ marginBottom: 0 }} />
                      </DocCard>
                      <PdfBadge>PDF</PdfBadge>
                    </DocPreview>
                    <DocFilename>Rohan-Mehta-Health.pdf · 3 pages</DocFilename>
                  </div>

                  {/* Fields */}
                  <div>
                    <ToggleRow>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                        {manualMode ? "Manual entry — AI auto-fill disabled" : "AI auto-filled 6 fields — confirm or edit"}
                      </div>
                      <ToggleLabel>
                        Enter manually
                        <ToggleTrack $on={manualMode} onClick={() => { setManualMode(v => !v); setEditedFields({}); }} />
                      </ToggleLabel>
                    </ToggleRow>

                    {!manualMode && flaggedCount > 0 && (
                      <AlertBanner>
                        <AlertTriangle size={14} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
                        <span>
                          <strong>{flaggedCount} field needs your confirmation</strong> — Policy period was read with low confidence. Please verify below.
                        </span>
                      </AlertBanner>
                    )}

                    <div>
                      {EXTRACT_FIELDS.map(f => {
                        const low = f.conf < 80;
                        const val = manualMode
                          ? (editedFields[f.key] ?? "")
                          : (editedFields[f.key] ?? f.value);
                        return (
                          <FieldRow key={f.key}>
                            <FieldLabel>{f.label}</FieldLabel>
                            <FieldInput
                              value={val}
                              placeholder={manualMode ? "Type to enter…" : ""}
                              onChange={e => setEditedFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                            />
                            {!manualMode && (
                              <ConfChip $low={low}>
                                {low ? <AlertTriangle size={11} /> : <Check size={11} />}
                                {low ? "Needs review" : "Auto-filled"}
                              </ConfChip>
                            )}
                          </FieldRow>
                        );
                      })}
                    </div>
                  </div>
                </ReviewGrid>

                <ModalFooter>
                  <span style={{ fontSize: 12, color: "#64748b" }}>
                    Customer confirms the auto-filled data before it is saved.
                  </span>
                  <div style={{ display: "flex", gap: 10 }}>
                    <GhostBtn onClick={closeUploadModal}>Cancel</GhostBtn>
                    <AccentBtn onClick={() => setStep('summary')}>
                      Confirm &amp; summarise <ChevronRight size={15} />
                    </AccentBtn>
                  </div>
                </ModalFooter>
              </>
            )}

            {/* Step 4: Summary */}
            {step === 'summary' && (
              <>
                <div style={{ padding: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
                    <Sparkles size={17} color="#2563eb" />
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>AI policy summary</h3>
                  </div>

                  <SummaryBlock>
                    This is a Star Health individual health insurance policy for Rohan Mehta with a sum insured of ₹10,00,000, valid from 14 Apr 2026 to 13 Apr 2027. It covers in-patient hospitalisation, pre- and post-hospitalisation expenses and day-care procedures, subject to a 30-day initial waiting period.
                  </SummaryBlock>

                  <SummaryGrid>
                    {SUMMARY_POINTS.map(pt => (
                      <SummaryPoint key={pt.label}>
                        <Check size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "#64748b" }}>{pt.label}</div>
                          <div style={{ fontSize: 13.5, color: "#0f172a", fontWeight: 600, marginTop: 2 }}>{pt.value}</div>
                        </div>
                      </SummaryPoint>
                    ))}
                  </SummaryGrid>

                  <InfoNote>
                    <Info size={15} color="#94a3b8" style={{ flexShrink: 0, marginTop: 1 }} />
                    Summaries are generated from the extracted policy data only. Free-form "ask anything about my policy" Q&A is planned for a later release.
                  </InfoNote>
                </div>

                <ModalFooter>
                  <GhostBtn onClick={() => setStep('review')}>Back</GhostBtn>
                  <AccentBtn onClick={confirmPolicy}>
                    <Check size={16} />
                    Confirm &amp; add policy
                  </AccentBtn>
                </ModalFooter>
              </>
            )}
          </ModalBox>
        </Overlay>
      )}

      {/* ── Extracted Fields Dialog ───────────────────────────────────── */}
      <Dialog
        visible={!!detailPolicy}
        onHide={() => setDetailPolicy(null)}
        header={`Extracted Details — ${detailPolicy?.policy_number ?? ""}`}
        style={{ width: "520px" }}
        modal
        draggable={false}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button label="Close" severity="secondary" text onClick={() => setDetailPolicy(null)} />
          </div>
        }
      >
        {hasFields ? (
          <KVTable>
            <tbody>
              {Object.entries(extractedFields).map(([k, v]) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td>{String(v)}</td>
                </tr>
              ))}
            </tbody>
          </KVTable>
        ) : (
          <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>
            No extracted data available for this policy.
          </p>
        )}
      </Dialog>
    </Page>
  );
}
