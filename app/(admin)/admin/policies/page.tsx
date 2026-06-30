"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Download, FileSearch, FileText, CheckCircle, AlertTriangle, Sparkles, Upload, X, ChevronRight, Check, Info, ChevronDown, Filter, Users, CheckCheck } from "lucide-react";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import styled from "styled-components";
import { adminListPolicies, adminViewPolicyPdf, adminDownloadPolicyPdf, adminListMembers, listPolicyTypes, adminUploadPolicy } from "@/imports/core/api";
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
  background: ${p => p.$status === 'active' ? '#f0fdf4' : p.$status === 'rejected' ? '#fef2f2' : p.$status === 'Expired' ? '#fef9c3' : '#f8fafc'};
  color: ${p => p.$status === 'active' ? '#16a34a' : p.$status === 'rejected' ? '#b91c1c' : p.$status === 'Expired' ? '#854d0e' : '#64748b'};
`;

const AiExtractionBadge = styled.span<{ $s: string }>`
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11.5px; font-weight: 700;
  padding: 3px 10px; border-radius: 999px;
  background: ${p =>
    p.$s === 'processing'       ? '#eff6ff' :
    p.$s === 'need_review'      ? '#fffbeb' :
    p.$s === 'renewal_pending'  ? '#fdf4ff' :
    p.$s === 'active'           ? '#f0fdf4' :
    p.$s === 'renewed'          ? '#f0fdf4' :
    p.$s === 'rejected'         ? '#fef2f2' : '#f8fafc'};
  color: ${p =>
    p.$s === 'processing'       ? '#2563eb' :
    p.$s === 'need_review'      ? '#b45309' :
    p.$s === 'renewal_pending'  ? '#7c3aed' :
    p.$s === 'active'           ? '#16a34a' :
    p.$s === 'renewed'          ? '#16a34a' :
    p.$s === 'rejected'         ? '#b91c1c' : '#64748b'};
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

// Filter Dropdown
const ThFilterWrap = styled.div`
  display: inline-flex; align-items: center; gap: 4px; position: relative;
`;

const FilterBtn = styled.button<{ $active: boolean }>`
  display: inline-flex; align-items: center; gap: 2px;
  padding: 2px 5px; border-radius: 5px; border: none;
  background: ${p => p.$active ? '#eff6ff' : 'transparent'};
  color: ${p => p.$active ? '#2563eb' : '#94a3b8'};
  cursor: pointer; font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.04em;
  transition: background 0.12s, color 0.12s;
  &:hover { background: #f1f5f9; color: #374151; }
`;

const DropMenu = styled.div`
  position: absolute; top: calc(100% + 6px); left: 0; z-index: 200;
  background: #fff; border: 1px solid #e8eaf0; border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12); min-width: 150px; padding: 4px 0;
  animation: popIn 0.12s ease;
  @keyframes popIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:none} }
`;

const DropItem = styled.button<{ $selected: boolean }>`
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 7px 14px; border: none; background: none; cursor: pointer;
  font-size: 12.5px; color: ${p => p.$selected ? '#2563eb' : '#374151'};
  font-weight: ${p => p.$selected ? 700 : 400};
  text-align: left;
  &:hover { background: #f8f9fb; }
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

const TabBar = styled.div`display: flex; gap: 0; border-bottom: 1px solid #e8eaf0;`;

const Tab = styled.button<{ $active: boolean }>`
  background: none; border: none;
  border-bottom: 2px solid ${p => p.$active ? "#0a2257" : "transparent"};
  color: ${p => p.$active ? "#0a2257" : "#64748b"};
  font-size: 13.5px; font-weight: ${p => p.$active ? 700 : 500};
  padding: 10px 18px 12px; cursor: pointer; transition: all 0.15s; white-space: nowrap;
  &:hover { color: #0f172a; }
`;

const ExpiryWarning = styled.span<{ $expired?: boolean }>`
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 600;
  color: ${p => p.$expired ? "#dc2626" : "#b45309"};
  background: ${p => p.$expired ? "#fee2e2" : "#fef3c7"};
  border: 1px solid ${p => p.$expired ? "#fca5a5" : "#fde68a"};
  border-radius: 999px; padding: 2px 7px; margin-top: 3px; white-space: nowrap;
`;

