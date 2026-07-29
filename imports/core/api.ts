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
// PARTNER TYPES (public)
// ─────────────────────────────────────────────
export const listPartnerTypes = (active_only = false) =>
  apiClient.get("/partner-types", { params: { active_only } }).then((r) => r.data);

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

export const adminDeletePlan = (id: string) =>
  apiClient.delete(`/admin/plans/${id}`).then((r) => r.data);

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

export const adminUploadPartnerCardLogo = (id: string, file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  return apiClient.post(`/admin/partners/${id}/card-logo`, fd).then((r) => r.data);
};

export const adminGetPartnerCardLogo = (id: string): Promise<Blob> =>
  apiClient.get(`/admin/partners/${id}/card-logo/view`, { responseType: "blob" }).then((r) => r.data);

export const adminDownloadCardPreview = (id: string): Promise<Blob> =>
  apiClient.get(`/admin/partners/${id}/card-preview`, { responseType: "blob" }).then((r) => r.data);

export const adminGetPartnerPlans = (id: string) =>
  apiClient.get(`/admin/partners/${id}/plans`).then((r) => r.data);

export const adminGetPartnerPlansOverview = (id: string) =>
  apiClient.get(`/admin/partners/${id}/plans-overview`).then((r) => r.data);

export const adminListPartnerChangeRequests = (partnerId: string, params?: { status?: string; skip?: number; limit?: number }) =>
  apiClient.get(`/admin/partners/${partnerId}/change-requests`, { params }).then((r) => r.data);

export const adminApprovePartnerChangeRequest = (crId: string, data?: { admin_note?: string }) =>
  apiClient.post(`/admin/partners/change-requests/${crId}/approve`, data || {}).then((r) => r.data);

export const adminRejectPartnerChangeRequest = (crId: string, data?: { admin_note?: string }) =>
  apiClient.post(`/admin/partners/change-requests/${crId}/reject`, data || {}).then((r) => r.data);

export const adminAddMemberToPartner = (partnerId: string, data: object) =>
  apiClient.post(`/admin/partners/${partnerId}/members`, data).then((r) => r.data);

export const adminBulkUploadMembersToPartner = (partnerId: string, file: File, planId?: string) => {
  const fd = new FormData();
  fd.append("file", file);
  if (planId) fd.append("plan_id", planId);
  return apiClient.post(`/admin/partners/${partnerId}/members/bulk-upload`, fd).then((r) => r.data);
};

export const adminDownloadMemberBulkSample = (partnerId: string): Promise<Blob> =>
  apiClient.get(`/admin/partners/${partnerId}/members/bulk-upload/sample`, { responseType: "blob" }).then((r) => r.data);

export const adminDownloadMemberBulkReport = (partnerId: string, file: File): Promise<Blob> => {
  const fd = new FormData();
  fd.append("file", file);
  return apiClient.post(`/admin/partners/${partnerId}/members/bulk-upload/report`, fd, { responseType: "blob" }).then((r) => r.data);
};

export const partnerBulkUploadMembers = (file: File, planId?: string) => {
  const fd = new FormData();
  fd.append("file", file);
  if (planId) fd.append("plan_id", planId);
  return apiClient.post("/partner/members/bulk-upload", fd).then((r) => r.data);
};

export const partnerDownloadMemberBulkSample = (): Promise<Blob> =>
  apiClient.get("/partner/members/bulk-upload/sample", { responseType: "blob" }).then((r) => r.data);

export const partnerDownloadMemberBulkReport = (file: File): Promise<Blob> => {
  const fd = new FormData();
  fd.append("file", file);
  return apiClient.post("/partner/members/bulk-upload/report", fd, { responseType: "blob" }).then((r) => r.data);
};

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

export const adminGetPartnerNotifications = (partnerId: string, params?: { skip?: number; limit?: number }) =>
  apiClient.get(`/admin/partners/${partnerId}/notifications`, { params }).then((r) => r.data);

export const adminMarkPartnerNotificationsRead = (partnerId: string) =>
  apiClient.patch(`/admin/partners/${partnerId}/notifications/mark-all-read`).then((r) => r.data);

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

export const adminGetPolicyHistory = (id: string, params?: { skip?: number; limit?: number }) =>
  apiClient.get(`/admin/policies/${id}/history`, { params }).then((r) => r.data);

