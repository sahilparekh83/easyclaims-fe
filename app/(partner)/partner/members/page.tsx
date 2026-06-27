"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import styled from "styled-components";
import { ChevronRight } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { useDebounce } from "@/hooks/useDebounce";
import { getApiError } from "@/imports/core/errors";
import {
  partnerListMembers,
  partnerCreateMember,
  partnerListPlans,
} from "@/imports/core/api";

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
  background: #f0fdf4; color: #16a34a;
  border-radius: 999px; padding: 3px 10px;
  white-space: nowrap;
`;

const EnrolledCell = styled.div`
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

interface Enrollment {
  plan_id: string;
  plan_name?: string | null;
  status: string;
  start_date?: string | null;
  end_date?: string | null;
}

interface Member {
  id: string;
  name?: string;
  email?: string;
  mobile_no?: string | null;
  is_active?: boolean;
  policy_count?: number;
  enrollment?: Enrollment | null;
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
  plan_id: string;
}

const GENDER_OPTIONS = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
];

interface Plan {
  id: string;
  name: string;
  status: string;
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

  useEffect(() => { setPage(0); }, [debouncedSearch, tab]);

  const form = useForm<MemberFormValues>({
    defaultValues: { email: "", name: "", mobile_no: "", gender: "", address_line: "", address_city: "", address_state: "", address_pin: "", sale_date: "", sales_channel: "", branch_code: "", salesperson_name: "", employee_code: "", data1: "", data2: "", data3: "", plan_id: "" },
  });

