"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Tag } from "primereact/tag";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import styled from "styled-components";
import { Dropdown } from "primereact/dropdown";
import PageHeader from "@/components/ui/PageHeader";
import {
  adminListEmailTemplates, adminUpdateEmailTemplate,
  adminListTemplateOverrides, adminCreateTemplateOverride, adminDeleteTemplateOverride,
  adminListPartners,
} from "@/imports/core/api";
import { getApiError } from "@/imports/core/errors";

// ─── Styled ────────────────────────────────────────────────────────────────────

const FormGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 0.25rem;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`;

const Hint = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
`;

const SlugChip = styled.code`
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 5px;
  padding: 2px 7px;
  font-size: 0.78rem;
  color: #4b5563;
`;

const FooterRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;

const TypeChip = styled.span<{ $type: "email" | "whatsapp" }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  background: ${p => p.$type === "whatsapp" ? "#f0fdf4" : "#eff6ff"};
  color: ${p => p.$type === "whatsapp" ? "#15803d" : "#1d4ed8"};
  border: 1px solid ${p => p.$type === "whatsapp" ? "#bbf7d0" : "#bfdbfe"};
`;

// ─── Types ─────────────────────────────────────────────────────────────────────

interface MessageTemplate {
  id: string;
  slug: string;
  channel_type: "email" | "whatsapp";
  description?: string | null;
  subject?: string | null;
  html_body: string;
  is_active: boolean;
  updated_at?: string | null;
}

interface TemplateOverride {
  id: string;
  slug: string;
  partner_id: string;
  partner_name?: string | null;
  subject?: string | null;
  html_body: string;
  description?: string | null;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function EmailTemplatesPage() {
  const queryClient = useQueryClient();
  const [editTemplate, setEditTemplate] = useState<MessageTemplate | null>(null);
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [description, setDescription] = useState("");

  const [overridesFor, setOverridesFor] = useState<MessageTemplate | null>(null);
  const [addingOverride, setAddingOverride] = useState(false);
  const [overridePartnerId, setOverridePartnerId] = useState("");
  const [overrideSubject, setOverrideSubject] = useState("");
  const [overrideBody, setOverrideBody] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "email-templates"],
    queryFn: adminListEmailTemplates,
  });

  const templates: MessageTemplate[] = (data as any)?.data ?? [];

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: object }) =>
      adminUpdateEmailTemplate(id, payload),
    onSuccess: () => {
      toast.success("Template saved");
      queryClient.invalidateQueries({ queryKey: ["admin", "email-templates"] });
      setEditTemplate(null);
    },
    onError: (err: any) => {
      toast.error(getApiError(err, "Failed to save template"));
    },
  });

  const openEdit = (t: MessageTemplate) => {
    setEditTemplate(t);
    setSubject(t.subject ?? "");
    setHtmlBody(t.html_body);
    setDescription(t.description ?? "");
  };

  // ── Partner overrides (E6, 4th MOM) ─────────────────────────────────────────

  const { data: overridesData, isLoading: overridesLoading } = useQuery({
    queryKey: ["admin", "email-template-overrides", overridesFor?.slug],
    queryFn: () => adminListTemplateOverrides(overridesFor!.slug),
    enabled: !!overridesFor,
  });
  const overrides: TemplateOverride[] = (overridesData as any)?.data ?? [];

  const { data: partnersData } = useQuery({
    queryKey: ["admin", "partners", "list"],
    queryFn: () => adminListPartners({ skip: 0, limit: 500 }),
    enabled: !!overridesFor,
  });
  const partnerOptions = ((partnersData as any)?.data?.data ?? [])
    .filter((p: any) => !overrides.some(o => o.partner_id === p.id))
    .map((p: any) => ({ label: p.name, value: p.id }));

  const createOverrideMutation = useMutation({
    mutationFn: () => adminCreateTemplateOverride(overridesFor!.slug, {
      partner_id: overridePartnerId,
      subject: overrideSubject.trim(),
      html_body: overrideBody.trim(),
    }),
    onSuccess: () => {
      toast.success("Partner override created");
      queryClient.invalidateQueries({ queryKey: ["admin", "email-template-overrides", overridesFor?.slug] });
      setAddingOverride(false);
      setOverridePartnerId(""); setOverrideSubject(""); setOverrideBody("");
    },
    onError: (err: any) => toast.error(getApiError(err, "Failed to create override")),
  });

  const deleteOverrideMutation = useMutation({
    mutationFn: (id: string) => adminDeleteTemplateOverride(id),
    onSuccess: () => {
      toast.success("Override removed — partner now uses the system default");
      queryClient.invalidateQueries({ queryKey: ["admin", "email-template-overrides", overridesFor?.slug] });
    },
    onError: (err: any) => toast.error(getApiError(err, "Failed to remove override")),
  });

  const openOverrides = (t: MessageTemplate) => {
    setOverridesFor(t);
    setAddingOverride(false);
  };

  const onCreateOverride = () => {
    if (!overridePartnerId) { toast.error("Select a partner"); return; }
    if (overridesFor?.channel_type === "email" && !overrideSubject.trim()) {
      toast.error("Subject is required for email templates"); return;
    }
    if (!overrideBody.trim()) { toast.error("Body is required"); return; }
    createOverrideMutation.mutate();
  };

  const onSave = () => {
    if (!editTemplate) return;
    if (editTemplate.channel_type === "email" && !subject.trim()) {
      toast.error("Subject is required for email templates");
      return;
    }
    if (!htmlBody.trim()) { toast.error("Body is required"); return; }
    const payload: Record<string, any> = {
      html_body: htmlBody.trim(),
      description: description.trim() || null,
    };
    if (editTemplate.channel_type === "email") {
      payload.subject = subject.trim();
    }
    updateMutation.mutate({ id: editTemplate.id, payload });
  };

  // ─── Column renderers ──────────────────────────────────────────────────────

  const typeBody = (row: MessageTemplate) => {
    const type = (row.channel_type ?? "email") as "email" | "whatsapp";
    return (
      <TypeChip $type={type}>
        {type === "whatsapp" ? (
          <><i className="pi pi-whatsapp" style={{ fontSize: 11 }} /> WhatsApp</>
        ) : (
          <><i className="pi pi-envelope" style={{ fontSize: 11 }} /> Email</>
        )}
      </TypeChip>
    );
  };

  const slugBody = (row: MessageTemplate) => <SlugChip>{row.slug}</SlugChip>;

  const subjectBody = (row: MessageTemplate) => (
    <span style={{ fontSize: "0.875rem", color: row.subject ? "#111827" : "#9ca3af" }}>
      {row.subject ?? (row.channel_type === "whatsapp" ? "— (WhatsApp)" : "—")}
    </span>
  );

  const descBody = (row: MessageTemplate) => (
    <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>{row.description ?? "—"}</span>
  );

  const statusBody = (row: MessageTemplate) => (
    <Tag
      severity={row.is_active ? "success" : "secondary"}
      value={row.is_active ? "Active" : "Inactive"}
      style={{ fontSize: "0.7rem" }}
    />
  );

  const updatedBody = (row: MessageTemplate) =>
    row.updated_at ? dayjs(row.updated_at).format("DD MMM YYYY HH:mm") : "—";

  const actionsBody = (row: MessageTemplate) => (
    <div style={{ display: "flex", gap: 4 }}>
      <Button
        label="Edit"
        icon="pi pi-pencil"
        text
        size="small"
        severity="info"
        onClick={() => openEdit(row)}
      />
      <Button
        label="Partner Overrides"
        icon="pi pi-users"
        text
        size="small"
        severity="secondary"
        onClick={() => openOverrides(row)}
      />
    </div>
  );

  const isWA = editTemplate?.channel_type === "whatsapp";

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader
        title="Message Templates"
        subtitle="Manage all system email and WhatsApp message templates. Templates use Jinja2 syntax ({{ variable }})."
      />

      <div style={{ marginTop: "1.5rem" }}>
        {isLoading ? (
          <p style={{ padding: "1.5rem", color: "#6b7280" }}>Loading templates…</p>
        ) : (
          <DataTable
            value={templates}
            stripedRows
            emptyMessage="No templates found."
            style={{ fontSize: "0.875rem" }}
            sortField="channel_type"
            sortOrder={1}
          >
            <Column header="Type" body={typeBody} style={{ width: "120px" }} sortable field="channel_type" />
            <Column header="Slug" body={slugBody} style={{ minWidth: "200px" }} />
            <Column header="Subject / Title" body={subjectBody} style={{ minWidth: "200px" }} />
            <Column header="Description" body={descBody} style={{ minWidth: "200px" }} />
            <Column header="Status" body={statusBody} style={{ width: "90px" }} />
            <Column header="Last Updated" body={updatedBody} style={{ minWidth: "150px" }} />
            <Column header="" body={actionsBody} style={{ width: "170px" }} />
          </DataTable>
        )}
      </div>

      {/* ── Edit Dialog ─────────────────────────────────────────────────────── */}
      <Dialog
        header={
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "1rem", fontWeight: 600 }}>Edit Template</span>
              {editTemplate && (
                <TypeChip $type={(editTemplate.channel_type ?? "email") as "email" | "whatsapp"}>
                  {isWA ? (
                    <><i className="pi pi-whatsapp" style={{ fontSize: 11 }} /> WhatsApp</>
                  ) : (
                    <><i className="pi pi-envelope" style={{ fontSize: 11 }} /> Email</>
                  )}
                </TypeChip>
              )}
            </div>
            {editTemplate && (
              <div style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: "2px" }}>
                Slug: <SlugChip>{editTemplate.slug}</SlugChip>
              </div>
            )}
          </div>
        }
        visible={!!editTemplate}
        onHide={() => setEditTemplate(null)}
        style={{ width: "760px" }}
        footer={
          <FooterRow>
            <Button label="Cancel" severity="secondary" outlined onClick={() => setEditTemplate(null)} disabled={updateMutation.isPending} />
            <Button label="Save" icon="pi pi-check" loading={updateMutation.isPending} onClick={onSave} />
          </FooterRow>
        }
      >
        <FormGrid>
          <Field>
            <Label htmlFor="et-desc">Description</Label>
            <InputText
              id="et-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of when this template is sent"
              style={{ width: "100%" }}
            />
          </Field>

          {!isWA && (
            <Field>
              <Label htmlFor="et-subject">Subject *</Label>
              <InputText
                id="et-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject line"
                style={{ width: "100%" }}
              />
              <Hint>Supports Jinja2 variables, e.g. {"{{ member_name }}"}</Hint>
            </Field>
          )}

          <Field>
            <Label htmlFor="et-body">{isWA ? "Message Body *" : "HTML Body *"}</Label>
            <InputTextarea
              id="et-body"
              value={htmlBody}
              onChange={(e) => setHtmlBody(e.target.value)}
              rows={isWA ? 10 : 16}
              style={{
                width: "100%",
                fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
                fontSize: "0.8rem",
              }}
              placeholder={isWA
                ? "Hi {{ member_name }}! 👋\n\nYour message here..."
                : "<p>Hello {{ member_name }},</p>"}
            />
            <Hint>
              {isWA
                ? "Plain text with WhatsApp formatting (*bold*, _italic_). Variables use Jinja2 syntax: {{ variable_name }}."
                : "Full HTML supported. Variables use Jinja2 syntax: {{ variable_name }}. Check the slug description for available variables."}
            </Hint>
          </Field>
        </FormGrid>
      </Dialog>

      {/* ── Partner Overrides Dialog (E6, 4th MOM) ──────────────────────────── */}
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
        style={{ width: "700px" }}
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
                  {o.subject && <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>{o.subject}</div>}
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
                {overridesFor?.channel_type === "email" && (
                  <Field>
                    <Label>Subject *</Label>
                    <InputText
                      value={overrideSubject}
                      onChange={(e) => setOverrideSubject(e.target.value)}
                      style={{ width: "100%" }}
                    />
                  </Field>
                )}
                <Field>
                  <Label>{overridesFor?.channel_type === "whatsapp" ? "Message Body *" : "HTML Body *"}</Label>
                  <InputTextarea
                    value={overrideBody}
                    onChange={(e) => setOverrideBody(e.target.value)}
                    rows={overridesFor?.channel_type === "whatsapp" ? 8 : 12}
                    style={{ width: "100%", fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: "0.8rem" }}
                    placeholder={overridesFor?.html_body}
                  />
                  <Hint>Starting point — copy the system default above and customize it.</Hint>
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