export const adminUploadPolicy = (formData: FormData) =>
  apiClient.post("/admin/policies/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);

// ─────────────────────────────────────────────
// ADMIN — POLICY TYPES
// ─────────────────────────────────────────────
export const adminListPolicyTypes = () =>
  apiClient.get("/admin/policy-types").then((r) => r.data);

export const adminCreatePolicyType = (data: object) =>
  apiClient.post("/admin/policy-types", data).then((r) => r.data);

export const adminUpdatePolicyType = (id: string, data: object) =>
  apiClient.patch(`/admin/policy-types/${id}`, data).then((r) => r.data);

export const adminTogglePolicyType = (id: string, is_active: boolean) =>
  apiClient
    .patch(`/admin/policy-types/${id}/${is_active ? "activate" : "deactivate"}`, {})
    .then((r) => r.data);

export const adminDeletePolicyType = (id: string) =>
  apiClient.delete(`/admin/policy-types/${id}`).then((r) => r.data);

// ─────────────────────────────────────────────
// ADMIN — PARTNER TYPES
// ─────────────────────────────────────────────
export const adminListPartnerTypes = () =>
  apiClient.get("/admin/partner-types").then((r) => r.data);

export const adminCreatePartnerType = (data: object) =>
  apiClient.post("/admin/partner-types", data).then((r) => r.data);

export const adminUpdatePartnerType = (id: string, data: object) =>
  apiClient.patch(`/admin/partner-types/${id}`, data).then((r) => r.data);

export const adminTogglePartnerType = (id: string, is_active: boolean) =>
  apiClient
    .patch(`/admin/partner-types/${id}/${is_active ? "activate" : "deactivate"}`, {})
    .then((r) => r.data);

export const adminDeletePartnerType = (id: string) =>
  apiClient.delete(`/admin/partner-types/${id}`).then((r) => r.data);

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

export const adminGetBadgeCounts = () =>
  apiClient.get("/admin/notifications/badge-counts").then((r) => r.data);

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

export const getMe = () =>
  apiClient.get("/users/me").then((r) => r.data);

export const adminAssignUserRole = (userId: string, roleId: string) =>
  apiClient.post(`/users/${userId}/roles`, { role_id: roleId }).then((r) => r.data);

export const adminRemoveUserRole = (userId: string, roleId: string) =>
  apiClient.delete(`/users/${userId}/roles/${roleId}`).then((r) => r.data);

// ─────────────────────────────────────────────
// ADMIN — ROLES & PERMISSIONS
// ─────────────────────────────────────────────
export const adminListRoles = () =>
  apiClient.get("/roles").then((r) => r.data);

export const adminGetPermissionCatalog = () =>
  apiClient.get("/roles/permissions/catalog").then((r) => r.data);

export const adminCreateRole = (data: object) =>
  apiClient.post("/roles", data).then((r) => r.data);

export const adminUpdateRole = (id: string, data: object) =>
  apiClient.patch(`/roles/${id}`, data).then((r) => r.data);

export const adminSetRolePermissions = (id: string, permissionIds: string[]) =>
  apiClient.put(`/roles/${id}/permissions`, { permission_ids: permissionIds }).then((r) => r.data);

export const adminDeleteRole = (id: string) =>
  apiClient.delete(`/roles/${id}`).then((r) => r.data);

export const adminDeletePolicy = (id: string) =>
  apiClient.delete(`/admin/policies/${id}`).then((r) => r.data);

// ─────────────────────────────────────────────
// PARTNER — PROFILE
// ─────────────────────────────────────────────
export const partnerGetProfile = () =>
  apiClient.get("/partner/profile").then((r) => r.data);

export const partnerSubmitChangeRequest = (data: { requested_fields: Record<string, string>; reason?: string }) =>
  apiClient.post("/partner/profile/change-request", data).then((r) => r.data);

export const partnerListChangeRequests = (params?: { skip?: number; limit?: number }) =>
  apiClient.get("/partner/profile/change-requests", { params }).then((r) => r.data);

export const partnerUpdateProfile = (data: object) =>
  apiClient.patch("/partner/profile", data).then((r) => r.data);

export const partnerUploadCardLogo = (file: File) => {
  const fd = new FormData(); fd.append("file", file);
  return apiClient.post("/partner/profile/card-logo", fd).then((r) => r.data);
};
export const partnerGetCardLogoUrl = () =>
  apiClient.get("/partner/profile/card-logo/view", { responseType: "blob" }).then((r) => r.data);
export const partnerDownloadCardPreview = () =>
  apiClient.get("/partner/profile/card-preview", { responseType: "blob" }).then((r) => r.data);

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

export const partnerGetBadgeCounts = () =>
  apiClient.get("/partner/notifications/badge-counts").then((r) => r.data);

export const partnerMarkReadByType = (type: string) =>
  apiClient.patch(`/partner/notifications/mark-read-by-type`, null, { params: { type } }).then((r) => r.data);

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

export const memberRequestAddFamily = (data: { requested_fields: object; reason?: string }) =>
  apiClient.post("/member/family/requests", data).then((r) => r.data);

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
  apiClient.post("/member/policies", formData).then((r) => r.data);

export const memberUpdatePolicy = (id: string, data: object) =>
  apiClient.patch(`/member/policies/${id}`, data).then((r) => r.data);

export const memberDeletePolicy = (id: string) =>
  apiClient.delete(`/member/policies/${id}`).then((r) => r.data);

export const memberViewPolicyPdf = (policyId: string) =>
  apiClient.get(`/member/policies/${policyId}/view`, { responseType: "blob" }).then((r) => r.data);

export const memberDownloadPolicyPdf = (policyId: string) =>
  apiClient.get(`/member/policies/${policyId}/download`, { responseType: "blob" }).then((r) => r.data);

// ─────────────────────────────────────────────
// MEMBER — CLAIMS
// ─────────────────────────────────────────────
export const memberListClaimDocTypes = () =>
  apiClient.get("/member/claims/document-types").then((r) => r.data);

export const memberCreateClaim = (data: object) =>
  apiClient.post("/member/claims", data).then((r) => r.data);

export const memberListClaims = () =>
  apiClient.get("/member/claims").then((r) => r.data);

export const memberGetClaim = (id: string) =>
  apiClient.get(`/member/claims/${id}`).then((r) => r.data);

export const memberUploadClaimDocument = (claimId: string, docType: string, file: File) => {
  const form = new FormData();
  form.append("doc_type", docType);
  form.append("file", file);
  return apiClient.post(`/member/claims/${claimId}/documents`, form).then((r) => r.data);
};

export const memberViewClaimDocument = (claimId: string, documentId: string) =>
  apiClient.get(`/member/claims/${claimId}/documents/${documentId}/view`, { responseType: "blob" }).then((r) => r.data);

export const memberDownloadClaimDocument = (claimId: string, documentId: string) =>
  apiClient.get(`/member/claims/${claimId}/documents/${documentId}/download`, { responseType: "blob" }).then((r) => r.data);

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

export const adminListTemplateOverrides = (slug: string) =>
  apiClient.get(`/admin/email-templates/${slug}/overrides`).then((r) => r.data);

export const adminCreateTemplateOverride = (slug: string, data: { partner_id: string; subject: string; html_body: string; description?: string }) =>
  apiClient.post(`/admin/email-templates/${slug}/overrides`, data).then((r) => r.data);

export const adminDeleteTemplateOverride = (templateId: string) =>
  apiClient.delete(`/admin/email-templates/overrides/${templateId}`).then((r) => r.data);

// ─────────────────────────────────────────────
// ADMIN — WHATSAPP TEMPLATES (Meta Cloud API)
// ─────────────────────────────────────────────
export const adminListWhatsAppTemplates = () =>
  apiClient.get("/admin/whatsapp-templates").then((r) => r.data);

export const adminGetWhatsAppTemplate = (id: string) =>
  apiClient.get(`/admin/whatsapp-templates/${id}`).then((r) => r.data);

export const adminUpdateWhatsAppTemplate = (id: string, data: object) =>
  apiClient.patch(`/admin/whatsapp-templates/${id}`, data).then((r) => r.data);

export const adminListWhatsAppTemplateOverrides = (slug: string) =>
  apiClient.get(`/admin/whatsapp-templates/${slug}/overrides`).then((r) => r.data);

export const adminCreateWhatsAppTemplateOverride = (slug: string, data: { partner_id: string; meta_template_name?: string; meta_template_language?: string; description?: string }) =>
  apiClient.post(`/admin/whatsapp-templates/${slug}/overrides`, data).then((r) => r.data);

export const adminDeleteWhatsAppTemplateOverride = (templateId: string) =>
  apiClient.delete(`/admin/whatsapp-templates/overrides/${templateId}`).then((r) => r.data);

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

export const adminConfirmRenewal = (id: string) =>
  apiClient.post(`/admin/policies/${id}/confirm-renewal`, {}).then((r) => r.data);

export const adminDismissRenewal = (id: string) =>
  apiClient.post(`/admin/policies/${id}/dismiss-renewal`, {}).then((r) => r.data);

// ─────────────────────────────────────────────
// ADMIN — DASHBOARD ANALYTICS
// ─────────────────────────────────────────────
export const adminGetDashboard = (params?: { year?: number }) =>
  apiClient.get("/admin/dashboard", { params }).then((r) => r.data);

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

export const adminCancelMemberEnrollment = (memberId: string, reason?: string) =>
  apiClient.post(`/admin/members/${memberId}/enrollment/cancel`, { reason }).then((r) => r.data);

// ─────────────────────────────────────────────
// ADMIN — FINANCE (Float Ledger)
// ─────────────────────────────────────────────
export const adminFinanceDashboard = () =>
  apiClient.get("/admin/finance/dashboard").then((r) => r.data);

export const adminFinanceTopUp = (partner_id: string, amount: number, note?: string) =>
  apiClient.post("/admin/finance/topup", { partner_id, amount, note }).then((r) => r.data);

export const adminFinanceLedger = (params: object = {}) =>
  apiClient.get("/admin/finance/ledger", { params }).then((r) => r.data);

export const adminFinanceReconcile = (transactionId: string) =>
  apiClient.patch(`/admin/finance/ledger/${transactionId}/reconcile`, {}).then((r) => r.data);

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

export const adminBulkUploadMembers = (file: File, partnerId?: string, planId?: string) => {
  const form = new FormData();
  form.append("file", file);
  if (partnerId) form.append("partner_id", partnerId);
  if (planId) form.append("plan_id", planId);
  return apiClient.post("/admin/members/bulk-upload", form).then((r) => r.data);
};

export const adminDownloadMemberBulkSampleMulti = (partnerIds: string[]): Promise<Blob> =>
  apiClient.get("/admin/members/bulk-upload/sample", {
    params: { partner_ids: partnerIds.join(",") },
    responseType: "blob",
  }).then((r) => r.data);

export async function adminBulkUploadPartners(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await apiClient.post("/admin/partners/bulk-upload", form);
  return res.data;
}

export async function adminDownloadPartnerBulkReport(file: File): Promise<Blob> {
  const form = new FormData();
  form.append("file", file);
  const res = await apiClient.post("/admin/partners/bulk-upload/report", form, {
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
// ADMIN — TICKETS
// ─────────────────────────────────────────────
export const adminListTickets = (params?: { status?: string; category?: string; skip?: number; limit?: number }) =>
  apiClient.get("/admin/tickets", { params }).then((r) => r.data);

export const adminUpdateTicketStatus = (id: string, status: string) =>
  apiClient.patch(`/admin/tickets/${id}/status`, null, { params: { status } }).then((r) => r.data);

// ─────────────────────────────────────────────
// ADMIN — CLAIM TICKETS
// ─────────────────────────────────────────────
export const adminListClaims = (params?: object) =>
  apiClient.post("/admin/claims/list", params || {}).then((r) => r.data);

export const adminSearchAllClaims = (params: { search: string; skip?: number; limit?: number }) =>
  apiClient.post("/admin/claims/search-all", params).then((r) => r.data);

export const adminGetClaim = (id: string) =>
  apiClient.get(`/admin/claims/${id}`).then((r) => r.data);

export const adminListClaimAgents = () =>
  apiClient.get("/admin/claims/agents").then((r) => r.data);

export const adminListClaimAgentsOverview = (params?: { skip?: number; limit?: number; active_only?: boolean }) =>
  apiClient.get("/admin/claims/agents/overview", { params }).then((r) => r.data);

export const adminGetClaimAgentOverview = (id: string) =>
  apiClient.get(`/admin/claims/agents/overview/${id}`).then((r) => r.data);

export const adminUpdateClaimStatus = (id: string, status: string, remark?: string) =>
  apiClient.patch(`/admin/claims/${id}/status`, { status, remark }).then((r) => r.data);

export const adminReassignClaim = (id: string, agentId: string) =>
  apiClient.patch(`/admin/claims/${id}/reassign`, { agent_id: agentId }).then((r) => r.data);

export const adminBulkAssignClaims = (claimIds: string[], agentId: string) =>
  apiClient.patch("/admin/claims/bulk-assign", { claim_ids: claimIds, agent_id: agentId }).then((r) => r.data);

export const adminAddClaimRemark = (id: string, message: string) =>
  apiClient.post(`/admin/claims/${id}/remarks`, { message }).then((r) => r.data);

export const adminUploadClaimDocument = (claimId: string, docType: string, file: File) => {
  const form = new FormData();
  form.append("doc_type", docType);
  form.append("file", file);
  return apiClient.post(`/admin/claims/${claimId}/documents`, form).then((r) => r.data);
};

export const adminViewClaimDocument = (claimId: string, documentId: string) =>
  apiClient.get(`/admin/claims/${claimId}/documents/${documentId}/view`, { responseType: "blob" }).then((r) => r.data);

export const adminDownloadClaimDocument = (claimId: string, documentId: string) =>
  apiClient.get(`/admin/claims/${claimId}/documents/${documentId}/download`, { responseType: "blob" }).then((r) => r.data);

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

export const memberClaimAssist = (body: { claim_type: string; incident_details: string; language?: string }) =>
  apiClient.post("/member/ai/claim", body).then((r) => r.data);

export const memberListTickets = (params?: { skip?: number; limit?: number }) =>
  apiClient.get("/member/ai/tickets", { params }).then((r) => r.data);
