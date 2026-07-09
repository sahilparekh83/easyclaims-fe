"use client";

import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import { InputText } from "primereact/inputtext";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { sendOtp, verifyOtp } from "@/imports/core/api";
import { getApiError } from "@/imports/core/errors";
import { useAuthStore } from "@/stores/AuthStore";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Mail, ArrowLeft, Sparkles, CheckCircle2, Shield, Activity, Headphones } from "lucide-react";

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-14px); }
`;

// ─── Root ─────────────────────────────────────────────────────────────────────

const Root = styled.div`
  min-height: 100vh;
  display: flex;
`;

// ─── Left Panel ───────────────────────────────────────────────────────────────

const BrandPanel = styled.div`
  width: 52%;
  min-height: 100vh;
  position: relative;
  background: #050823;
  overflow: hidden;
  @media (max-width: 900px) { display: none; }
`;

/* Floating illustration container */
const HeroBg = styled.div`
  position: absolute;
  right: -2%;
  top: 50%;
  transform: translateY(-50%);
  height: 78%;
  aspect-ratio: 3/2;
  z-index: 0;
  pointer-events: none;
`;

/* Dark gradient overlay — left text area */
const LeftFade = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(
    90deg,
    rgba(5,8,35,1) 0%,
    rgba(5,8,35,0.9) 40%,
    transparent 70%
  );
`;

/* Text content */
const TextCol = styled.div`
  position: relative;
  z-index: 2;
  width: 42%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 44px 0 40px 48px;
`;

// Logo
const LogoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 46px;
`;

const LogoBox = styled.div`
  width: 44px; height: 44px; border-radius: 11px;
  background: #fff;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; padding: 7px;
`;

const BrandName = styled.div`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 800; font-size: 19px; color: #fff;
`;

const BrandSub = styled.div`
  font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
  color: #4ade80; font-weight: 700; margin-top: 2px;
`;

// Heading
const HeroAccent = styled.div`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: clamp(34px, 2.25vw, 42px); font-weight: 800; color: #4ade80;
  letter-spacing: -0.02em; line-height: 1.1;
`;

const HeroWhite = styled.div`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: clamp(34px, 2.25vw, 42px); font-weight: 800; color: #fff;
  letter-spacing: -0.02em; line-height: 1.1; margin-bottom: 16px;
`;

const HeroSub = styled.p`
  font-family: 'Public Sans', sans-serif;
  font-size: 13.5px; color: rgba(255,255,255,0.62);
  line-height: 1.65; margin: 0 0 32px;
  max-width: 310px;
`;

// Features
const Features = styled.div`
  display: flex; flex-direction: column; gap: 14px;
`;

const Feature = styled.div`
  display: flex; align-items: flex-start; gap: 13px;
`;

const FeatureIcon = styled.div`
  width: 32px; height: 32px; border-radius: 8px;
  background: rgba(74,222,128,0.12);
  border: 1px solid rgba(74,222,128,0.2);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 1px;
`;

const FeatureTitle = styled.div`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13.5px; font-weight: 700; color: #fff;
`;

const FeatureDesc = styled.div`
  font-family: 'Public Sans', sans-serif;
  font-size: 12px; color: rgba(255,255,255,0.48); margin-top: 2px;
`;

// Stats
const PanelDivider = styled.div`
  height: 1px; background: rgba(255,255,255,0.1);
  margin: 28px 0 20px;
`;

const StatsTrustLabel = styled.div`
  font-size: 9.5px; font-weight: 700; letter-spacing: 0.13em;
  text-transform: uppercase; color: rgba(255,255,255,0.36); margin-bottom: 14px;
`;

const StatsGrid = styled.div`
  display: flex;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.13);
  border-radius: 14px; overflow: hidden;
  width: 100%;
`;

const StatItem = styled.div`
  flex: 1; padding: 12px 14px;
  border-right: 1px solid rgba(255,255,255,0.08);
  &:last-child { border-right: none; }
`;

const StatValue = styled.div`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 17px; font-weight: 800; color: #fff;
`;

const StatLabel = styled.div`
  font-family: 'Public Sans', sans-serif;
  font-size: 10px; color: rgba(255,255,255,0.4); margin-top: 2px;
`;

const Copyright = styled.div`
  font-size: 11px; color: rgba(255,255,255,0.25);
  margin-top: 20px; font-family: 'Public Sans', sans-serif;
