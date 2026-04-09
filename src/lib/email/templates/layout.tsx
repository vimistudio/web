import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

const BRAND = {
  primary: "#909AF7",
  primaryDark: "#7b85e8",
  dark: "#0a0b14",
  light: "#fbfafa",
  muted: "#6B6F99",
  mutedLight: "#9ca3af",
  border: "#e5e7eb",
  white: "#ffffff",
};

interface EmailLayoutProps {
  previewText: string;
  children: React.ReactNode;
  ctaUrl?: string;
  ctaLabel?: string;
}

export function EmailLayout({
  previewText,
  children,
  ctaUrl,
  ctaLabel,
}: EmailLayoutProps) {
  return (
    <Html>
      <Head>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');`}</style>
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src="https://vimistudio.com/logo-vimi.png"
              alt="Vimi Studio"
              width="120"
              height="39"
              style={logo}
            />
          </Section>

          {/* Content */}
          <Section style={content}>{children}</Section>

          {/* CTA */}
          {ctaUrl && ctaLabel && (
            <Section style={ctaSection}>
              <Button style={ctaButton} href={ctaUrl}>
                {ctaLabel}
              </Button>
            </Section>
          )}

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              <Link href="https://vimistudio.com" style={footerLink}>
                Vimi Studio
              </Link>{" "}
              · Design partnership for brands that move fast
            </Text>
            <Text style={footerMuted}>
              You received this because you&apos;re part of a Vimi Studio
              project. Visit your portal at vimistudio.com to manage your
              notification preferences.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily: "'Inter', Arial, Helvetica, sans-serif",
  margin: 0,
  padding: 0,
};

const container: React.CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: BRAND.white,
  borderRadius: "12px",
  overflow: "hidden",
  marginTop: "32px",
  marginBottom: "32px",
};

const header: React.CSSProperties = {
  backgroundColor: BRAND.dark,
  padding: "20px 32px",
};

const logo: React.CSSProperties = {
  width: "120px",
  height: "39px",
  maxWidth: "120px",
};

const content: React.CSSProperties = {
  padding: "32px",
};

const ctaSection: React.CSSProperties = {
  padding: "0 32px 32px",
  textAlign: "center" as const,
};

const ctaButton: React.CSSProperties = {
  backgroundColor: BRAND.primary,
  color: BRAND.white,
  fontSize: "14px",
  fontWeight: 600,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
  borderRadius: "8px",
};

const hr: React.CSSProperties = {
  borderColor: BRAND.border,
  margin: "0 32px",
};

const footer: React.CSSProperties = {
  padding: "24px 32px",
};

const footerText: React.CSSProperties = {
  fontSize: "13px",
  color: BRAND.muted,
  lineHeight: "20px",
  margin: "0 0 8px",
};

const footerLink: React.CSSProperties = {
  color: BRAND.primary,
  textDecoration: "none",
};

const footerMuted: React.CSSProperties = {
  fontSize: "11px",
  color: BRAND.mutedLight,
  lineHeight: "16px",
  margin: 0,
};

export { BRAND };
export { Heading, Text, Section, Link, Hr };
