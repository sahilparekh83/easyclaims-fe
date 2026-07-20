"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { InputSwitch } from "primereact/inputswitch";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import styled from "styled-components";
import PageHeader from "@/components/ui/PageHeader";
import {
  adminListWhatsAppTemplates, adminUpdateWhatsAppTemplate,
  adminListWhatsAppTemplateOverrides, adminCreateWhatsAppTemplateOverride, adminDeleteWhatsAppTemplateOverride,
  adminListPartners,
} from "@/imports/core/api";
import { getApiError } from "@/imports/core/errors";

// ─── Styled ────────────────────────────────────────────────────────────────────

const FormGrid = styled.div`display: flex; flex-direction: column; gap: 1rem; margin-top: 0.25rem;`;
const Field = styled.div`display: flex; flex-direction: column; gap: 0.25rem;`;
const Label = styled.label`font-size: 0.875rem; font-weight: 500; color: #374151;`;
const Hint = styled.p`font-size: 0.75rem; color: #6b7280; margin: 0.25rem 0 0 0;`;
const SlugChip = styled.code`
  background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 5px;
  padding: 2px 7px; font-size: 0.78rem; color: #15803d;
`;
const FooterRow = styled.div`display: flex; justify-content: flex-end; gap: 0.5rem;`;

const TopBar = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; margin-top: 1.5rem; margin-bottom: 0.75rem; flex-wrap: wrap;
`;

const HeaderNote = styled.p`
  font-size: 0.8rem; color: #6b7280; margin: 0;
