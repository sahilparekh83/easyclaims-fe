"use client";

import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { X, Upload, CheckCircle2 } from "lucide-react";
import PlanFeaturesBlock from "./PlanFeaturesBlock";
import { getApiError } from "@/imports/core/errors";
import {
  memberGetPlan, memberListFamily, memberListClaimDocTypes,
  memberCreateClaim, memberUploadClaimDocument,
} from "@/imports/core/api";

// ─── Styled ────────────────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(10,42,87,0.52);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
`;

const ModalCard = styled.div`
  width: 100%; max-width: 560px;
  background: #fff; border-radius: 18px;
  padding: 32px 32px 28px;
  box-shadow: 0 4px 32px rgba(10,42,87,0.18);
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
  margin: 0 0 4px;
`;

const ModalSub = styled.p`
  font-size: 13px; color: #6b7a8c; margin: 0 0 20px;
`;

const PlanBox = styled.div`
  background: #f7f9fb; border: 1px solid #e0e6ec; border-radius: 12px;
  padding: 14px 16px; margin-bottom: 20px;
`;

const PlanTop = styled.div`
  display: flex; align-items: baseline; justify-content: space-between; gap: 12px;
`;

const PlanName = styled.div`font-size: 14px; font-weight: 700; color: #161d26;`;
const MaxClaim = styled.div`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 15px; font-weight: 700; color: #0050b0;
`;
const MaxClaimLabel = styled.div`font-size: 10.5px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em;`;

const FieldLabel = styled.label`
  display: block; font-size: 13px; font-weight: 600; color: #3a4756; margin-bottom: 6px;
`;

const Input = styled.input`
  width: 100%; height: 42px; border: 1.5px solid #e0e6ec; border-radius: 10px;
  padding: 0 12px; font-size: 14px; color: #161d26; background: #f7f9fb; outline: none;
  margin-bottom: 16px;
  &:focus { border-color: #0050b0; background: #fff; }
`;

const Select = styled.select`
  width: 100%; height: 42px; border: 1.5px solid #e0e6ec; border-radius: 10px;
  padding: 0 12px; font-size: 14px; color: #161d26; background: #f7f9fb; outline: none;
  cursor: pointer; margin-bottom: 16px;
  &:focus { border-color: #0050b0; background: #fff; }
`;

const Textarea = styled.textarea`
  width: 100%; min-height: 84px; border: 1.5px solid #e0e6ec; border-radius: 10px;
  padding: 10px 12px; font-size: 14px; color: #161d26; background: #f7f9fb; outline: none;
  margin-bottom: 16px; font-family: inherit; resize: vertical;
  &:focus { border-color: #0050b0; background: #fff; }
`;

const DocRow = styled.div`
  display: flex; gap: 8px; align-items: center; margin-bottom: 8px;
`;

const DocFileLabel = styled.label`
  flex: 1; display: flex; align-items: center; gap: 8px;
  border: 1.5px dashed #e0e6ec; border-radius: 8px; padding: 8px 12px;
  font-size: 12.5px; color: #6b7a8c; cursor: pointer; background: #f7f9fb;
  &:hover { border-color: #0050b0; }
`;

const RemoveDocBtn = styled.button`
  background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px;
`;

const AddDocBtn = styled.button`
  background: none; border: 1px dashed #0050b0; color: #0050b0; border-radius: 8px;
  padding: 8px 12px; font-size: 13px; font-weight: 600; cursor: pointer; width: 100%;
  margin-bottom: 20px;
  &:hover { background: #eff6ff; }
`;

const SubmitBtn = styled.button`
  width: 100%; height: 46px; background: #0050b0; color: #fff; border: none; border-radius: 10px;
  font-size: 15px; font-weight: 600; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  &:hover:not(:disabled) { background: #0046a0; }
  &:disabled { opacity: 0.55; cursor: not-allowed; }
`;

// ─── Types ─────────────────────────────────────────────────────────────────────

interface FamilyMember { id: string; name: string; relation: string; }
interface DocSlot { docType: string; file: File | null; }

