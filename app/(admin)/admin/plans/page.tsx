"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import styled from "styled-components";
import {
  Check, Minus, Plus, ChevronLeft, Sparkles, Users,
  Shield, FileText, MessageSquare, Phone, Globe, Heart, User, Trash2,
} from "lucide-react";
import { getApiError } from "@/imports/core/errors";
import {
  adminListPlans, adminCreatePlan, adminUpdatePlan, adminActivatePlan, adminArchivePlan, adminDeletePlan,
} from "@/imports/core/api";
import PlanFeaturesBlock, { FeeSlab } from "@/components/ui/PlanFeaturesBlock";

// ─── Design tokens ────────────────────────────────────────────────────────────

const PLAN_COLORS = ["#3b82f6", "#22c55e", "#0a2257"];

// ─── Styled ───────────────────────────────────────────────────────────────────

const Page = styled.div`
  max-width: 1240px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const PageTop = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
`;

const PageTitle = styled.h2`
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
`;

const PageSub = styled.p`
  font-size: 13px;
  color: #64748b;
  margin: 4px 0 0;
`;

const AccentBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: #0a2257;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 10px 18px;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  &:hover { background: #0d2d6e; }
`;

const SecondaryBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #fff;
  color: #374151;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #f8f9fb; }
`;

const GhostBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  padding: 6px 10px;
  border-radius: 8px;
  &:hover { background: #f1f5f9; color: #0f172a; }
`;

const Breadcrumb = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: none;
  border: none;
  cursor: pointer;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  padding: 4px 0;
  margin-bottom: 16px;
  &:hover { color: #374151; }
`;

const PlanGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  align-items: start;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

const CardWrap = styled.div<{ $popular?: boolean; $color: string }>`
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 480px;
  border: ${p => p.$popular ? `2px solid #4ade80` : `1px solid #e8eaf0`};
  box-shadow: ${p => p.$popular ? `0 4px 16px rgba(0,0,0,0.10)` : `0 1px 3px rgba(0,0,0,0.06)`};
`;

const CardColorBar = styled.div<{ $color: string }>`
  height: 5px;
  background: ${p => p.$color};
`;

const CardBody = styled.div`
  padding: 22px 22px 18px;
`;

const CardFooter = styled.div`
  margin-top: auto;
  padding: 15px 22px;
  border-top: 1px solid #f1f2f6;
  background: #f8f9fb;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const PopularBadge = styled.span`
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #15803d;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 999px;
  padding: 2px 9px;
`;

const PriceRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin: 14px 0;
`;

const PriceNum = styled.span`
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #0f172a;
`;

const PriceSuffix = styled.span`
  font-size: 13px;
  color: #64748b;
  font-weight: 600;
`;

const MembersRow = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 0;
  padding-top: 14px;
  border-top: 1px solid #f1f2f6;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 12.5px;
  color: #64748b;
`;

const BenefitsList = styled.div`
  padding: 4px 22px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const BenefitLine = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

// Status pill
const StatusPill = styled.span<{ $s: string }>`
  display: inline-block;
  font-size: 11.5px;
  font-weight: 600;
  border-radius: 999px;
  padding: 3px 11px;
  background: ${p =>
    p.$s === "Active" ? "#f0fdf4" :
    p.$s === "Draft" ? "#f8f9fb" :
    p.$s === "Archived" ? "#fff1f2" : "#f8f9fb"};
  color: ${p =>
    p.$s === "Active" ? "#16a34a" :
    p.$s === "Draft" ? "#64748b" :
    p.$s === "Archived" ? "#e11d48" : "#64748b"};
  border: 1px solid ${p =>
    p.$s === "Active" ? "#bbf7d0" :
    p.$s === "Draft" ? "#e2e8f0" :
    p.$s === "Archived" ? "#fecdd3" : "#e2e8f0"};
`;

// Builder
const BuilderWrap = styled.div`
  padding-bottom: 40px;
  max-width: 1180px;
`;

const BuilderGrid = styled.div`
  display: grid;
  grid-template-columns: 1.35fr 0.9fr;
  gap: 24px;
  align-items: start;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

const FormCard = styled.div`
  background: #fff;
  border: 1px solid #e8eaf0;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  padding: 24px;
  margin-bottom: 18px;
`;

const FormCardTitle = styled.h3`
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 16px;
`;

const FormCardSub = styled.p`
  font-size: 12.5px;
  color: #64748b;
  margin: 3px 0 0;
`;

const FieldGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ThreeCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 14px;
`;

const FieldWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FieldLabel = styled.div`
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #64748b;
`;

const StyledInput = styled.input`
  width: 100%;
  height: 44px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0 12px;
  font-size: 14px;
  color: #0f172a;
  background: #fff;
  outline: none;
  &:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
`;

const StyledSelect = styled.select`
  width: 100%;
  height: 44px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0 12px;
  font-size: 14px;
  color: #0f172a;
  background: #fff;
  outline: none;
  cursor: pointer;
  &:focus { border-color: #3b82f6; }
`;

const BenefitRow = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 0;
  border-top: 1px solid #f1f2f6;
`;

const BIconBox = styled.span`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #eff6ff;
  color: #3b82f6;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
`;

const BLabel = styled.div`
  flex: 1;
  font-size: 13.5px;
  font-weight: 600;
  color: #0f172a;
`;

// Toggle switch
const ToggleWrap = styled.label`
  cursor: pointer;
  display: inline-flex;
  align-items: center;
`;

const ToggleInput = styled.input`
  display: none;
`;

const ToggleTrack = styled.span<{ $on: boolean }>`
  width: 36px;
  height: 20px;
  border-radius: 999px;
  background: ${p => p.$on ? "#22c55e" : "#e2e8f0"};
  position: relative;
  transition: background 0.2s;
  flex: none;
  &::after {
    content: "";
    position: absolute;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    top: 2px;
    left: ${p => p.$on ? "18px" : "2px"};
    transition: left 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
`;

const PreviewLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #64748b;
  margin-bottom: 14px;
`;

const SaveRow = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 14px;
`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Benefits {
  family: number;
  slots: number;
  claim: string;
  aiqa: boolean;
  aicalls: boolean;
  voice: string;
  vault: boolean;
  rm: boolean;
  concierge: boolean;
}

interface Plan {
  id: string;
  name: string;
  plan_code?: string;
  tagline?: string;
  description?: string;
  price?: number;
  cycle?: string;
  billing_cycle?: string;
  plan_type?: string;
  popular?: boolean;
  status: string;
  member_count?: number;
  partner_count?: number;
  max_claim_value?: number | null;
  capping?: { max_family_members?: number; max_claim_value?: number | null; max_policies?: number };
  benefits?: Partial<Benefits>;
  benefits_json?: Partial<Benefits>;
  fee_slabs?: FeeSlab[];
  basic_features_note?: string;
  basic_features?: string[];
  advanced_features_note?: string;
  advanced_features?: string[];
  co_powered_by_easyclaims?: boolean;
}

interface Draft {
  name: string;
  tagline: string;
  price: number;
  cycle: string;
  status: string;
  popular: boolean;
  plan_type: string;
  max_claim_value: number | null;
  benefits: Benefits;
  fee_slabs: FeeSlab[];
  basic_features_note: string;
  basic_features: string[];
  advanced_features_note: string;
  advanced_features: string[];
  co_powered_by_easyclaims: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BLANK_BENEFITS: Benefits = {
  family: 2, slots: 3, claim: "Standard", aiqa: false, aicalls: false,
  voice: "English", vault: false, rm: false, concierge: false,
};

const BLANK_DRAFT: Draft = {
  name: "New plan", tagline: "Describe this tier",
  price: 1999, cycle: "Annual", status: "Draft", popular: false, plan_type: "partner",
  max_claim_value: null,
  benefits: { ...BLANK_BENEFITS },
  fee_slabs: [],
  basic_features_note: "",
  basic_features: [],
  advanced_features_note: "",
  advanced_features: [],
  co_powered_by_easyclaims: true,
};

const BENEFIT_DEFS: Array<{
  id: keyof Benefits;
  label: string;
  kind: "toggle" | "number" | "select";
  icon: React.ReactNode;
  min?: number; max?: number;
  options?: string[];
}> = [
  { id: "claim",     label: "Claim assistance level",            kind: "select",  icon: <FileText size={15} />,       options: ["Standard", "Priority", "24×7 Priority"] },
  { id: "aiqa",      label: "AI policy Q&A — WhatsApp & email",  kind: "toggle",  icon: <MessageSquare size={15} /> },
  { id: "aicalls",   label: "Outbound AI calls (welcome + renewal)", kind: "toggle", icon: <Phone size={15} /> },
  { id: "voice",     label: "Voice support languages",           kind: "select",  icon: <Globe size={15} />,          options: ["English", "English + Hindi"] },
  { id: "vault",     label: "Document vault & e-certificate",    kind: "toggle",  icon: <Shield size={15} /> },
  { id: "rm",        label: "Dedicated relationship manager",    kind: "toggle",  icon: <User size={15} /> },
  { id: "concierge", label: "Concierge claim filing",            kind: "toggle",  icon: <Heart size={15} /> },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtINR(n: number) {
  const s = Math.round(n).toString();
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3 : last3;
  return "₹" + grouped;
}

function cycleSuffix(c: string) {
  if (c === "Annual") return "/year";
  if (c === "Half-yearly") return "/6 mo";
  if (c === "Quarterly") return "/quarter";
  return "";
}

function benefitLines(b: Partial<Benefits>) {
  const safe: Benefits = { ...BLANK_BENEFITS, ...b };
  return [
    { text: `${safe.family} family members covered`, on: true },
    { text: `${safe.slots} policy storage slots`, on: true },
    { text: `${safe.claim} claim assistance`, on: true },
    { text: "AI policy Q&A — WhatsApp & email", on: !!safe.aiqa },
    { text: "Outbound AI calls (welcome + renewal)", on: !!safe.aicalls },
    { text: `Voice support: ${safe.voice}`, on: true },
    { text: "Document vault & e-certificate", on: !!safe.vault },
    { text: "Dedicated relationship manager", on: !!safe.rm },
    { text: "Concierge claim filing", on: !!safe.concierge },
  ];
}

function planColor(index: number) {
  return PLAN_COLORS[index] ?? PLAN_COLORS[0];
}

// ─── PlanCardDisplay ──────────────────────────────────────────────────────────

function PlanCardDisplay({
  plan, color, onEdit, onActivate, onArchive, onDelete,
}: {
  plan: Plan;
  color: string;
  onEdit?: () => void;
  onActivate?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}) {
  const price = plan.price ?? 0;
  const cycle = plan.cycle ?? plan.billing_cycle ?? "Annual";
  const tagline = plan.tagline ?? plan.description ?? "";
  const benefits = plan.benefits ?? plan.benefits_json ?? {};
  const lines = benefitLines(benefits);
  const status = plan.status ?? "Draft";

  return (
    <CardWrap $popular={!!plan.popular} $color={color}>
      <CardColorBar $color={color} />
      <CardBody>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 9, marginBottom: 3, flexWrap: "wrap" }}>
          <h3 style={{ fontSize: 19, fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1.25 }}>
            {plan.name}
          </h3>
          {plan.popular && <PopularBadge style={{ flex: "none" }}>Most popular</PopularBadge>}
        </div>
        {plan.plan_code && (
          <div style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>
            {plan.plan_code}
          </div>
        )}
        <p style={{ fontSize: 12.5, color: "#64748b", margin: 0 }}>{tagline}</p>
        <PriceRow>
          <PriceNum>{fmtINR(price)}</PriceNum>
          <PriceSuffix>{cycleSuffix(cycle)}</PriceSuffix>
        </PriceRow>
        <MembersRow>
          <Users size={13} />
          <span>{(plan.member_count ?? 0).toLocaleString("en-IN")} members</span>
        </MembersRow>
      </CardBody>
      <BenefitsList>
        {lines.map((line, i) => (
          <BenefitLine key={i}>
            {line.on
              ? <Check size={15} color="#16a34a" style={{ flex: "none" }} />
              : <Minus size={15} color="#94a3b8" style={{ flex: "none" }} />}
            <span style={{ fontSize: 13, color: line.on ? "#374151" : "#94a3b8", fontWeight: 500 }}>
              {line.text}
            </span>
          </BenefitLine>
        ))}
      </BenefitsList>
      {(plan.fee_slabs?.length || plan.basic_features?.length || plan.advanced_features?.length) ? (
        <div style={{ padding: "0 22px 18px" }}>
          <PlanFeaturesBlock plan={plan} />
        </div>
      ) : null}
      <CardFooter>
        <StatusPill $s={status}>{status}</StatusPill>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {onEdit && (
            <SecondaryBtn onClick={onEdit} style={{ fontSize: 12.5, padding: "6px 13px" }}>
              Edit plan
            </SecondaryBtn>
          )}
          {onDelete !== undefined && (() => {
            const isLinked = (plan.member_count ?? 0) > 0 || (plan.partner_count ?? 0) > 0;
            return (
              <button
                onClick={!isLinked ? onDelete : undefined}
                disabled={isLinked}
                title={isLinked
                  ? `Cannot delete — ${plan.member_count ?? 0} member(s), ${plan.partner_count ?? 0} partner(s) linked`
                  : "Delete plan permanently"}
                style={{
                  background: "none",
                  border: "1px solid #fecaca",
                  borderRadius: 8,
                  padding: "6px 9px",
                  cursor: isLinked ? "not-allowed" : "pointer",
                  color: isLinked ? "#fca5a5" : "#dc2626",
                  opacity: isLinked ? 0.5 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                <Trash2 size={13} />
              </button>
            );
          })()}
        </div>
      </CardFooter>
    </CardWrap>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlansPage() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"list" | "builder">("list");
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [draft, setDraft] = useState<Draft>({ ...BLANK_DRAFT, benefits: { ...BLANK_BENEFITS } });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "plans"],
    queryFn: () => adminListPlans({ skip: 0, limit: 100 }),
  });

  const plans: Plan[] = Array.isArray(data?.data) ? data.data : (data?.data?.data ?? []);

  const invalidatePlans = () => queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });

  const createMutation = useMutation({
    mutationFn: (d: Draft) =>
      adminCreatePlan({
        name: d.name, tagline: d.tagline, price: d.price,
        cycle: d.cycle, billing_cycle: d.cycle, plan_type: d.plan_type,
        popular: d.popular, status: d.status, max_claim_value: d.max_claim_value,
        benefits: d.benefits, benefits_json: d.benefits,
        fee_slabs: d.fee_slabs,
        basic_features_note: d.basic_features_note, basic_features: d.basic_features,
        advanced_features_note: d.advanced_features_note, advanced_features: d.advanced_features,
        co_powered_by_easyclaims: d.co_powered_by_easyclaims,
      }),
    onSuccess: () => { toast.success("Plan created"); invalidatePlans(); setMode("list"); },
    onError: (err: any) => toast.error(getApiError(err, "Failed to create plan")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: Draft }) =>
      adminUpdatePlan(id, {
        name: d.name, tagline: d.tagline, price: d.price,
        cycle: d.cycle, billing_cycle: d.cycle, plan_type: d.plan_type,
        status: d.status, popular: d.popular, max_claim_value: d.max_claim_value,
        benefits: d.benefits, benefits_json: d.benefits,
        fee_slabs: d.fee_slabs,
        basic_features_note: d.basic_features_note, basic_features: d.basic_features,
        advanced_features_note: d.advanced_features_note, advanced_features: d.advanced_features,
        co_powered_by_easyclaims: d.co_powered_by_easyclaims,
      }),
    onSuccess: () => { toast.success("Plan updated"); invalidatePlans(); setMode("list"); },
    onError: (err: any) => toast.error(getApiError(err, "Failed to update plan")),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => adminActivatePlan(id),
    onSuccess: () => { toast.success("Plan activated"); invalidatePlans(); },
    onError: (err: any) => toast.error(getApiError(err, "Failed to activate")),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => adminArchivePlan(id),
    onSuccess: () => { toast.success("Plan archived"); invalidatePlans(); },
    onError: (err: any) => toast.error(getApiError(err, "Failed to archive")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeletePlan(id),
    onSuccess: () => { toast.success("Plan permanently deleted"); invalidatePlans(); },
    onError: (err: any) => toast.error(getApiError(err, "Failed to delete plan")),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  function openCreate() {
    setEditingPlan(null);
    setDraft({ ...BLANK_DRAFT, benefits: { ...BLANK_BENEFITS } });
    setMode("builder");
  }

  function openEdit(plan: Plan) {
    setEditingPlan(plan);
    const b = plan.benefits ?? plan.benefits_json ?? {};
    setDraft({
      name: plan.name ?? "",
      tagline: plan.tagline ?? plan.description ?? "",
      price: plan.price ?? 0,
      cycle: plan.cycle ?? plan.billing_cycle ?? "Annual",
      status: plan.status ?? "Draft",
      popular: plan.popular ?? false,
      plan_type: plan.plan_type ?? "partner",
      max_claim_value: plan.capping?.max_claim_value ?? plan.max_claim_value ?? null,
      benefits: { ...BLANK_BENEFITS, ...b },
      fee_slabs: plan.fee_slabs ?? [],
      basic_features_note: plan.basic_features_note ?? "",
      basic_features: plan.basic_features ?? [],
      advanced_features_note: plan.advanced_features_note ?? "",
      advanced_features: plan.advanced_features ?? [],
      co_powered_by_easyclaims: plan.co_powered_by_easyclaims ?? true,
    });
    setMode("builder");
  }

  function setDraftField<K extends keyof Draft>(k: K, v: Draft[K]) {
    setDraft(d => ({ ...d, [k]: v }));
  }

  function setBenefit<K extends keyof Benefits>(k: K, v: Benefits[K]) {
    setDraft(d => ({ ...d, benefits: { ...d.benefits, [k]: v } }));
  }

  // ── Fee slabs (Advanced Assistance Service Fee) ──────────────────────────────
  function addFeeSlab() {
    setDraft(d => ({ ...d, fee_slabs: [...d.fee_slabs, { slab: "", fee: "" }] }));
  }
  function updateFeeSlab(idx: number, field: keyof FeeSlab, value: string) {
    setDraft(d => ({
      ...d,
      fee_slabs: d.fee_slabs.map((row, i) => (i === idx ? { ...row, [field]: value } : row)),
    }));
  }
  function removeFeeSlab(idx: number) {
    setDraft(d => ({ ...d, fee_slabs: d.fee_slabs.filter((_, i) => i !== idx) }));
  }

  // ── Feature lists (Basic / Advanced Assistance Services) ─────────────────────
  function addFeature(key: "basic_features" | "advanced_features") {
    setDraft(d => ({ ...d, [key]: [...d[key], ""] }));
  }
  function updateFeature(key: "basic_features" | "advanced_features", idx: number, value: string) {
    setDraft(d => ({ ...d, [key]: d[key].map((f, i) => (i === idx ? value : f)) }));
  }
  function removeFeature(key: "basic_features" | "advanced_features", idx: number) {
    setDraft(d => ({ ...d, [key]: d[key].filter((_, i) => i !== idx) }));
  }

  function stepBenefit(id: keyof Benefits, delta: number, min: number, max: number) {
    setDraft(d => {
      const cur = (d.benefits[id] as number) || 0;
      return { ...d, benefits: { ...d.benefits, [id]: Math.max(min, Math.min(max, cur + delta)) } };
    });
  }

  function savePlan() {
    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, d: draft });
    } else {
      createMutation.mutate(draft);
    }
  }

  const draftColor = editingPlan
    ? (PLAN_COLORS[plans.findIndex(p => p.id === editingPlan.id)] ?? PLAN_COLORS[0])
    : PLAN_COLORS[0];

  const draftAsplan: Plan = {
    id: editingPlan?.id ?? "preview",
    name: draft.name || "Untitled plan",
    tagline: draft.tagline,
    price: draft.price,
    cycle: draft.cycle,
    status: draft.status,
    popular: draft.popular,
    benefits: draft.benefits,
    fee_slabs: draft.fee_slabs,
    basic_features_note: draft.basic_features_note,
    basic_features: draft.basic_features,
    advanced_features_note: draft.advanced_features_note,
    advanced_features: draft.advanced_features,
    co_powered_by_easyclaims: draft.co_powered_by_easyclaims,
  };

  // ── List view ────────────────────────────────────────────────────────────────

  if (mode === "list") {
    return (
      <Page>
        <PageTop>
          <div>
            <PageTitle>Subscription tiers</PageTitle>
            <PageSub>
              {plans.length} active plan{plans.length !== 1 ? "s" : ""} · billed annually in Indian Rupees (₹) · single currency
            </PageSub>
          </div>
          <AccentBtn onClick={openCreate}>
            <Plus size={16} /> Create plan
          </AccentBtn>
        </PageTop>

        {isLoading ? (
          <PlanGrid>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                height: 480, background: "#fff", borderRadius: 14,
                border: "1px solid #e8eaf0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                animation: "shimmer 1.4s infinite",
                backgroundImage: "linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)",
                backgroundSize: "200% 100%",
              }} />
            ))}
          </PlanGrid>
        ) : plans.length === 0 ? (
          <div style={{
            background: "#fff", border: "2px dashed #e2e8f0", borderRadius: 14,
            padding: 40, textAlign: "center", color: "#64748b", fontSize: 14,
          }}>
            No plans yet. Create your first subscription tier.
          </div>
        ) : (
          <PlanGrid>
            {plans.map((plan, idx) => (
              <PlanCardDisplay
                key={plan.id}
                plan={plan}
                color={planColor(idx)}
                onEdit={() => openEdit(plan)}
                onActivate={plan.status !== "Active" ? () => activateMutation.mutate(plan.id) : undefined}
                onArchive={plan.status === "Active" ? () => archiveMutation.mutate(plan.id) : undefined}
                onDelete={() => {
                  if (window.confirm(`Permanently delete "${plan.name}"? This cannot be undone.`)) {
                    deleteMutation.mutate(plan.id);
                  }
                }}
              />
            ))}
          </PlanGrid>
        )}
      </Page>
    );
  }

  // ── Builder view ──────────────────────────────────────────────────────────────

  return (
    <BuilderWrap>
      <Breadcrumb onClick={() => setMode("list")}>
        <ChevronLeft size={16} /> All plans
      </Breadcrumb>

      <BuilderGrid>
        {/* Left col */}
        <div>
          {/* Plan details */}
          <FormCard>
            <FormCardTitle>Plan details</FormCardTitle>
            <FieldGrid>
              <FieldWrap>
                <FieldLabel>Plan name</FieldLabel>
                <StyledInput
                  value={draft.name}
                  onChange={e => setDraftField("name", e.target.value)}
                  placeholder="e.g. Secure"
                />
              </FieldWrap>
              <FieldWrap>
                <FieldLabel>Tagline</FieldLabel>
                <StyledInput
                  value={draft.tagline}
                  onChange={e => setDraftField("tagline", e.target.value)}
                  placeholder="Short description"
                />
              </FieldWrap>
              <ThreeCol>
                <FieldWrap>
                  <FieldLabel>Annual price (₹)</FieldLabel>
                  <StyledInput
                    type="number"
                    min={0}
                    value={draft.price}
                    onChange={e => setDraftField("price", parseInt(e.target.value) || 0)}
                  />
                </FieldWrap>
                <FieldWrap>
                  <FieldLabel>Billing cycle</FieldLabel>
                  <StyledSelect value={draft.cycle} onChange={e => setDraftField("cycle", e.target.value)}>
                    <option>Annual</option>
                    <option>Half-yearly</option>
                    <option>Quarterly</option>
                  </StyledSelect>
                </FieldWrap>
                <FieldWrap>
                  <FieldLabel>Status</FieldLabel>
                  {(() => {
                    const memberCount = editingPlan?.member_count ?? 0;
                    const partnerCount = editingPlan?.partner_count ?? 0;
                    const isLinked = memberCount > 0 || partnerCount > 0;
                    const originalStatus = editingPlan?.status ?? "Draft";
                    // Active → Draft is blocked when linked; Draft → Active is always allowed
                    const blockDowngrade = isLinked && originalStatus === "Active";
                    return (
                      <>
                        <StyledSelect
                          value={draft.status}
                          onChange={e => setDraftField("status", e.target.value)}
                        >
                          <option value="Active">Active</option>
                          <option value="Draft" disabled={blockDowngrade}>Draft{blockDowngrade ? " (linked — not allowed)" : ""}</option>
                          <option value="Archived" disabled={blockDowngrade}>Archived{blockDowngrade ? " (linked — not allowed)" : ""}</option>
                        </StyledSelect>
                        {blockDowngrade && (
                          <div style={{ fontSize: 11.5, color: "#92400e", marginTop: 4, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 6, padding: "4px 8px" }}>
                            {memberCount} member(s), {partnerCount} partner(s) linked — unlink all to change status
                          </div>
                        )}
                      </>
                    );
                  })()}
                </FieldWrap>
              </ThreeCol>
            </FieldGrid>
          </FormCard>

          {/* Plan capping */}
          <FormCard>
            <div style={{ marginBottom: 6 }}>
              <FormCardTitle style={{ margin: 0 }}>Plan capping</FormCardTitle>
              <FormCardSub>Maximum limits enforced for members enrolled on this plan.</FormCardSub>
            </div>
            <ThreeCol style={{ marginTop: 14 }}>
              <FieldWrap>
                <FieldLabel>Max family members</FieldLabel>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 2,
                  background: "#f8f9fb", border: "1px solid #e2e8f0",
                  borderRadius: 999, padding: 3,
                }}>
                  <button
                    onClick={() => stepBenefit("family", -1, 1, 10)}
                    style={{
                      width: 28, height: 28, borderRadius: "50%", border: "none",
                      background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      cursor: "pointer", fontSize: 17, fontWeight: 600,
                      color: "#3b82f6", display: "inline-flex",
                      alignItems: "center", justifyContent: "center", lineHeight: 1,
                    }}
                  >−</button>
                  <span style={{ minWidth: 34, textAlign: "center", fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                    {draft.benefits.family}
                  </span>
                  <button
                    onClick={() => stepBenefit("family", 1, 1, 10)}
                    style={{
                      width: 28, height: 28, borderRadius: "50%", border: "none",
                      background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      cursor: "pointer", fontSize: 17, fontWeight: 600,
                      color: "#3b82f6", display: "inline-flex",
                      alignItems: "center", justifyContent: "center", lineHeight: 1,
                    }}
                  >+</button>
                </div>
              </FieldWrap>
              <FieldWrap>
                <FieldLabel>Max claim value (₹)</FieldLabel>
                <StyledInput
                  type="number"
                  min={0}
                  placeholder="No cap"
                  value={draft.max_claim_value ?? ""}
                  onChange={e => setDraftField("max_claim_value", e.target.value ? parseInt(e.target.value) : null)}
                />
              </FieldWrap>
              <FieldWrap>
                <FieldLabel>Max number of policies</FieldLabel>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 2,
                  background: "#f8f9fb", border: "1px solid #e2e8f0",
                  borderRadius: 999, padding: 3,
                }}>
                  <button
                    onClick={() => stepBenefit("slots", -1, 1, 20)}
                    style={{
                      width: 28, height: 28, borderRadius: "50%", border: "none",
                      background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      cursor: "pointer", fontSize: 17, fontWeight: 600,
                      color: "#3b82f6", display: "inline-flex",
                      alignItems: "center", justifyContent: "center", lineHeight: 1,
                    }}
                  >−</button>
                  <span style={{ minWidth: 34, textAlign: "center", fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                    {draft.benefits.slots}
                  </span>
                  <button
                    onClick={() => stepBenefit("slots", 1, 1, 20)}
                    style={{
                      width: 28, height: 28, borderRadius: "50%", border: "none",
                      background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      cursor: "pointer", fontSize: 17, fontWeight: 600,
                      color: "#3b82f6", display: "inline-flex",
                      alignItems: "center", justifyContent: "center", lineHeight: 1,
                    }}
                  >+</button>
                </div>
              </FieldWrap>
            </ThreeCol>
          </FormCard>

          {/* Benefits */}
          <FormCard>
            <div style={{ marginBottom: 6 }}>
              <FormCardTitle style={{ margin: 0 }}>Benefits</FormCardTitle>
              <FormCardSub>Toggle and configure what's included. Changes preview instantly on the right.</FormCardSub>
            </div>
            <div>
              {BENEFIT_DEFS.map(def => (
                <BenefitRow key={def.id}>
                  <BIconBox>{def.icon}</BIconBox>
                  <BLabel>{def.label}</BLabel>
                  {def.kind === "toggle" && (
                    <ToggleWrap>
                      <ToggleInput
                        type="checkbox"
                        checked={!!draft.benefits[def.id]}
                        onChange={e => setBenefit(def.id, e.target.checked as any)}
                      />
                      <ToggleTrack $on={!!draft.benefits[def.id]} />
                    </ToggleWrap>
                  )}
                  {def.kind === "number" && (
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 2,
                      background: "#f8f9fb", border: "1px solid #e2e8f0",
                      borderRadius: 999, padding: 3,
                    }}>
                      <button
                        onClick={() => stepBenefit(def.id, -1, def.min!, def.max!)}
                        style={{
                          width: 28, height: 28, borderRadius: "50%", border: "none",
                          background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                          cursor: "pointer", fontSize: 17, fontWeight: 600,
                          color: "#3b82f6", display: "inline-flex",
                          alignItems: "center", justifyContent: "center", lineHeight: 1,
                        }}
                      >−</button>
                      <span style={{ minWidth: 34, textAlign: "center", fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                        {draft.benefits[def.id] as number}
                      </span>
                      <button
                        onClick={() => stepBenefit(def.id, 1, def.min!, def.max!)}
                        style={{
                          width: 28, height: 28, borderRadius: "50%", border: "none",
                          background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                          cursor: "pointer", fontSize: 17, fontWeight: 600,
                          color: "#3b82f6", display: "inline-flex",
                          alignItems: "center", justifyContent: "center", lineHeight: 1,
                        }}
                      >+</button>
                    </div>
                  )}
                  {def.kind === "select" && (
                    <div style={{ width: 185, flexShrink: 0 }}>
                      <StyledSelect
                        style={{ height: 36 }}
                        value={draft.benefits[def.id] as string}
                        onChange={e => setBenefit(def.id, e.target.value as any)}
                      >
                        {def.options!.map(o => <option key={o}>{o}</option>)}
                      </StyledSelect>
                    </div>
                  )}
                </BenefitRow>
              ))}
            </div>
          </FormCard>

          {/* Advanced Assistance Service Fee */}
          <FormCard>
            <div style={{ marginBottom: 6 }}>
              <FormCardTitle style={{ margin: 0 }}>Advanced Assistance Service Fee</FormCardTitle>
              <FormCardSub>Claim amount slabs and the additional service fee charged above the basic cover.</FormCardSub>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
              {draft.fee_slabs.map((row, idx) => (
                <div key={idx} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <StyledInput
                    placeholder="e.g. INR 50,001 – INR 1,00,000"
                    value={row.slab}
                    onChange={e => updateFeeSlab(idx, "slab", e.target.value)}
                  />
                  <StyledInput
                    placeholder="e.g. INR 5000 + applicable taxes"
                    value={row.fee}
                    onChange={e => updateFeeSlab(idx, "fee", e.target.value)}
                  />
                  <button
                    onClick={() => removeFeeSlab(idx)}
                    title="Remove slab"
                    style={{
                      background: "none", border: "1px solid #fecaca", borderRadius: 8,
                      padding: "10px", cursor: "pointer", color: "#dc2626", flex: "none",
                      display: "inline-flex", alignItems: "center",
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <SecondaryBtn onClick={addFeeSlab} style={{ alignSelf: "flex-start" }}>
                <Plus size={14} /> Add slab
              </SecondaryBtn>
            </div>
          </FormCard>

          {/* Plan Features */}
          <FormCard>
            <div style={{ marginBottom: 6 }}>
              <FormCardTitle style={{ margin: 0 }}>Plan Features</FormCardTitle>
              <FormCardSub>Basic and advanced assistance services included in this plan.</FormCardSub>
            </div>

            <div style={{ marginTop: 14 }}>
              <FieldLabel style={{ marginBottom: 6 }}>Basic Assistance Services</FieldLabel>
              <StyledInput
                placeholder="e.g. For claims value up to INR 50,000/-"
                value={draft.basic_features_note}
                onChange={e => setDraftField("basic_features_note", e.target.value)}
                style={{ marginBottom: 10 }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {draft.basic_features.map((f, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <StyledInput
                      placeholder={`Basic feature #${idx + 1}`}
                      value={f}
                      onChange={e => updateFeature("basic_features", idx, e.target.value)}
                    />
                    <button
                      onClick={() => removeFeature("basic_features", idx)}
                      title="Remove feature"
                      style={{
                        background: "none", border: "1px solid #fecaca", borderRadius: 8,
                        padding: "10px", cursor: "pointer", color: "#dc2626", flex: "none",
                        display: "inline-flex", alignItems: "center",
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <SecondaryBtn onClick={() => addFeature("basic_features")} style={{ alignSelf: "flex-start" }}>
                  <Plus size={14} /> Add basic feature
                </SecondaryBtn>
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <FieldLabel style={{ marginBottom: 6 }}>Advanced Assistance Service</FieldLabel>
              <StyledInput
                placeholder="e.g. For claims exceeding INR 50,000/- subject to payment of additional fee"
                value={draft.advanced_features_note}
                onChange={e => setDraftField("advanced_features_note", e.target.value)}
                style={{ marginBottom: 10 }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {draft.advanced_features.map((f, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <StyledInput
                      placeholder={`Advanced feature #${idx + 1}`}
                      value={f}
                      onChange={e => updateFeature("advanced_features", idx, e.target.value)}
                    />
                    <button
                      onClick={() => removeFeature("advanced_features", idx)}
                      title="Remove feature"
                      style={{
                        background: "none", border: "1px solid #fecaca", borderRadius: 8,
                        padding: "10px", cursor: "pointer", color: "#dc2626", flex: "none",
                        display: "inline-flex", alignItems: "center",
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <SecondaryBtn onClick={() => addFeature("advanced_features")} style={{ alignSelf: "flex-start" }}>
                  <Plus size={14} /> Add advanced feature
                </SecondaryBtn>
              </div>
            </div>
          </FormCard>

          {/* Branding */}
          <FormCard>
            <BenefitRow style={{ borderTop: "none", padding: "0" }}>
              <BIconBox><Sparkles size={15} /></BIconBox>
              <BLabel>Co-powered by EasyClaims</BLabel>
              <ToggleWrap>
                <ToggleInput
                  type="checkbox"
                  checked={draft.co_powered_by_easyclaims}
                  onChange={e => setDraftField("co_powered_by_easyclaims", e.target.checked)}
                />
                <ToggleTrack $on={draft.co_powered_by_easyclaims} />
              </ToggleWrap>
            </BenefitRow>
          </FormCard>
        </div>

        {/* Right col — live preview */}
        <div style={{ position: "sticky", top: 0 }}>
          <PreviewLabel>
            <Sparkles size={14} color="#3b82f6" />
            LIVE PREVIEW
          </PreviewLabel>
          <PlanCardDisplay
            plan={draftAsplan}
            color={draftColor}
          />
          <SaveRow>
            <AccentBtn
              onClick={savePlan}
              disabled={isSaving}
              style={{ flex: 1, justifyContent: "center", opacity: isSaving ? 0.7 : 1 }}
            >
              <Check size={16} /> {isSaving ? "Saving…" : "Save plan"}
            </AccentBtn>
            <GhostBtn onClick={() => setMode("list")}>Cancel</GhostBtn>
          </SaveRow>
        </div>
      </BuilderGrid>
    </BuilderWrap>
  );
}