`;

// ─── Types ─────────────────────────────────────────────────────────────────────

interface WATemplate {
  id: string;
  slug: string;
  partner_id?: string | null;
  partner_name?: string | null;
  is_partner_override: boolean;
  meta_template_name?: string | null;
  meta_template_language?: string | null;
  meta_template_status?: string | null;
  header_type?: string | null;
  variable_order?: string[] | null;
  description?: string | null;
  is_active: boolean;
  updated_at?: string | null;
}

const STATUS_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const LANGUAGE_OPTIONS = [
  { label: "English (en)", value: "en" },
  { label: "Hindi (hi)", value: "hi" },
];

function statusSeverity(status?: string | null): "success" | "warning" | "danger" | "secondary" {
  if (status === "approved") return "success";
  if (status === "rejected") return "danger";
  if (status === "pending") return "warning";
  return "secondary";
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function WhatsAppTemplatesPage() {
  const queryClient = useQueryClient();
  const [editTemplate, setEditTemplate] = useState<WATemplate | null>(null);
  const [metaName, setMetaName] = useState("");
  const [metaLanguage, setMetaLanguage] = useState("en");
  const [metaStatus, setMetaStatus] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [description, setDescription] = useState("");

  const [overridesFor, setOverridesFor] = useState<WATemplate | null>(null);
  const [addingOverride, setAddingOverride] = useState(false);
  const [overridePartnerId, setOverridePartnerId] = useState("");
  const [overrideName, setOverrideName] = useState("");
  const [overrideLanguage, setOverrideLanguage] = useState("en");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "whatsapp-templates"],
    queryFn: adminListWhatsAppTemplates,
  });

  const templates: WATemplate[] = (data as any)?.data ?? [];
  const notApprovedCount = templates.filter(t => t.meta_template_status !== "approved").length;

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: object }) =>
      adminUpdateWhatsAppTemplate(id, payload),
    onSuccess: () => {
      toast.success("Template saved");
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp-templates"] });
      setEditTemplate(null);
    },
    onError: (err: any) => toast.error(getApiError(err, "Failed to save template")),
  });

  const openEdit = (t: WATemplate) => {
    setEditTemplate(t);
    setMetaName(t.meta_template_name ?? "");
    setMetaLanguage(t.meta_template_language ?? "en");
    setMetaStatus(t.meta_template_status ?? "");
    setIsActive(t.is_active);
    setDescription(t.description ?? "");
  };

  const onSave = () => {
    if (!editTemplate) return;
    updateMutation.mutate({
      id: editTemplate.id,
      payload: {
        meta_template_name: metaName.trim() || null,
        meta_template_language: metaLanguage,
        meta_template_status: metaStatus || null,
        is_active: isActive,
        description: description.trim() || null,
      },
    });
  };

  // ── Bulk "mark all approved" — per docs/meta_whatsapp_templates.md convention:
  // Meta template name == our slug, submitted in English. Handy right after a
  // batch of templates comes back approved from Meta Business Manager. ─────────
  const [bulkApproving, setBulkApproving] = useState(false);
  const onMarkAllApproved = async () => {
    const pending = templates.filter(t => t.meta_template_status !== "approved");
    if (pending.length === 0) {
      toast.info("Everything is already marked approved.");
      return;
    }
    if (!window.confirm(
      `Mark ${pending.length} template(s) as approved? This sets Meta Template Name = slug, Language = en, Status = approved for each. Only do this after they're actually approved in Meta Business Manager.`
    )) return;

    setBulkApproving(true);
    try {
      const results = await Promise.allSettled(
        pending.map(t => adminUpdateWhatsAppTemplate(t.id, {
          meta_template_name: t.slug,
          meta_template_language: "en",
          meta_template_status: "approved",
        }))
      );
      const failed = results.filter(r => r.status === "rejected").length;
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp-templates"] });
      if (failed > 0) {
        toast.error(`${pending.length - failed} approved, ${failed} failed — check and retry individually.`);
      } else {
        toast.success(`${pending.length} template(s) marked approved.`);
      }
    } finally {
      setBulkApproving(false);
    }
  };

  // ── Partner overrides ───────────────────────────────────────────────────────

  const { data: overridesData, isLoading: overridesLoading } = useQuery({
    queryKey: ["admin", "whatsapp-template-overrides", overridesFor?.slug],
    queryFn: () => adminListWhatsAppTemplateOverrides(overridesFor!.slug),
    enabled: !!overridesFor,
  });
  const overrides: WATemplate[] = (overridesData as any)?.data ?? [];

  const { data: partnersData } = useQuery({
    queryKey: ["admin", "partners", "list"],
    queryFn: () => adminListPartners({ skip: 0, limit: 500 }),
    enabled: !!overridesFor,
  });
  const partnerOptions = ((partnersData as any)?.data?.data ?? [])
    .filter((p: any) => !overrides.some(o => o.partner_id === p.id))
    .map((p: any) => ({ label: p.name, value: p.id }));

  const createOverrideMutation = useMutation({
    mutationFn: () => adminCreateWhatsAppTemplateOverride(overridesFor!.slug, {
      partner_id: overridePartnerId,
      meta_template_name: overrideName.trim() || undefined,
      meta_template_language: overrideLanguage,
    }),
    onSuccess: () => {
      toast.success("Partner override created");
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp-template-overrides", overridesFor?.slug] });
      setAddingOverride(false);
      setOverridePartnerId(""); setOverrideName(""); setOverrideLanguage("en");
    },
    onError: (err: any) => toast.error(getApiError(err, "Failed to create override")),
  });

  const deleteOverrideMutation = useMutation({
    mutationFn: (id: string) => adminDeleteWhatsAppTemplateOverride(id),
    onSuccess: () => {
      toast.success("Override removed — partner now uses the system default");
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp-template-overrides", overridesFor?.slug] });
    },
    onError: (err: any) => toast.error(getApiError(err, "Failed to remove override")),
  });

  const openOverrides = (t: WATemplate) => {
    setOverridesFor(t);
    setAddingOverride(false);
  };

  const onCreateOverride = () => {
    if (!overridePartnerId) { toast.error("Select a partner"); return; }
    createOverrideMutation.mutate();
  };

  // ─── Column renderers ──────────────────────────────────────────────────────

  const slugBody = (row: WATemplate) => <SlugChip>{row.slug}</SlugChip>;

  const nameBody = (row: WATemplate) => (
    <span style={{ fontSize: "0.85rem", color: row.meta_template_name ? "#111827" : "#9ca3af", fontFamily: row.meta_template_name ? "'IBM Plex Mono', ui-monospace, monospace" : undefined }}>
      {row.meta_template_name ?? "— not set —"}
    </span>
  );

  const descBody = (row: WATemplate) => (
    <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>{row.description ?? "—"}</span>
  );

  const statusBody = (row: WATemplate) => (
    <Tag
      severity={statusSeverity(row.meta_template_status)}
      value={row.meta_template_status ? row.meta_template_status[0].toUpperCase() + row.meta_template_status.slice(1) : "Not Set"}
      style={{ fontSize: "0.7rem" }}
    />
  );

  const activeBody = (row: WATemplate) => (
    <Tag severity={row.is_active ? "success" : "secondary"} value={row.is_active ? "Active" : "Inactive"} style={{ fontSize: "0.7rem" }} />
  );

  const updatedBody = (row: WATemplate) =>
    row.updated_at ? dayjs(row.updated_at).format("DD MMM YYYY HH:mm") : "—";

  const actionsBody = (row: WATemplate) => (
    <div style={{ display: "flex", gap: 4 }}>
      <Button label="Edit" icon="pi pi-pencil" text size="small" severity="info" onClick={() => openEdit(row)} />
      <Button label="Overrides" icon="pi pi-users" text size="small" severity="secondary" onClick={() => openOverrides(row)} />
    </div>
  );

  return (
    <div>
      <PageHeader
        title="WhatsApp Templates"
        subtitle="Manage Meta WhatsApp Cloud API template names, language, and approval status. Submission copy for each template lives in docs/meta_whatsapp_templates.md."
      />

      <TopBar>
        <HeaderNote>
          {notApprovedCount > 0
            ? `${notApprovedCount} of ${templates.length} not yet marked approved.`
            : `All ${templates.length} templates marked approved.`}
        </HeaderNote>
        <Button
          label="Mark All Approved (name = slug)"
          icon="pi pi-check-circle"
          size="small"
          loading={bulkApproving}
          disabled={notApprovedCount === 0}
          onClick={onMarkAllApproved}
        />
      </TopBar>

      {isLoading ? (
        <p style={{ padding: "1.5rem", color: "#6b7280" }}>Loading templates…</p>
      ) : (
        <DataTable value={templates} stripedRows emptyMessage="No templates found." style={{ fontSize: "0.875rem" }}>
          <Column header="Slug" body={slugBody} style={{ minWidth: "190px" }} />
          <Column header="Meta Template Name" body={nameBody} style={{ minWidth: "180px" }} />
          <Column header="Description" body={descBody} style={{ minWidth: "220px" }} />
          <Column header="Status" body={statusBody} style={{ width: "110px" }} />
          <Column header="Active" body={activeBody} style={{ width: "90px" }} />
          <Column header="Last Updated" body={updatedBody} style={{ minWidth: "150px" }} />
          <Column header="" body={actionsBody} style={{ width: "160px" }} />
        </DataTable>
      )}

      {/* ── Edit Dialog ─────────────────────────────────────────────────────── */}
      <Dialog
        header={
          <div>
            <span style={{ fontSize: "1rem", fontWeight: 600 }}>Edit WhatsApp Template</span>
            {editTemplate && (
              <div style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: "2px", fontWeight: 400 }}>
                Slug: <SlugChip>{editTemplate.slug}</SlugChip>
              </div>
            )}
          </div>
        }
        visible={!!editTemplate}
        onHide={() => setEditTemplate(null)}
        style={{ width: "560px" }}
        footer={
          <FooterRow>
            <Button label="Cancel" severity="secondary" outlined onClick={() => setEditTemplate(null)} disabled={updateMutation.isPending} />
            <Button label="Save" icon="pi pi-check" loading={updateMutation.isPending} onClick={onSave} />
          </FooterRow>
        }
      >
        <FormGrid>
          <Field>
            <Label htmlFor="wt-name">Meta Template Name</Label>
            <InputText
              id="wt-name"
              value={metaName}
              onChange={(e) => setMetaName(e.target.value)}
              placeholder="Exact name Meta approved it under (usually == slug)"
              style={{ width: "100%", fontFamily: "'IBM Plex Mono', ui-monospace, monospace" }}
            />
            <Hint>Leave blank to keep this template dormant — sends silently no-op until this is set.</Hint>
          </Field>

          <Field>
            <Label>Language</Label>
            <Dropdown value={metaLanguage} options={LANGUAGE_OPTIONS} onChange={(e) => setMetaLanguage(e.value)} style={{ width: "100%" }} />
          </Field>

          <Field>
            <Label>Approval Status</Label>
            <Dropdown value={metaStatus} options={STATUS_OPTIONS} onChange={(e) => setMetaStatus(e.value)} placeholder="Not set" showClear style={{ width: "100%" }} />
          </Field>

          <Field>
            <Label htmlFor="wt-desc">Description</Label>
            <InputTextarea
              id="wt-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ width: "100%" }}
            />
          </Field>

          <Field>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <InputSwitch checked={isActive} onChange={(e) => setIsActive(!!e.value)} />
              <Label style={{ margin: 0 }}>Active</Label>
            </div>
          </Field>
        </FormGrid>
      </Dialog>

      {/* ── Partner Overrides Dialog ─────────────────────────────────────────── */}
      <Dialog
        header={
          <div>
            <span style={{ fontSize: "1rem", fontWeight: 600 }}>Partner Overrides</span>
            {overridesFor && (
              <div style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: "2px", fontWeight: 400 }}>
                Slug: <SlugChip>{overridesFor.slug}</SlugChip> — a partner override takes priority over the system default for that partner's members.
              </div>
            )}
          </div>
        }
        visible={!!overridesFor}
        onHide={() => { setOverridesFor(null); setAddingOverride(false); }}
        style={{ width: "560px" }}
      >
        {overridesLoading ? (
          <p style={{ color: "#6b7280" }}>Loading…</p>
        ) : (
          <>
            {overrides.length === 0 && !addingOverride && (
              <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>
                No partner overrides yet — all partners use the system default for this message.
              </p>
            )}
            {overrides.map((o) => (
              <div key={o.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: 8, marginBottom: 8,
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{o.partner_name || o.partner_id}</div>
                  {o.meta_template_name && <div style={{ fontSize: "0.78rem", color: "#6b7280", fontFamily: "'IBM Plex Mono', ui-monospace, monospace" }}>{o.meta_template_name}</div>}
                </div>
                <Button
                  label="Remove"
                  icon="pi pi-trash"
                  text
                  size="small"
                  severity="danger"
                  loading={deleteOverrideMutation.isPending}
                  onClick={() => {
                    if (window.confirm(`Remove ${o.partner_name || "this partner"}'s override? They will go back to the system default.`)) {
                      deleteOverrideMutation.mutate(o.id);
                    }
                  }}
                />
              </div>
            ))}

            {!addingOverride ? (
              <Button
                label="+ Add Partner Override"
                size="small"
                outlined
                style={{ marginTop: 8 }}
                onClick={() => setAddingOverride(true)}
                disabled={partnerOptions.length === 0}
              />
            ) : (
              <FormGrid style={{ marginTop: 12, borderTop: "1px solid #f3f4f6", paddingTop: 12 }}>
                <Field>
                  <Label>Partner *</Label>
                  <Dropdown
                    value={overridePartnerId}
                    options={partnerOptions}
                    onChange={(e) => setOverridePartnerId(e.value)}
                    placeholder="Select a partner"
                    filter
                    style={{ width: "100%" }}
                  />
                </Field>
                <Field>
                  <Label>Meta Template Name</Label>
                  <InputText value={overrideName} onChange={(e) => setOverrideName(e.target.value)} style={{ width: "100%" }} />
                </Field>
                <Field>
                  <Label>Language</Label>
                  <Dropdown value={overrideLanguage} options={LANGUAGE_OPTIONS} onChange={(e) => setOverrideLanguage(e.value)} style={{ width: "100%" }} />
                </Field>
                <FooterRow>
                  <Button label="Cancel" severity="secondary" outlined size="small" onClick={() => setAddingOverride(false)} />
                  <Button label="Create Override" size="small" loading={createOverrideMutation.isPending} onClick={onCreateOverride} />
                </FooterRow>
              </FormGrid>
            )}
          </>
        )}
      </Dialog>
    </div>
  );
}
