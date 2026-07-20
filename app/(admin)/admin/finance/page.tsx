"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import styled from "styled-components";
import { Wallet, AlertTriangle, TrendingUp, TrendingDown, CheckCircle2 } from "lucide-react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { toast } from "react-toastify";
import {
  adminFinanceDashboard, adminFinanceTopUp, adminFinanceLedger, adminFinanceReconcile,
  adminListPartners,
} from "@/imports/core/api";
import { getApiError } from "@/imports/core/errors";
import StatusBadge from "@/components/ui/StatusBadge";

const Page = styled.div`display: flex; flex-direction: column; gap: 20px; max-width: 1240px;`;
const PageHeader = styled.div`display: flex; align-items: center; justify-content: space-between;`;
const PageTitle = styled.h1`font-family: 'Plus Jakarta Sans', sans-serif; font-size: 19px; font-weight: 800; color: #161d26; margin: 0;`;

const KpiGrid = styled.div`
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px;
  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
`;
const KpiCard = styled.div`
  background: #fff; border: 1px solid #e0e6ec; border-radius: 14px;
  box-shadow: 0 1px 2px rgba(10,42,87,0.06); padding: 20px 22px;
  display: flex; flex-direction: column; gap: 10px;
`;
const KpiIconBox = styled.div<{ $bg: string; $color: string }>`
  width: 42px; height: 42px; border-radius: 10px; background: ${p => p.$bg}; color: ${p => p.$color};
  display: flex; align-items: center; justify-content: center; flex: none;
`;
const KpiValue = styled.div`font-size: 1.7rem; font-weight: 800; color: #161d26; letter-spacing: -0.02em;`;
const KpiLabel = styled.div`font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7a8c;`;

const SectionCard = styled.div`background: #fff; border: 1px solid #e0e6ec; border-radius: 14px; box-shadow: 0 1px 2px rgba(10,42,87,0.06); overflow: hidden;`;
const CardHeader = styled.div`display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #f1f2f6;`;
const CardTitle = styled.h3`font-size: 15px; font-weight: 700; color: #0f172a; margin: 0;`;
const TableScroll = styled.div`width: 100%; overflow-x: auto;`;
const Table = styled.table`width: 100%; min-width: 560px; border-collapse: collapse; font-size: 13px;`;
const Th = styled.th`padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; background: #f8f9fb;`;
const Td = styled.td`padding: 11px 16px; border-top: 1px solid #f1f2f6;`;
const Empty = styled.div`padding: 24px 20px; text-align: center; color: #9ca3af; font-size: 13px;`;
const FormBody = styled.div`display: flex; flex-direction: column; gap: 1rem; margin-top: 0.5rem;`;
const FormField = styled.div`display: flex; flex-direction: column; gap: 4px;`;
const FormLabel = styled.label`font-size: 0.8rem; font-weight: 600; color: #3a4756;`;
const DialogFooterRow = styled.div`display: flex; justify-content: flex-end; gap: 0.5rem;`;

const fmt = (n: number) => (n ?? 0).toLocaleString("en-IN");

