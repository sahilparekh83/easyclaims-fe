"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  adminGetPartner,
  adminGetPartnerPlansOverview,
  adminBulkUploadMembersToPartner,
  adminDownloadMemberBulkSample,
  adminDownloadMemberBulkReport,
} from "@/imports/core/api";
import MemberBulkUpload from "@/components/ui/MemberBulkUpload";

export default function AdminMemberBulkUploadPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: partnerRes } = useQuery({
    queryKey: ["admin", "partner", id],
    queryFn: () => adminGetPartner(id),
    enabled: !!id,
  });

  const { data: plansRes } = useQuery({
    queryKey: ["admin", "partner-plans-overview", id],
    queryFn: () => adminGetPartnerPlansOverview(id),
    enabled: !!id,
  });

  const partnerName =
    (partnerRes as any)?.data?.legal_company_name ||
    (partnerRes as any)?.data?.name ||
    "";
  const partnerStatus = (partnerRes as any)?.data?.status;
  const disabledReason = partnerStatus && partnerStatus !== "Active"
    ? `This partner is ${partnerStatus} — bulk upload is disabled.`
    : null;

  const planOptions = ((plansRes as any)?.data ?? [])
    .filter((p: any) => p.linked && p.status === "Active")
    .map((p: any) => ({ label: p.name, value: p.id }));

  return (
    <MemberBulkUpload
      title="Bulk Upload Members"
      subtitle={partnerName ? `Upload members for ${partnerName}` : "Upload an Excel file to add multiple members at once"}
      dropdownInputId="admin-partner-member-bulk-plan-select"
      dropdownPlaceholder="Select a plan (partner's linked plans only)"
      noPlansMessage="No active plans linked to this partner. Go to the Plans tab to assign plans first."
      planOptions={planOptions}
      planCodeMode
      disabledReason={disabledReason}
      onBack={() => router.push(`/admin/partners/${id}`)}
      uploadFn={(file) => adminBulkUploadMembersToPartner(id, file)}
      downloadSampleFn={() => adminDownloadMemberBulkSample(id)}
      downloadReportFn={(file) => adminDownloadMemberBulkReport(id, file)}
    />
  );
}
