"use client";

import styled from "styled-components";

export const TabBar = styled.div`display: flex; gap: 0; border-bottom: 1px solid #e8eaf0;`;

export const Tab = styled.button<{ $active: boolean }>`
  background: none; border: none;
  border-bottom: 2px solid ${p => p.$active ? "#0a2257" : "transparent"};
  color: ${p => p.$active ? "#0a2257" : "#64748b"};
  font-size: 13.5px; font-weight: ${p => p.$active ? 700 : 500};
  padding: 10px 18px 12px; cursor: pointer; transition: all 0.15s; white-space: nowrap;
  &:hover { color: #0f172a; }
`;
