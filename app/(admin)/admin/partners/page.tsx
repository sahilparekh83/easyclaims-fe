"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { Checkbox } from "primereact/checkbox";
import { toast } from "react-toastify";
import styled from "styled-components";
import { Briefcase, TrendingUp, CreditCard, RefreshCw, Key, Copy, RotateCcw, Upload, ChevronRight } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { getApiError } from "@/imports/core/errors";
import {
  adminListPartners,
  adminCreatePartner,
  adminGetPartner,
  adminUpdatePartner,
  adminRegenPartnerKey,
  adminListPlans,
  listPartnerTypes,
} from "@/imports/core/api";

// ─── Styled ───────────────────────────────────────────────────────────────────

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1240px;
`;

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
`;

const KpiCard = styled.div`
  background: #fff;
  border: 1px solid #e8eaf0;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const KpiIconBox = styled.div<{ $bg: string; $color: string }>`
  width: 42px; height: 42px; border-radius: 10px;
  background: ${p => p.$bg};
  color: ${p => p.$color};
  display: flex; align-items: center; justify-content: center;
  flex: none;
`;

const KpiValue = styled.div`
  font-size: 2rem; font-weight: 800; color: #0f172a;
  letter-spacing: -0.02em; line-height: 1;
`;

const KpiLabel = styled.div`
  font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.05em; color: #64748b;