`;

// ─── Right Panel ──────────────────────────────────────────────────────────────

const FormPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  background: #f3f7fb;
  position: relative;
  overflow: hidden;

  @media (max-width: 900px) {
    background: #0a2a57;
    justify-content: flex-start;
    padding: 0;
    min-height: 100vh;
  }
`;

/* Decorative blobs — right panel */
const BlobTopRight = styled.div`
  position: absolute;
  top: -100px; right: -100px;
  width: 320px; height: 320px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(167,139,250,0.28) 0%, rgba(167,139,250,0.06) 70%);
  pointer-events: none;

  @media (max-width: 900px) { display: none; }
`;

const BlobBottomLeft = styled.div`
  position: absolute;
  bottom: -80px; left: -60px;
  width: 260px; height: 260px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(20,184,166,0.22) 0%, rgba(20,184,166,0.04) 70%);
  pointer-events: none;

  @media (max-width: 900px) { display: none; }
`;

const BlobBottomRight = styled.div`
  position: absolute;
  bottom: -60px; right: 60px;
  width: 200px; height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(167,139,250,0.15) 0%, rgba(167,139,250,0.03) 70%);
  pointer-events: none;

  @media (max-width: 900px) { display: none; }
`;

const BlobLeftConnect = styled.div`
  position: absolute;
  left: -220px;
  top: 50%;
  transform: translateY(-50%);
  width: 440px;
  height: 440px;
  border-radius: 50%;
  background: radial-gradient(circle,
    rgba(56, 189, 248, 0.18) 0%,
    rgba(99, 102, 241, 0.12) 40%,
    transparent 70%
  );
  pointer-events: none;

  @media (max-width: 900px) { display: none; }
`;

const FormHeroGhost = styled.div`
  position: absolute;
  left: -120px;
  top: 50%;
  transform: translateY(-50%);
  width: 420px;
  height: 420px;
  opacity: 0.09;
  pointer-events: none;
  z-index: 0;
  @media (max-width: 900px) { display: none; }
`;

/* Dot grid */
const DotGrid = styled.div`
  position: absolute; top: 0; right: 0;
  width: 200px; height: 200px;
  background-image: radial-gradient(circle, #94a3b8 1px, transparent 1px);
  background-size: 20px 20px;
  opacity: 0.3; pointer-events: none;
  @media (max-width: 900px) { display: none; }
`;

const MobileHeader = styled.div`
  display: none; width: 100%;
  padding: 22px 24px; align-items: center; gap: 12px;
  @media (max-width: 900px) { display: flex; }
`;

const FormCard = styled.div`
  width: 100%; max-width: 440px;
  background: #fff; border-radius: 24px;
  padding: 44px 40px 40px;
  box-shadow: 0 8px 48px rgba(10,42,87,0.11);
  animation: ${fadeUp} 0.3s ease;
  position: relative; z-index: 1;

  @media (max-width: 900px) {
    border-radius: 20px 20px 0 0;
    padding: 32px 26px 44px;
    max-width: 100%; margin-top: auto;
  }
`;

const CardLogoWrap = styled.div`
  display: flex; justify-content: center; margin-bottom: 24px;
`;

const CardLogoCircle = styled.div`
  width: 64px; height: 64px; border-radius: 50%;
  background: #eff6ff; border: 2px solid #dbeafe;
  display: flex; align-items: center; justify-content: center;
`;

const CardHeading = styled.h1`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px; font-weight: 800; color: #0f172a;
  letter-spacing: -0.01em; margin-bottom: 6px; text-align: center;
`;

const CardSub = styled.p`
  font-family: 'Public Sans', sans-serif;
  font-size: 13.5px; color: #64748b;
  margin-bottom: 28px; line-height: 1.55; text-align: center;
`;

const FieldGroup = styled.div` margin-bottom: 16px; `;

const FieldLabel = styled.label`
  display: block;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 7px;
`;

const InputWrap = styled.div`
  position: relative;
  .p-inputtext {
    width: 100%; padding: 12px 14px 12px 40px !important;
    border-radius: 11px !important; border: 1.5px solid #e2e8f0 !important;
    font-size: 0.925rem !important; font-family: 'Public Sans', sans-serif !important;
    background: #f8fafc !important; color: #0f172a !important;
    transition: border-color 0.15s, box-shadow 0.15s !important;
    &:focus, &:enabled:focus {
      border-color: #6d28d9 !important;
      box-shadow: 0 0 0 3px rgba(109,40,217,0.1) !important;
      background: #fff !important;
    }
  }
`;

