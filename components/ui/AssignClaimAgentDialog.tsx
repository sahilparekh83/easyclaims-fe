"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { toast } from "react-toastify";
import { getApiError } from "@/imports/core/errors";
import { adminListClaimAgents, adminBulkAssignClaims } from "@/imports/core/api";

interface AssignClaimAgentDialogProps {
  visible: boolean;
  claimIds: string[];
  onHide: () => void;
  onAssigned: () => void;
}

export default function AssignClaimAgentDialog({ visible, claimIds, onHide, onAssigned }: AssignClaimAgentDialogProps) {
  const [agentId, setAgentId] = useState("");
  const queryClient = useQueryClient();

  const { data: agentsData } = useQuery({
    queryKey: ["admin", "claim-agents"], queryFn: adminListClaimAgents, enabled: visible,
  });
  const agents: { id: string; name: string }[] = agentsData?.data ?? [];

  const assignMutation = useMutation({
    mutationFn: () => adminBulkAssignClaims(claimIds, agentId),
    onSuccess: (res: any) => {
      toast.success(`${res?.data?.assigned ?? claimIds.length} claim(s) assigned — agent notified by email, in-app, and WhatsApp.`);
      setAgentId("");
      onAssigned();
    },
    onError: (err: any) => toast.error(getApiError(err, "Failed to assign claims")),
  });

  return (
    <Dialog
      header={`Assign Claim Agent — ${claimIds.length} claim${claimIds.length === 1 ? "" : "s"} selected`}
      visible={visible}
      onHide={() => { setAgentId(""); onHide(); }}
      style={{ width: "420px" }}
      modal
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 13, color: "#6b7280" }}>
          Choose an active claim agent. They'll be notified immediately by email, in-app notification, and WhatsApp.
        </div>
        <Dropdown
          value={agentId}
          onChange={(e) => setAgentId(e.value)}
          options={agents.map((a) => ({ label: a.name, value: a.id }))}
          placeholder={agents.length === 0 ? "No active claim agents found" : "Select claim agent"}
          style={{ width: "100%" }}
          disabled={agents.length === 0}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
          <Button label="Cancel" severity="secondary" onClick={() => { setAgentId(""); onHide(); }} />
          <Button
            label="Assign"
            disabled={!agentId}
            loading={assignMutation.isPending}
            onClick={() => assignMutation.mutate()}
          />
        </div>
      </div>
    </Dialog>
  );
}