`;

const Skeleton = styled.div`
  height: 2rem; width: 60px;
  background: linear-gradient(90deg, #e2e8f0 25%, #f8fafc 50%, #e2e8f0 75%);
  background-size: 200% 100%; border-radius: 6px;
  animation: shimmer 1.4s infinite;
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1.55fr 1fr;
  gap: 18px;
  align-items: start;
  @media (max-width: 1024px) { grid-template-columns: 1fr; }
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

const CardSub = styled.div`
  font-size: 12.5px; color: #64748b; margin-top: 2px;
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
  padding: 12px 22px; border-top: 1px solid #f1f2f6;
`;

const TdSm = styled(Td)` padding: 12px 8px; `;

const PartnerLogoBox = styled.div<{ $isBroker?: boolean }>`
  width: 34px; height: 34px; border-radius: 8px;
  background: ${p => p.$isBroker ? '#eff6ff' : '#f0fdf4'};
  color: ${p => p.$isBroker ? '#1d4ed8' : '#16a34a'};
  display: inline-flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 12.5px; flex: none;
`;

const PartnerName = styled.div`
  font-weight: 700; color: #0f172a; font-size: 13.5px;
`;

const PartnerMeta = styled.div`
  font-size: 11.5px; color: #64748b; margin-top: 1px;
`;

const MonoText = styled.span`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
`;

const FloatBadge = styled.span<{ $warn?: boolean }>`
  font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 13px; font-weight: 600;
  color: ${p => p.$warn ? '#b45309' : '#374151'};
  background: ${p => p.$warn ? '#fffbeb' : 'transparent'};
  border-radius: 6px;
  padding: ${p => p.$warn ? '2px 8px' : '0'};
`;

const StatusPill = styled.span<{ $active?: boolean }>`
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600;
  background: ${p => p.$active ? '#f0fdf4' : '#fffbeb'};
  color: ${p => p.$active ? '#16a34a' : '#b45309'};
`;

const RightCol = styled.div`
  display: flex; flex-direction: column; gap: 18px;
`;

const ApiCard = styled.div`
  background: #fff; border: 1px solid #e8eaf0;
  border-radius: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); padding: 20px;
`;

const ApiKeyBox = styled.div`
  display: flex; align-items: center; gap: 8px;
  background: #f8f9fb; border: 1px solid #e8eaf0;
  border-radius: 10px; padding: 10px 12px; margin-top: 14px;
`;

const CodeBadge = styled.span<{ $ok?: boolean }>`
  font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 11px; font-weight: 600;
  padding: 2px 7px; border-radius: 6px;
  color: ${p => p.$ok ? '#16a34a' : '#b45309'};
  background: ${p => p.$ok ? '#f0fdf4' : '#fffbeb'};
  flex: none;
`;

const UsageItem = styled.div`
  display: flex; align-items: center; gap: 12px;
  padding: 12px 20px; border-top: 1px solid #f1f2f6;
`;

const GhostBtn = styled.button`
  background: none; border: none; cursor: pointer; font-size: 12.5px;
  font-weight: 600; color: #64748b; padding: 4px 8px; border-radius: 6px;
  display: inline-flex; align-items: center; gap: 6px;
  &:hover { background: #f1f5f9; color: #0f172a; }
`;

const OutlineBtn = styled.button`
  background: #fff; color: #0a2257; border: 1.5px solid #0a2257;
  cursor: pointer; font-size: 12.5px; font-weight: 700;
  padding: 7px 14px; border-radius: 10px;
  display: inline-flex; align-items: center; gap: 6px;
  &:hover { background: #f0f4ff; }
`;

const AccentBtn = styled.button`
  background: #0a2257; color: #fff; border: none; cursor: pointer;
  font-size: 13px; font-weight: 700; padding: 9px 18px; border-radius: 10px;
  display: inline-flex; align-items: center; gap: 6px;
  &:hover { background: #0d2d6b; }
`;

// ── Add Customer Modal ──
const ModalOverlay = styled.div`
  position: fixed; inset: 0; z-index: 1100;
  background: rgba(10,42,87,0.45);
  display: flex; align-items: center; justify-content: center; padding: 24px;
`;

const ModalBox = styled.div`
  width: 660px; max-width: 100%; max-height: 90vh; overflow-y: auto;
  background: #fff; border-radius: 18px; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
`;

const ModalHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px; border-bottom: 1px solid #e8eaf0;
`;

const ModalTabRow = styled.div`
  display: flex; gap: 0; padding: 0 24px;
  border-bottom: 1px solid #e8eaf0;
`;

const ModalTab = styled.button<{ $active?: boolean }>`
  background: none; border: none; cursor: pointer;
  font-size: 13.5px; font-weight: ${p => p.$active ? 700 : 500};
  color: ${p => p.$active ? '#0a2257' : '#64748b'};
  padding: 12px 16px;
  border-bottom: 2px solid ${p => p.$active ? '#0a2257' : 'transparent'};
  transition: color 0.15s;
  &:hover { color: #0f172a; }
`;

const FormGrid2 = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  padding: 22px 24px;
`;

const FieldWrap = styled.div`
  display: flex; flex-direction: column; gap: 4px;
`;

const FieldLabel = styled.label`
  font-size: 12px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.05em; color: #64748b;
`;

const CodeBlock = styled.div`
  background: #0a2257; border-radius: 12px; padding: 16px 18px;
  font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 12.5px; color: #cfe0f5;
  line-height: 1.7; overflow-x: auto; margin: 0 24px 22px;
`;

const DropZone = styled.div`
  border: 2px dashed #e8eaf0; border-radius: 14px; padding: 36px;
  text-align: center; background: #f8f9fb; margin: 22px 24px 0;
`;

const ModalFooter = styled.div`
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 16px 24px; border-top: 1px solid #e8eaf0; background: #f8f9fb;
`;

// ── Add/Edit Partner form styles ──
const FormStack = styled.div`
  display: flex; flex-direction: column; gap: 1rem; margin-top: 0.5rem;
`;

const FormField = styled.div`
  display: flex; flex-direction: column; gap: 0.25rem;
`;

const Lbl = styled.label`
  font-size: 0.875rem; font-weight: 500; color: #374151;
`;

const Err = styled.small`
  color: #dc2626; font-size: 0.75rem;
`;

const FooterRow = styled.div`
  display: flex; justify-content: flex-end; gap: 0.5rem;
`;

const SectionDivider = styled.div`
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; color: #6b7a8c;
  padding: 14px 0 8px;
  border-bottom: 1px solid #f1f2f6;
  margin-bottom: 12px;
`;

const FormGrid2Col = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 4px;
`;

const Required = styled.span`color: #dc2626;`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface PartnerFormValues {
  name: string;
  email: string;
  mobile_no: string;
  partner_type: string;
  legal_company_name: string;
  trade_name: string;
  registered_address: string;
  city: string;
  state: string;
  pin_code: string;
  gstin: string;
  pan: string;
  authorized_signatory_name: string;
  designation: string;
  data_1?: string;
  data_2?: string;
  data_3?: string;
  plan_ids?: string[];
}

interface EditFormValues {
  name: string;
  mobile_no: string;
  partner_type: string;
  city: string;
  state: string;
  status: string;
  allow_member_upload: boolean;
  legal_company_name: string;
  trade_name: string;
  registered_address: string;
  pin_code: string;
  gstin: string;
  pan: string;
  authorized_signatory_name: string;
  designation: string;
  data_1?: string;
  data_2?: string;
  data_3?: string;
}

interface Partner {
  id: string;
  user_id?: string;
  partner_code?: string | null;
  name: string;
  partner_type?: string | null;
  city?: string | null;
  state?: string | null;
  legal_company_name?: string | null;
  trade_name?: string | null;
  registered_address?: string | null;
  pin_code?: string | null;
  gstin?: string | null;
  pan?: string | null;
  authorized_signatory_name?: string | null;
  designation?: string | null;
  data_1?: string | null;
  data_2?: string | null;
  data_3?: string | null;
  status: string;
  allow_member_upload?: boolean;
  email?: string | null;
  mobile_no?: string | null;
  api_key?: string | null;
  api_rate_limit?: number;
  member_count?: number;
  unread_notification_count?: number;
  created_at?: string | null;
  [key: string]: unknown;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
  { label: "Suspended", value: "Suspended" },
];

const MOBILE_PATTERN = /^\+?[\d\s\-()]{7,15}$/;
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_PATTERN   = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const PIN_PATTERN   = /^\d{6}$/;
const ROWS = 20;
const QUERY_KEY = ["admin", "partners"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function applyServerErrors(
  err: any,
  setError: (name: string, error: { message: string }) => void,
  fieldMap: Record<string, string> = {}
) {
  const detail = err?.response?.data?.detail;
  if (Array.isArray(detail)) {
    detail.forEach((d: any) => {
      const fieldName = d.loc?.[d.loc.length - 1];
      if (fieldName) {
        const mapped = fieldMap[fieldName] ?? fieldName;
        setError(mapped, { message: d.msg ?? "Invalid value" });
      }
    });
  }
}

function initials(name: string) {
  return (name || "P").split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();
}

function fmtINR(n: number) {
  const s = Math.round(n).toString();
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  return "₹" + (rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3 : last3);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PartnersPage() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editPartner, setEditPartner] = useState<Partner | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [regenId, setRegenId] = useState<string | null>(null);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [first, setFirst] = useState(0);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => { setFirst(0); }, [debouncedSearch]);

  // Add customer modal state
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [createTab, setCreateTab] = useState<"manual" | "api" | "bulk">("manual");
  const [consentChecked, setConsentChecked] = useState(false);

  // API key reveal state
  const [keyRevealed, setKeyRevealed] = useState(false);

  const { data: plansData } = useQuery({
    queryKey: ["admin", "all-plans"],
    queryFn: () => adminListPlans({ limit: 100 }),
  });
  const allPlans = (plansData as any)?.data ?? [];
  const planOptions = allPlans
    .filter((p: any) => p.status === "Active")
    .map((p: any) => ({ label: p.name, value: p.id }));

  const { data: partnerTypesData } = useQuery({
    queryKey: ["partner-types"],
    queryFn: () => listPartnerTypes(true),
  });
  // Dropdown shows the actual partner type name; matching against the managed
  // partner_types table (lowercase `code`) happens server-side.
  const PARTNER_TYPES = ((partnerTypesData as any)?.data ?? []).map(
    (pt: { id: string; name: string }) => ({ label: pt.name, value: pt.name })
  );

  const createForm = useForm<PartnerFormValues>({
    defaultValues: {
      name: "", email: "", mobile_no: "", partner_type: "Other",
      legal_company_name: "", trade_name: "", registered_address: "",
      city: "", state: "", pin_code: "", gstin: "", pan: "",
      authorized_signatory_name: "", designation: "",
      data_1: "", data_2: "", data_3: "", plan_ids: [],
    },
  });

  const editForm = useForm<EditFormValues>({
    defaultValues: {
      name: "", mobile_no: "", partner_type: "Other", city: "", state: "", status: "Active",
      legal_company_name: "", trade_name: "", registered_address: "",
      pin_code: "", gstin: "", pan: "",
      authorized_signatory_name: "", designation: "",
      data_1: "", data_2: "", data_3: "",
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEY, debouncedSearch, first],
    queryFn: () => adminListPartners({
      global_filter: debouncedSearch,
      sort_field: "created_at",
      sort_order: -1,
      limit: ROWS,
      skip: first,
    }),
  });

  const partners: Partner[] = data?.data?.data ?? [];
  const total: number = data?.data?.total ?? 0;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: (values: PartnerFormValues) =>
      adminCreatePartner({
        name: values.authorized_signatory_name,
        email: values.email,
        mobile_no: values.mobile_no,
        partner_type: values.partner_type || "Other",
        legal_company_name: values.legal_company_name,
        trade_name: values.trade_name,
        registered_address: values.registered_address,
        city: values.city,
        state: values.state,
        pin_code: values.pin_code,
        gstin: values.gstin.toUpperCase(),
        pan: values.pan.toUpperCase(),
        authorized_signatory_name: values.authorized_signatory_name,
        designation: values.designation,
        data_1: values.data_1 || undefined,
        data_2: values.data_2 || undefined,
        data_3: values.data_3 || undefined,
        plan_ids: values.plan_ids ?? [],
      }),
    onSuccess: () => { invalidate(); toast.success("Partner created"); setCreateOpen(false); createForm.reset(); },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail;
      if (Array.isArray(detail)) {
        applyServerErrors(err, createForm.setError as (name: string, error: { message: string }) => void);
        toast.error("Please fix the validation errors below");
      } else {
        toast.error(getApiError(err, "Failed to create partner"));
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: EditFormValues }) =>
      adminUpdatePartner(id, {
        name: values.name || undefined,
        mobile_no: values.mobile_no || undefined,
        city: values.city || undefined,
        state: values.state || undefined,
        partner_type: values.partner_type || undefined,
        status: values.status || undefined,
        allow_member_upload: values.allow_member_upload,
        legal_company_name: values.legal_company_name || undefined,
        trade_name: values.trade_name || undefined,
        registered_address: values.registered_address || undefined,
        pin_code: values.pin_code || undefined,
        gstin: values.gstin ? values.gstin.toUpperCase() : undefined,
        pan: values.pan ? values.pan.toUpperCase() : undefined,
        authorized_signatory_name: values.authorized_signatory_name || undefined,
        designation: values.designation || undefined,
        data_1: values.data_1 || undefined,
        data_2: values.data_2 || undefined,
        data_3: values.data_3 || undefined,
      }),
    onSuccess: () => { invalidate(); toast.success("Partner updated"); setEditOpen(false); setEditPartner(null); editForm.reset(); },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail;
      if (Array.isArray(detail)) {
        applyServerErrors(err, editForm.setError as (name: string, error: { message: string }) => void);
        toast.error("Please fix the validation errors below");
      } else {
        toast.error(getApiError(err, "Failed to update partner"));
      }
    },
  });

  const regenMutation = useMutation({
    mutationFn: (id: string) => adminRegenPartnerKey(id),
    onSuccess: (res) => { setNewApiKey(res?.data?.api_key ?? null); },
    onError: () => toast.error("Failed to regenerate API key"),
  });

  const openCreate = () => {
    createForm.reset({
      name: "", email: "", mobile_no: "", partner_type: "Other",
      legal_company_name: "", trade_name: "", registered_address: "",
      city: "", state: "", pin_code: "", gstin: "", pan: "",
      authorized_signatory_name: "", designation: "",
      data_1: "", data_2: "", data_3: "",
    });
    setCreateOpen(true);
  };

  const openEdit = async (partner: Partner) => {
    setEditLoading(true);
    setEditOpen(true);
    try {
      const res = await adminGetPartner(partner.id);
      const p: Partner = res?.data ?? partner;
      setEditPartner(p);
      editForm.reset({
        name: p.name ?? "",
        mobile_no: (p.mobile_no as string) ?? "",
        partner_type: (p.partner_type as string) ?? "Other",
        city: (p.city as string) ?? "",
        state: (p.state as string) ?? "",
        status: p.status ?? "Active",
        allow_member_upload: p.allow_member_upload ?? true,
        legal_company_name: (p.legal_company_name as string) ?? "",
        trade_name: (p.trade_name as string) ?? "",
        registered_address: (p.registered_address as string) ?? "",
        pin_code: (p.pin_code as string) ?? "",
        gstin: (p.gstin as string) ?? "",
        pan: (p.pan as string) ?? "",
        authorized_signatory_name: (p.authorized_signatory_name as string) ?? "",
        designation: (p.designation as string) ?? "",
        data_1: (p.data_1 as string) ?? "",
        data_2: (p.data_2 as string) ?? "",
        data_3: (p.data_3 as string) ?? "",
      });
    } catch {
      setEditPartner(partner);
    } finally {
      setEditLoading(false);
    }
  };

  const onCreateSubmit = (values: PartnerFormValues) => createMutation.mutate(values);
  const onEditSubmit = (values: EditFormValues) => { if (!editPartner) return; updateMutation.mutate({ id: editPartner.id, values }); };

  return (
    <Page>
      {/* Main two-col */}
      <TwoCol>
        {/* Partners table */}
        <SectionCard>
          <CardHeader>
            <div>
              <CardTitle>Channel partners</CardTitle>
              <CardSub>Brokers &amp; channel partners driving acquisition</CardSub>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className="p-input-icon-left" style={{ position: "relative" }}>
                <i className="pi pi-search" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 13 }} />
                <InputText
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search partners…"
                  style={{ paddingLeft: 30, height: 34, fontSize: 13, width: 200, borderRadius: 7 }}
                />
              </span>
              <OutlineBtn
                onClick={() => { window.location.href = "/admin/partners/bulk-upload"; }}
                style={{ fontSize: 12.5 }}
              >
                ↑ Bulk Upload
              </OutlineBtn>
              <AccentBtn onClick={openCreate} style={{ fontSize: 12.5, padding: "7px 14px" }}>
                + Add partner
              </AccentBtn>
            </div>
          </CardHeader>
          <Table>
            <thead>
              <tr>
                <Th>Partner</Th>
                <ThSm>Members</ThSm>
                <Th style={{ paddingLeft: 8 }}>Status</Th>
                <Th style={{ paddingLeft: 8 }}>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><Td colSpan={3} style={{ color: "#9ca3af", textAlign: "center" }}>Loading…</Td></tr>
              ) : partners.length === 0 ? (
                <tr><Td colSpan={3} style={{ color: "#9ca3af", textAlign: "center" }}>No partners found</Td></tr>
              ) : partners.map((p) => {
                const isBroker = (p.partner_type || "Other") === "Insurance Broker";
                return (
                  <tr
                    key={p.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => router.push(`/admin/partners/${p.id}`)}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fb")}
                    onMouseLeave={e => (e.currentTarget.style.background = "")}
                  >
                    <Td>
                      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                        <PartnerLogoBox $isBroker={isBroker}>{initials(p.name)}</PartnerLogoBox>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <PartnerName>{p.name}</PartnerName>
                            {(p.unread_notification_count ?? 0) > 0 && (
                              <span style={{ background: "#ef4444", color: "#fff", borderRadius: "999px", padding: "1px 7px", fontSize: 11, fontWeight: 700, fontFamily: "monospace" }}>
                                {p.unread_notification_count}
                              </span>
                            )}
                          </div>
                          <PartnerMeta>
                            {p.partner_code && (
                              <span style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", color: "#94a3b8" }}>{p.partner_code}</span>
                            )}
                            {p.partner_code ? " · " : ""}{p.partner_type || "Other"}{p.city ? ` · ${p.city}` : ""}
                          </PartnerMeta>
                        </div>
                      </div>
                    </Td>
                    <TdSm>
                      <MonoText>{p.member_count != null ? p.member_count.toLocaleString("en-IN") : "—"}</MonoText>
                    </TdSm>
                    <Td style={{ paddingLeft: 8 }}>
                      <StatusPill $active={p.status === "Active"}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: p.status === "Active" ? "#16a34a" : "#f59e0b", display: "inline-block" }} />
                        {p.status === "Active" ? "Active" : p.status === "Inactive" ? "Inactive" : p.status}
                      </StatusPill>
                    </Td>
                    <Td style={{ paddingLeft: 8 }}>
                      <OutlineBtn
                        style={{ fontSize: 12, padding: "5px 12px" }}
                        onClick={e => { e.stopPropagation(); openEdit(p); }}
                      >
                        Edit
                      </OutlineBtn>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          {total > ROWS && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderTop: "1px solid #f1f2f6" }}>
              <span style={{ fontSize: 12.5, color: "#6b7280" }}>
                Showing {first + 1}–{Math.min(first + ROWS, total)} of {total}
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <OutlineBtn
                  disabled={first === 0}
                  onClick={() => setFirst(Math.max(0, first - ROWS))}
                  style={{ fontSize: 12.5, padding: "5px 14px", opacity: first === 0 ? 0.4 : 1, cursor: first === 0 ? "default" : "pointer" }}
                >
                  ← Prev
                </OutlineBtn>
                <OutlineBtn
                  disabled={first + ROWS >= total}
                  onClick={() => setFirst(first + ROWS)}
                  style={{ fontSize: 12.5, padding: "5px 14px", opacity: first + ROWS >= total ? 0.4 : 1, cursor: first + ROWS >= total ? "default" : "pointer" }}
                >
                  Next →
                </OutlineBtn>
              </div>
            </div>
          )}
        </SectionCard>

        {/* Right col */}
        <RightCol>
          {/* API access — hidden
          <ApiCard>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Key size={16} color="#2563eb" />
              <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>API access</span>
            </div>
            <div style={{ fontSize: 12.5, color: "#64748b", marginBottom: 16 }}>
              Each partner has their own secret key. Open a partner record to view or regenerate their API key.
            </div>
            <div style={{ background: "#f7f9fb", border: "1px solid #e0e6ec", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 12, color: "#6b7a8c", marginBottom: 6 }}>Rate limit per partner</div>
              <span style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 14, fontWeight: 600, color: "#161d26" }}>600 req / min</span>
            </div>
          </ApiCard>
          */}

          {/* Quick stats */}
          <SectionCard>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f2f6" }}>
              <CardTitle style={{ fontSize: 15 }}>Partner summary</CardTitle>
            </div>
            <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#6b7a8c" }}>Total partners</span>
                <span style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 13, fontWeight: 600, color: "#161d26" }}>{total}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#6b7a8c" }}>Active</span>
                <span style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 13, fontWeight: 600, color: "#16a34a" }}>
                  {partners.filter(p => p.status === "Active").length}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#6b7a8c" }}>Total members enrolled</span>
                <span style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 13, fontWeight: 600, color: "#161d26" }}>
                  {partners.reduce((sum, p) => sum + (p.member_count ?? 0), 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </SectionCard>
        </RightCol>
      </TwoCol>

      {/* ── Add Customer Modal ─────────────────────────────────────────────── */}
      {addCustomerOpen && (
        <ModalOverlay onClick={() => setAddCustomerOpen(false)}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <div>
                <div style={{ fontWeight: 800, fontSize: 17, color: "#0f172a" }}>Add customer</div>
                <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 3 }}>Onboard a new membership customer</div>
              </div>
              <button
                onClick={() => setAddCustomerOpen(false)}
                style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid #e8eaf0", background: "#fff", cursor: "pointer", color: "#64748b", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}
              >
                ×
              </button>
            </ModalHeader>
            <ModalTabRow>
              {(["manual", "api", "bulk"] as const).map(t => (
                <ModalTab key={t} $active={createTab === t} onClick={() => setCreateTab(t)}>
                  {t === "manual" ? "Manual" : t === "api" ? "API" : "Bulk upload"}
                </ModalTab>
              ))}
            </ModalTabRow>

            {createTab === "manual" && (
              <FormGrid2>
                <FieldWrap>
                  <FieldLabel>Full name *</FieldLabel>
                  <InputText placeholder="e.g. Neha Verma" style={{ width: "100%" }} />
                </FieldWrap>
                <FieldWrap>
                  <FieldLabel>Mobile number *</FieldLabel>
                  <InputText placeholder="+91 9XXXX XXXXX" style={{ width: "100%" }} />
                </FieldWrap>
                <FieldWrap>
                  <FieldLabel>Email address</FieldLabel>
                  <InputText placeholder="name@email.com" style={{ width: "100%" }} />
                </FieldWrap>
                <FieldWrap>
                  <FieldLabel>City</FieldLabel>
                  <InputText placeholder="e.g. Mumbai" style={{ width: "100%" }} />
                </FieldWrap>
                <FieldWrap>
                  <FieldLabel>Membership plan *</FieldLabel>
                  <Dropdown placeholder="Select plan" options={[]} style={{ width: "100%" }} />
                </FieldWrap>
                <FieldWrap>
                  <FieldLabel>Acquired by</FieldLabel>
                  <Dropdown placeholder="Select partner" options={partners.map(p => ({ label: p.name, value: p.id }))} style={{ width: "100%" }} />
                </FieldWrap>
                <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 10, marginTop: 2 }}>
                  <Checkbox checked={consentChecked} onChange={e => setConsentChecked(!!e.checked)} inputId="consent-cb" />
                  <label htmlFor="consent-cb" style={{ fontSize: 13, color: "#374151", cursor: "pointer" }}>
                    Customer has provided DPDP consent for data processing
                  </label>
                </div>
              </FormGrid2>
            )}

            {createTab === "api" && (
              <div style={{ padding: "22px 24px" }}>
                <p style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.6, margin: "0 0 14px" }}>
                  Create customers programmatically. Records appear in the directory automatically and trigger the welcome flow.
                </p>
                <CodeBlock>
                  <span style={{ color: "#4ade80" }}>POST</span> https://api.easyclaims.in/v1/customers<br />
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>Authorization:</span> Bearer {"{MASKED_KEY}"}<br />
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>Content-Type:</span> application/json<br /><br />
                  {'{ "name": "Neha Verma", "mobile": "+919812345678", "plan": "secure" }'}
                </CodeBlock>
              </div>
            )}

            {createTab === "bulk" && (
              <div style={{ padding: "22px 24px" }}>
                <DropZone>
                  <div style={{ display: "inline-flex", width: 48, height: 48, borderRadius: 12, background: "#eff6ff", color: "#2563eb", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                    <Upload size={22} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: "#0f172a" }}>Drop a CSV or XLSX file</div>
                  <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 4 }}>Up to 5,000 customers per upload</div>
                </DropZone>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
                  <span style={{ fontSize: 12.5, color: "#64748b" }}>Need the format?</span>
                  <GhostBtn style={{ border: "1px solid #e8eaf0", borderRadius: 8 }}>Download template</GhostBtn>
                </div>
              </div>
            )}

            <ModalFooter>
              <GhostBtn style={{ padding: "9px 18px", fontSize: 13, border: "1px solid #e8eaf0", borderRadius: 10 }} onClick={() => setAddCustomerOpen(false)}>Cancel</GhostBtn>
              <AccentBtn onClick={() => { setAddCustomerOpen(false); toast.success("Customer created — welcome flow triggered"); }}>
                Create customer
              </AccentBtn>
            </ModalFooter>
          </ModalBox>
        </ModalOverlay>
      )}

      {/* ── Create Partner Dialog ─────────────────────────────────────────── */}
      <Dialog
        header="New Partner"
        visible={createOpen}
        onHide={() => { setCreateOpen(false); createForm.reset(); }}
        style={{ width: "680px", maxHeight: "90vh" }}
        footer={
          <FooterRow>
            <Button label="Cancel" severity="secondary" onClick={() => { setCreateOpen(false); createForm.reset(); }} />
            <Button label="Create" loading={createMutation.isPending} onClick={createForm.handleSubmit(onCreateSubmit)} />
          </FooterRow>
        }
      >
        <div style={{ overflowY: "auto", maxHeight: "calc(90vh - 140px)", padding: "4px 0" }}>
          {/* Section: Company */}
          <SectionDivider>Company Information</SectionDivider>
          <FormGrid2Col>
            <FormField style={{ gridColumn: "1 / -1" }}>
              <Lbl>Legal Company Name <Required>*</Required></Lbl>
              <Controller name="legal_company_name" control={createForm.control}
                rules={{ required: "Legal Company Name is required" }}
                render={({ field, fieldState }) => (
                  <><InputText {...field} invalid={!!fieldState.error} style={{ width: "100%" }} placeholder="ABC Insurance Brokers Pvt Ltd" />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )}
              />
            </FormField>
            <FormField>
              <Lbl>Trade Name / Brand Name <Required>*</Required></Lbl>
              <Controller name="trade_name" control={createForm.control}
                rules={{ required: "Trade Name is required" }}
                render={({ field, fieldState }) => (
                  <><InputText {...field} invalid={!!fieldState.error} style={{ width: "100%" }} placeholder="ABC Brokers" />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )}
              />
            </FormField>
            <FormField>
              <Lbl>Partner Type <Required>*</Required></Lbl>
              <Controller name="partner_type" control={createForm.control}
                rules={{ required: "Partner Type is required" }}
                render={({ field, fieldState }) => (
                  <><Dropdown value={field.value} options={PARTNER_TYPES} onChange={e => field.onChange(e.value)}
                    invalid={!!fieldState.error} style={{ width: "100%" }} />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )}
              />
            </FormField>
            <FormField>
              <Lbl>GSTIN <Required>*</Required></Lbl>
              <Controller name="gstin" control={createForm.control}
                rules={{ required: "GSTIN is required", pattern: { value: GSTIN_PATTERN, message: "Invalid GSTIN — e.g. 27AAPFU0939F1ZV" } }}
                render={({ field, fieldState }) => (
                  <><InputText {...field} onChange={e => field.onChange(e.target.value.toUpperCase())}
                    invalid={!!fieldState.error} style={{ width: "100%", fontFamily: "monospace" }} placeholder="27AAPFU0939F1ZV" maxLength={15} />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )}
              />
            </FormField>
            <FormField>
              <Lbl>PAN <Required>*</Required></Lbl>
              <Controller name="pan" control={createForm.control}
                rules={{ required: "PAN is required", pattern: { value: PAN_PATTERN, message: "Invalid PAN — e.g. AAPFU0939F" } }}
                render={({ field, fieldState }) => (
                  <><InputText {...field} onChange={e => field.onChange(e.target.value.toUpperCase())}
                    invalid={!!fieldState.error} style={{ width: "100%", fontFamily: "monospace" }} placeholder="AAPFU0939F" maxLength={10} />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )}
              />
            </FormField>
          </FormGrid2Col>

          {/* Section: Address */}
          <SectionDivider>Registered Office Address</SectionDivider>
          <FormGrid2Col>
            <FormField style={{ gridColumn: "1 / -1" }}>
              <Lbl>Address <Required>*</Required></Lbl>
              <Controller name="registered_address" control={createForm.control}
                rules={{ required: "Registered address is required" }}
                render={({ field, fieldState }) => (
                  <><InputText {...field} invalid={!!fieldState.error} style={{ width: "100%" }} placeholder="123 Business Park, Andheri East" />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )}
              />
            </FormField>
            <FormField>
              <Lbl>City <Required>*</Required></Lbl>
              <Controller name="city" control={createForm.control}
                rules={{ required: "City is required" }}
                render={({ field, fieldState }) => (
                  <><InputText {...field} invalid={!!fieldState.error} style={{ width: "100%" }} placeholder="Mumbai" />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )}
              />
            </FormField>
            <FormField>
              <Lbl>State <Required>*</Required></Lbl>
              <Controller name="state" control={createForm.control}
                rules={{ required: "State is required" }}
                render={({ field, fieldState }) => (
                  <><InputText {...field} invalid={!!fieldState.error} style={{ width: "100%" }} placeholder="Maharashtra" />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )}
              />
            </FormField>
            <FormField>
              <Lbl>Pin Code <Required>*</Required></Lbl>
              <Controller name="pin_code" control={createForm.control}
                rules={{ required: "Pin Code is required", pattern: { value: PIN_PATTERN, message: "Must be exactly 6 digits" } }}
                render={({ field, fieldState }) => (
                  <><InputText {...field} invalid={!!fieldState.error} style={{ width: "100%", fontFamily: "monospace" }} placeholder="400001" maxLength={6} />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )}
              />
            </FormField>
          </FormGrid2Col>

          {/* Section: Signatory */}
          <SectionDivider>Authorized Signatory &amp; Contact</SectionDivider>
          <FormGrid2Col>
            <FormField>
              <Lbl>Signatory Name <Required>*</Required></Lbl>
              <Controller name="authorized_signatory_name" control={createForm.control}
                rules={{ required: "Signatory name is required" }}
                render={({ field, fieldState }) => (
                  <><InputText {...field} invalid={!!fieldState.error} style={{ width: "100%" }} placeholder="John Doe" />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )}
              />
            </FormField>
            <FormField>
              <Lbl>Designation <Required>*</Required></Lbl>
              <Controller name="designation" control={createForm.control}
                rules={{ required: "Designation is required" }}
                render={({ field, fieldState }) => (
                  <><InputText {...field} invalid={!!fieldState.error} style={{ width: "100%" }} placeholder="Director" />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )}
              />
            </FormField>
            <FormField>
              <Lbl>Email ID <Required>*</Required></Lbl>
              <Controller name="email" control={createForm.control}
                rules={{ required: "Email is required", pattern: { value: EMAIL_PATTERN, message: "Invalid email address" } }}
                render={({ field, fieldState }) => (
                  <><InputText {...field} type="email" invalid={!!fieldState.error} style={{ width: "100%" }} placeholder="partner@company.com" />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )}
              />
            </FormField>
            <FormField>
              <Lbl>Mobile Number <Required>*</Required></Lbl>
              <Controller name="mobile_no" control={createForm.control}
                rules={{ required: "Mobile number is required", pattern: { value: MOBILE_PATTERN, message: "Invalid mobile number (7–15 digits)" } }}
                render={({ field, fieldState }) => (
                  <><InputText {...field} invalid={!!fieldState.error} style={{ width: "100%" }} placeholder="9876543210" />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )}
              />
            </FormField>
          </FormGrid2Col>

          {/* Section: Additional Data */}
          <SectionDivider>Additional Data (Optional)</SectionDivider>
          <FormGrid2Col>
            {(["data_1", "data_2", "data_3"] as const).map((f, i) => (
              <FormField key={f}>
                <Lbl>Data {i + 1}</Lbl>
                <Controller name={f} control={createForm.control}
                  render={({ field }) => <InputText {...field} value={field.value ?? ""} style={{ width: "100%" }} placeholder={`Data ${i + 1}`} />}
                />
              </FormField>
            ))}
          </FormGrid2Col>

          {/* Section: Plans */}
          <SectionDivider>Membership Plans</SectionDivider>
          <FormField style={{ gridColumn: "1 / -1" }}>
            <Lbl>Assign Plans <Required>*</Required></Lbl>
            <Controller
              name="plan_ids"
              control={createForm.control}
              rules={{ validate: (value) => (value && value.length > 0) || "Select at least one plan" }}
              render={({ field, fieldState }) => (
                <>
                  <MultiSelect
                    value={field.value ?? []}
                    onChange={e => field.onChange(e.value)}
                    options={planOptions}
                    placeholder="Select plans to assign to this partner"
                    filter
                    invalid={!!fieldState.error}
                    style={{ width: "100%" }}
                  />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}
                </>
              )}
            />
          </FormField>
        </div>
      </Dialog>

      {/* ── Edit Partner Dialog ───────────────────────────────────────────── */}
      <Dialog
        header={editLoading ? "Loading…" : `Edit Partner — ${editPartner?.name ?? ""}`}
        visible={editOpen}
        onHide={() => { setEditOpen(false); setEditPartner(null); setEditLoading(false); editForm.reset(); }}
        style={{ width: "680px", maxHeight: "90vh" }}
        footer={
          <FooterRow>
            <Button label="Cancel" severity="secondary" onClick={() => { setEditOpen(false); setEditPartner(null); editForm.reset(); }} />
            <Button label="Save" loading={updateMutation.isPending} onClick={editForm.handleSubmit(onEditSubmit)} />
          </FooterRow>
        }
      >
        <div style={{ overflowY: "auto", maxHeight: "calc(90vh - 140px)", padding: "4px 0" }}>
          {/* Read-only email */}
          {editPartner?.email && (
            <FormField style={{ marginBottom: 12 }}>
              <Lbl>Email (read-only)</Lbl>
              <InputText value={editPartner.email as string} disabled style={{ width: "100%", opacity: 0.7 }} />
            </FormField>
          )}

          {/* Section: Company */}
          <SectionDivider>Company Information</SectionDivider>
          <FormGrid2Col>
            <FormField style={{ gridColumn: "1 / -1" }}>
              <Lbl>Legal Company Name</Lbl>
              <Controller name="legal_company_name" control={editForm.control}
                render={({ field, fieldState }) => (
                  <><InputText {...field} invalid={!!fieldState.error} style={{ width: "100%" }} placeholder="ABC Insurance Brokers Pvt Ltd" />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )}
              />
            </FormField>
            <FormField>
              <Lbl>Trade Name / Brand Name</Lbl>
              <Controller name="trade_name" control={editForm.control}
                render={({ field, fieldState }) => (
                  <><InputText {...field} invalid={!!fieldState.error} style={{ width: "100%" }} placeholder="ABC Brokers" />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )}
              />
            </FormField>
            <FormField>
              <Lbl>Partner Type</Lbl>
              <Controller name="partner_type" control={editForm.control}
                render={({ field, fieldState }) => (
                  <><Dropdown value={field.value} options={PARTNER_TYPES} onChange={e => field.onChange(e.value)}
                    invalid={!!fieldState.error} style={{ width: "100%" }} />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )}
              />
            </FormField>
            <FormField>
              <Lbl>GSTIN</Lbl>
              <Controller name="gstin" control={editForm.control}
                rules={{ pattern: { value: GSTIN_PATTERN, message: "Invalid GSTIN — e.g. 27AAPFU0939F1ZV" } }}
                render={({ field, fieldState }) => (
                  <><InputText {...field} onChange={e => field.onChange(e.target.value.toUpperCase())}
                    invalid={!!fieldState.error} style={{ width: "100%", fontFamily: "monospace" }} placeholder="27AAPFU0939F1ZV" maxLength={15} />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )}
              />
            </FormField>
            <FormField>
              <Lbl>PAN</Lbl>
              <Controller name="pan" control={editForm.control}
                rules={{ pattern: { value: PAN_PATTERN, message: "Invalid PAN — e.g. AAPFU0939F" } }}
                render={({ field, fieldState }) => (
                  <><InputText {...field} onChange={e => field.onChange(e.target.value.toUpperCase())}
                    invalid={!!fieldState.error} style={{ width: "100%", fontFamily: "monospace" }} placeholder="AAPFU0939F" maxLength={10} />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )}
              />
            </FormField>
          </FormGrid2Col>

          {/* Section: Address */}
          <SectionDivider>Registered Office Address</SectionDivider>
          <FormGrid2Col>
            <FormField style={{ gridColumn: "1 / -1" }}>
              <Lbl>Address</Lbl>
              <Controller name="registered_address" control={editForm.control}
                render={({ field, fieldState }) => (
                  <><InputText {...field} invalid={!!fieldState.error} style={{ width: "100%" }} placeholder="123 Business Park, Andheri East" />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )}
              />
            </FormField>
            <FormField>
              <Lbl>City</Lbl>
              <Controller name="city" control={editForm.control}
                render={({ field, fieldState }) => (
                  <><InputText {...field} invalid={!!fieldState.error} style={{ width: "100%" }} placeholder="Mumbai" />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )}
              />
            </FormField>
            <FormField>
              <Lbl>State</Lbl>
              <Controller name="state" control={editForm.control}
                render={({ field, fieldState }) => (
                  <><InputText {...field} invalid={!!fieldState.error} style={{ width: "100%" }} placeholder="Maharashtra" />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )}
              />
            </FormField>
            <FormField>
              <Lbl>Pin Code</Lbl>
              <Controller name="pin_code" control={editForm.control}
                rules={{ pattern: { value: PIN_PATTERN, message: "Must be exactly 6 digits" } }}
                render={({ field, fieldState }) => (
                  <><InputText {...field} invalid={!!fieldState.error} style={{ width: "100%", fontFamily: "monospace" }} placeholder="400001" maxLength={6} />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )}
              />
            </FormField>
          </FormGrid2Col>

          {/* Section: Signatory & Contact */}
          <SectionDivider>Authorized Signatory &amp; Contact</SectionDivider>
          <FormGrid2Col>
            <FormField>
              <Lbl>Name <Required>*</Required></Lbl>
              <Controller name="name" control={editForm.control}
                rules={{ required: "Name is required" }}
                render={({ field, fieldState }) => (
                  <><InputText {...field} invalid={!!fieldState.error} style={{ width: "100%" }} />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )}
              />
            </FormField>
            <FormField>
              <Lbl>Mobile</Lbl>
              <Controller name="mobile_no" control={editForm.control}
                rules={{ pattern: { value: MOBILE_PATTERN, message: "Invalid mobile number (7–15 digits)" } }}
                render={({ field, fieldState }) => (
                  <><InputText {...field} invalid={!!fieldState.error} style={{ width: "100%" }} />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )}
              />
            </FormField>
            <FormField>
              <Lbl>Signatory Name</Lbl>
              <Controller name="authorized_signatory_name" control={editForm.control}
                render={({ field, fieldState }) => (
                  <><InputText {...field} invalid={!!fieldState.error} style={{ width: "100%" }} placeholder="John Doe" />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )}
              />
            </FormField>
            <FormField>
              <Lbl>Designation</Lbl>
              <Controller name="designation" control={editForm.control}
                render={({ field, fieldState }) => (
                  <><InputText {...field} invalid={!!fieldState.error} style={{ width: "100%" }} placeholder="Director" />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )}
              />
            </FormField>
            <FormField>
              <Lbl>Status</Lbl>
              <Controller name="status" control={editForm.control}
                render={({ field, fieldState }) => (
                  <><Dropdown value={field.value} options={STATUS_OPTIONS} onChange={e => field.onChange(e.value)}
                    invalid={!!fieldState.error} style={{ width: "100%" }} />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )}
              />
            </FormField>
            <FormField>
              <Lbl>Allow Member Upload</Lbl>
              <Controller name="allow_member_upload" control={editForm.control}
                render={({ field }) => (
                  <Dropdown
                    value={field.value ? "yes" : "no"}
                    options={[{ label: "Yes", value: "yes" }, { label: "No", value: "no" }]}
                    onChange={e => field.onChange(e.value === "yes")}
                    style={{ width: "100%" }}
                  />
                )}
              />
            </FormField>
          </FormGrid2Col>

          {/* Section: Additional Data */}
          <SectionDivider>Additional Data (Optional)</SectionDivider>
          <FormGrid2Col>
            {(["data_1", "data_2", "data_3"] as const).map((f, i) => (
              <FormField key={f}>
                <Lbl>Data {i + 1}</Lbl>
                <Controller name={f} control={editForm.control}
                  render={({ field }) => <InputText {...field} value={field.value ?? ""} style={{ width: "100%" }} placeholder={`Data ${i + 1}`} />}
                />
              </FormField>
            ))}
          </FormGrid2Col>
        </div>
      </Dialog>

      {/* ── Regen Key Result Dialog ───────────────────────────────────────── */}
      <Dialog
        header="API Key Regenerated"
        visible={!!newApiKey}
        onHide={() => { setNewApiKey(null); setRegenId(null); }}
        style={{ width: "520px" }}
        footer={<Button label="Close" onClick={() => { setNewApiKey(null); setRegenId(null); }} />}
      >
        <p style={{ marginBottom: "0.75rem", color: "#374151", fontSize: "0.9rem" }}>
          Copy this key now — it will not be shown again.
        </p>
        {newApiKey && (
          <div style={{ background: "#f8f9fb", borderRadius: 8, padding: "0.75rem 1rem", fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: "0.875rem", wordBreak: "break-all", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ flex: 1 }}>{newApiKey}</span>
            <Button icon="pi pi-copy" text size="small" title="Copy to clipboard"
              onClick={() => { navigator.clipboard.writeText(newApiKey); toast.success("Copied to clipboard"); }}
            />
          </div>
        )}
      </Dialog>
    </Page>
  );
}
