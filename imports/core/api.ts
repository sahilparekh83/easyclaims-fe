import apiClient from "@/lib/api-client";

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────
export const sendOtp = (email: string) =>
  apiClient.post("/auth/send-otp", { email }).then((r) => r.data);

export const verifyOtp = (email: string, otp: string) =>
  apiClient.post("/auth/verify-otp", { email, otp }).then((r) => r.data);

export const refreshToken = (refresh_token: string) =>
  apiClient.post("/auth/refresh", { refresh_token }).then((r) => r.data);

export const logout = (access_token: string) =>
  apiClient.post("/auth/logout", { access_token }).then((r) => r.data);

// ─────────────────────────────────────────────
// POLICY TYPES (public)
// ─────────────────────────────────────────────
export const listPolicyTypes = (active_only = false) =>
  apiClient.get("/policy-types", { params: { active_only } }).then((r) => r.data);

// ─────────────────────────────────────────────
// ADMIN — PLANS
// ─────────────────────────────────────────────
export const adminListPlans = (params?: { skip?: number; limit?: number }) =>
  apiClient.get("/admin/plans", { params: { skip: params?.skip || 0, limit: params?.limit || 100 } }).then((r) => r.data);

export const adminCreatePlan = (data: object) =>
  apiClient.post("/admin/plans", data).then((r) => r.data);

export const adminGetPlan = (id: string) =>
  apiClient.get(`/admin/plans/${id}`).then((r) => r.data);

export const adminUpdatePlan = (id: string, data: object) =>
  apiClient.patch(`/admin/plans/${id}`, data).then((r) => r.data);

export const adminActivatePlan = (id: string) =>
  apiClient.post(`/admin/plans/${id}/activate`, {}).then((r) => r.data);

export const adminArchivePlan = (id: string) =>
  apiClient.post(`/admin/plans/${id}/archive`, {}).then((r) => r.data);

export const adminLinkPlanToPartner = (planId: string, partnerId: string) =>
  apiClient.post(`/admin/plans/${planId}/partners`, { partner_id: partnerId }).then((r) => r.data);

export const adminUnlinkPlanFromPartner = (planId: string, partnerId: string) =>
  apiClient.delete(`/admin/plans/${planId}/partners/${partnerId}`).then((r) => r.data);

export const adminGetPlanPartners = (planId: string) =>
  apiClient.get(`/admin/plans/${planId}/partners`).then((r) => r.data);

export const adminGetPlanMembers = (planId: string, partnerId: string) =>
  apiClient.get(`/admin/plans/${planId}/members`, { params: { partner_id: partnerId } }).then((r) => r.data);

// ─────────────────────────────────────────────
// ADMIN — PARTNERS
// ─────────────────────────────────────────────
export const adminListPartners = (params?: object) =>
  apiClient.post("/admin/partners/list", params || {}).then((r) => r.data);

export const adminCreatePartner = (data: object) =>
  apiClient.post("/admin/partners", data).then((r) => r.data);

export const adminGetPartner = (id: string) =>
  apiClient.get(`/admin/partners/${id}`).then((r) => r.data);

export const adminUpdatePartner = (id: string, data: object) =>
  apiClient.patch(`/admin/partners/${id}`, data).then((r) => r.data);

export const adminRegenPartnerKey = (id: string) =>
  apiClient.post(`/admin/partners/${id}/regenerate-key`, {}).then((r) => r.data);

export const adminGetPartnerPlans = (id: string) =>
  apiClient.get(`/admin/partners/${id}/plans`).then((r) => r.data);

// ─────────────────────────────────────────────
// ADMIN — MEMBERS
// ─────────────────────────────────────────────
export const adminListMembers = (params?: object) =>
  apiClient.post("/admin/members/list", params || {}).then((r) => r.data);

export const adminCreateMember = (data: object) =>
  apiClient.post("/admin/members", data).then((r) => r.data);

export const adminListMembersByPartner = (partnerId: string, params?: object) =>
  apiClient.post(`/admin/partners/${partnerId}/members/list`, params || {}).then((r) => r.data);

