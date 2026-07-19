"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { useForm, Controller, useWatch } from "react-hook-form";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import styled from "styled-components";
import { ChevronRight } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { getApiError } from "@/imports/core/errors";
import {
  adminListMembers, adminCreateMember, adminListPartners,
  adminGetPartnerPlans,
} from "@/imports/core/api";

const GENDER_OPTIONS = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
];

// ─── Styled ───────────────────────────────────────────────────────────────────

const PageWrap = styled.div`
  max-width: 1240px;
`;

const Card = styled.div`
  background: #fff;
  border: 1px solid #e8eaf0;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  overflow: hidden;
`;

const CardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 18px 0;
  border-bottom: 1px solid #e8eaf0;
`;

const TabBar = styled.div`
  display: flex;
  gap: 0;
`;

const Tab = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  border-bottom: 2px solid ${p => p.$active ? "#2563eb" : "transparent"};
  color: ${p => p.$active ? "#2563eb" : "#64748b"};
  font-size: 13.5px;
  font-weight: ${p => p.$active ? 700 : 500};
  padding: 10px 16px 12px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  &:hover { color: #0f172a; }
`;

const TopActions = styled.div`
  display: flex;
  gap: 10px;
  padding-bottom: 8px;
  align-items: center;
`;

const SearchWrap = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  i { position: absolute; left: 10px; color: #94a3b8; font-size: 13px; pointer-events: none; }
`;

const SearchInput = styled.input`
  height: 34px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0 12px 0 34px;
  font-size: 13px;
  color: #0f172a;
  outline: none;
  width: 220px;
  background: #f8f9fb;
  &:focus { border-color: #2563eb; background: #fff; }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
`;

const Th = styled.th`
  padding: 11px 22px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  background: #f8f9fb;
  white-space: nowrap;
`;

const ThSm = styled(Th)`
  padding: 11px 8px;
`;

const Tr = styled.tr`
  cursor: pointer;
  border-top: 1px solid #f1f2f6;
  &:hover { background: #f8f9fb; }
`;

const Td = styled.td`
  padding: 13px 22px;
  vertical-align: middle;
`;

const TdSm = styled(Td)`
  padding: 13px 8px;
`;

const Avatar = styled.div`
  width: 34px; height: 34px; border-radius: 50%;
  background: #e0e7ff; color: #4338ca;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.8rem; font-weight: 700; flex: none;
`;

const MemberName = styled.div`
  font-weight: 700; color: #0f172a; font-size: 13.5px;
`;

const MemberId = styled.div`
  font-family: 'IBM Plex Mono', ui-monospace, monospace; color: #64748b; font-size: 11.5px; margin-top: 1px;
`;

const PlanBadge = styled.span`
  font-size: 11.5px; font-weight: 600;
  background: #eff6ff; color: #2563eb;
  border-radius: 999px; padding: 3px 10px;
  white-space: nowrap;
`;

const Required = styled.span`color: #dc2626;`;

const JoinedCell = styled.div`
  display: inline-flex; align-items: center; gap: 10px;
  color: #64748b; font-size: 13px;
`;

const Pagination = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 22px; border-top: 1px solid #f1f2f6;
  font-size: 13px; color: #64748b;
`;

const PagBtn = styled.button`
  background: none; border: 1px solid #e2e8f0; border-radius: 8px;
  padding: 6px 14px; font-size: 13px; font-weight: 600; color: #374151;
  cursor: pointer;
  &:hover:not(:disabled) { background: #f1f5f9; }
  &:disabled { opacity: 0.4; cursor: default; }
`;

const EmptyRow = styled.tr`
  td { padding: 40px 22px; text-align: center; color: #9ca3af; }
`;

const FormGrid = styled.div`
  display: flex; flex-direction: column; gap: 1rem; margin-top: 0.5rem;
`;

const Field = styled.div`
  display: flex; flex-direction: column; gap: 0.25rem;
`;

const FieldLabel = styled.label`
  font-size: 0.875rem; font-weight: 500; color: #374151;
`;

const Err = styled.small`
  color: #dc2626; font-size: 0.75rem;
`;

const FooterRow = styled.div`
  display: flex; justify-content: flex-end; gap: 0.5rem;
`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Member {
  id: string;
  name?: string;
  email?: string;
  mobile_no?: string | null;
  is_active?: boolean;
  created_at?: string | null;
  policy_count?: number;
  plan_name?: string | null;
  partner_name?: string | null;
  enrollments?: any[];
}

interface MemberFormValues {
  email: string;
  name: string;
  mobile_no: string;
  gender: string;
  address_line: string;
  address_city: string;
  address_state: string;
  address_pin: string;
  sale_date: string;
  sales_channel: string;
  branch_code: string;
  salesperson_name: string;
  employee_code: string;
  data1: string;
  data2: string;
  data3: string;
  partner_id: string;
  plan_id: string;
}

type FilterTab = "all" | "active" | "inactive";

const ROWS = 20;

function initials(name?: string | null, email?: string | null) {
  const src = name || email || "M";
  return src.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MembersPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [tab, setTab] = useState<FilterTab>("all");
  const debouncedSearch = useDebounce(search, 300);

  const form = useForm<MemberFormValues>({
    defaultValues: { email: "", name: "", mobile_no: "", gender: "", address_line: "", address_city: "", address_state: "", address_pin: "", sale_date: "", sales_channel: "", branch_code: "", salesperson_name: "", employee_code: "", data1: "", data2: "", data3: "", partner_id: "", plan_id: "" },
  });

  const isActiveFilter = tab === "active" ? true : tab === "inactive" ? false : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "members", debouncedSearch, page, tab],
    queryFn: () => adminListMembers({
      global_filter: debouncedSearch || undefined,
      sort_field: "created_at",
      sort_order: -1,
      limit: ROWS,
      skip: page * ROWS,
      ...(isActiveFilter !== undefined ? { filters: [{ field: "is_active", value: isActiveFilter }] } : {}),
    }),
  });

  const selectedPartnerId = useWatch({ control: form.control, name: "partner_id" });

  const { data: partnersData } = useQuery({
    queryKey: ["admin", "partners", "select", "active"],
    queryFn: () => adminListPartners({
      limit: 200, skip: 0,
      filters: [{ field: "status", operator: "equals", value: "Active" }],
    }),
    enabled: createOpen,
  });

  const { data: partnerPlansData } = useQuery({
    queryKey: ["admin", "partner-plans", selectedPartnerId],
    queryFn: () => adminGetPartnerPlans(selectedPartnerId),
    enabled: createOpen && !!selectedPartnerId,
  });

  const members: Member[] = data?.data?.data ?? [];
  const total: number = data?.data?.total ?? 0;
  const totalPages = Math.ceil(total / ROWS);

  const partnerOptions = (partnersData?.data?.data ?? []).map((p: any) => ({
    label: p.name, value: p.id,
  }));

  const planOptions = ((partnerPlansData as any)?.data ?? []).map((p: any) => ({
    label: `${p.name}${p.status !== "Active" ? ` (${p.status})` : ""}`,
    value: p.id,
  }));

  const createMutation = useMutation({
    mutationFn: (v: MemberFormValues) =>
      adminCreateMember({
        email: v.email,
        name: v.name,
        mobile_no: v.mobile_no || undefined,
        gender: v.gender || undefined,
        address_line: v.address_line || undefined,
        address_city: v.address_city || undefined,
        address_state: v.address_state || undefined,
        address_pin: v.address_pin || undefined,
        sale_date: v.sale_date || undefined,
        sales_channel: v.sales_channel || undefined,
        branch_code: v.branch_code || undefined,
        salesperson_name: v.salesperson_name || undefined,
        employee_code: v.employee_code || undefined,
        data1: v.data1 || undefined,
        data2: v.data2 || undefined,
        data3: v.data3 || undefined,
        partner_id: v.partner_id || undefined,
        plan_id: v.plan_id || undefined,
      }),
    onSuccess: () => {
      toast.success("Member created successfully");
      setCreateOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["admin", "members"] });
    },
    onError: (err: any) => {
      toast.error(getApiError(err, "Failed to create member"));
    },
  });

  const openCreate = () => {
    form.reset({ email: "", name: "", mobile_no: "", gender: "", address_line: "", address_city: "", address_state: "", address_pin: "", sale_date: "", sales_channel: "", branch_code: "", salesperson_name: "", employee_code: "", data1: "", data2: "", data3: "", partner_id: "", plan_id: "" });
    setCreateOpen(true);
  };

  const dialogFooter = (
    <FooterRow>
      <Button label="Cancel" severity="secondary" onClick={() => setCreateOpen(false)} />
      <Button label="Create" loading={createMutation.isPending} onClick={form.handleSubmit((v) => createMutation.mutate(v))} />
    </FooterRow>
  );

  const TABS: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "inactive", label: "Inactive" },
  ];

  return (
    <PageWrap>
      <Card>
        <CardTop>
          <TabBar>
            {TABS.map(t => (
              <Tab key={t.key} $active={tab === t.key} onClick={() => { setTab(t.key); setPage(0); }}>
                {t.label}
              </Tab>
            ))}
          </TabBar>
          <TopActions>
            <SearchWrap>
              <i className="pi pi-search" />
              <SearchInput
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                placeholder="Search members…"
              />
            </SearchWrap>
            <Button
              label="Bulk Upload"
              icon="pi pi-upload"
              size="small"
              severity="secondary"
              onClick={() => router.push("/admin/members/bulk-upload")}
              style={{ height: 34, fontSize: 13 }}
            />
            <Button
              label="Add member"
              icon="pi pi-plus"
              size="small"
              onClick={openCreate}
              style={{ height: 34, fontSize: 13 }}
            />
          </TopActions>
        </CardTop>

        <Table>
          <thead>
            <tr>
              <Th>Member</Th>
              <ThSm>Plan</ThSm>
              <ThSm>Policies</ThSm>
              <ThSm>Acquired by</ThSm>
              <ThSm>Status</ThSm>
              <Th>Joined</Th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <EmptyRow><td>Loading…</td></EmptyRow>
            ) : members.length === 0 ? (
              <EmptyRow><td>No members found.</td></EmptyRow>
            ) : members.map(m => (
              <Tr key={m.id} onClick={() => router.push(`/admin/members/${m.id}`)}>
                <Td>
                  <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                    <Avatar>{initials(m.name, m.email)}</Avatar>
                    <div>
                      <MemberName>{m.name || m.email}</MemberName>
                      <MemberId>{m.id?.slice(-8)?.toUpperCase()}</MemberId>
                    </div>
                  </div>
                </Td>
                <TdSm>
                  {m.plan_name
                    ? <PlanBadge>{m.plan_name}</PlanBadge>
                    : <span style={{ color: "#9ca3af" }}>—</span>}
                </TdSm>
                <TdSm style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", color: "#374151" }}>
                  {m.policy_count ?? 0}
                </TdSm>
                <TdSm style={{ color: "#374151" }}>
                  {m.partner_name ?? "—"}
                </TdSm>
                <TdSm>
                  <StatusBadge value={!!m.is_active} trueLabel="Active" falseLabel="Inactive" />
                </TdSm>
                <Td>
                  <JoinedCell>
                    {m.created_at ? dayjs(m.created_at).format("DD MMM YYYY") : "—"}
                    <ChevronRight size={15} color="#94a3b8" />
                  </JoinedCell>
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

      {/* Create Member Dialog */}
      <Dialog
        header="Add Member"
        visible={createOpen}
        onHide={() => { setCreateOpen(false); form.reset(); }}
        style={{ width: "620px" }}
        footer={dialogFooter}
        maximizable
      >
        <FormGrid>
          {/* ── Basic info ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Field>
              <FieldLabel htmlFor="m-name">Full Name <Required>*</Required></FieldLabel>
              <Controller name="name" control={form.control} rules={{ required: "Name is required" }}
                render={({ field, fieldState }) => (
                  <><InputText id="m-name" {...field} invalid={!!fieldState.error} style={{ width: "100%" }} />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )} />
            </Field>
            <Field>
              <FieldLabel htmlFor="m-email">Email <Required>*</Required></FieldLabel>
              <Controller name="email" control={form.control} rules={{ required: "Email is required", pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email" } }}
                render={({ field, fieldState }) => (
                  <><InputText id="m-email" type="email" {...field} invalid={!!fieldState.error} style={{ width: "100%" }} />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )} />
            </Field>
            <Field>
              <FieldLabel htmlFor="m-mobile">Mobile No. <Required>*</Required></FieldLabel>
              <Controller name="mobile_no" control={form.control} rules={{ required: "Mobile is required", pattern: { value: /^\+?[\d\s\-()]{7,15}$/, message: "Invalid mobile (7–15 digits)" } }}
                render={({ field, fieldState }) => (
                  <><InputText id="m-mobile" {...field} placeholder="+91 98765 43210" invalid={!!fieldState.error} style={{ width: "100%" }} />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )} />
            </Field>
            <Field>
              <FieldLabel>Gender <Required>*</Required></FieldLabel>
              <Controller name="gender" control={form.control} rules={{ required: "Gender is required" }}
                render={({ field, fieldState }) => (
                  <><Dropdown value={field.value} options={GENDER_OPTIONS} onChange={e => field.onChange(e.value)} placeholder="Select gender" style={{ width: "100%" }} invalid={!!fieldState.error} />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )} />
            </Field>
          </div>

          {/* ── Address ── */}
          <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "0.75rem" }}>
            <FieldLabel style={{ fontSize: "0.72rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Address</FieldLabel>
          </div>
          <Field>
            <FieldLabel htmlFor="m-addr">Address Line <Required>*</Required></FieldLabel>
            <Controller name="address_line" control={form.control} rules={{ required: "Address is required" }}
              render={({ field, fieldState }) => (
                <><InputText id="m-addr" {...field} style={{ width: "100%" }} invalid={!!fieldState.error} />
                {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
              )} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
            <Field>
              <FieldLabel>City <Required>*</Required></FieldLabel>
              <Controller name="address_city" control={form.control} rules={{ required: "City is required" }}
                render={({ field, fieldState }) => (
                  <><InputText {...field} style={{ width: "100%" }} invalid={!!fieldState.error} />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )} />
            </Field>
            <Field>
              <FieldLabel>State <Required>*</Required></FieldLabel>
              <Controller name="address_state" control={form.control} rules={{ required: "State is required" }}
                render={({ field, fieldState }) => (
                  <><InputText {...field} style={{ width: "100%" }} invalid={!!fieldState.error} />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )} />
            </Field>
            <Field>
              <FieldLabel>PIN Code <Required>*</Required></FieldLabel>
              <Controller name="address_pin" control={form.control} rules={{ required: "PIN is required", pattern: { value: /^\d{6}$/, message: "6-digit PIN" } }}
                render={({ field, fieldState }) => (
                  <><InputText {...field} placeholder="400001" maxLength={6} style={{ width: "100%" }} invalid={!!fieldState.error} />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )} />
            </Field>
          </div>

          {/* ── Onboarding ── */}
          <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "0.75rem" }}>
            <FieldLabel style={{ fontSize: "0.72rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Onboarding &amp; Sales (optional)</FieldLabel>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Field>
              <FieldLabel>Sale Date</FieldLabel>
              <Controller name="sale_date" control={form.control}
                render={({ field }) => (
                  <Calendar value={field.value ? new Date(field.value) : null}
                    onChange={e => { const v = e.value; field.onChange(v instanceof Date ? dayjs(v).format("YYYY-MM-DD") : ""); }}
                    dateFormat="dd M yy" showIcon style={{ width: "100%" }} inputStyle={{ width: "100%" }}
                    placeholder="Select date" maxDate={new Date()} />
                )} />
            </Field>
            <Field>
              <FieldLabel>Sales Channel</FieldLabel>
              <Controller name="sales_channel" control={form.control}
                render={({ field }) => <InputText {...field} style={{ width: "100%" }} />} />
            </Field>
            <Field>
              <FieldLabel>Branch Code</FieldLabel>
              <Controller name="branch_code" control={form.control}
                render={({ field }) => <InputText {...field} style={{ width: "100%" }} />} />
            </Field>
            <Field>
              <FieldLabel>Salesperson Name</FieldLabel>
              <Controller name="salesperson_name" control={form.control}
                render={({ field }) => <InputText {...field} style={{ width: "100%" }} />} />
            </Field>
            <Field>
              <FieldLabel>Employee Code</FieldLabel>
              <Controller name="employee_code" control={form.control}
                render={({ field }) => <InputText {...field} style={{ width: "100%" }} />} />
            </Field>
            <Field>
              <FieldLabel>Data 1</FieldLabel>
              <Controller name="data1" control={form.control}
                render={({ field }) => <InputText {...field} style={{ width: "100%" }} />} />
            </Field>
            <Field>
              <FieldLabel>Data 2</FieldLabel>
              <Controller name="data2" control={form.control}
                render={({ field }) => <InputText {...field} style={{ width: "100%" }} />} />
            </Field>
            <Field>
              <FieldLabel>Data 3</FieldLabel>
              <Controller name="data3" control={form.control}
                render={({ field }) => <InputText {...field} style={{ width: "100%" }} />} />
            </Field>
          </div>

          {/* ── Partner & Plan ── */}
          <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "0.75rem" }}>
            <FieldLabel style={{ fontSize: "0.72rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Enrollment</FieldLabel>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Field>
              <FieldLabel>Partner</FieldLabel>
              <Controller name="partner_id" control={form.control}
                render={({ field }) => (
                  <Dropdown id="m-partner" value={field.value} options={partnerOptions} onChange={e => { field.onChange(e.value); form.setValue("plan_id", ""); }} placeholder="Select partner" showClear style={{ width: "100%" }} filter />
                )} />
            </Field>
            <Field>
              <FieldLabel>Plan</FieldLabel>
              <Controller name="plan_id" control={form.control}
                render={({ field }) => (
                  <Dropdown id="m-plan" value={field.value} options={planOptions} onChange={e => field.onChange(e.value)} placeholder={selectedPartnerId ? "Select plan" : "Select partner first"} disabled={!selectedPartnerId} showClear style={{ width: "100%" }} />
                )} />
            </Field>
          </div>
        </FormGrid>
      </Dialog>
    </PageWrap>
  );
}
