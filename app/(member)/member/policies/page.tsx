"use client";
import React, { useState, useRef } from "react";
import styled, { keyframes } from "styled-components";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, Download, Upload, CheckCircle2, X, AlertTriangle, RefreshCw } from "lucide-react";
import PoliciesTable from "@/components/ui/PoliciesTable";
import ClaimPolicyModal from "@/components/ui/ClaimPolicyModal";
import {
  memberListPolicies, memberUploadPolicy, memberUpdatePolicy,
  memberDeletePolicy, memberViewPolicyPdf, memberDownloadPolicyPdf,
  listPolicyTypes, memberListFamily, memberListNominees,
} from "@/imports/core/api";
import PolicyStatusBadge from "@/components/ui/PolicyStatusBadge";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { useDebounce } from "@/hooks/useDebounce";
import { getApiError } from "@/imports/core/errors";

const ROWS = 20;

// ─── Upload overlay — same style as /upload page ──────────────────────────────

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`from{transform:rotate(0deg)}to{transform:rotate(360deg)}`;

const Overlay = styled.div`
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(10,42,87,0.52);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
`;

const ModalCard = styled.div`
  width: 100%; max-width: 480px;
  background: #fff; border-radius: 18px;
  padding: 40px 36px;
  box-shadow: 0 4px 32px rgba(10,42,87,0.18);
  animation: ${fadeUp} 0.25s ease;
  max-height: 92vh; overflow-y: auto;
  position: relative;
`;

const ModalClose = styled.button`
  position: absolute; top: 14px; right: 14px;
  background: none; border: none; cursor: pointer;
  color: #94a3b8; padding: 4px; border-radius: 6px;
  display: flex; align-items: center;
  &:hover { background: #f1f5f9; color: #3a4756; }
`;

const ModalTitle = styled.h2`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 20px; font-weight: 800; color: #161d26;
  margin-bottom: 6px;
`;

const ModalSub = styled.p`
  font-family: 'Public Sans', sans-serif;
  font-size: 14px; color: #6b7a8c;
  margin-bottom: 28px; line-height: 1.5;
`;

const FieldLabel = styled.label`
  display: block;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px; font-weight: 600; color: #3a4756;
  margin-bottom: 6px;
`;

const UploadSelect = styled.select`
  width: 100%; height: 42px;
  border: 1.5px solid #e0e6ec; border-radius: 10px;
  padding: 0 12px; font-size: 14px; color: #161d26;
  background: #f7f9fb; outline: none; cursor: pointer;
  margin-bottom: 18px;
  &:focus { border-color: #0050b0; background: #fff; }
`;

const UploadInput = styled.input`
  width: 100%; height: 42px;
  border: 1.5px solid #e0e6ec; border-radius: 10px;
  padding: 0 12px; font-size: 14px; color: #161d26;
  background: #f7f9fb; outline: none;
  margin-bottom: 18px;
  &:focus { border-color: #0050b0; background: #fff; }
`;

const UploadDropzone = styled.div<{ $active: boolean; $hasFile: boolean }>`
  border: 2px dashed ${p => p.$active ? "#0050b0" : p.$hasFile ? "#65a147" : "#b0c8e8"};
  border-radius: 12px;
  padding: 32px 20px;
  text-align: center;
  cursor: pointer;
  background: ${p => p.$active ? "#eff6ff" : p.$hasFile ? "#f0fdf4" : "#f7f9fb"};
  transition: all 0.15s;
  margin-bottom: 20px;
`;

const DropIcon = styled.div`color: #6b7a8c; margin-bottom: 10px;`;

const DropText = styled.p`
  font-family: 'Public Sans', sans-serif;
  font-size: 14px; color: #6b7a8c; margin: 0;
`;

const DropFileName = styled.p`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 13px; color: #0050b0; margin-top: 8px; font-weight: 600;
`;

const FamilyBox = styled.div`
  border: 1.5px solid #e0e6ec; border-radius: 10px;
  padding: 14px 16px; margin-bottom: 20px;
  background: #f7f9fb;
`;

const FamilyBoxLabel = styled.div`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px; font-weight: 600; color: #3a4756;
  margin-bottom: 10px;
`;

const FamilyList = styled.div`display: flex; flex-direction: column; gap: 8px;`;