function getDaysUntilExpiry(endDate: string | null | undefined): number | null {
  if (!endDate) return null;
  return dayjs(endDate).diff(dayjs().startOf("day"), "day");
}

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

// ─── FilterDropdown component ─────────────────────────────────────────────────

interface DropOption { label: string; value: string; }

function FilterDropdown({
  label, options, value, onChange,
}: { label: string; options: DropOption[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const active = !!value;
  const selectedLabel = options.find(o => o.value === value)?.label;

  return (
    <ThFilterWrap ref={ref}>
      <span>{label}</span>
      <FilterBtn $active={active} onClick={() => setOpen(v => !v)} title={active ? `Filtered: ${selectedLabel}` : "Filter"}>
        <Filter size={9} />
        {active && <span>{selectedLabel}</span>}
        <ChevronDown size={9} />
      </FilterBtn>
      {open && (
        <DropMenu>
          <DropItem $selected={value === ""} onClick={() => { onChange(""); setOpen(false); }}>
            {value === "" && <Check size={12} />} All
          </DropItem>
          {options.map(o => (
            <DropItem key={o.value} $selected={value === o.value} onClick={() => { onChange(o.value); setOpen(false); }}>
              {value === o.value && <Check size={12} />} {o.label}
            </DropItem>
          ))}
        </DropMenu>
      )}
    </ThFilterWrap>
  );
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

// ─── Page ─────────────────────────────────────────────────────────────────────

const STATUS_LABELS_MAP: Record<string, string> = {
  active: "Active", need_review: "Need Review",
  rejected: "Rejected", processing: "Processing",
};

export default function PoliciesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") ?? "";

  const [search, setSearch] = useState("");
  const [first, setFirst] = useState(0);
  const [detailPolicy, setDetailPolicy] = useState<any>(null);
  const [typeFilter, setTypeFilter] = useState("");
  const [aiFilter, setAiFilter] = useState("");
  const [policyTab, setPolicyTab] = useState<"active" | "expired">("active");
  const debouncedSearch = useDebounce(search, 300);

  // Upload modal state
  const queryClient = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [step, setStep] = useState<'form' | 'uploading' | 'done'>('form');
  const [memberQuery, setMemberQuery] = useState("");
  const [memberResults, setMemberResults] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [uploadPolicyTypeId, setUploadPolicyTypeId] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const memberSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setFirst(0); }, [debouncedSearch, statusFilter, typeFilter, aiFilter, policyTab]);

  const activeFilters = [
    { field: "status", value: policyTab },
    ...(typeFilter ? [{ field: "policy_type", value: typeFilter }] : []),
  ];

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "policies", debouncedSearch, policyTab, typeFilter, first],
    queryFn: () => adminListPolicies({
      global_filter: debouncedSearch,
      sort_field: "created_at",
      sort_order: -1,
      limit: ROWS,
      skip: first,
      filters: activeFilters,
    }),
  });

  const { data: policyTypesData } = useQuery({
    queryKey: ["policy-types"],
    queryFn: () => listPolicyTypes(true),
  });
  const policyTypes: any[] = policyTypesData?.data ?? [];

  const policies: any[] = data?.data?.data ?? [];
  const total: number = data?.data?.total ?? 0;
  const totalPages = Math.ceil(total / ROWS);
  const currentPage = Math.floor(first / ROWS);

  const openUploadModal = () => {
    setStep('form');
    setMemberQuery("");
    setMemberResults([]);
    setSelectedMember(null);
    setUploadPolicyTypeId("");
    setUploadFile(null);
    setUploadResult(null);
    setUploadOpen(true);
  };

  const closeUploadModal = () => setUploadOpen(false);

  const handleMemberSearch = (q: string) => {
    setMemberQuery(q);
    setSelectedMember(null);
    if (memberSearchRef.current) clearTimeout(memberSearchRef.current);
    if (!q.trim()) { setMemberResults([]); return; }
    memberSearchRef.current = setTimeout(async () => {
      try {
        const res = await adminListMembers({ global_filter: q, limit: 8, skip: 0 });
        setMemberResults(res?.data?.data ?? []);
      } catch {}
    }, 300);
  };

  const doUpload = async () => {
    if (!selectedMember || !uploadPolicyTypeId || !uploadFile) return;
    const partnerId = selectedMember.enrollments?.[0]?.partner_id;
    if (!partnerId) { toast.error("Member has no partner enrollment"); return; }
    setStep('uploading');
    try {
      const fd = new FormData();
      fd.append("user_id", selectedMember.id);
      fd.append("partner_id", partnerId);
      fd.append("policy_type_id", uploadPolicyTypeId);
      fd.append("file", uploadFile);
      const res = await adminUploadPolicy(fd);
      setUploadResult(res?.data ?? {});
      setStep('done');
      queryClient.invalidateQueries({ queryKey: ["admin", "policies"] });
    } catch (e: any) {
      setStep('form');
      toast.error(e?.response?.data?.detail || "Upload failed");
    }
  };

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
              <StatValue>{policies.filter((p: any) => p.status === "Active" || p.status === "active").length}</StatValue>
              <StatLabel>Active policies</StatLabel>
            </div>
          </AiStat>

          <AiStat>
            <StatIconBox $bg="#fffbeb" $color="#d97706">
              <AlertTriangle size={18} />
            </StatIconBox>
            <div>
              <StatValue>{policies.filter((p: any) => p.status === "Expired" || p.status === "expired").length}</StatValue>
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
          <TabBar style={{ borderBottom: "none", gap: 4 }}>
            <Tab $active={policyTab === "active"} onClick={() => { setPolicyTab("active"); setFirst(0); }}>
              Active
            </Tab>
            <Tab $active={policyTab === "expired"} onClick={() => { setPolicyTab("expired"); setFirst(0); }}>
              Expired
            </Tab>
          </TabBar>
          <CountMono>{total} policies</CountMono>
        </CardHeader>

        {/* Search */}
        <div style={{ padding: "14px 22px 0", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
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
          {typeFilter && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, height: 36, padding: "0 12px", borderRadius: 999, background: "#eff6ff", border: "1px solid #bfdbfe", fontSize: 12.5, fontWeight: 600, color: "#1d4ed8" }}>
              Type: {typeFilter}
              <button onClick={() => setTypeFilter("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", color: "#1d4ed8" }}>
                <X size={13} />
              </button>
            </div>
          )}
          {aiFilter && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, height: 36, padding: "0 12px", borderRadius: 999, background: "#eff6ff", border: "1px solid #bfdbfe", fontSize: 12.5, fontWeight: 600, color: "#1d4ed8" }}>
              AI: {STATUS_LABELS_MAP[aiFilter] ?? aiFilter}
              <button onClick={() => setAiFilter("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", color: "#1d4ed8" }}>
                <X size={13} />
              </button>
            </div>
          )}
        </div>

        <Table style={{ marginTop: 4 }}>
          <thead>
            <tr>
              <Th>Policy</Th>
              <ThSm>
                <FilterDropdown
                  label="Type"
                  value={typeFilter}
                  onChange={v => { setTypeFilter(v); setFirst(0); }}
                  options={[
                    { label: "Health", value: "Health" },
                    { label: "Life",   value: "Life" },
                    { label: "Motor",  value: "Motor" },
                    { label: "Travel", value: "Travel" },
                    { label: "Home",   value: "Home" },
                  ]}
                />
              </ThSm>
              <ThSm>Insurer</ThSm>
              <ThSm>Sum Insured</ThSm>
              <ThSm>
                <FilterDropdown
                  label="AI Extraction"
                  value={aiFilter}
                  onChange={v => { setAiFilter(v); setFirst(0); }}
                  options={[
                    { label: "Processing",  value: "processing" },
                    { label: "Need Review", value: "need_review" },
                    { label: "Approved",    value: "active" },
                    { label: "Rejected",    value: "rejected" },
                  ]}
                />
              </ThSm>
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
                    {(() => {
                      const d = getDaysUntilExpiry(row.end_date);
                      if (d !== null && d < 0) return <span style={{ color: "#94a3b8" }}>—</span>;
                      if (row.status === 'processing')                              return <AiExtractionBadge $s="processing"><span>⏳</span> Processing</AiExtractionBadge>;
                      if (row.status === 'need_review' || row.status === 'pending') return <AiExtractionBadge $s="need_review"><AlertTriangle size={12} /> Need Review</AiExtractionBadge>;
                      if (row.status === 'renewal_pending')                         return <AiExtractionBadge $s="renewal_pending"><AlertTriangle size={12} /> Renewal?</AiExtractionBadge>;
                      if (row.status === 'active' && row.previous_policy_id)        return <AiExtractionBadge $s="active"><Check size={12} /> Renewed</AiExtractionBadge>;
                      if (row.status === 'active')                                  return <AiExtractionBadge $s="active"><Check size={12} /> Approved</AiExtractionBadge>;
                      if (row.status === 'renewed')                                 return <AiExtractionBadge $s="renewed"><Check size={12} /> Superseded</AiExtractionBadge>;
                      if (row.status === 'rejected')                                return <AiExtractionBadge $s="rejected"><X size={12} /> Rejected</AiExtractionBadge>;
                      return <span style={{ color: "#94a3b8" }}>—</span>;
                    })()}
                  </TdSm>
                  <Td style={{ paddingLeft: 8 }}>
                    {(() => {
                      const d = getDaysUntilExpiry(row.end_date);
                      const isExpired = d !== null && d < 0;
                      const effectiveStatus = isExpired ? 'expired' : row.status;
                      return (
                        <>
                          {effectiveStatus
                            ? <StatusPill $status={effectiveStatus}>
                                {effectiveStatus === 'expired'          ? 'Expired' :
                                 effectiveStatus === 'processing'        ? 'Processing' :
                                 effectiveStatus === 'need_review'       ? 'Pending' :
                                 effectiveStatus === 'renewal_pending'   ? 'Renewal?' :
                                 effectiveStatus === 'active'            ? 'Active' :
                                 effectiveStatus === 'renewed'           ? 'Renewed' :
                                 effectiveStatus === 'rejected'          ? 'Rejected' : effectiveStatus}
                              </StatusPill>
                            : <span style={{ color: "#94a3b8" }}>—</span>}
                          {d !== null && d >= 0 && d <= 30 && (
                            <div><ExpiryWarning><AlertTriangle size={10} /> Expires in {d}d</ExpiryWarning></div>
                          )}
                        </>
                      );
                    })()}
                  </Td>
                  <Td style={{ paddingLeft: 8 }}>
                    <ActionBtns>
                      {row.has_file && (
                        <IconBtn title="Download PDF" onClick={() => downloadPdf(row.id, row.file_name)}>
                          <Download size={14} />
                        </IconBtn>
                      )}
                      <IconBtn $color="#7c3aed" title="Review Policy" onClick={() => router.push(`/admin/policies/${row.id}`)}>
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
        <Overlay onClick={step === 'uploading' ? undefined : closeUploadModal}>
          <ModalBox onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <ModalHeader>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Sparkles size={17} color="#2563eb" />
                <div>
                  <ModalTitle>Upload policy for member</ModalTitle>
                  <ModalStepLabel>
                    {step === 'form' && "Select member · policy type · PDF"}
                    {step === 'uploading' && "Uploading & running AI extraction…"}
                    {step === 'done' && "Policy created — AI extraction running in background"}
                  </ModalStepLabel>
                </div>
              </div>
              {step !== 'uploading' && <CloseBtn onClick={closeUploadModal}><X size={16} /></CloseBtn>}
            </ModalHeader>

            {/* Step 1: Form */}
            {step === 'form' && (
              <>
                <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Member search */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                      Member
                    </div>
                    <div style={{ position: "relative" }}>
                      <input
                        value={selectedMember ? (selectedMember.name || selectedMember.email) : memberQuery}
                        onChange={e => handleMemberSearch(e.target.value)}
                        placeholder="Search by name or email…"
                        style={{
                          width: "100%", height: 38, border: "1px solid #e0e6ec", borderRadius: 8,
                          padding: "0 12px", fontSize: 13.5, color: "#0f172a", outline: "none",
                          background: selectedMember ? "#f0fdf4" : "#fff", boxSizing: "border-box",
                        }}
                      />
                      {!selectedMember && memberResults.length > 0 && (
                        <div style={{
                          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20,
                          background: "#fff", border: "1px solid #e0e6ec", borderRadius: 8,
                          boxShadow: "0 4px 16px rgba(0,0,0,0.1)", marginTop: 4, overflow: "hidden",
                        }}>
                          {memberResults.map((m: any) => (
                            <div
                              key={m.id}
                              onClick={() => { setSelectedMember(m); setMemberQuery(""); setMemberResults([]); }}
                              style={{
                                padding: "9px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                                borderBottom: "1px solid #f1f5f9",
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = "#f7f9fb")}
                              onMouseLeave={e => (e.currentTarget.style.background = "")}
                            >
                              <div style={{
                                width: 30, height: 30, borderRadius: "50%", background: "#eff6ff",
                                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                              }}>
                                <Users size={14} color="#2563eb" />
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{m.name || m.email}</div>
                                <div style={{ fontSize: 11.5, color: "#64748b" }}>{m.email} {m.partner_name ? `· ${m.partner_name}` : ""}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedMember && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                        <span style={{ fontSize: 12, color: "#16a34a" }}>
                          ✓ {selectedMember.partner_name ? `Enrolled under ${selectedMember.partner_name}` : "Member selected"}
                        </span>
                        <button onClick={() => setSelectedMember(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 12, padding: 0 }}>
                          Change
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Policy type */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                      Policy type
                    </div>
                    <select
                      value={uploadPolicyTypeId}
                      onChange={e => setUploadPolicyTypeId(e.target.value)}
                      style={{
                        width: "100%", height: 38, border: "1px solid #e0e6ec", borderRadius: 8,
                        padding: "0 10px", fontSize: 13.5, color: uploadPolicyTypeId ? "#0f172a" : "#94a3b8",
                        outline: "none", background: "#fff", cursor: "pointer", boxSizing: "border-box",
                      }}
                    >
                      <option value="">Select policy type…</option>
                      {policyTypes.map((pt: any) => (
                        <option key={pt.id} value={pt.id}>{pt.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* File upload */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                      Policy PDF
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      style={{ display: "none" }}
                      onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
                    />
                    {uploadFile ? (
                      <div style={{
                        border: "1px solid #86efac", borderRadius: 8, padding: "10px 14px",
                        background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "space-between",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <FileText size={16} color="#16a34a" />
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{uploadFile.name}</span>
                          <span style={{ fontSize: 11.5, color: "#64748b" }}>({(uploadFile.size / 1024).toFixed(0)} KB)</span>
                        </div>
                        <button onClick={() => setUploadFile(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <DropZone onClick={() => fileInputRef.current?.click()} style={{ padding: "18px 20px" }}>
                        <DropIconBox><Upload size={20} /></DropIconBox>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Click to browse</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>PDF · up to 20 MB</div>
                      </DropZone>
                    )}
                  </div>
                </div>

                <ModalFooter>
                  <GhostBtn onClick={closeUploadModal}>Cancel</GhostBtn>
                  <AccentBtn
                    onClick={doUpload}
                    disabled={!selectedMember || !uploadPolicyTypeId || !uploadFile}
                    style={{ opacity: (!selectedMember || !uploadPolicyTypeId || !uploadFile) ? 0.5 : 1 }}
                  >
                    <Sparkles size={15} />
                    Upload &amp; extract
                  </AccentBtn>
                </ModalFooter>
              </>
            )}

            {/* Step 2: Uploading */}
            {step === 'uploading' && (
              <div style={{ padding: "56px 28px", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
                <Spinner />
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Uploading &amp; running AI extraction…</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 5 }}>
                    Extracting policy fields · syncing family members
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Done */}
            {step === 'done' && (
              <>
                <div style={{ padding: "32px 28px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CheckCheck size={28} color="#16a34a" />
                  </div>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>Policy uploaded!</div>
                    {uploadResult?.policy_number && (
                      <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                        Policy number: <strong style={{ color: "#0f172a" }}>{uploadResult.policy_number}</strong>
                      </div>
                    )}
                  </div>
                  <div style={{
                    background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10,
                    padding: "12px 16px", fontSize: 13, color: "#1d4ed8", textAlign: "left", lineHeight: 1.5,
                  }}>
                    <strong>AI extraction is running in the background.</strong><br />
                    Family members found in the policy will be added automatically within a few seconds.
                  </div>
                </div>
                <ModalFooter>
                  <AccentBtn onClick={closeUploadModal}>
                    <Check size={16} /> Done
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
