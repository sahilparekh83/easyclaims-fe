"use client";

import React, { useState, useRef, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { useMutation } from "@tanstack/react-query";
import { memberUploadPolicy } from "@/imports/core/api";
import { getApiError } from "@/imports/core/errors";
import { useAuthStore } from "@/stores/AuthStore";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CheckCircle2, Upload, FileText } from "lucide-react";
import Cookies from "js-cookie";

// ─── Styled ───────────────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Root = styled.div`
  min-height: 100vh;
  background: #f7f9fb;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 36px;
`;

const LogoBox = styled.div`
  width: 44px; height: 44px;
  border-radius: 10px;
  background: #0a2a57;
  display: flex; align-items: center; justify-content: center;
  padding: 8px; flex-shrink: 0;
`;

const BrandName = styled.div`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 800; font-size: 20px; color: #0a2a57;
`;

const BrandSub = styled.div`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 10px; letter-spacing: 0.14em;
  text-transform: uppercase; color: #65a147; font-weight: 700;
`;

const Card = styled.div`
  width: 100%; max-width: 460px;
  background: #fff;
  border-radius: 18px;
  padding: 40px 36px;
  box-shadow: 0 4px 24px rgba(10,42,87,0.1);
  animation: ${fadeUp} 0.3s ease;
`;

const CardTitle = styled.h1`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 20px; font-weight: 800; color: #161d26;
  margin-bottom: 6px;
`;

const CardSub = styled.p`
  font-family: 'Public Sans', sans-serif;
  font-size: 14px; color: #6b7a8c;
  margin-bottom: 28px; line-height: 1.5;
`;

const FieldLabel = styled.label`
  display: block;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px; font-weight: 600; color: #3a4756;
  margin-bottom: 6px;
`;

const Dropzone = styled.div<{ $active: boolean; $hasFile: boolean }>`
  border: 2px dashed ${p => p.$active ? "#0050b0" : p.$hasFile ? "#65a147" : "#b0c8e8"};
  border-radius: 12px;
  padding: 32px 20px;
  text-align: center;
  cursor: pointer;
  background: ${p => p.$active ? "#eff6ff" : p.$hasFile ? "#f0fdf4" : "#f7f9fb"};
  transition: all 0.15s;
  margin-bottom: 20px;
`;

const DropzoneIcon = styled.div`color: #6b7a8c; margin-bottom: 10px;`;

const DropzoneText = styled.p`
  font-family: 'Public Sans', sans-serif;
  font-size: 14px; color: #6b7a8c; margin: 0;
`;

const FileName = styled.p`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 13px; color: #0050b0; margin-top: 8px; font-weight: 600;
`;

const SubmitBtn = styled.button`
  width: 100%; height: 46px;
  background: #0050b0; color: #fff;
  border: none; border-radius: 10px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 15px; font-weight: 600;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: background 0.15s;
  &:hover:not(:disabled) { background: #0046a0; }
  &:disabled { opacity: 0.55; cursor: not-allowed; }
`;

const spin = keyframes`from{transform:rotate(0deg)}to{transform:rotate(360deg)}`;
const Spinner = styled.span`
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
`;

const SuccessCard = styled.div`
  width: 100%; max-width: 460px;
  background: #fff;
  border-radius: 18px;
  padding: 48px 36px;
  box-shadow: 0 4px 24px rgba(10,42,87,0.1);
  text-align: center;
  animation: ${fadeUp} 0.3s ease;
`;

const SuccessTitle = styled.h2`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 20px; font-weight: 800; color: #161d26;
  margin: 16px 0 8px;
`;

const SuccessText = styled.p`
  font-family: 'Public Sans', sans-serif;
  font-size: 14px; color: #6b7a8c; line-height: 1.6;
`;