export const adminListPoliciesByPartner = (partnerId: string, params?: object) =>
  apiClient.post(`/admin/partners/${partnerId}/policies/list`, params || {}).then((r) => r.data);

export const adminGetMember = (id: string) =>
  apiClient.get(`/admin/members/${id}`).then((r) => r.data);

export const adminViewPolicyPdf = (policyId: string) =>
  apiClient.get(`/admin/policies/${policyId}/view`, { responseType: "blob" }).then((r) => r.data);

export const adminDownloadPolicyPdf = (policyId: string) =>
  apiClient.get(`/admin/policies/${policyId}/download`, { responseType: "blob" }).then((r) => r.data);

// ─────────────────────────────────────────────
// ADMIN — POLICIES
// ─────────────────────────────────────────────
export const adminListPolicies = (params?: object) =>
  apiClient.post("/admin/policies/list", params || {}).then((r) => r.data);

export const adminGetPolicy = (id: string) =>
  apiClient.get(`/admin/policies/${id}`).then((r) => r.data);

// ─────────────────────────────────────────────
// ADMIN — POLICY TYPES
// ─────────────────────────────────────────────
export const adminCreatePolicyType = (data: object) =>
  apiClient.post("/admin/policy-types", data).then((r) => r.data);

export const adminUpdatePolicyType = (id: string, data: object) =>
  apiClient.patch(`/admin/policy-types/${id}`, data).then((r) => r.data);

export const adminTogglePolicyType = (id: string, is_active: boolean) =>
  apiClient.patch(`/admin/policy-types/${id}/toggle`, { is_active }).then((r) => r.data);

// ─────────────────────────────────────────────
// ADMIN — NOTIFICATIONS
// ─────────────────────────────────────────────
export const adminListNotifications = (params?: object) =>
  apiClient.get("/admin/notifications", { params }).then((r) => r.data);

export const adminMarkNotificationRead = (id: string) =>
  apiClient.patch(`/admin/notifications/${id}/read`, {}).then((r) => r.data);

export const adminMarkAllNotificationsRead = () =>
  apiClient.patch("/admin/notifications/read-all", {}).then((r) => r.data);

export const adminDeleteNotification = (id: string) =>
  apiClient.delete(`/admin/notifications/${id}`).then((r) => r.data);

// ─────────────────────────────────────────────
// ADMIN — USERS (internal)
// ─────────────────────────────────────────────
export const adminListUsers = (skip = 0, limit = 100) =>
  apiClient.get("/users", { params: { skip, limit } }).then((r) => r.data);

export const adminCreateUser = (data: object) =>
  apiClient.post("/users", data).then((r) => r.data);

export const adminGetUser = (id: string) =>
  apiClient.get(`/users/${id}`).then((r) => r.data);

export const adminUpdateUser = (id: string, data: object) =>
  apiClient.patch(`/users/${id}`, data).then((r) => r.data);

export const adminDeleteUser = (id: string) =>
  apiClient.delete(`/users/${id}`).then((r) => r.data);

// ─────────────────────────────────────────────
// PARTNER — PROFILE
// ─────────────────────────────────────────────
export const partnerGetProfile = () =>
  apiClient.get("/partner/profile").then((r) => r.data);

export const partnerUpdateProfile = (data: object) =>
  apiClient.patch("/partner/profile", data).then((r) => r.data);

// ─────────────────────────────────────────────
// PARTNER — MEMBERS
// ─────────────────────────────────────────────
export const partnerListMembers = (params?: object) =>
  apiClient.post("/partner/members/list", params || {}).then((r) => r.data);

export const partnerCreateMember = (data: object) =>
  apiClient.post("/partner/members", data).then((r) => r.data);

export const partnerGetMember = (id: string) =>
  apiClient.get(`/partner/members/${id}`).then((r) => r.data);

export const partnerUpdateMember = (id: string, data: object) =>
  apiClient.patch(`/partner/members/${id}`, data).then((r) => r.data);

export const partnerSwitchMemberPlan = (id: string, plan_id: string) =>
  apiClient.patch(`/partner/members/${id}/plan`, { plan_id }).then((r) => r.data);

