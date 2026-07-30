"use client";

import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { AlertTriangle, Check, Filter, ChevronDown } from "lucide-react";
import dayjs from "dayjs";
import PolicyStatusBadge from "./PolicyStatusBadge";
import PolicyActionButtons from "./PolicyActionButtons";
import CategoryConfidenceChip from "./CategoryConfidenceChip";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LinkedMember { id: string; name: string; relation: string; }

export interface PolicyRow {
  id: string;
  policy_number?: string | null;
  member_id?: string | null;
  member_name?: string | null;
  member_email?: string | null;
  partner_id?: string | null;
  partner_name?: string | null;
  partner_code?: string | null;
  policy_type?: string | null;
  ai_confidence?: number | null;
  insurer?: string | null;
  sum_insured?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  status: string;
  previous_policy_id?: string | null;
  has_file?: boolean;
  file_name?: string | null;
  linked_family_members?: LinkedMember[] | null;
}

interface FilterOption { label: string; value: string; }

export interface PoliciesTableProps {
  policies: PolicyRow[];
  isLoading?: boolean;
  role: "admin" | "partner" | "member";
  /** Show member name as sub-line under policy number (admin/policies list) */
  showMemberSubline?: boolean;
  /** Show a separate MEMBER column (partner/policies) */
  showMemberColumn?: boolean;
  /** Show a separate PARTNER column (member/policies — a member can be enrolled with several) */
  showPartnerColumn?: boolean;
  /** Click handler for the member name cell — admin/policies links this to /admin/members/[id] */
  onMemberClick?: (policy: PolicyRow) => void;
  /** Click handler for the partner name/code cell — member portal links this to /member/plan */
  onPartnerClick?: (policy: PolicyRow) => void;
  onDownload?: (policy: PolicyRow) => void;
  onView?: (policy: PolicyRow) => void;
  onDelete?: (policy: PolicyRow) => void;
  onLinked?: (policy: PolicyRow) => void;
  /** "Claim Policy" action — member portal only */
  onClaim?: (policy: PolicyRow) => void;
  /** Column filter state — admin/policies page only */
  typeFilter?: string;
  onTypeFilter?: (v: string) => void;
  aiFilter?: string;
  onAiFilter?: (v: string) => void;
  policyTypeOptions?: FilterOption[];
  emptyText?: string;
}

// ─── Styled ───────────────────────────────────────────────────────────────────

const TableScroll = styled.div`
  width: 100%;
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
  font-size: 13.5px;
`;

const Th = styled.th`
  padding: 10px 16px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  background: #f8f9fb;
  white-space: nowrap;
`;

const Td = styled.td`
  padding: 11px 16px;
  border-top: 1px solid #f1f2f6;
  vertical-align: middle;
  color: #3a4756;
`;

const PolicyNo = styled.div`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-weight: 600;
  color: #0f172a;
  font-size: 13px;
`;

const PolicySub = styled.div`
  font-size: 11.5px;
  color: #94a3b8;
  margin-top: 2px;
`;

const MemberName = styled.div`font-weight: 600; color: #161d26; font-size: 13.5px;`;
const MemberEmail = styled.div`font-size: 12px; color: #6b7a8c; margin-top: 2px;`;

const PartnerCellBtn = styled.button`
  background: none; border: none; padding: 0; cursor: pointer; text-align: left;
  font-weight: 600; color: #0050b0; font-size: 13.5px;
  &:hover { text-decoration: underline; }
`;
const PartnerCodeText = styled.div`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 11.5px; color: #94a3b8; margin-top: 1px;
`;

const MonoAmount = styled.span`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-weight: 600;
  color: #0f172a;
  font-size: 13px;
`;

const ExpiryPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 600;
  color: #b45309;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 999px;
  padding: 2px 7px;
  margin-top: 3px;
  white-space: nowrap;
`;

const LinkBadgeBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: none;
  border: 1px solid #d1fae5;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
  color: #059669;
  cursor: pointer;
  &:hover { background: #ecfdf5; }
`;

const ClaimBtn = styled.button`
  display: inline-flex;
  align-items: center;
  background: #0050b0;
  border: none;
  border-radius: 7px;
  padding: 5px 10px;
  font-size: 11.5px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  white-space: nowrap;
  &:hover { background: #0046a0; }
`;

const Skeleton = styled.div`
  height: 40px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  border-radius: 6px;
  animation: shimmer 1.4s infinite;
  @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
`;

// ─── Filter Dropdown ──────────────────────────────────────────────────────────

const ThFilterWrap = styled.div`display: inline-flex; align-items: center; gap: 4px; position: relative;`;

const FilterBtn = styled.button<{ $active: boolean }>`
  display: inline-flex; align-items: center; gap: 2px;
  padding: 2px 5px; border-radius: 5px; border: none;
  background: ${p => p.$active ? "#eff6ff" : "transparent"};
  color: ${p => p.$active ? "#2563eb" : "#94a3b8"};
  cursor: pointer; font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.04em;
  &:hover { background: #f1f5f9; color: #374151; }
`;