const NotMemberBox = styled.div`
  width: 100%; max-width: 460px;
  background: #fff; border-radius: 18px;
  padding: 40px 36px; text-align: center;
  box-shadow: 0 4px 24px rgba(10,42,87,0.1);
  font-family: 'Public Sans', sans-serif;
  color: #6b7a8c; font-size: 14px; line-height: 1.6;
`;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UploadPage() {
  const { isAuthenticated, userType, restoreFromCookie } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    restoreFromCookie();
    setHydrated(true);
  }, [restoreFromCookie]);

  const router = useRouter();

  const uploadMutation = useMutation({
    mutationFn: (fd: FormData) => memberUploadPolicy(fd),
    onSuccess: () => {
      setUploaded(true);
      setTimeout(() => router.push("/member/dashboard"), 3000);
    },
    onError: (err: unknown) => toast.error(getApiError(err, "Upload failed. Please try again.")),
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/pdf") setSelectedFile(file);
    else toast.error("Please upload a PDF file.");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
    e.target.value = "";
  };

  const handleSubmit = () => {
    if (!selectedFile) { toast.error("Please select a PDF file."); return; }
    const fd = new FormData();
    fd.append("file", selectedFile);
    uploadMutation.mutate(fd);
  };

  const Logo = () => (
    <Header>
      <LogoBox>
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
          <path d="M183.4 61.1 A92 92 0 1 0 183.4 138.9 L145.3 121.1 A50 50 0 1 1 145.3 78.9 Z" fill="#fff" />
          <path d="M14 132 q14 -26 52 -26 l46 0 q-2 28 -34 32 q-38 4 -64 -6 Z" fill="#65A147" />
        </svg>
      </LogoBox>
      <div>
        <BrandName>Easy Claims</BrandName>
        <BrandSub>Seamless &amp; Convenient</BrandSub>
      </div>
    </Header>
  );

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/login?next=/upload");
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || !isAuthenticated) return null;

  if (userType !== "MEMBER") {
    return (
      <Root>
        <Logo />
        <NotMemberBox>
          <FileText size={40} color="#b0c8e8" style={{ marginBottom: 12 }} />
          <p style={{ fontWeight: 700, color: "#161d26", fontSize: 16 }}>This page is for members only.</p>
          <p>Please ask your member to open this link from their device.</p>
        </NotMemberBox>
      </Root>
    );
  }

  if (uploaded) {
    return (
      <Root>
        <Logo />
        <SuccessCard>
          <CheckCircle2 size={52} color="#65a147" />
          <SuccessTitle>Document Submitted!</SuccessTitle>
          <SuccessText>
            Your policy document has been uploaded successfully.<br />
            We will verify it within 24 hours and notify you on WhatsApp and Email.<br /><br />
            <span style={{ fontSize: 12, color: "#94a3b8" }}>Redirecting to dashboard in 3 seconds…</span>
          </SuccessText>
        </SuccessCard>
      </Root>
    );
  }

  return (
    <Root>
      <Logo />
      <Card>
        <CardTitle>Upload Policy Document</CardTitle>
        <CardSub>Upload your insurance policy PDF. Our AI will detect the policy type and extract the details automatically.</CardSub>

        <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={handleFileChange} />

        <FieldLabel>Policy Document (PDF) *</FieldLabel>
        <Dropzone
          $active={dropActive}
          $hasFile={!!selectedFile}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDropActive(true); }}
          onDragLeave={() => setDropActive(false)}
          onDrop={handleDrop}
        >
          <DropzoneIcon>
            {selectedFile ? <CheckCircle2 size={32} color="#65a147" /> : <Upload size={32} color="#b0c8e8" />}
          </DropzoneIcon>
          {selectedFile
            ? <FileName>{selectedFile.name}</FileName>
            : <>
                <DropzoneText>Drag & drop your PDF here</DropzoneText>
                <DropzoneText style={{ fontSize: 12, marginTop: 4 }}>or click to browse</DropzoneText>
              </>
          }
        </Dropzone>

        <SubmitBtn onClick={handleSubmit} disabled={uploadMutation.isPending}>
          {uploadMutation.isPending ? <Spinner /> : <><Upload size={15} /> Submit Document</>}
        </SubmitBtn>
      </Card>
    </Root>
  );
}
