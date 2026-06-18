"use client";

import React from "react";
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
  min-height: 0;
  padding: 28px;
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
  return (
    <Shell>
      <Sidebar portal={portal} />
      <Main>
        <Header title={title} subtitle={subtitle} unreadCount={unreadCount} onBellClick={onBellClick} />
        <Content>{children}</Content>
      </Main>
    </Shell>
  );
}