interface ClaimPolicyModalProps {
  policyId: string;
  policyNumber?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ClaimPolicyModal({ policyId, policyNumber, onClose, onSuccess }: ClaimPolicyModalProps) {
  const [familyMemberId, setFamilyMemberId] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [description, setDescription] = useState("");
  const [claimedAmount, setClaimedAmount] = useState("");
  const [docs, setDocs] = useState<DocSlot[]>([{ docType: "Other", file: null }]);
  const [planExpanded, setPlanExpanded] = useState(false);

  const { data: planData } = useQuery({ queryKey: ["member", "plan"], queryFn: memberGetPlan });
  const { data: familyData } = useQuery({ queryKey: ["member", "family"], queryFn: memberListFamily });
  const { data: docTypesData } = useQuery({ queryKey: ["member", "claim-doc-types"], queryFn: memberListClaimDocTypes });

  const plan: any = (planData as any)?.data?.plan;
  const familyMembers: FamilyMember[] = (familyData as any)?.data?.family ?? (familyData as any)?.data ?? [];
  const docTypes: string[] = (docTypesData as any)?.data ?? ["Other"];

  const createMutation = useMutation({
    mutationFn: (body: object) => memberCreateClaim(body),
    onError: (err: any) => toast.error(getApiError(err, "Failed to submit claim")),
  });

  const handleSubmit = async () => {
    if (!description.trim()) { toast.error("Please describe what happened."); return; }
    try {
      const res = await createMutation.mutateAsync({
        policy_id: policyId,
        family_member_id: familyMemberId || null,
        incident_date: incidentDate || null,
        description: description.trim(),
        claimed_amount: claimedAmount ? Number(claimedAmount) : null,
      });
      const claim = (res as any)?.data;
      const claimId = claim?.id;

      const filesToUpload = docs.filter(d => d.file);
      for (const d of filesToUpload) {
        try {
          await memberUploadClaimDocument(claimId, d.docType, d.file as File);
        } catch {
          toast.warn(`Claim submitted, but "${d.file?.name}" failed to upload — you can add it from My Claims.`);
        }
      }

      toast.success(`Claim ${claim?.claim_number} submitted — assigned to ${claim?.assigned_agent_name || "our team"}.`);
      onSuccess();
    } catch {
      // error already toasted by mutation
    }
  };

  const updateDocType = (idx: number, docType: string) =>
    setDocs(prev => prev.map((d, i) => i === idx ? { ...d, docType } : d));
  const updateDocFile = (idx: number, file: File | null) =>
    setDocs(prev => prev.map((d, i) => i === idx ? { ...d, file } : d));
  const removeDocSlot = (idx: number) =>
    setDocs(prev => prev.filter((_, i) => i !== idx));
  const addDocSlot = () => setDocs(prev => [...prev, { docType: "Other", file: null }]);

  return (
    <Overlay onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <ModalCard>
        <ModalClose onClick={onClose}><X size={18} /></ModalClose>
        <ModalTitle>Claim Policy</ModalTitle>
        <ModalSub>{policyNumber ? `Filing a claim against policy ${policyNumber}` : "Filing a claim"}</ModalSub>

        {plan && (
          <PlanBox>
            <PlanTop>
              <div>
                <PlanName>{plan.name}</PlanName>
              </div>
              <div style={{ textAlign: "right" }}>
                <MaxClaimLabel>Max Claim Value</MaxClaimLabel>
                <MaxClaim>
                  {plan.capping?.max_claim_value != null
                    ? `₹${Number(plan.capping.max_claim_value).toLocaleString("en-IN")}`
                    : "No cap"}
                </MaxClaim>
              </div>
            </PlanTop>
            <div style={{ marginTop: 10 }}>
              <PlanFeaturesBlock plan={plan} defaultExpanded={planExpanded} />
            </div>
          </PlanBox>
        )}

        <FieldLabel>Who is this claim for?</FieldLabel>
        <Select value={familyMemberId} onChange={e => setFamilyMemberId(e.target.value)}>
          <option value="">Myself</option>
          {familyMembers.map(m => <option key={m.id} value={m.id}>{m.name} ({m.relation})</option>)}
        </Select>

        <FieldLabel>Incident / Event Date</FieldLabel>
        <Input type="date" value={incidentDate} onChange={e => setIncidentDate(e.target.value)} max={new Date().toISOString().slice(0, 10)} />

        <FieldLabel>What happened? *</FieldLabel>
        <Textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="e.g. Hospitalized for 3 days for treatment of..."
        />

        <FieldLabel>Claimed Amount (₹, optional estimate)</FieldLabel>
        <Input
          type="number" min={1} value={claimedAmount}
          onChange={e => setClaimedAmount(e.target.value)}
          placeholder="e.g. 25000"
        />

        <FieldLabel>Supporting Documents</FieldLabel>
        {docs.map((d, idx) => (
          <DocRow key={idx}>
            <Select
              value={d.docType}
              onChange={e => updateDocType(idx, e.target.value)}
              style={{ marginBottom: 0, width: 170, flex: "none" }}
            >
              {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
            <DocFileLabel>
              {d.file ? <CheckCircle2 size={14} color="#65a147" /> : <Upload size={14} />}
              {d.file ? d.file.name : "Choose file"}
              <input
                type="file"
                style={{ display: "none" }}
                onChange={e => updateDocFile(idx, e.target.files?.[0] ?? null)}
              />
            </DocFileLabel>
            {docs.length > 1 && (
              <RemoveDocBtn onClick={() => removeDocSlot(idx)}><X size={16} /></RemoveDocBtn>
            )}
          </DocRow>
        ))}
        <AddDocBtn onClick={addDocSlot}>+ Add another document</AddDocBtn>

        <SubmitBtn onClick={handleSubmit} disabled={createMutation.isPending}>
          {createMutation.isPending ? "Submitting…" : "Submit Claim"}
        </SubmitBtn>
      </ModalCard>
    </Overlay>
  );
}
