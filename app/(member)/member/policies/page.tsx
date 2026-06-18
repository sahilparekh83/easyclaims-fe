"use client";
import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { Eye, Download, Upload } from "lucide-react";
import {
  memberListPolicies,
  memberUploadPolicy,
  memberUpdatePolicy,
  memberDeletePolicy,
  memberViewPolicyPdf,
  memberDownloadPolicyPdf,
  listPolicyTypes,
  memberListFamily,
} from "@/imports/core/api";
import StatusBadge from "@/components/ui/StatusBadge";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { useDebounce } from "@/hooks/useDebounce";
import { getApiError } from "@/imports/core/errors";

const ROWS = 20;

// ─── Styled ───────────────────────────────────────────────────────────────────

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

const Dropzone = styled.div<{ $hovered?: boolean }>`
  border: 2px dashed #b0c8e8; border-radius: 10px; padding: 28px;
  text-align: center; cursor: pointer;
  background: ${({ $hovered }) => ($hovered ? "#eff6ff" : "#f7f9fb")};
  transition: background 0.15s; margin-bottom: 1rem; user-select: none;
`;

const DropzoneText = styled.p`color: #6b7a8c; font-size: 0.9rem; margin: 0;`;
const SelectedFileName = styled.p`color: #0050b0; font-size: 0.85rem; margin-top: 6px; font-weight: 600;`;

const FamilyScrollList = styled.div`
  max-height: 200px; overflow-y: auto;
  display: flex; flex-direction: column; gap: 0.5rem; padding: 0.25rem 0;
`;

const FamilyCheckRow = styled.div`
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.9rem; color: #3a4756;
`;

const DialogFooter = styled.div`display: flex; justify-content: flex-end; gap: 0.5rem;`;