const OtpInputWrap = styled.div`
  .p-inputtext {
    width: 100%;
    font-family: 'IBM Plex Mono', ui-monospace, monospace !important;
    font-size: 2rem !important; font-weight: 700 !important;
    letter-spacing: 0.45em !important; text-align: center !important;
    padding: 14px !important; border-radius: 12px !important;
    border: 2px solid #e2e8f0 !important; color: #0f172a !important;
    background: #f8fafc !important;
    &:focus, &:enabled:focus {
      border-color: #6d28d9 !important;
      box-shadow: 0 0 0 3px rgba(109,40,217,0.1) !important;
      background: #fff !important;
    }
  }
`;

const InputIcon = styled.div`
  position: absolute; left: 13px; top: 50%;
  transform: translateY(-50%); color: #94a3b8;
  display: flex; align-items: center; pointer-events: none;
`;

const PrimaryBtn = styled.button`
  width: 100%; height: 50px;
  background: linear-gradient(90deg, #6d28d9, #1d4ed8);
  color: #fff; border: none; border-radius: 12px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 15px; font-weight: 700; cursor: pointer; margin-top: 8px;
  transition: opacity 0.15s, transform 0.1s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  &:hover:not(:disabled) { opacity: 0.9; }
  &:active:not(:disabled) { transform: scale(0.99); }
  &:disabled { opacity: 0.55; cursor: not-allowed; }
`;

const BackBtn = styled.button`
  background: none; border: none; color: #6d28d9;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px; font-weight: 600; cursor: pointer;
  padding: 0; margin-bottom: 20px;
  display: flex; align-items: center; gap: 5px;
  &:hover { color: #5b21b6; }
`;

const DevBadge = styled.div`
  margin-top: 12px; padding: 10px 14px;
  background: #fefce8; border: 1px solid #fde047;
  border-radius: 10px; font-size: 13px; color: #713f12;
  display: flex; align-items: center; gap: 8px; cursor: pointer;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  strong { font-weight: 700; letter-spacing: 0.1em; }
`;

const Divider = styled.div`
  display: flex; align-items: center; gap: 10px;
  margin: 18px 0; color: #94a3b8; font-size: 12px;
  font-family: 'Public Sans', sans-serif;
  &::before, &::after { content: ""; flex: 1; height: 1px; background: #e2e8f0; }
`;

const ResendBtn = styled.button`
  width: 100%; background: none;
  border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 11px;
  cursor: pointer; font-family: 'Public Sans', sans-serif;
  font-size: 14px; color: #64748b; font-weight: 600;
  transition: border-color 0.15s, color 0.15s;
  &:hover:not(:disabled) { border-color: #6d28d9; color: #6d28d9; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
`;

const PoweredBy = styled.p`
  text-align: center; font-family: 'Public Sans', sans-serif;
  font-size: 12px; color: #94a3b8; margin-top: 22px;
`;

const Spinner = styled.span`
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: #fff; border-radius: 50%;
  animation: ${spin} 0.7s linear infinite; display: inline-block;
`;

// ─── Constants ────────────────────────────────────────────────────────────────

const LOGO_SVG = (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="30" height="30">
    <path d="M183.4 61.1 A92 92 0 1 0 183.4 138.9 L145.3 121.1 A50 50 0 1 1 145.3 78.9 Z" fill="#0050B0" />
    <path d="M14 132 q14 -26 52 -26 l46 0 q-2 28 -34 32 q-38 4 -64 -6 Z" fill="#65A147" />
  </svg>
);

const REDIRECT: Record<string, string> = {
  SUPERADMIN: "/admin/dashboard",
  ADMIN:      "/admin/dashboard",
  PARTNER:    "/partner/dashboard",
  MEMBER:     "/member/dashboard",
};

const FEATURES = [
  { title: "AI-powered policy extraction",  desc: "Extract data accurately, instantly" },
  { title: "Partner & member portals",      desc: "Self-service for all stakeholders" },
  { title: "Real-time claims assistance",   desc: "Track, update and resolve in real-time" },
];

