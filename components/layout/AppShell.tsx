"use client";

import React, { useState } from "react";
import styled from "styled-components";
import Sidebar from "./Sidebar";
import Header from "./Header";

const Shell = styled.div`
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background: #f4f6fb;
`;

const Main = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
`;

const Content = styled.main`
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  min-height: 0;
  padding: 28px;

  @media (max-width: 720px) {
    padding: 16px;
  }
`;

const Backdrop = styled.div<{ $visible: boolean }>`
  display: none;

  @media (max-width: 880px) {
    display: ${p => (p.$visible ? "block" : "none")};
    position: fixed;
    inset: 0;
    background: rgba(10, 20, 40, 0.45);
    z-index: 40;
  }
`;

interface AppShellProps {
  portal: "admin" | "partner" | "member";
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  unreadCount?: number;
  onBellClick?: () => void;
}

export default function AppShell({ portal, title, subtitle, children, unreadCount, onBellClick }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <Shell>
      <Sidebar portal={portal} mobileOpen={mobileNavOpen} onNavigate={() => setMobileNavOpen(false)} />
      <Backdrop $visible={mobileNavOpen} onClick={() => setMobileNavOpen(false)} />
      <Main>
        <Header
          title={title}
          subtitle={subtitle}
          unreadCount={unreadCount}
          onBellClick={onBellClick}
          onMenuClick={() => setMobileNavOpen((o) => !o)}
        />
        <Content>{children}</Content>
      </Main>
    </Shell>
  );
}