export default function AdminFinancePage() {
  const queryClient = useQueryClient();
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpPartnerId, setTopUpPartnerId] = useState<string | null>(null);
  const [topUpAmount, setTopUpAmount] = useState<number | null>(null);
  const [topUpNote, setTopUpNote] = useState("");

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["admin", "finance", "dashboard"],
    queryFn: adminFinanceDashboard,
  });
  const { data: ledgerData } = useQuery({
    queryKey: ["admin", "finance", "ledger"],
    queryFn: () => adminFinanceLedger({ limit: 30 }),
  });
  const { data: partnersData } = useQuery({
    queryKey: ["admin", "partners", "for-topup"],
    queryFn: () => adminListPartners({ limit: 500 }),
  });

  const dash = (dashboardData as any)?.data ?? {};
  const ledger: any[] = (ledgerData as any)?.data?.data ?? [];
  const partnerOptions = ((partnersData as any)?.data?.data ?? []).map((p: any) => ({ label: p.name, value: p.id }));
  const lowFloatPartners: any[] = dash.low_float_partners ?? [];

  const topUpMutation = useMutation({
    mutationFn: () => adminFinanceTopUp(topUpPartnerId as string, topUpAmount as number, topUpNote || undefined),
    onSuccess: () => {
      toast.success("Float balance topped up!");
      setTopUpOpen(false); setTopUpPartnerId(null); setTopUpAmount(null); setTopUpNote("");
      queryClient.invalidateQueries({ queryKey: ["admin", "finance"] });
    },
    onError: (err: any) => toast.error(getApiError(err, "Top-up failed")),
  });

  const reconcileMutation = useMutation({
    mutationFn: (id: string) => adminFinanceReconcile(id),
    onSuccess: () => {
      toast.success("Marked as reconciled");
      queryClient.invalidateQueries({ queryKey: ["admin", "finance"] });
    },
    onError: (err: any) => toast.error(getApiError(err, "Failed to reconcile")),
  });

  const KPIS = [
    { label: "Total float balance", value: dash.total_float_balance, bg: "#f0fdf4", color: "#16a34a", icon: <Wallet size={18} /> },
    { label: "Top-ups this month", value: dash.top_ups_this_month, bg: "#eff6ff", color: "#2563eb", icon: <TrendingUp size={18} /> },
    { label: "Deductions this month", value: dash.deductions_this_month, bg: "#fef2f2", color: "#dc2626", icon: <TrendingDown size={18} /> },
    { label: "Unreconciled top-ups", value: dash.unreconciled_topups_count, bg: "#fffbeb", color: "#b45309", icon: <AlertTriangle size={18} /> },
  ];

  return (
    <Page>
      <PageHeader>
        <PageTitle>Finance — Float Ledger</PageTitle>
        <Button label="Top Up Partner" icon="pi pi-plus" onClick={() => setTopUpOpen(true)} />
      </PageHeader>

      <KpiGrid>
        {KPIS.map(k => (
          <KpiCard key={k.label}>
            <KpiIconBox $bg={k.bg} $color={k.color}>{k.icon}</KpiIconBox>
            <KpiValue>{isLoading ? "…" : fmt(k.value)}</KpiValue>
            <KpiLabel>{k.label}</KpiLabel>
          </KpiCard>
        ))}
      </KpiGrid>

      {lowFloatPartners.length > 0 && (
        <SectionCard>
          <CardHeader>
            <CardTitle>Low Float Alerts</CardTitle>
          </CardHeader>
          <TableScroll>
          <Table>
            <thead>
              <tr><Th>Partner</Th><Th>Balance</Th><Th>Threshold</Th><Th></Th></tr>
            </thead>
            <tbody>
              {lowFloatPartners.map((p: any) => (
                <tr key={p.partner_id}>
                  <Td>{p.partner_name}</Td>
                  <Td style={{ color: "#dc2626", fontWeight: 700 }}>{fmt(p.float_balance)}</Td>
                  <Td>{fmt(p.low_float_threshold)}</Td>
                  <Td>
                    <Button
                      label="Top Up"
                      size="small" outlined
                      onClick={() => { setTopUpPartnerId(p.partner_id); setTopUpOpen(true); }}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          </TableScroll>
        </SectionCard>
      )}

      <SectionCard>
        <CardHeader>
          <CardTitle>Billing / Reconciliation Ledger</CardTitle>
        </CardHeader>
        {ledger.length === 0 ? (
          <Empty>No float transactions yet</Empty>
        ) : (
          <TableScroll>
          <Table>
            <thead>
              <tr>
                <Th>Date</Th><Th>Partner</Th><Th>Type</Th><Th>Amount</Th>
                <Th>Balance After</Th><Th>Note</Th><Th>Reconciled</Th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((t: any) => (
                <tr key={t.id}>
                  <Td>{t.created_at ? new Date(t.created_at).toLocaleDateString("en-IN") : "—"}</Td>
                  <Td>{t.partner_name || "—"}</Td>
                  <Td><StatusBadge value={t.type === "top_up" ? "Active" : "Inactive"} trueLabel="Top-up" falseLabel="Deduction" /></Td>
                  <Td style={{ color: t.type === "top_up" ? "#16a34a" : "#dc2626", fontWeight: 700 }}>
                    {t.type === "top_up" ? "+" : "-"}{fmt(t.amount)}
                  </Td>
                  <Td>{fmt(t.balance_after)}</Td>
                  <Td style={{ color: "#6b7a8c" }}>{t.note || "—"}</Td>
                  <Td>
                    {t.is_reconciled ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#16a34a", fontSize: 12, fontWeight: 600 }}>
                        <CheckCircle2 size={13} /> Reconciled
                      </span>
                    ) : t.type === "top_up" ? (
                      <Button
                        label="Mark Reconciled"
                        size="small" outlined severity="secondary"
                        loading={reconcileMutation.isPending}
                        onClick={() => reconcileMutation.mutate(t.id)}
                      />
                    ) : "—"}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          </TableScroll>
        )}
      </SectionCard>

      <Dialog
        header="Top Up Partner Float Balance"
        visible={topUpOpen}
        onHide={() => { setTopUpOpen(false); setTopUpPartnerId(null); setTopUpAmount(null); setTopUpNote(""); }}
        style={{ width: "420px" }}
        modal
        draggable={false}
        footer={
          <DialogFooterRow>
            <Button label="Cancel" severity="secondary" outlined
              onClick={() => { setTopUpOpen(false); setTopUpPartnerId(null); setTopUpAmount(null); setTopUpNote(""); }}
              disabled={topUpMutation.isPending} />
            <Button
              label="Top Up"
              icon="pi pi-check"
              loading={topUpMutation.isPending}
              disabled={!topUpPartnerId || !topUpAmount || topUpAmount <= 0}
              onClick={() => topUpMutation.mutate()}
            />
          </DialogFooterRow>
        }
      >
        <FormBody>
          <FormField>
            <FormLabel>Partner *</FormLabel>
            <Dropdown
              value={topUpPartnerId}
              options={partnerOptions}
              onChange={e => setTopUpPartnerId(e.value)}
              placeholder="Select partner"
              filter
              style={{ width: "100%" }}
            />
          </FormField>
          <FormField>
            <FormLabel>Amount *</FormLabel>
            <InputNumber
              value={topUpAmount}
              onValueChange={e => setTopUpAmount(e.value ?? null)}
              placeholder="Amount to credit"
              min={1}
              style={{ width: "100%" }}
            />
          </FormField>
          <FormField>
            <FormLabel>Note</FormLabel>
            <InputText
              value={topUpNote}
              onChange={e => setTopUpNote(e.target.value)}
              placeholder="e.g. Bank transfer ref #1234"
              style={{ width: "100%" }}
            />
          </FormField>
        </FormBody>
      </Dialog>
    </Page>
  );
}
