"use client";

import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { sendOtp, verifyOtp } from "@/imports/core/api";
import { getApiError } from "@/imports/core/errors";
import { useAuthStore } from "@/stores/AuthStore";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Mail, ArrowLeft, Sparkles, CheckCircle2 } from "lucide-react";

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Root = styled.div`
  min-height: 100vh;
  display: flex;
  background: #f7f9fb;
`;

/* ── Left brand panel ───────────────────────────────────────────────────── */

const BrandPanel = styled.div`
  width: 45%;
  min-height: 100vh;
  background: #0a2a57;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 64px;
  gap: 0;

  @media (max-width: 860px) {
    display: none;
  }
`;

const LogoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 44px;
  align-self: flex-start;
`;

const LogoBox = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 8px;
`;

const BrandText = styled.div``;

const BrandName = styled.div`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 800;
  font-size: 22px;
  color: #fff;
  letter-spacing: -0.01em;
`;

const BrandSub = styled.div`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #a3cd7a;
  font-weight: 700;
  margin-top: 3px;
`;

const Tagline = styled.p`
  font-family: 'Public Sans', sans-serif;
  font-size: 15px;
  line-height: 1.65;
  color: rgba(255,255,255,0.78);
  align-self: flex-start;
  margin-bottom: 40px;
  max-width: 320px;
`;

const Features = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
  align-self: flex-start;
`;

const Feature = styled.li`
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: 'Public Sans', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255,255,255,0.82);
`;

const FeatureIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

/* ── Right form panel ───────────────────────────────────────────────────── */

const FormPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;

  @media (max-width: 860px) {
    padding: 0;
    background: #0a2a57;
    min-height: 100vh;
    justify-content: flex-start;
  }
`;

const MobileHeader = styled.div`
  display: none;
  width: 100%;
  padding: 22px 24px;
  align-items: center;
  gap: 12px;

  @media (max-width: 860px) {
    display: flex;
  }
`;

const FormCard = styled.div`
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: 18px;
  padding: 44px 40px;
  box-shadow: 0 4px 24px rgba(10,42,87,0.1);
  animation: ${fadeUp} 0.3s ease;

  @media (max-width: 860px) {
    border-radius: 20px 20px 0 0;
    padding: 36px 28px 48px;
    max-width: 100%;
    margin-top: auto;
    box-shadow: 0 -4px 32px rgba(0,0,0,0.2);
  }
`;

const CardHeading = styled.h1`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px;
  font-weight: 800;
  color: #161d26;
  letter-spacing: -0.01em;
  margin-bottom: 6px;
`;

const CardSub = styled.p`
  font-family: 'Public Sans', sans-serif;
  font-size: 14px;
  color: #6b7a8c;
  margin-bottom: 28px;
  line-height: 1.5;
`;

const FieldGroup = styled.div`
  margin-bottom: 18px;
`;

const FieldLabel = styled.label`
  display: block;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #3a4756;
  margin-bottom: 7px;
`;

const InputWrap = styled.div`
  position: relative;

  .p-inputtext {
    width: 100%;
    padding: 11px 14px 11px 40px !important;
    border-radius: 10px !important;
    border: 1.5px solid #e0e6ec !important;
    font-size: 0.925rem !important;
    font-family: 'Public Sans', sans-serif !important;
    background: #f7f9fb !important;
    color: #161d26 !important;
    transition: border-color 0.15s, box-shadow 0.15s !important;

    &:focus,
    &:enabled:focus {
      border-color: #0050b0 !important;
      box-shadow: 0 0 0 3px rgba(0,80,176,0.1) !important;
      background: #fff !important;
    }
  }
`;

const OtpInputWrap = styled.div`
  .p-inputtext {
    width: 100%;
    font-family: 'IBM Plex Mono', ui-monospace, monospace !important;
    font-size: 2rem !important;
    font-weight: 700 !important;
    letter-spacing: 0.45em !important;
    text-align: center !important;
    padding: 14px !important;
    border-radius: 12px !important;
    border: 2px solid #e0e6ec !important;
    color: #161d26 !important;
    background: #f7f9fb !important;
    transition: border-color 0.15s !important;

    &:focus,
    &:enabled:focus {
      border-color: #0050b0 !important;
      box-shadow: 0 0 0 3px rgba(0,80,176,0.1) !important;
      background: #fff !important;
    }
  }
`;

const InputIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7a8c;
  display: flex;
  align-items: center;
  pointer-events: none;
`;

const PrimaryBtn = styled.button`
  width: 100%;
  height: 44px;
  background: #0050b0;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 6px;
  transition: background 0.15s, transform 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover:not(:disabled) { background: #0046a0; }
  &:active:not(:disabled) { transform: scale(0.99); }
  &:disabled { opacity: 0.55; cursor: not-allowed; }
`;

const BackBtn = styled.button`
  background: none;
  border: none;
  color: #0050b0;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 5px;
  &:hover { color: #0046a0; }
`;

const DevBadge = styled.div`
  margin-top: 12px;
  padding: 10px 14px;
  background: #fefce8;
  border: 1px solid #fde047;
  border-radius: 10px;
  font-size: 13px;
  color: #713f12;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  strong { font-weight: 700; letter-spacing: 0.1em; }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 20px 0;
  color: #6b7a8c;
  font-size: 12px;
  font-family: 'Public Sans', sans-serif;
  &::before, &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: #e0e6ec;
  }
`;

const ResendBtn = styled.button`
  width: 100%;
  background: none;
  border: 1.5px solid #e0e6ec;
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
  font-family: 'Public Sans', sans-serif;
  font-size: 14px;
  color: #6b7a8c;
  font-weight: 600;
  transition: border-color 0.15s, color 0.15s;
  &:hover:not(:disabled) { border-color: #0050b0; color: #0050b0; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
`;

const PoweredBy = styled.p`
  text-align: center;
  font-family: 'Public Sans', sans-serif;
  font-size: 12px;
  color: #6b7a8c;
  margin-top: 24px;
`;

/* ── Spinner ───────────────────────────────────────────────────────────── */

const spin = keyframes`from{transform:rotate(0deg)}to{transform:rotate(360deg)}`;
const Spinner = styled.span`
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
  display: inline-block;
`;

/* ── Constants ─────────────────────────────────────────────────────────── */

const REDIRECT: Record<string, string> = {
  SUPERADMIN: "/admin/dashboard",
  PARTNER: "/partner/dashboard",
  MEMBER: "/member/dashboard",
};

const FEATURES = [
  "AI-powered policy extraction",
  "Partner & member portals",
  "Real-time claims assistance",
];

/* ── Component ─────────────────────────────────────────────────────────── */

export default function LoginPage() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const { setAuth } = useAuthStore();
  const router = useRouter();

  const handleSendOtp = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return toast.error("Please enter your email");
    setLoading(true);
    setDevOtp(null);
    try {
      const res = await sendOtp(trimmedEmail);
      if (res?.data?.otp) {
        setDevOtp(res.data.otp);
        setOtp(res.data.otp);
        toast.info("Dev mode: OTP auto-filled below");
      } else {
        toast.success("OTP sent to your email");
      }
      setStep("otp");
    } catch (err: unknown) {
      toast.error(getApiError(err, "Failed to send OTP"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) return toast.error("Please enter the OTP");
    setLoading(true);
    try {
      const res = await verifyOtp(email.trim().toLowerCase(), otp.trim());
      const data = res?.data;
      if (!data?.access_token) throw new Error("Invalid response");
      const userType = data.user_type === "CUSTOMER" ? "MEMBER" : (data.user_type || "MEMBER");
      setAuth(data.access_token, data.refresh_token, userType, data.user_id || "");
      toast.success("Welcome back!");
      router.push(REDIRECT[userType] || "/member/dashboard");
    } catch (err: unknown) {
      toast.error(getApiError(err, "Invalid or expired OTP"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Root>
      {/* ── Brand panel (desktop only) ── */}
      <BrandPanel>
        <LogoRow>
          <LogoBox>
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
              <path d="M183.4 61.1 A92 92 0 1 0 183.4 138.9 L145.3 121.1 A50 50 0 1 1 145.3 78.9 Z" fill="#0050B0" />
              <path d="M14 132 q14 -26 52 -26 l46 0 q-2 28 -34 32 q-38 4 -64 -6 Z" fill="#65A147" />
            </svg>
          </LogoBox>
          <BrandText>
            <BrandName>Easy Claims</BrandName>
            <BrandSub>Seamless &amp; Convenience</BrandSub>
          </BrandText>
        </LogoRow>

        <Tagline>
          Manage memberships, policies and partners from one place.
        </Tagline>

        <Features>
          {FEATURES.map(f => (
            <Feature key={f}>
              <FeatureIcon>
                <CheckCircle2 size={15} color="#a3cd7a" />
              </FeatureIcon>
              {f}
            </Feature>
          ))}
        </Features>
      </BrandPanel>

      {/* ── Form panel ── */}
      <FormPanel>
        <MobileHeader>
          <LogoBox style={{ width: 38, height: 38, padding: 6, background: "#fff" }}>
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="26" height="26">
              <path d="M183.4 61.1 A92 92 0 1 0 183.4 138.9 L145.3 121.1 A50 50 0 1 1 145.3 78.9 Z" fill="#0050B0" />
              <path d="M14 132 q14 -26 52 -26 l46 0 q-2 28 -34 32 q-38 4 -64 -6 Z" fill="#65A147" />
            </svg>
          </LogoBox>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 16, color: "#fff" }}>Easy Claims</div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "#a3cd7a", fontWeight: 700 }}>Seamless &amp; Convenience</div>
          </div>
        </MobileHeader>

        <FormCard>
          {step === "email" ? (
            <>
              <CardHeading>Welcome back</CardHeading>
              <CardSub>Enter your email to receive a one-time sign-in code.</CardSub>

              <FieldGroup>
                <FieldLabel htmlFor="ec-email">Email address</FieldLabel>
                <InputWrap>
                  <InputIcon><Mail size={15} /></InputIcon>
                  <InputText
                    id="ec-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                    placeholder="you@company.com"
                  />
                </InputWrap>
              </FieldGroup>

              <PrimaryBtn onClick={handleSendOtp} disabled={loading}>
                {loading ? <Spinner /> : "Send OTP"}
              </PrimaryBtn>
            </>
          ) : (
            <>
              <BackBtn onClick={() => { setStep("email"); setOtp(""); setDevOtp(null); }}>
                <ArrowLeft size={13} /> Back
              </BackBtn>

              <CardHeading>Enter verification code</CardHeading>
              <CardSub>
                We sent a 6-digit OTP to <strong style={{ color: "#161d26" }}>{email}</strong>
              </CardSub>

              <FieldGroup>
                <FieldLabel htmlFor="ec-otp">One-time password</FieldLabel>
                <OtpInputWrap>
                  <InputText
                    id="ec-otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                    placeholder="······"
                    maxLength={6}
                    keyfilter="int"
                  />
                </OtpInputWrap>
              </FieldGroup>

              {devOtp && (
                <DevBadge
                  title="Click to copy"
                  onClick={() => { navigator.clipboard.writeText(devOtp); toast.info("Copied!"); }}
                >
                  <Sparkles size={13} color="#92400e" />
                  Dev OTP: <strong>{devOtp}</strong>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "#92400e" }}>click to copy</span>
                </DevBadge>
              )}

              <PrimaryBtn onClick={handleVerifyOtp} disabled={loading} style={{ marginTop: 12 }}>
                {loading ? <Spinner /> : "Verify & Sign in"}
              </PrimaryBtn>

              <Divider>didn&apos;t receive it?</Divider>

              <ResendBtn onClick={handleSendOtp} disabled={loading}>
                Resend OTP
              </ResendBtn>
            </>
          )}

          <PoweredBy>Easy Claims CRM v1.0</PoweredBy>
        </FormCard>
      </FormPanel>
    </Root>
  );
}