// ─────────────────────────────────────────────
// PARTNER — POLICIES
// ─────────────────────────────────────────────
export const partnerListPolicies = (params?: object) =>
  apiClient.post("/partner/policies/list", params || {}).then((r) => r.data);

export const partnerGetPolicy = (id: string) =>
  apiClient.get(`/partner/policies/${id}`).then((r) => r.data);

export const partnerViewPolicyPdf = (policyId: string) =>
  apiClient.get(`/partner/policies/${policyId}/view`, { responseType: "blob" }).then((r) => r.data);

export const partnerDownloadPolicyPdf = (policyId: string) =>
  apiClient.get(`/partner/policies/${policyId}/download`, { responseType: "blob" }).then((r) => r.data);

export const partnerViewMemberPolicyPdf = (memberId: string, policyId: string) =>
  apiClient.get(`/partner/members/${memberId}/policies/${policyId}/view`, { responseType: "blob" }).then((r) => r.data);

export const partnerDownloadMemberPolicyPdf = (memberId: string, policyId: string) =>
  apiClient.get(`/partner/members/${memberId}/policies/${policyId}/download`, { responseType: "blob" }).then((r) => r.data);

// ─────────────────────────────────────────────
// PARTNER — PLANS
// ─────────────────────────────────────────────
export const partnerListPlans = () =>
  apiClient.get("/partner/plans").then((r) => r.data);

// ─────────────────────────────────────────────
// PARTNER — NOTIFICATIONS
// ─────────────────────────────────────────────
export const partnerListNotifications = (params?: object) =>
  apiClient.get("/partner/notifications", { params }).then((r) => r.data);

export const partnerMarkNotificationRead = (id: string) =>
  apiClient.patch(`/partner/notifications/${id}/read`, {}).then((r) => r.data);

export const partnerMarkAllNotificationsRead = () =>
  apiClient.patch("/partner/notifications/read-all", {}).then((r) => r.data);

export const partnerDeleteNotification = (id: string) =>
  apiClient.delete(`/partner/notifications/${id}`).then((r) => r.data);

// ─────────────────────────────────────────────
// MEMBER — PROFILE
// ─────────────────────────────────────────────
export const memberGetProfile = () =>
  apiClient.get("/member/profile").then((r) => r.data);

export const memberUpdateProfile = (data: object) =>
  apiClient.patch("/member/profile", data).then((r) => r.data);

// ─────────────────────────────────────────────
// MEMBER — FAMILY
// ─────────────────────────────────────────────
export const memberGetFamily = () =>
  apiClient.get("/member/family").then((r) => r.data);

export const memberListFamily = memberGetFamily;  // backward-compat alias

export const memberCreateFamily = (data: object) =>
  apiClient.post("/member/family", data).then((r) => r.data);

export const memberUpdateFamily = (id: string, data: object) =>
  apiClient.patch(`/member/family/${id}`, data).then((r) => r.data);

export const memberDeleteFamily = (id: string) =>
  apiClient.delete(`/member/family/${id}`).then((r) => r.data);

export const memberCreateFamilyChangeRequest = (
  familyMemberId: string,
  data: { requested_fields: object; reason?: string }
) =>
  apiClient.post(`/member/family/${familyMemberId}/change-request`, data).then((r) => r.data);

// ─────────────────────────────────────────────
// MEMBER — NOMINEES
// ─────────────────────────────────────────────
export const memberListNominees = () =>
  apiClient.get("/member/nominees").then((r) => r.data);

export const memberCreateNominee = (data: object) =>
  apiClient.post("/member/nominees", data).then((r) => r.data);

export const memberUpdateNominee = (id: string, data: object) =>
  apiClient.patch(`/member/nominees/${id}`, data).then((r) => r.data);

export const memberDeleteNominee = (id: string) =>
  apiClient.delete(`/member/nominees/${id}`).then((r) => r.data);

// ─────────────────────────────────────────────
// MEMBER — POLICIES
// ─────────────────────────────────────────────
export const memberListPolicies = (params?: object) =>
  apiClient.post("/member/policies/list", params || {}).then((r) => r.data);

