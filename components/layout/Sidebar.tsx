"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styled from "styled-components";
import {
  LayoutDashboard, Users, FileText, CreditCard, Bell,
  Settings, Package, ShieldCheck, Heart, UserCheck,
  BadgeCheck, Mail, Sparkles, LogOut, Briefcase, BarChart2,
} from "lucide-react";
import { useAuthStore } from "@/stores/AuthStore";
import { logout } from "@/imports/core/api";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard",      href: "/admin/dashboard",       icon: <LayoutDashboard size={18} /> },
  { label: "Membership plans", href: "/admin/plans",         icon: <CreditCard size={18} /> },
  { label: "Members",        href: "/admin/members",         icon: <Users size={18} /> },
  { label: "Partners",       href: "/admin/partners",        icon: <Briefcase size={18} /> },
  { label: "Policies",       href: "/admin/policies",        icon: <ShieldCheck size={18} />, badge: 7 },
  { label: "Reports",        href: "/admin/reports",         icon: <BarChart2 size={18} /> },
  { label: "Policy Types",   href: "/admin/policy-types",    icon: <Package size={18} /> },
  { label: "Notifications",  href: "/admin/notifications",   icon: <Bell size={18} /> },
  { label: "Email Templates", href: "/admin/email-templates", icon: <Mail size={18} /> },
];

const PARTNER_NAV: NavItem[] = [
  { label: "Dashboard",    href: "/partner/dashboard",    icon: <LayoutDashboard size={18} /> },
  { label: "Members",      href: "/partner/members",      icon: <Users size={18} /> },
  { label: "Policies",     href: "/partner/policies",     icon: <FileText size={18} /> },
  { label: "Plans",        href: "/partner/plans",        icon: <CreditCard size={18} /> },
  { label: "Profile",      href: "/partner/profile",      icon: <Settings size={18} /> },
  { label: "Notifications", href: "/partner/notifications", icon: <Bell size={18} /> },
];

const MEMBER_NAV: NavItem[] = [
  { label: "Dashboard",    href: "/member/dashboard",     icon: <LayoutDashboard size={18} /> },
  { label: "My Plan",      href: "/member/plan",          icon: <BadgeCheck size={18} /> },
  { label: "Profile",      href: "/member/profile",       icon: <UserCheck size={18} /> },
  { label: "Family",       href: "/member/family",        icon: <Heart size={18} /> },
  { label: "Nominees",     href: "/member/nominees",      icon: <Users size={18} /> },
  { label: "Policies",     href: "/member/policies",      icon: <FileText size={18} /> },
  { label: "Consent",      href: "/member/consent",       icon: <ShieldCheck size={18} /> },
  { label: "Notifications", href: "/member/notifications", icon: <Bell size={18} /> },
];

const NAV_MAP: Record<string, NavItem[]> = { admin: ADMIN_NAV, partner: PARTNER_NAV, member: MEMBER_NAV };

// ─── Styled ───────────────────────────────────────────────────────────────────

const Wrap = styled.aside`
  width: 256px;
  min-height: 100vh;
  background: #0a2a57;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  color: #fff;
`;

const LogoArea = styled.div`
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 22px 20px 24px;
`;

const LogoBox = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 5px;
`;

const BrandText = styled.div`
  display: flex;
  flex-direction: column;
  line-height: 1;
`;

const BrandName = styled.b`
  font-weight: 800;
  font-size: 16px;
  letter-spacing: -0.01em;
  color: #fff;
`;

const BrandSub = styled.span`
  font-size: 8.5px;
  letter-spacing: 0.12em;
  color: #a3cd7a;
  margin-top: 3px;
  font-weight: 700;
  text-transform: uppercase;
`;

const SectionLabel = styled.div`
  font-size: 10.5px;
  letter-spacing: 0.1em;
  color: rgba(255,255,255,0.4);
  font-weight: 700;
  text-transform: uppercase;
  padding: 10px 12px 7px;
`;

const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 12px;
  flex: 1;
`;

const NavBtn = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: 14px;
  font-weight: ${p => p.$active ? 700 : 500};
  color: ${p => p.$active ? "#fff" : "rgba(255,255,255,0.72)"};
  background: ${p => p.$active ? "rgba(255,255,255,0.12)" : "transparent"};
  box-shadow: ${p => p.$active ? "inset 3px 0 0 #84ba52" : "none"};
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.9);
  }

  svg { flex-shrink: 0; }
`;

const NavBadge = styled.span`
  margin-left: auto;
  background: #65a147;
  color: #fff;
  border-radius: 999px;
  padding: 1px 7px;
  font-size: 11px;
  font-weight: 600;
  font-family: var(--ec-font-mono, 'IBM Plex Mono', ui-monospace, monospace);
`;

const AICopilot = styled.div`
  padding: 14px;
  margin: 12px;
  border-radius: 14px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.08);
`;

const AIHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 7px;
  font-weight: 700;
  font-size: 13px;
`;

const AIBlurb = styled.p`
  margin: 0;
  font-size: 12px;
  color: rgba(255,255,255,0.72);
  line-height: 1.5;
`;

const SignOutBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 24px;
  border: none;
  border-top: 1px solid rgba(255,255,255,0.1);
  background: transparent;
  color: rgba(255,255,255,0.72);
  cursor: pointer;
  font-size: 13.5px;
  font-weight: 500;
  width: 100%;
  text-align: left;
  transition: color 0.15s;

  &:hover {
    color: #fff;
  }
`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function Sidebar({ portal }: { portal: "admin" | "partner" | "member" }) {
  const pathname = usePathname();
  const router = useRouter();
  const { clearAuth, accessToken } = useAuthStore();
  const navItems = NAV_MAP[portal] || [];

  const handleSignOut = async () => {
    try { if (accessToken) await logout(accessToken); } catch {}
    clearAuth();
    router.push("/login");
  };

  return (
    <Wrap>
      <LogoArea>
        <LogoBox>
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
            <path d="M183.4 61.1 A92 92 0 1 0 183.4 138.9 L145.3 121.1 A50 50 0 1 1 145.3 78.9 Z" fill="#0050B0" />
            <path d="M14 132 q14 -26 52 -26 l46 0 q-2 28 -34 32 q-38 4 -64 -6 Z" fill="#65A147" />
          </svg>
        </LogoBox>
        <BrandText>
          <BrandName>Easy Claims</BrandName>
          <BrandSub>Seamless &amp; Convenience</BrandSub>
        </BrandText>
      </LogoArea>

      <Nav>
        <SectionLabel>Workspace</SectionLabel>
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <NavBtn
              key={item.href}
              $active={active}
              onClick={() => router.push(item.href)}
            >
              {item.icon}
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge != null && <NavBadge>{item.badge}</NavBadge>}
            </NavBtn>
          );
        })}
      </Nav>

      <AICopilot>
        <AIHeader>
          <Sparkles size={15} color="#a3cd7a" />
          AI Copilot
        </AIHeader>
        <AIBlurb>82% of claims this week were auto-triaged by AI.</AIBlurb>
      </AICopilot>

      <SignOutBtn onClick={handleSignOut}>
        <LogOut size={18} />
        Sign out
      </SignOutBtn>
    </Wrap>
  );
}