const DropMenu = styled.div`
  position: absolute; top: calc(100% + 6px); left: 0; z-index: 200;
  background: #fff; border: 1px solid #e8eaf0; border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12); min-width: 150px; padding: 4px 0;
`;

const DropItem = styled.button<{ $selected: boolean }>`
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 7px 14px; border: none; background: none; cursor: pointer;
  font-size: 12.5px; color: ${p => p.$selected ? "#2563eb" : "#374151"};
  font-weight: ${p => p.$selected ? 700 : 400}; text-align: left;
  &:hover { background: #f8f9fb; }
`;

function FilterDropdown({ label, options, value, onChange }: {
  label: string; options: FilterOption[]; value: string; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find(o => o.value === value)?.label;

  return (
    <ThFilterWrap ref={ref}>
      <span>{label}</span>
      <FilterBtn $active={!!value} onClick={() => setOpen(v => !v)}>
        <Filter size={9} />
        {value && <span>{selected}</span>}
        <ChevronDown size={9} />
      </FilterBtn>
      {open && (
        <DropMenu>
          <DropItem $selected={!value} onClick={() => { onChange(""); setOpen(false); }}>
            {!value && <Check size={12} />} All
          </DropItem>
          {options.map(o => (
            <DropItem key={o.value} $selected={value === o.value} onClick={() => { onChange(o.value); setOpen(false); }}>
              {value === o.value && <Check size={12} />} {o.label}
            </DropItem>
          ))}
        </DropMenu>
      )}
    </ThFilterWrap>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysUntilExpiry(endDate: string | null | undefined): number | null {
  if (!endDate) return null;
  return dayjs(endDate).diff(dayjs().startOf("day"), "day");
}

const AI_FILTER_OPTIONS: FilterOption[] = [
  { label: "Processing",  value: "processing" },
  { label: "Need Review", value: "need_review" },
  { label: "Approved",    value: "active" },
  { label: "Rejected",    value: "rejected" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function PoliciesTable({
  policies,
  isLoading = false,
  role,
  showMemberSubline = false,
  showMemberColumn = false,
  showPartnerColumn = false,
  onMemberClick,
  onPartnerClick,
  onDownload,
  onView,
  onDelete,
  onLinked,
  onClaim,
  typeFilter = "",
  onTypeFilter,
  aiFilter = "",
  onAiFilter,
  policyTypeOptions = [],
  emptyText = "No policies found.",
}: PoliciesTableProps) {
  const isMember = role === "member";
  const showFilters = !!onTypeFilter || !!onAiFilter;

  // Column count: POLICY + [MEMBER col?] + [PARTNER col?] + TYPE + INSURER + [EXPIRY if !member] + SUM INSURED + [AI EXTRACTION if !member] + STATUS + ACTIONS
  const colCount = 6 + (showMemberColumn ? 1 : 0) + (showPartnerColumn ? 1 : 0) + (isMember ? 0 : 2);

  return (
    <TableScroll>
    <Table>
      <thead>
        <tr>
          <Th>Policy</Th>
          {showMemberColumn && <Th>Member</Th>}
          {showPartnerColumn && <Th>Partner</Th>}
          <Th>
            {showFilters && onTypeFilter && policyTypeOptions.length > 0 ? (
              <FilterDropdown
                label="Type"
                value={typeFilter}
                onChange={onTypeFilter}
                options={policyTypeOptions}
              />
            ) : "Type"}
          </Th>
          <Th>Insurer</Th>
          {!isMember && <Th>Period</Th>}
          <Th>Sum Insured</Th>
          {!isMember && (
            <Th>
              {showFilters && onAiFilter ? (
                <FilterDropdown
                  label="AI Extraction"
                  value={aiFilter}
                  onChange={onAiFilter}
                  options={AI_FILTER_OPTIONS}
                />
              ) : "AI Extraction"}
            </Th>
          )}
          <Th>Status</Th>
          <Th>Actions</Th>
        </tr>
      </thead>
      <tbody>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <tr key={i}>
              <Td colSpan={colCount}><Skeleton /></Td>
            </tr>
          ))
        ) : policies.length === 0 ? (
          <tr>
            <Td colSpan={colCount} style={{ textAlign: "center", color: "#9ca3af", padding: "2.5rem 1rem" }}>
              {emptyText}
            </Td>
          </tr>
        ) : policies.map(row => {
          const daysLeft = getDaysUntilExpiry(row.end_date);
          const isExpired = daysLeft !== null && daysLeft < 0;
          const effectiveStatus = isExpired ? "expired" : row.status;
          const pType = row.policy_type || "";
          const hasFile = row.has_file || !!row.file_name;

          return (
            <tr
              key={row.id}
              style={{ borderTop: "1px solid #f1f2f6" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fb")}
              onMouseLeave={e => (e.currentTarget.style.background = "")}
            >
              {/* Policy number */}
              <Td>
                <PolicyNo>{row.policy_number || "—"}</PolicyNo>
                {showMemberSubline && row.member_name && (
                  <PolicySub>{row.member_name}</PolicySub>
                )}
                {isMember && (row.start_date || row.end_date) && (
                  <PolicySub>
                    {row.start_date ? dayjs(row.start_date).format("DD MMM YY") : "—"}
                    {" → "}
                    {row.end_date ? dayjs(row.end_date).format("DD MMM YY") : "—"}
                  </PolicySub>
                )}
                {isMember && daysLeft !== null && daysLeft >= 0 && daysLeft <= 30 && (
                  <div style={{ marginTop: 3 }}>
                    <ExpiryPill><AlertTriangle size={10} /> Expires in {daysLeft}d</ExpiryPill>
                  </div>
                )}
              </Td>

              {/* Member column (partner only) */}
              {showMemberColumn && (
                <Td>
                  {row.member_name && onMemberClick ? (
                    <PartnerCellBtn onClick={() => onMemberClick(row)} title="View member">
                      {row.member_name}
                    </PartnerCellBtn>
                  ) : (
                    <MemberName>{row.member_name || "—"}</MemberName>
                  )}
                  {row.member_email && <MemberEmail>{row.member_email}</MemberEmail>}
                </Td>
              )}

              {/* Partner column (member only — a member can be enrolled with several) */}
              {showPartnerColumn && (
                <Td>
                  {row.partner_name ? (
                    onPartnerClick ? (
                      <PartnerCellBtn onClick={() => onPartnerClick(row)} title="View my plan">
                        {row.partner_name}
                        {row.partner_code && <PartnerCodeText>{row.partner_code}</PartnerCodeText>}
                      </PartnerCellBtn>
                    ) : (
                      <>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{row.partner_name}</div>
                        {row.partner_code && <PartnerCodeText>{row.partner_code}</PartnerCodeText>}
                      </>
                    )
                  ) : (
                    <span style={{ color: "#9ca3af" }}>—</span>
                  )}
                </Td>
              )}

              {/* Type */}
              <Td>
                <CategoryConfidenceChip category={pType || null} confidence={row.ai_confidence} status={row.status} />
              </Td>

              {/* Insurer */}
              <Td>{row.insurer || <span style={{ color: "#9ca3af" }}>—</span>}</Td>

              {/* Period (start → end) — admin/partner only */}
              {!isMember && (
                <Td>
                  {(row.start_date || row.end_date) ? (
                    <div>
                      <div style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 12, color: "#64748b" }}>
                        {row.start_date ? dayjs(row.start_date).format("DD MMM YYYY") : "—"}
                      </div>
                      <div style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 12.5, fontWeight: 600, color: isExpired ? "#b91c1c" : "#0f172a", marginTop: 2 }}>
                        {row.end_date ? dayjs(row.end_date).format("DD MMM YYYY") : "—"}
                      </div>
                      {daysLeft !== null && daysLeft < 0 && (
                        <ExpiryPill style={{ color: "#b91c1c", background: "#fee2e2", border: "1px solid #fca5a5" }}>
                          <AlertTriangle size={10} /> Expired
                        </ExpiryPill>
                      )}
                      {daysLeft !== null && daysLeft >= 0 && daysLeft <= 30 && (
                        <ExpiryPill><AlertTriangle size={10} /> {daysLeft}d left</ExpiryPill>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: "#9ca3af" }}>—</span>
                  )}
                </Td>
              )}

              {/* Sum Insured */}
              <Td>
                {row.sum_insured != null
                  ? <MonoAmount>₹{Number(row.sum_insured).toLocaleString("en-IN")}</MonoAmount>
                  : <span style={{ color: "#9ca3af" }}>—</span>}
              </Td>

              {/* AI Extraction column — admin/partner only */}
              {!isMember && (
                <Td>
                  {isExpired
                    ? <span style={{ color: "#9ca3af" }}>—</span>
                    : <PolicyStatusBadge status={row.status} isRenewal={!!row.previous_policy_id} />}
                </Td>
              )}

              {/* Status */}
              <Td>
                <PolicyStatusBadge
                  status={effectiveStatus}
                  isRenewal={!!row.previous_policy_id}
                  showIcon={isMember}
                />
              </Td>

              {/* Actions */}
              <Td>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <PolicyActionButtons
                    onDownload={onDownload && hasFile ? () => onDownload(row) : undefined}
                    onView={onView ? () => onView(row) : undefined}
                    onDelete={onDelete ? () => onDelete(row) : undefined}
                    viewTitle="Review Policy"
                  />
                  {onLinked && (row.linked_family_members?.length ?? 0) > 0 && (
                    <LinkBadgeBtn onClick={() => onLinked(row)} title="View linked family members">
                      🔗 {row.linked_family_members!.length}
                    </LinkBadgeBtn>
                  )}
                  {onClaim && isMember && effectiveStatus === "active" && (
                    <ClaimBtn onClick={() => onClaim(row)}>Claim Policy</ClaimBtn>
                  )}
                </div>
              </Td>
            </tr>
          );
        })}
      </tbody>
    </Table>
    </TableScroll>
  );
}