export const memberGetPolicy = (id: string) =>
  apiClient.get(`/member/policies/${id}`).then((r) => r.data);

export const memberUploadPolicy = (formData: FormData) =>
  apiClient.post("/member/policies", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);

export const memberUpdatePolicy = (id: string, data: object) =>
  apiClient.patch(`/member/policies/${id}`, data).then((r) => r.data);

export const memberDeletePolicy = (id: string) =>
  apiClient.delete(`/member/policies/${id}`).then((r) => r.data);

export const memberViewPolicyPdf = (policyId: string) =>
  apiClient.get(`/member/policies/${policyId}/view`, { responseType: "blob" }).then((r) => r.data);

export const memberDownloadPolicyPdf = (policyId: string) =>
  apiClient.get(`/member/policies/${policyId}/download`, { responseType: "blob" }).then((r) => r.data);

// ─────────────────────────────────────────────
// MEMBER — PLAN
// ─────────────────────────────────────────────
export const memberGetPlan = () =>
  apiClient.get("/member/plan").then((r) => r.data);

export const memberSwitchPlan = (plan_id: string) =>
  apiClient.put("/member/plan", { plan_id }).then((r) => r.data);

export const memberListAvailablePlans = () =>
  apiClient.get("/member/plan/available").then((r) => r.data);

// ─────────────────────────────────────────────
// MEMBER — CONSENT
// ─────────────────────────────────────────────
export const memberListConsents = () =>
  apiClient.get("/member/consent").then((r) => r.data);

export const memberCreateConsent = (data: object) =>
  apiClient.post("/member/consent", data).then((r) => r.data);

// ─────────────────────────────────────────────
// MEMBER — PARTNERS (enrolled partners)
// ─────────────────────────────────────────────
export const memberListPartners = () =>
  apiClient.get("/member/partners").then((r) => r.data);

// ─────────────────────────────────────────────
// MEMBER — NOTIFICATIONS
// ─────────────────────────────────────────────
export const memberListNotifications = (params?: object) =>
  apiClient.get("/member/notifications", { params }).then((r) => r.data);

export const memberMarkNotificationRead = (id: string) =>
  apiClient.patch(`/member/notifications/${id}/read`, {}).then((r) => r.data);

export const memberMarkAllNotificationsRead = () =>
  apiClient.patch("/member/notifications/read-all", {}).then((r) => r.data);

export const memberDeleteNotification = (id: string) =>
  apiClient.delete(`/member/notifications/${id}`).then((r) => r.data);

// ─────────────────────────────────────────────
// ADMIN — EMAIL TEMPLATES
// ─────────────────────────────────────────────
export const adminListEmailTemplates = () =>
  apiClient.get("/admin/email-templates").then((r) => r.data);

export const adminGetEmailTemplate = (id: string) =>
  apiClient.get(`/admin/email-templates/${id}`).then((r) => r.data);

export const adminUpdateEmailTemplate = (id: string, data: object) =>
  apiClient.patch(`/admin/email-templates/${id}`, data).then((r) => r.data);

// ─────────────────────────────────────────────
// ADMIN — CRON
// ─────────────────────────────────────────────
export const adminRunExpiryCheck = () =>
  apiClient.post("/admin/cron/run-expiry-check", {}).then((r) => r.data);

export const adminApprovePolicy = (id: string) =>
  apiClient.post(`/admin/policies/${id}/approve`, {}).then((r) => r.data);

export const adminRejectPolicy = (id: string) =>
  apiClient.post(`/admin/policies/${id}/reject`, {}).then((r) => r.data);

export const adminUpdatePolicyFields = (id: string, fields: object) =>
  apiClient.patch(`/admin/policies/${id}/fields`, fields).then((r) => r.data);

// ─────────────────────────────────────────────
// ADMIN — DASHBOARD ANALYTICS
// ─────────────────────────────────────────────
export const adminGetDashboard = () =>
  apiClient.get("/admin/dashboard").then((r) => r.data);