const FamilyRow = styled.div`
  display: flex; align-items: center; gap: 8px;
  font-family: 'Public Sans', sans-serif; font-size: 13.5px; color: #3a4756;
  label { cursor: pointer; }
`;

const SubmitBtn = styled.button`
  width: 100%; height: 46px;
  background: #0050b0; color: #fff;
  border: none; border-radius: 10px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 15px; font-weight: 600;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: background 0.15s;
  &:hover:not(:disabled) { background: #0046a0; }
  &:disabled { opacity: 0.55; cursor: not-allowed; }
`;

const Spinner = styled.span`
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: #fff; border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
`;

// ─── Table styled ─────────────────────────────────────────────────────────────

const PageWrap = styled.div`max-width: 1240px;`;

const Card = styled.div`
  background: #fff;
  border: 1px solid #e0e6ec;
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(10,42,87,0.06), 0 2px 6px rgba(10,42,87,0.06);
  overflow: hidden;
`;

const CardTop = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px; padding: 14px 20px;
  border-bottom: 1px solid #e0e6ec;
`;

const CardTitle = styled.h2`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 16px; font-weight: 700; color: #161d26; margin: 0;
`;

const SearchWrap = styled.div`
  position: relative; display: flex; align-items: center;
  i { position: absolute; left: 10px; color: #94a3b8; font-size: 13px; pointer-events: none; }
`;

const SearchInput = styled.input`
  height: 34px; border: 1px solid #e0e6ec; border-radius: 8px;
  padding: 0 12px 0 32px; font-size: 13px; color: #161d26;
  outline: none; width: 220px; background: #f7f9fb;
  &:focus { border-color: #0050b0; background: #fff; }
`;

const Table = styled.table`width: 100%; border-collapse: collapse; font-size: 13.5px;`;

const Th = styled.th`
  padding: 10px 20px; text-align: left; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.05em; color: #6b7a8c; background: #f7f9fb;
  font-family: 'Plus Jakarta Sans', sans-serif;
`;

const Tr = styled.tr`
  border-top: 1px solid #f1f3f6;
  &:hover { background: #f7f9fb; }
`;

const Td = styled.td`padding: 13px 20px; vertical-align: middle;`;

const PolicyIdText = styled.div`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 12px; color: #6b7a8c;
`;

const TypeBadge = styled.span<{ $type: string }>`
  font-size: 11.5px; font-weight: 600; border-radius: 999px; padding: 3px 10px; white-space: nowrap;
  background: ${p => p.$type === "Health" ? "#dbeafe" : p.$type === "Life" ? "#f3e8ff" : "#f1f5f9"};
  color: ${p => p.$type === "Health" ? "#1e40af" : p.$type === "Life" ? "#7e22ce" : "#374151"};
`;

const MonoValue = styled.span`
  font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 13px; color: #161d26;
`;

const MonoMuted = styled.span`
  font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 11.5px; color: #6b7a8c;
`;

const ActionBtn = styled.button`
  background: none; border: 1px solid #e0e6ec; border-radius: 7px;
  padding: 5px 8px; cursor: pointer; color: #6b7a8c; display: inline-flex; align-items: center;
  &:hover { background: #f1f5f9; color: #0050b0; border-color: #0050b0; }
`;

const EmptyRow = styled.tr`td { padding: 40px 20px; text-align: center; color: #9ca3af; }`;

const ExpiryWarning = styled.span`
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 600;
  color: #b45309; background: #fef3c7;
  border: 1px solid #fde68a; border-radius: 999px;
  padding: 2px 7px; margin-top: 3px; white-space: nowrap;
`;

function getDaysUntilExpiry(endDate: string | null | undefined): number | null {
  if (!endDate) return null;
  const diff = dayjs(endDate).diff(dayjs().startOf("day"), "day");
  return diff;
}

const Pagination = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 20px; border-top: 1px solid #e0e6ec; font-size: 13px; color: #6b7a8c;
`;

const PagBtn = styled.button`
  background: none; border: 1px solid #e0e6ec; border-radius: 8px;
  padding: 6px 14px; font-size: 13px; font-weight: 600; color: #3a4756; cursor: pointer;
  &:hover:not(:disabled) { background: #f1f5f9; }
  &:disabled { opacity: 0.4; cursor: default; }
`;

const AccentBtn = styled.button`
  display: inline-flex; align-items: center; gap: 7px;
  background: #0050b0; color: #fff; border: none; border-radius: 9px;
  padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer;
  font-family: 'Plus Jakarta Sans', sans-serif;
  &:hover { background: #0046a0; }
`;

const RefreshBtn = styled.button<{ $spinning: boolean }>`
  display: inline-flex; align-items: center; justify-content: center;
  background: none; border: 1px solid #e0e6ec; border-radius: 9px;
  padding: 7px 10px; cursor: pointer; color: #6b7a8c;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  &:hover { background: #f1f5f9; border-color: #0050b0; color: #0050b0; }
  svg { animation: ${p => p.$spinning ? spin : "none"} 0.7s linear infinite; }
`;

const FamilyScrollList = styled.div`
  max-height: 200px; overflow-y: auto;
  display: flex; flex-direction: column; gap: 0.5rem; padding: 0.25rem 0;
`;

const FamilyCheckRow = styled.div`
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.9rem; color: #3a4756;
`;

const DialogFooter = styled.div`display: flex; justify-content: flex-end; gap: 0.5rem;`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface LinkedMember { id: string; name: string; relation: string; }
interface Policy {
  id: string; policy_number: string; insurer: string; policy_type?: string;
  sum_insured?: number | null; premium_amount?: number | null;
  start_date: string; end_date: string; status: string; file_name?: string | null;
  previous_policy_id?: string | null;
  linked_family_members: LinkedMember[] | null | undefined;
  linked_nominees?: LinkedNominee[] | null | undefined;
  vehicle_number?: string | null; vehicle_type?: string | null;
  vehicle_owner_family_member_id?: string | null;
}
interface LinkedNominee { id: string; name: string; relation: string; share_percent: number; }
interface FamilyMember { id: string; name: string; relation: string; }
interface Nominee { id: string; name: string; relation: string; share_percent: number; }
interface PolicyType { id: string; name: string; }

// ─── PDF helpers ──────────────────────────────────────────────────────────────

async function openPdf(policyId: string) {
  try {
    const blob = await memberViewPolicyPdf(policyId);
    const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  } catch { toast.error("Could not load PDF"); }
}

async function downloadPdf(policyId: string, fileName?: string | null) {
  try {
    const blob = await memberDownloadPolicyPdf(policyId);
    const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url; a.download = fileName || "policy.pdf";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5_000);
  } catch { toast.error("Could not download PDF"); }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MemberPoliciesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  React.useEffect(() => { setPage(0); }, [debouncedSearch]);

  // Upload overlay state
  const [uploadVisible, setUploadVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPolicyTypeId, setUploadPolicyTypeId] = useState("");
  const [dropActive, setDropActive] = useState(false);
  const [uploadVehicleNumber, setUploadVehicleNumber] = useState("");
  const [uploadVehicleType, setUploadVehicleType] = useState("");
  const [uploadVehicleOwnerId, setUploadVehicleOwnerId] = useState("");
  const [uploadNomineeIds, setUploadNomineeIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit links dialog state
  const [editLinksDialogVisible, setEditLinksDialogVisible] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [editFamilyIds, setEditFamilyIds] = useState<string[]>([]);
  const [editSelf, setEditSelf] = useState(false);

  // View linked members dialog state
  const [viewLinkedPolicy, setViewLinkedPolicy] = useState<Policy | null>(null);

  // Claim policy modal state
  const [claimingPolicy, setClaimingPolicy] = useState<Policy | null>(null);

  const { data: policiesData, isLoading, isFetching } = useQuery({
    queryKey: ["member", "policies", debouncedSearch, page],
    queryFn: () => memberListPolicies({ global_filter: debouncedSearch, sort_field: "created_at", sort_order: -1, limit: ROWS, skip: page * ROWS }),
  });
  const { data: policyTypesData } = useQuery({ queryKey: ["policy-types"], queryFn: () => listPolicyTypes(true) });
  const { data: familyData } = useQuery({ queryKey: ["member", "family"], queryFn: memberListFamily });
  const { data: nomineesData } = useQuery({ queryKey: ["member", "nominees"], queryFn: memberListNominees });

  const policies: Policy[] = policiesData?.data?.data ?? [];
  const total: number = policiesData?.data?.total ?? 0;
  const totalPages = Math.ceil(total / ROWS);
  const policyTypes: PolicyType[] = policyTypesData?.data ?? [];
  const familyMembers: FamilyMember[] = (familyData as any)?.data?.family ?? (familyData as any)?.data ?? [];
  const nominees: Nominee[] = (nomineesData as any)?.data ?? [];

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => memberUploadPolicy(formData),
    onSuccess: () => {
      toast.success("Policy uploaded!");
      queryClient.invalidateQueries({ queryKey: ["member", "policies"] });
      closeUpload();
    },
    onError: (err: any) => { toast.error(getApiError(err, "Failed to upload policy")); },
  });

  const updateLinksMutation = useMutation({
    mutationFn: ({ id, ids }: { id: string; ids: string[] }) => memberUpdatePolicy(id, { family_member_ids: ids }),
    onSuccess: () => { toast.success("Family links updated!"); queryClient.invalidateQueries({ queryKey: ["member", "policies"] }); closeEditLinksDialog(); },
    onError: (err: any) => { toast.error(getApiError(err, "Failed to update family links")); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => memberDeletePolicy(id),
    onSuccess: () => { toast.success("Policy deleted!"); queryClient.invalidateQueries({ queryKey: ["member", "policies"] }); },
    onError: (err: any) => { toast.error(getApiError(err, "Failed to delete policy")); },
  });

  const openUpload = () => {
    setSelectedFile(null);
    setUploadPolicyTypeId("");
    setDropActive(false);
    setUploadVehicleNumber("");
    setUploadVehicleType("");
    setUploadVehicleOwnerId("");
    setUploadNomineeIds([]);
    setUploadVisible(true);
  };

  const closeUpload = () => {
    setUploadVisible(false);
    setSelectedFile(null);
    setUploadPolicyTypeId("");
    setDropActive(false);
    setUploadVehicleNumber("");
    setUploadVehicleType("");
    setUploadVehicleOwnerId("");
    setUploadNomineeIds([]);
  };

  const isMotorUpload = policyTypes.find(pt => pt.id === uploadPolicyTypeId)?.name?.toLowerCase() === "motor";
  const isLifeUpload = policyTypes.find(pt => pt.id === uploadPolicyTypeId)?.name?.toLowerCase() === "life";
  const toggleUploadNomineeId = (id: string) =>
    setUploadNomineeIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const openEditLinksDialog = (policy: Policy) => {
    setEditingPolicy(policy);
    setEditFamilyIds((policy.linked_family_members ?? []).map(m => m.id));
    setEditSelf(true);
    setEditLinksDialogVisible(true);
  };
  const closeEditLinksDialog = () => { setEditLinksDialogVisible(false); setEditingPolicy(null); setEditFamilyIds([]); setEditSelf(false); };

  const toggleEditFamilyId = (id: string) => setEditFamilyIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/pdf") setSelectedFile(file);
    else toast.error("Please upload a PDF file.");
  };

  const handleUploadSubmit = () => {
    if (!selectedFile) { toast.error("Please select a PDF file."); return; }
    if (!uploadPolicyTypeId) { toast.error("Please select a policy type."); return; }
    const fd = new FormData();
    fd.append("file", selectedFile);
    fd.append("policy_type_id", uploadPolicyTypeId);
    if (isMotorUpload) {
      if (uploadVehicleNumber) fd.append("vehicle_number", uploadVehicleNumber);
      if (uploadVehicleType) fd.append("vehicle_type", uploadVehicleType);
      if (uploadVehicleOwnerId) fd.append("vehicle_owner_family_member_id", uploadVehicleOwnerId);
    }
    if (isLifeUpload && uploadNomineeIds.length > 0) {
      fd.append("nominee_ids", uploadNomineeIds.join(","));
    }
    uploadMutation.mutate(fd);
  };

  const handleDelete = (policy: Policy) => {
    if (!window.confirm(`Delete policy "${policy.policy_number}"? This cannot be undone.`)) return;
    deleteMutation.mutate(policy.id);
  };

  return (
    <PageWrap>
      <Card>
        <CardTop>
          <CardTitle>My Policies</CardTitle>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <SearchWrap>
              <i className="pi pi-search" />
              <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search policies…" />
            </SearchWrap>
            <RefreshBtn
              $spinning={isFetching}
              title="Refresh policies"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["member", "policies"] })}
            >
              <RefreshCw size={15} />
            </RefreshBtn>
            <AccentBtn onClick={openUpload}><Upload size={14} />Upload Policy</AccentBtn>
          </div>
        </CardTop>

        <PoliciesTable
          policies={policies}
          isLoading={isLoading}
          role="member"
          onDownload={p => downloadPdf(p.id, p.file_name ?? undefined)}
          onView={p => router.push(`/member/policies/${p.id}`)}
          onDelete={p => handleDelete(p as any)}
          onLinked={p => setViewLinkedPolicy(p as any)}
          onClaim={p => setClaimingPolicy(p as any)}
        />

        {total > ROWS && (
          <Pagination>
            <span>Showing {page * ROWS + 1}–{Math.min((page + 1) * ROWS, total)} of {total.toLocaleString("en-IN")}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <PagBtn disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</PagBtn>
              <PagBtn disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</PagBtn>
            </div>
          </Pagination>
        )}
      </Card>

      {/* Upload Policy Overlay — same style as /upload page */}
      {uploadVisible && (
        <Overlay onClick={e => { if (e.target === e.currentTarget) closeUpload(); }}>
          <ModalCard>
            <ModalClose onClick={closeUpload}><X size={18} /></ModalClose>

            <ModalTitle>Upload Policy Document</ModalTitle>
            <ModalSub>Upload your insurance policy PDF. We will extract and verify the details automatically.</ModalSub>

            <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={handleFileChange} />

            <FieldLabel>Policy Type *</FieldLabel>
            <UploadSelect value={uploadPolicyTypeId} onChange={e => setUploadPolicyTypeId(e.target.value)}>
              <option value="">Select policy type…</option>
              {policyTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
            </UploadSelect>

            {isMotorUpload && (
              <>
                <FieldLabel>Vehicle Number</FieldLabel>
                <UploadInput
                  type="text"
                  value={uploadVehicleNumber}
                  onChange={e => setUploadVehicleNumber(e.target.value)}
                  placeholder="e.g. MH12AB1234"
                />

                <FieldLabel>Vehicle Type</FieldLabel>
                <UploadSelect value={uploadVehicleType} onChange={e => setUploadVehicleType(e.target.value)}>
                  <option value="">Select vehicle type…</option>
                  <option value="Car">Car</option>
                  <option value="Bike">Bike</option>
                  <option value="Commercial">Commercial</option>
                </UploadSelect>

                <FieldLabel>Vehicle Owner</FieldLabel>
                <UploadSelect value={uploadVehicleOwnerId} onChange={e => setUploadVehicleOwnerId(e.target.value)}>
                  <option value="">Select family member…</option>
                  {familyMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </UploadSelect>
              </>
            )}

            {isLifeUpload && (
              <>
                <FieldLabel>Nominee(s)</FieldLabel>
                {nominees.length === 0 ? (
                  <div style={{ padding: "12px", background: "#f8fafc", borderRadius: 8, fontSize: "0.85rem", color: "#9ca3af", textAlign: "center", marginBottom: 18 }}>
                    No nominees added yet. Add nominees first from the Nominees menu.
                  </div>
                ) : (
                  <FamilyScrollList style={{ marginBottom: 18 }}>
                    {nominees.map(n => {
                      const isChecked = uploadNomineeIds.includes(n.id);
                      return (
                        <FamilyCheckRow
                          key={n.id}
                          style={{ cursor: "pointer", padding: "6px 8px", borderRadius: 6, background: isChecked ? "#eff6ff" : "transparent" }}
                          onClick={() => toggleUploadNomineeId(n.id)}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleUploadNomineeId(n.id)}
                            style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#0050b0" }}
                          />
                          <span style={{ fontWeight: isChecked ? 600 : 400 }}>{n.name}</span>
                          <span style={{ color: "#94a3b8", fontSize: 12 }}>({n.relation} · {n.share_percent}%)</span>
                        </FamilyCheckRow>
                      );
                    })}
                  </FamilyScrollList>
                )}
              </>
            )}

            <FieldLabel>Policy Document (PDF) *</FieldLabel>
            <UploadDropzone
              $active={dropActive}
              $hasFile={!!selectedFile}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDropActive(true); }}
              onDragLeave={() => setDropActive(false)}
              onDrop={handleDrop}
            >
              <DropIcon>
                {selectedFile
                  ? <CheckCircle2 size={32} color="#65a147" />
                  : <Upload size={32} color="#b0c8e8" />}
              </DropIcon>
              {selectedFile
                ? <DropFileName>{selectedFile.name}</DropFileName>
                : <>
                    <DropText>Drag &amp; drop your PDF here</DropText>
                    <DropText style={{ fontSize: 12, marginTop: 4 }}>or click to browse</DropText>
                  </>}
            </UploadDropzone>

            <SubmitBtn onClick={handleUploadSubmit} disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? <Spinner /> : <><Upload size={15} /> Submit Document</>}
            </SubmitBtn>
          </ModalCard>
        </Overlay>
      )}

      {/* View Linked Members Dialog */}
      <Dialog
        header="Linked Family Members"
        visible={!!viewLinkedPolicy}
        onHide={() => setViewLinkedPolicy(null)}
        style={{ width: "380px" }}
        footer={
          <DialogFooter>
            <Button label="Close" severity="secondary" outlined onClick={() => setViewLinkedPolicy(null)} />
          </DialogFooter>
        }
      >
        {viewLinkedPolicy && (
          <div>
            <p style={{ marginBottom: "0.75rem", fontSize: "0.9rem", color: "#3a4756" }}>
              Policy: <strong style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace" }}>{viewLinkedPolicy.policy_number}</strong>
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(viewLinkedPolicy.linked_family_members ?? []).map(m => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: 18 }}>👤</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#161d26" }}>{m.name}</div>
                    <div style={{ fontSize: "0.78rem", color: "#6b7a8c", textTransform: "capitalize" }}>{m.relation}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Dialog>

      {/* Link Family Members Dialog */}
      <Dialog
        header="Link Family Members to Policy"
        visible={editLinksDialogVisible}
        onHide={closeEditLinksDialog}
        style={{ width: "420px" }}
        dismissableMask={false}
        footer={
          <DialogFooter>
            <Button label="Cancel" severity="secondary" outlined onClick={closeEditLinksDialog} disabled={updateLinksMutation.isPending} />
            <Button
              label="Save Links"
              icon="pi pi-check"
              loading={updateLinksMutation.isPending}
              disabled={editFamilyIds.length === 0}
              onClick={() => {
                if (editingPolicy) {
                  updateLinksMutation.mutate({ id: editingPolicy.id, ids: editFamilyIds });
                }
              }}
            />
          </DialogFooter>
        }
      >
        {editingPolicy && (
          <div>
            <p style={{ marginBottom: "0.75rem", fontSize: "0.9rem", color: "#3a4756" }}>
              Policy: <strong style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace" }}>{editingPolicy.policy_number}</strong>
            </p>
            {familyMembers.length === 0 ? (
              <div style={{ padding: "12px", background: "#f8fafc", borderRadius: 8, fontSize: "0.85rem", color: "#9ca3af", textAlign: "center" }}>
                No family members added yet. Add family members first from the Family Members menu.
              </div>
            ) : (
              <FamilyScrollList>
                {familyMembers.map(member => {
                  const isChecked = editFamilyIds.includes(member.id);
                  return (
                    <FamilyCheckRow
                      key={member.id}
                      style={{ cursor: "pointer", padding: "6px 8px", borderRadius: 6, background: isChecked ? "#eff6ff" : "transparent" }}
                      onClick={() => toggleEditFamilyId(member.id)}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleEditFamilyId(member.id)}
                        style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#0050b0" }}
                      />
                      <span style={{ fontWeight: isChecked ? 600 : 400 }}>{member.name}</span>
                      <span style={{ color: "#94a3b8", fontSize: 12 }}>({member.relation})</span>
                    </FamilyCheckRow>
                  );
                })}
              </FamilyScrollList>
            )}
          </div>
        )}
      </Dialog>

      {claimingPolicy && (
        <ClaimPolicyModal
          policyId={claimingPolicy.id}
          policyNumber={claimingPolicy.policy_number}
          onClose={() => setClaimingPolicy(null)}
          onSuccess={() => {
            setClaimingPolicy(null);
            router.push("/member/claims");
          }}
        />
      )}
    </PageWrap>
  );
}
