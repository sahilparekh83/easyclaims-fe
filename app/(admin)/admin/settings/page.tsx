"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { toast } from "react-toastify";
import styled from "styled-components";
import PageHeader from "@/components/ui/PageHeader";
import { adminListSettings, adminUpdateSetting } from "@/imports/core/api";
import { getApiError } from "@/imports/core/errors";

// ─── Styled ────────────────────────────────────────────────────────────────────

const Card = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1.75rem;
  margin-top: 1.5rem;
  max-width: 520px;
`;

const SettingLabel = styled.label`
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
`;

const SettingHint = styled.p`
  font-size: 0.78rem;
  color: #6b7280;
  margin: 0 0 1.25rem 0;
`;

const DurationRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DurationField = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
`;

const UnitLabel = styled.span`
  font-size: 0.72rem;
  font-weight: 500;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const Separator = styled.span`
  font-size: 1.2rem;
  font-weight: 600;
  color: #d1d5db;
  margin-bottom: 2px;
`;

const Preview = styled.div`
  margin-top: 1rem;
  font-size: 0.82rem;
  color: #374151;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px 12px;
`;

const SaveRow = styled.div`
  margin-top: 1.25rem;
`;

const LastUpdated = styled.p`
  font-size: 0.72rem;
  color: #9ca3af;
  margin: 0.75rem 0 0 0;
`;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function toTotalMinutes(d: number, h: number, m: number): number {
  return d * 1440 + h * 60 + m;
}

function fromTotalMinutes(total: number) {
  const days    = Math.floor(total / 1440);
  const hours   = Math.floor((total % 1440) / 60);
  const minutes = total % 60;
  return { days, hours, minutes };
}

function previewText(d: number, h: number, m: number): string {
  const total = toTotalMinutes(d, h, m);
  if (total === 0) return "Please set at least 1 minute";
  const parts: string[] = [];
  if (d) parts.push(`${d} day${d > 1 ? "s" : ""}`);
  if (h) parts.push(`${h} hour${h > 1 ? "s" : ""}`);
  if (m) parts.push(`${m} min${m > 1 ? "s" : ""}`);
  return `Reminder will be sent ${parts.join(" ")} after enrollment`;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [days,    setDays]    = useState<number>(0);
  const [hours,   setHours]   = useState<number>(0);
  const [mins,    setMins]    = useState<number>(1);
  const [edited,  setEdited]  = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: adminListSettings,
  });

  useEffect(() => {
    const settings: any[] = (data as any)?.data ?? [];
    const s = settings.find((x: any) => x.key === "upload_reminder_delay_minutes");
    if (s?.value != null) {
      const parsed = fromTotalMinutes(Math.round(parseFloat(s.value)));
      setDays(parsed.days);
      setHours(parsed.hours);
      setMins(parsed.minutes);
      setUpdatedAt(s.updated_at);
    }
  }, [data]);

  const totalMinutes = toTotalMinutes(days, hours, mins);

  const saveMutation = useMutation({
    mutationFn: () => adminUpdateSetting("upload_reminder_delay_minutes", String(totalMinutes)),
    onSuccess: () => {
      toast.success("Setting saved");
      setEdited(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (err: any) => toast.error(getApiError(err, "Failed to save")),
  });

  return (
    <div>
      <PageHeader
        title="System Settings"
        subtitle="Control system-wide configuration from the admin dashboard."
      />

      <Card>
        {isLoading ? (
          <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Loading…</p>
        ) : (
          <>
            <SettingLabel>Upload Reminder Delay</SettingLabel>
            <SettingHint>
              How long after enrollment to send a WhatsApp reminder to members
              who have not uploaded a policy document.
            </SettingHint>

            <DurationRow>
              <DurationField>
                <UnitLabel>Days</UnitLabel>
                <InputNumber
                  value={days}
                  onValueChange={(e) => { setDays(e.value ?? 0); setEdited(true); }}
                  min={0} max={365}
                  useGrouping={false}
                  inputStyle={{ width: "62px", textAlign: "center", padding: "6px 8px" }}
                />
              </DurationField>

              <Separator>:</Separator>

              <DurationField>
                <UnitLabel>Hours</UnitLabel>
                <InputNumber
                  value={hours}
                  onValueChange={(e) => { setHours(e.value ?? 0); setEdited(true); }}
                  min={0} max={23}
                  useGrouping={false}
                  inputStyle={{ width: "62px", textAlign: "center", padding: "6px 8px" }}
                />
              </DurationField>

              <Separator>:</Separator>

              <DurationField>
                <UnitLabel>Minutes</UnitLabel>
                <InputNumber
                  value={mins}
                  onValueChange={(e) => { setMins(e.value ?? 0); setEdited(true); }}
                  min={0} max={59}
                  useGrouping={false}
                  inputStyle={{ width: "62px", textAlign: "center", padding: "6px 8px" }}
                />
              </DurationField>
            </DurationRow>

            <Preview>{previewText(days, hours, mins)}</Preview>

            <SaveRow>
              <Button
                label="Save"
                icon="pi pi-check"
                disabled={!edited || totalMinutes < 1}
                loading={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              />
            </SaveRow>

            {updatedAt && (
              <LastUpdated>
                Last updated: {new Date(updatedAt).toLocaleString("en-IN")}
              </LastUpdated>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