// ─────────────────────────────────────────────
// ADMIN — SYSTEM SETTINGS
// ─────────────────────────────────────────────
export const adminListSettings = () =>
  apiClient.get("/admin/settings").then((r) => r.data);

export const adminUpdateSetting = (key: string, value: string) =>
  apiClient.patch(`/admin/settings/${key}`, { value }).then((r) => r.data);


// ─────────────────────────────────────────────
// ADMIN — MEMBER ENROLLMENT
// ─────────────────────────────────────────────
export const adminRenewMemberEnrollment = (memberId: string) =>
  apiClient.post(`/admin/members/${memberId}/enrollment/renew`, {}).then((r) => r.data);

export const adminGetMemberEnrollmentHistory = (memberId: string) =>
  apiClient.get(`/admin/members/${memberId}/enrollment/history`).then((r) => r.data);

export const adminSwitchMemberPlan = (memberId: string, plan_id: string) =>
  apiClient.patch(`/admin/members/${memberId}/plan`, { plan_id }).then((r) => r.data);

// ─────────────────────────────────────────────
// PARTNER — MEMBER ENROLLMENT
// ─────────────────────────────────────────────
export const partnerRenewMemberEnrollment = (memberId: string) =>
  apiClient.post(`/partner/members/${memberId}/enrollment/renew`, {}).then((r) => r.data);

export const partnerGetMemberEnrollmentHistory = (memberId: string) =>
  apiClient.get(`/partner/members/${memberId}/enrollment/history`).then((r) => r.data);

// ─────────────────────────────────────────────
// ADMIN — MEMBER UPDATES
// ─────────────────────────────────────────────
export const adminUpdateMember = (id: string, data: object) =>
  apiClient.patch(`/admin/members/${id}`, data).then((r) => r.data);

export const adminBulkUploadMembers = (file: File, partnerId: string, planId?: string) => {
  const form = new FormData();
  form.append("file", file);
  form.append("partner_id", partnerId);
  if (planId) form.append("plan_id", planId);
  return apiClient.post("/admin/members/bulk-upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);
};

export async function adminBulkUploadPartners(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await apiClient.post("/admin/partners/bulk-upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function adminDownloadPartnerBulkReport(file: File): Promise<Blob> {
  const form = new FormData();
  form.append("file", file);
  const res = await apiClient.post("/admin/partners/bulk-upload/report", form, {
    headers: { "Content-Type": "multipart/form-data" },
    responseType: "blob",
  });
  return res.data as Blob;
}

export async function adminDownloadPartnerSample(): Promise<Blob> {
  const res = await apiClient.get("/admin/partners/bulk-upload/sample", {
    responseType: "blob",
  });
  return res.data as Blob;
}

// ─────────────────────────────────────────────
// ADMIN — CHANGE REQUESTS
// ─────────────────────────────────────────────
export const adminListChangeRequests = (params?: { status?: string; member_id?: string; entity_type?: string; skip?: number; limit?: number }) =>
  apiClient.get("/admin/members/change-requests", { params }).then((r) => r.data);

export const adminApproveChangeRequest = (id: string, admin_note?: string) =>
  apiClient.post(`/admin/members/change-requests/${id}/approve`, { admin_note }).then((r) => r.data);

export const adminRejectChangeRequest = (id: string, admin_note?: string) =>
  apiClient.post(`/admin/members/change-requests/${id}/reject`, { admin_note }).then((r) => r.data);

// ─────────────────────────────────────────────
// ADMIN — AUDIT LOGS
// ─────────────────────────────────────────────
export const adminListAuditLogs = (params?: { entity_type?: string; entity_id?: string; skip?: number; limit?: number }) =>
  apiClient.get("/admin/audit-logs", { params }).then((r) => r.data);

// ─────────────────────────────────────────────
// MEMBER — CHANGE REQUESTS
// ─────────────────────────────────────────────
export const memberListChangeRequests = (params?: { skip?: number; limit?: number }) =>
  apiClient.get("/member/change-requests", { params }).then((r) => r.data);

export const memberCreateChangeRequest = (data: { requested_fields: object; reason?: string }) =>
  apiClient.post("/member/change-requests", data).then((r) => r.data);