const STATS = [
  { value: "10,000+", label: "Claims",     icon: Shield },
  { value: "99.9%",   label: "Uptime",     icon: Activity },
  { value: "24/7",    label: "AI Support", icon: Headphones },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [step, setStep]       = useState<"email" | "otp">("email");
  const [email, setEmail]     = useState("");
  const [otp, setOtp]         = useState("");
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp]   = useState<string | null>(null);

  const { setAuth } = useAuthStore();
  const router = useRouter();

  const getNextPath = () => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("next");
  };

  const handleSendOtp = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return toast.error("Please enter your email");
    setLoading(true); setDevOtp(null);
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
    } finally { setLoading(false); }
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
      const nextPath = getNextPath();
      const allowedNext =
        nextPath &&
        (((userType === "SUPERADMIN" || userType === "ADMIN") && nextPath.startsWith("/admin")) ||
         (userType === "PARTNER"    && nextPath.startsWith("/partner")) ||
         (userType === "MEMBER"     && (nextPath.startsWith("/member") || nextPath === "/upload")))
          ? nextPath : null;
      router.push(allowedNext || REDIRECT[userType] || "/member/dashboard");
    } catch (err: unknown) {
      toast.error(getApiError(err, "Invalid or expired OTP"));
    } finally { setLoading(false); }
  };

  return (
    <Root>
      {/* ── Left Brand Panel ─────────────────────────────────── */}
      <BrandPanel>
        <HeroBg>
          <Image
            src="/hero-illustration.png"
            alt=""
            fill
            sizes="(max-width: 900px) 0px, 52vw"
            style={{ objectFit: "contain" }}
            priority
          />
        </HeroBg>
        <LeftFade />

        {/* Text column */}
        <TextCol>
          <LogoRow>
            <LogoBox>{LOGO_SVG}</LogoBox>
            <div>
              <BrandName>Easy Claims</BrandName>
              <BrandSub>Seamless &amp; Convenience</BrandSub>
            </div>
          </LogoRow>

          <HeroAccent>AI-Powered.</HeroAccent>
          <HeroWhite>Human-Focused.</HeroWhite>
          <HeroSub>
            Built for insurers, by innovators. Streamline claims, delight members and drive better outcomes.
          </HeroSub>

          <Features>
            {FEATURES.map(f => (
              <Feature key={f.title}>
                <FeatureIcon>
                  <CheckCircle2 size={15} color="#4ade80" />
                </FeatureIcon>
                <div>
                  <FeatureTitle>{f.title}</FeatureTitle>
                  <FeatureDesc>{f.desc}</FeatureDesc>
                </div>
              </Feature>
            ))}
          </Features>

          <div style={{ marginTop: "auto" }}>
            <PanelDivider />
            <StatsTrustLabel>Trusted by leading insurers &amp; providers</StatsTrustLabel>
            <StatsGrid>
              {STATS.map((s, i) => (
                <StatItem key={i}>
                  <s.icon size={14} color="#4ade80" style={{ marginBottom: 5 }} />
                  <StatValue>{s.value}</StatValue>
                  <StatLabel>{s.label}</StatLabel>
                </StatItem>
              ))}
            </StatsGrid>
            <Copyright>© 2024 Easy Claims CRM. All rights reserved.</Copyright>
          </div>
        </TextCol>

      </BrandPanel>

      {/* ── Right Form Panel ─────────────────────────────────── */}
      <FormPanel>
        <BlobTopRight />
        <BlobBottomLeft />
        <BlobBottomRight />
        <BlobLeftConnect />
        <DotGrid />

        {/* Mobile header */}
        <MobileHeader>
          <LogoBox style={{ width: 38, height: 38, padding: 6 }}>
            {LOGO_SVG}
          </LogoBox>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 16, color: "#fff" }}>Easy Claims</div>
            <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "#4ade80", fontWeight: 700 }}>Seamless &amp; Convenience</div>
          </div>
        </MobileHeader>

        <FormCard>
          <CardLogoWrap>
            <CardLogoCircle>{LOGO_SVG}</CardLogoCircle>
          </CardLogoWrap>

          {step === "email" ? (
            <>
              <CardHeading>Welcome back</CardHeading>
              <CardSub>Enter your email to receive a one-time sign-in code.</CardSub>

              <FieldGroup>
                <FieldLabel htmlFor="ec-email">Email address</FieldLabel>
                <InputWrap>
                  <InputIcon><Mail size={15} /></InputIcon>
                  <InputText
                    id="ec-email" type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSendOtp()}
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
                We sent a 6-digit OTP to <strong style={{ color: "#0f172a" }}>{email}</strong>
              </CardSub>

              <FieldGroup>
                <FieldLabel htmlFor="ec-otp">One-time password</FieldLabel>
                <OtpInputWrap>
                  <InputText
                    id="ec-otp" value={otp}
                    onChange={e => setOtp(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleVerifyOtp()}
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
