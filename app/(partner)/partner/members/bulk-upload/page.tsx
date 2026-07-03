"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  partnerListPlans,
  partnerGetProfile,
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

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["partner", "profile"],
    queryFn: partnerGetProfile,
  });

  const planOptions = ((plansData as any)?.data ?? [])
    .filter((p: any) => p.status === "Active")
    .map((p: any) => ({ label: p.name, value: p.id }));

  const allowMemberUpload = (profileData as any)?.data?.allow_member_upload ?? true;

  if (!profileLoading && !allowMemberUpload) {
    return (
      <div style={{
        maxWidth: 560, margin: "60px auto", textAlign: "center",
        background: "#fff", border: "1px solid #fecaca", borderRadius: 14,
        padding: 32, color: "#991b1b",
      }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>Bulk Upload Disabled</h3>
        <p style={{ margin: "0 0 20px", fontSize: 13.5, color: "#7f1d1d" }}>
          Bulk member upload has been disabled for your account by the Admin. Please add members individually,
          or contact your administrator.
        </p>
        <button
          onClick={() => router.push("/partner/members")}
          style={{
            background: "#0a2257", color: "#fff", border: "none", borderRadius: 8,
            padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          ← Back to Members
        </button>
      </div>
    );
  }

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