  const isActiveFilter = tab === "active" ? true : tab === "inactive" ? false : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ["partner", "members", debouncedSearch, page, tab],
    queryFn: () => partnerListMembers({
      global_filter: debouncedSearch || undefined,
      sort_field: "created_at",
      sort_order: -1,
      limit: ROWS,
      skip: page * ROWS,
      ...(isActiveFilter !== undefined ? { filters: [{ field: "is_active", value: isActiveFilter }] } : {}),
    }),
  });

  const { data: plansData } = useQuery({
    queryKey: ["partner", "plans"],
    queryFn: partnerListPlans,
    enabled: createOpen,
  });

  const members: Member[] = (data as any)?.data?.data ?? [];
  const total: number = (data as any)?.data?.total ?? 0;
  const totalPages = Math.ceil(total / ROWS);
  const plans: Plan[] = (plansData as any)?.data ?? [];
  const planOptions = plans
    .filter(p => p.status === "Active")
    .map(p => ({ label: p.name, value: p.id }));

  const createMutation = useMutation({
    mutationFn: (v: MemberFormValues) => {
      const payload: Record<string, unknown> = { email: v.email, name: v.name };
      if (v.mobile_no) payload.mobile_no = v.mobile_no;
      if (v.gender) payload.gender = v.gender;
      if (v.address_line) payload.address_line = v.address_line;
      if (v.address_city) payload.address_city = v.address_city;
      if (v.address_state) payload.address_state = v.address_state;
      if (v.address_pin) payload.address_pin = v.address_pin;
      if (v.sale_date) payload.sale_date = v.sale_date;
      if (v.sales_channel) payload.sales_channel = v.sales_channel;
      if (v.branch_code) payload.branch_code = v.branch_code;
      if (v.salesperson_name) payload.salesperson_name = v.salesperson_name;
      if (v.employee_code) payload.employee_code = v.employee_code;
      if (v.data1) payload.data1 = v.data1;
      if (v.data2) payload.data2 = v.data2;
      if (v.data3) payload.data3 = v.data3;
      if (v.plan_id) payload.plan_id = v.plan_id;
      return partnerCreateMember(payload);
    },
    onSuccess: () => {
      toast.success("Member created successfully");
      setCreateOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["partner", "members"] });
    },
    onError: (err: any) => {
      toast.error(getApiError(err, "Failed to create member"));
    },
  });

  const openCreate = () => {
    form.reset({ email: "", name: "", mobile_no: "", gender: "", address_line: "", address_city: "", address_state: "", address_pin: "", sale_date: "", sales_channel: "", branch_code: "", salesperson_name: "", employee_code: "", data1: "", data2: "", data3: "", plan_id: "" });
    setCreateOpen(true);
  };

  const dialogFooter = (
    <FooterRow>
      <Button label="Cancel" severity="secondary" onClick={() => setCreateOpen(false)} />
      <Button label="Create" loading={createMutation.isPending} onClick={form.handleSubmit(v => createMutation.mutate(v))} />
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
              <Tab key={t.key} $active={tab === t.key} onClick={() => setTab(t.key)}>
                {t.label}
              </Tab>
            ))}
          </TabBar>
          <TopActions>
            <SearchWrap>
              <i className="pi pi-search" />
              <SearchInput
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search members…"
              />
            </SearchWrap>
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
              <ThSm>Status</ThSm>
              <Th>Enrolled</Th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <EmptyRow><td>Loading…</td></EmptyRow>
            ) : members.length === 0 ? (
              <EmptyRow><td>No members found.</td></EmptyRow>
            ) : members.map(m => (
              <Tr key={m.id} onClick={() => router.push(`/partner/members/${m.id}`)}>
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
                  {m.enrollment?.plan_name
                    ? <PlanBadge>{m.enrollment.plan_name}</PlanBadge>
                    : <span style={{ color: "#9ca3af" }}>—</span>}
                </TdSm>
                <TdSm style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", color: "#374151" }}>
                  {m.policy_count ?? 0}
                </TdSm>
                <TdSm>
                  <StatusBadge value={!!m.is_active} trueLabel="Active" falseLabel="Inactive" />
                </TdSm>
                <Td>
                  <EnrolledCell>
                    {m.enrollment?.start_date
                      ? dayjs(m.enrollment.start_date).format("DD MMM YYYY")
                      : "—"}
                    <ChevronRight size={15} color="#94a3b8" />
                  </EnrolledCell>
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

      {/* Add Member Dialog */}
      <Dialog
        header="Add Member"
        visible={createOpen}
        onHide={() => { setCreateOpen(false); form.reset(); }}
        style={{ width: "600px" }}
        footer={dialogFooter}
        maximizable
      >
        <FormGrid>
          {/* Basic */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Field>
              <FieldLabel>Full Name *</FieldLabel>
              <Controller name="name" control={form.control} rules={{ required: "Name is required" }}
                render={({ field, fieldState }) => (
                  <><InputText {...field} invalid={!!fieldState.error} style={{ width: "100%" }} />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )} />
            </Field>
            <Field>
              <FieldLabel>Email *</FieldLabel>
              <Controller name="email" control={form.control} rules={{ required: "Email is required", pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email" } }}
                render={({ field, fieldState }) => (
                  <><InputText type="email" {...field} invalid={!!fieldState.error} style={{ width: "100%" }} />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )} />
            </Field>
            <Field>
              <FieldLabel>Mobile No. *</FieldLabel>
              <Controller name="mobile_no" control={form.control} rules={{ required: "Mobile is required", pattern: { value: /^\+?[\d\s\-()]{7,15}$/, message: "Invalid mobile" } }}
                render={({ field, fieldState }) => (
                  <><InputText {...field} placeholder="+91 98765 43210" invalid={!!fieldState.error} style={{ width: "100%" }} />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )} />
            </Field>
            <Field>
              <FieldLabel>Gender *</FieldLabel>
              <Controller name="gender" control={form.control} rules={{ required: "Gender is required" }}
                render={({ field, fieldState }) => (
                  <><Dropdown value={field.value} options={GENDER_OPTIONS} onChange={e => field.onChange(e.value)} placeholder="Select gender" style={{ width: "100%" }} invalid={!!fieldState.error} />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )} />
            </Field>
          </div>

          {/* Address */}
          <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "0.75rem" }}>
            <FieldLabel style={{ fontSize: "0.72rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Address</FieldLabel>
          </div>
          <Field>
            <FieldLabel>Address Line *</FieldLabel>
            <Controller name="address_line" control={form.control} rules={{ required: "Address is required" }}
              render={({ field, fieldState }) => (
                <><InputText {...field} style={{ width: "100%" }} invalid={!!fieldState.error} />
                {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
              )} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
            <Field>
              <FieldLabel>City *</FieldLabel>
              <Controller name="address_city" control={form.control} rules={{ required: "City is required" }}
                render={({ field, fieldState }) => (
                  <><InputText {...field} style={{ width: "100%" }} invalid={!!fieldState.error} />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )} />
            </Field>
            <Field>
              <FieldLabel>State *</FieldLabel>
              <Controller name="address_state" control={form.control} rules={{ required: "State is required" }}
                render={({ field, fieldState }) => (
                  <><InputText {...field} style={{ width: "100%" }} invalid={!!fieldState.error} />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )} />
            </Field>
            <Field>
              <FieldLabel>PIN Code *</FieldLabel>
              <Controller name="address_pin" control={form.control} rules={{ required: "PIN is required", pattern: { value: /^\d{6}$/, message: "6-digit PIN" } }}
                render={({ field, fieldState }) => (
                  <><InputText {...field} placeholder="400001" maxLength={6} style={{ width: "100%" }} invalid={!!fieldState.error} />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}</>
                )} />
            </Field>
          </div>

          {/* Onboarding */}
          <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "0.75rem" }}>
            <FieldLabel style={{ fontSize: "0.72rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Onboarding &amp; Sales (optional)</FieldLabel>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Field>
              <FieldLabel>Sale Date</FieldLabel>
              <Controller name="sale_date" control={form.control}
                render={({ field }) => <InputText {...field} placeholder="YYYY-MM-DD" style={{ width: "100%" }} />} />
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

          {/* Plan */}
          <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "0.75rem" }}>
            <FieldLabel style={{ fontSize: "0.72rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Enrollment</FieldLabel>
          </div>
          <Field>
            <FieldLabel>Plan</FieldLabel>
            <Controller name="plan_id" control={form.control}
              render={({ field }) => (
                <Dropdown value={field.value} onChange={e => field.onChange(e.value)} options={planOptions} placeholder="Select a plan" showClear filter style={{ width: "100%" }} />
              )} />
          </Field>
        </FormGrid>
      </Dialog>
    </PageWrap>
  );
}