const FieldWrapper = styled.div`
  display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 1rem;
  label { font-size: 0.875rem; font-weight: 500; color: #3a4756; }
  .p-inputtext, .p-dropdown { width: 100%; }
  .error-msg { font-size: 0.8rem; color: #dc2626; }
`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface LinkedMember { id: string; name: string; relation: string; }
interface Policy {
  id: string; policy_number: string; insurer: string; policy_type?: string;
  sum_insured?: number | null; premium_amount?: number | null;
  start_date: string; end_date: string; status: string; file_name?: string | null;
  linked_family_members: LinkedMember[];
}
interface FamilyMember { id: string; name: string; relation: string; }
interface PolicyType { id: string; name: string; }
interface UploadFormValues { policy_type_id: string; insurer: string; sum_insured: string; }

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
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  useEffect(() => { setPage(0); }, [debouncedSearch]);

  const [uploadDialogVisible, setUploadDialogVisible] = useState(false);
  const [editLinksDialogVisible, setEditLinksDialogVisible] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dropzoneHovered, setDropzoneHovered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadFamilyIds, setUploadFamilyIds] = useState<string[]>([]);
  const [uploadSelf, setUploadSelf] = useState(false);
  const [editFamilyIds, setEditFamilyIds] = useState<string[]>([]);
  const [editSelf, setEditSelf] = useState(false);

  const { data: policiesData, isLoading } = useQuery({
    queryKey: ["member", "policies", debouncedSearch, page],
    queryFn: () => memberListPolicies({ global_filter: debouncedSearch, sort_field: "created_at", sort_order: -1, limit: ROWS, skip: page * ROWS }),
  });
  const { data: policyTypesData } = useQuery({ queryKey: ["policy-types"], queryFn: () => listPolicyTypes(true) });
  const { data: familyData } = useQuery({ queryKey: ["member", "family"], queryFn: memberListFamily });

  const policies: Policy[] = policiesData?.data?.data ?? [];
  const total: number = policiesData?.data?.total ?? 0;
  const totalPages = Math.ceil(total / ROWS);
  const policyTypeOptions = (policyTypesData?.data ?? []).map((pt: PolicyType) => ({ label: pt.name, value: pt.id }));
  const familyMembers: FamilyMember[] = familyData?.data ?? [];

  const { control, handleSubmit, reset: resetUploadForm, formState: { errors } } = useForm<UploadFormValues>({
    defaultValues: { policy_type_id: "", insurer: "", sum_insured: "" },
  });

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => memberUploadPolicy(formData),
    onSuccess: () => { toast.success("Policy uploaded!"); queryClient.invalidateQueries({ queryKey: ["member", "policies"] }); closeUploadDialog(); },
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

  const openUploadDialog = () => { setSelectedFile(null); setUploadFamilyIds([]); setUploadSelf(false); resetUploadForm({ policy_type_id: "", insurer: "", sum_insured: "" }); setUploadDialogVisible(true); };
  const closeUploadDialog = () => { setUploadDialogVisible(false); setSelectedFile(null); setUploadFamilyIds([]); setUploadSelf(false); resetUploadForm(); };
  const openEditLinksDialog = (policy: Policy) => { setEditingPolicy(policy); setEditFamilyIds(policy.linked_family_members.map(m => m.id)); setEditSelf(true); setEditLinksDialogVisible(true); };
  const closeEditLinksDialog = () => { setEditLinksDialogVisible(false); setEditingPolicy(null); setEditFamilyIds([]); setEditSelf(false); };

  const toggleUploadFamilyId = (id: string) => setUploadFamilyIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleEditFamilyId = (id: string) => setEditFamilyIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const onUploadSubmit = (values: UploadFormValues) => {
    if (!selectedFile) { toast.error("Please select a policy file."); return; }
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("policy_type_id", values.policy_type_id);
    if (values.insurer) formData.append("insurer", values.insurer);
    if (values.sum_insured) formData.append("sum_insured", values.sum_insured);
    if (uploadFamilyIds.length > 0) formData.append("family_member_ids", uploadFamilyIds.join(","));
    uploadMutation.mutate(formData);
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
            <AccentBtn onClick={openUploadDialog}><Upload size={14} />Upload Policy</AccentBtn>
          </div>
        </CardTop>

        <Table>
          <thead>
            <tr>
              <Th>Policy ID</Th>
              <Th>Type</Th>
              <Th>Insurer</Th>
              <Th>Sum Insured</Th>
              <Th>Period</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <EmptyRow><td>Loading…</td></EmptyRow>
            ) : policies.length === 0 ? (
              <EmptyRow><td>No policies found.</td></EmptyRow>
            ) : policies.map(p => (
              <Tr key={p.id}>
                <Td>
                  <PolicyIdText>{p.policy_number}</PolicyIdText>
                </Td>
                <Td>
                  {p.policy_type ? <TypeBadge $type={p.policy_type}>{p.policy_type}</TypeBadge> : <span style={{ color: "#9ca3af" }}>—</span>}
                </Td>
                <Td style={{ color: "#3a4756", fontWeight: 500 }}>{p.insurer || "—"}</Td>
                <Td>
                  {p.sum_insured != null
                    ? <MonoValue>₹{Number(p.sum_insured).toLocaleString("en-IN")}</MonoValue>
                    : <span style={{ color: "#9ca3af" }}>—</span>}
                </Td>
                <Td>
                  <MonoMuted>{dayjs(p.start_date).format("DD MMM YY")} – {dayjs(p.end_date).format("DD MMM YY")}</MonoMuted>
                </Td>
                <Td><StatusBadge value={p.status} /></Td>
                <Td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <ActionBtn title="View PDF" onClick={() => openPdf(p.id)}><Eye size={13} /></ActionBtn>
                    <ActionBtn title="Download PDF" onClick={() => downloadPdf(p.id, p.file_name)}><Download size={13} /></ActionBtn>
                    <ActionBtn title="Edit Family Links" onClick={() => openEditLinksDialog(p)}>
                      <i className="pi pi-users" style={{ fontSize: 12 }} />
                    </ActionBtn>
                    <ActionBtn title="Delete" style={{ color: "#dc2626" }} onClick={() => handleDelete(p)}>
                      <i className="pi pi-trash" style={{ fontSize: 12 }} />
                    </ActionBtn>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>

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

      {/* Upload Policy Dialog */}
      <Dialog header="Upload Policy" visible={uploadDialogVisible} onHide={closeUploadDialog} style={{ width: "500px" }}
        footer={
          <DialogFooter>
            <Button label="Cancel" severity="secondary" outlined onClick={closeUploadDialog} disabled={uploadMutation.isPending} />
            <Button label="Upload" icon="pi pi-upload" loading={uploadMutation.isPending} onClick={handleSubmit(onUploadSubmit)} />
          </DialogFooter>
        }
      >
        <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }} onChange={e => { setSelectedFile(e.target.files?.[0] ?? null); e.target.value = ""; }} />
        <Dropzone $hovered={dropzoneHovered} onClick={() => fileInputRef.current?.click()} onMouseEnter={() => setDropzoneHovered(true)} onMouseLeave={() => setDropzoneHovered(false)}>
          <DropzoneText>Click to select policy document (PDF, JPG, PNG)</DropzoneText>
          <DropzoneText style={{ fontSize: "0.78rem", marginTop: 4 }}>Policy details will be extracted automatically</DropzoneText>
          {selectedFile && <SelectedFileName>{selectedFile.name}</SelectedFileName>}
        </Dropzone>
        <form onSubmit={handleSubmit(onUploadSubmit)} noValidate>
          <FieldWrapper>
            <label htmlFor="policy_type_id">Policy Type *</label>
            <Controller name="policy_type_id" control={control} rules={{ required: "Policy type is required." }} render={({ field }) => (
              <Dropdown id="policy_type_id" value={field.value} options={policyTypeOptions} onChange={e => field.onChange(e.value)} placeholder="Select policy type" className={errors.policy_type_id ? "p-invalid" : ""} />
            )} />
            {errors.policy_type_id && <span className="error-msg">{errors.policy_type_id.message}</span>}
          </FieldWrapper>
          <FieldWrapper>
            <label htmlFor="insurer">Insurer Name</label>
            <Controller name="insurer" control={control} render={({ field }) => (
              <InputText id="insurer" {...field} placeholder="e.g. HDFC ERGO (auto-extracted if blank)" />
            )} />
          </FieldWrapper>
          <FieldWrapper>
            <label htmlFor="sum_insured">Sum Insured</label>
            <Controller name="sum_insured" control={control} render={({ field }) => (
              <InputText id="sum_insured" type="number" {...field} placeholder="e.g. 500000" />
            )} />
          </FieldWrapper>
          <FieldWrapper>
            <label>Link to Members</label>
            <FamilyScrollList>
              <FamilyCheckRow>
                <Checkbox inputId="upload-fm-self" checked={uploadSelf} onChange={() => setUploadSelf(v => !v)} />
                <label htmlFor="upload-fm-self" style={{ cursor: "pointer", fontWeight: 500 }}>Self (You)</label>
              </FamilyCheckRow>
              {familyMembers.map(member => (
                <FamilyCheckRow key={member.id}>
                  <Checkbox inputId={`upload-fm-${member.id}`} checked={uploadFamilyIds.includes(member.id)} onChange={() => toggleUploadFamilyId(member.id)} />
                  <label htmlFor={`upload-fm-${member.id}`} style={{ cursor: "pointer" }}>{member.name} ({member.relation})</label>
                </FamilyCheckRow>
              ))}
              {familyMembers.length === 0 && <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>No family members added yet.</span>}
            </FamilyScrollList>
          </FieldWrapper>
        </form>
      </Dialog>

      {/* Edit Family Links Dialog */}
      <Dialog header="Edit Family Links" visible={editLinksDialogVisible} onHide={closeEditLinksDialog} style={{ width: "400px" }}
        footer={
          <DialogFooter>
            <Button label="Cancel" severity="secondary" outlined onClick={closeEditLinksDialog} disabled={updateLinksMutation.isPending} />
            <Button label="Save" icon="pi pi-check" loading={updateLinksMutation.isPending} onClick={() => { if (editingPolicy) updateLinksMutation.mutate({ id: editingPolicy.id, ids: editFamilyIds }); }} />
          </DialogFooter>
        }
      >
        {editingPolicy && (
          <div>
            <p style={{ marginBottom: "0.75rem", fontSize: "0.9rem", color: "#3a4756" }}>
              Policy: <strong style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace" }}>{editingPolicy.policy_number}</strong>
            </p>
            <FamilyScrollList>
              <FamilyCheckRow>
                <Checkbox inputId="edit-fm-self" checked={editSelf} onChange={() => setEditSelf(v => !v)} />
                <label htmlFor="edit-fm-self" style={{ cursor: "pointer", fontWeight: 500 }}>Self (You)</label>
              </FamilyCheckRow>
              {familyMembers.map(member => (
                <FamilyCheckRow key={member.id}>
                  <Checkbox inputId={`edit-fm-${member.id}`} checked={editFamilyIds.includes(member.id)} onChange={() => toggleEditFamilyId(member.id)} />
                  <label htmlFor={`edit-fm-${member.id}`} style={{ cursor: "pointer" }}>{member.name} ({member.relation})</label>
                </FamilyCheckRow>
              ))}
              {familyMembers.length === 0 && <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>No family members added yet.</span>}
            </FamilyScrollList>
          </div>
        )}
      </Dialog>
    </PageWrap>
  );
}
