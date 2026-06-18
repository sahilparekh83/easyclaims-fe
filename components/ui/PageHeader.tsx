"use client";

import React from "react";
import styled from "styled-components";

const Wrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const Left = styled.div``;

const Title = styled.h2`
  font-size: 1.15rem;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.01em;
`;

const Subtitle = styled.p`
  font-size: 0.82rem;
  color: #9ca3af;
  margin-top: 2px;
  font-weight: 500;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <Wrap>
      <Left>
        <Title>{title}</Title>
        {subtitle && <Subtitle>{subtitle}</Subtitle>}
      </Left>
      {actions && <Actions>{actions}</Actions>}
    </Wrap>
  );
}
