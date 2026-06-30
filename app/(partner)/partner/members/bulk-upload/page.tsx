"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  partnerListPlans,
  partnerBulkUploadMembers,
  partnerDownloadMemberBulkSample,
  partnerDownloadMemberBulkReport,
} from "@/imports/core/api";
import MemberBulkUpload from "@/components/ui/MemberBulkUpload";

export default function PartnerMemberBulkUploadPage() {
  const router = useRouter();

  const { data: plansData } = useQuery({
    queryKey: ["partner", "plans"],
    queryFn: partnerListPlans,
  });

  const planOptions = ((plansData as any)?.data ?? [])
    .filter((p: any) => p.status === "Active")
    .map((p: any) => ({ label: p.name, value: p.id }));

  return (
    <MemberBulkUpload
      title="Bulk Upload Members"
      subtitle="Upload an Excel file to add multiple members at once"
      dropdownInputId="partner-member-bulk-plan-select"
      dropdownPlaceholder="Select a plan"
      noPlansMessage="No active plans available. Contact your administrator."
      planOptions={planOptions}
      onBack={() => router.push("/partner/members")}
      uploadFn={(file, planId) => partnerBulkUploadMembers(file, planId)}
      downloadSampleFn={() => partnerDownloadMemberBulkSample()}
      downloadReportFn={(file) => partnerDownloadMemberBulkReport(file)}
    />
  );
}
