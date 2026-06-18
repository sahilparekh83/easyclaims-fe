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
import PageHeader from "@/components/ui/PageHeader";
import { adminListEmailTemplates, adminUpdateEmailTemplate } from "@/imports/core/api";
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

// ─── Types ─────────────────────────────────────────────────────────────────────

interface EmailTemplate {
  id: string;
  slug: string;
  description?: string | null;
  subject: string;
  html_body: string;
  is_active: boolean;
  updated_at?: string | null;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function EmailTemplatesPage() {
  const queryClient = useQueryClient();
  const [editTemplate, setEditTemplate] = useState<EmailTemplate | null>(null);
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [description, setDescription] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "email-templates"],
    queryFn: adminListEmailTemplates,
  });

  const templates: EmailTemplate[] = (data as any)?.data ?? [];

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

  const openEdit = (t: EmailTemplate) => {
    setEditTemplate(t);
    setSubject(t.subject);
    setHtmlBody(t.html_body);
    setDescription(t.description ?? "");
  };

  const onSave = () => {
    if (!editTemplate) return;
    if (!subject.trim()) { toast.error("Subject is required"); return; }
    if (!htmlBody.trim()) { toast.error("Body is required"); return; }
    updateMutation.mutate({
      id: editTemplate.id,
      payload: { subject: subject.trim(), html_body: htmlBody.trim(), description: description.trim() || null },
    });
  };

  // ─── Column renderers ──────────────────────────────────────────────────────

  const slugBody = (row: EmailTemplate) => <SlugChip>{row.slug}</SlugChip>;

  const subjectBody = (row: EmailTemplate) => (
    <span style={{ fontSize: "0.875rem", color: "#111827" }}>{row.subject}</span>
  );

  const descBody = (row: EmailTemplate) => (
    <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>{row.description ?? "—"}</span>
  );

  const statusBody = (row: EmailTemplate) => (
    <Tag
      severity={row.is_active ? "success" : "secondary"}
      value={row.is_active ? "Active" : "Inactive"}
      style={{ fontSize: "0.7rem" }}
    />
  );

  const updatedBody = (row: EmailTemplate) =>
    row.updated_at ? dayjs(row.updated_at).format("DD MMM YYYY HH:mm") : "—";

  const actionsBody = (row: EmailTemplate) => (
    <Button
      label="Edit"
      icon="pi pi-pencil"
      text
      size="small"
      severity="info"
      onClick={() => openEdit(row)}
    />
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader
        title="Email Templates"
        subtitle="Manage all system email templates. Templates use Jinja2 syntax ({{ variable }})."
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
          >
            <Column header="Slug" body={slugBody} style={{ minWidth: "200px" }} />
            <Column header="Subject" body={subjectBody} style={{ minWidth: "220px" }} />
            <Column header="Description" body={descBody} style={{ minWidth: "200px" }} />
            <Column header="Status" body={statusBody} style={{ width: "90px" }} />
            <Column header="Last Updated" body={updatedBody} style={{ minWidth: "150px" }} />
            <Column header="" body={actionsBody} style={{ width: "80px" }} />
          </DataTable>
        )}
      </div>

      {/* ── Edit Dialog ─────────────────────────────────────────────────────── */}
      <Dialog
        header={
          <div>
            <div style={{ fontSize: "1rem", fontWeight: 600 }}>Edit Template</div>
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

          <Field>
            <Label htmlFor="et-body">HTML Body *</Label>
            <InputTextarea
              id="et-body"
              value={htmlBody}
              onChange={(e) => setHtmlBody(e.target.value)}
              rows={16}
              style={{ width: "100%", fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: "0.8rem" }}
              placeholder="<p>Hello {{ member_name }},</p>"
            />
            <Hint>
              Full HTML supported. Variables use Jinja2 syntax: {"{{ variable_name }}"}.
              Check the slug description for available variables.
            </Hint>
          </Field>
        </FormGrid>
      </Dialog>
    </div>
  );
}
