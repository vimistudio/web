import type { Metadata } from "next";
import { LegalPage } from "../legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy — Vimi Studio",
  description:
    "How Vimi Studio collects, uses, and protects your data when you use our design portal.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="April 13, 2026">
      <p>
        Vimi Studio (&ldquo;Vimi&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;)
        operates the client portal at{" "}
        <a href="https://vimistudio.com">vimistudio.com</a>. This page explains,
        in plain language, what data we collect when you use the portal, how we
        use it, and your rights over it.
      </p>

      <p>
        We try to keep this short and honest. If anything is unclear, email us
        at <a href="mailto:hello@vimistudio.com">hello@vimistudio.com</a> and
        we&apos;ll explain.
      </p>

      <h2>What we collect</h2>

      <h3>Account information</h3>
      <p>
        When you sign in with Google, we receive your name, email address, and
        profile picture from Google. We store these in our database to identify
        you, display your name on comments, and contact you about your projects.
      </p>

      <h3>Project content</h3>
      <p>
        When you use the portal, we store the design requests you create, the
        comments you write, the reference images you upload, and the design
        files we deliver to you. This is the content of the service itself.
      </p>

      <h3>Activity data</h3>
      <p>
        We log basic activity — when you view a deliverable, leave a comment,
        approve a design, or change a request status. This helps us improve the
        service and helps your designer understand which work you&apos;ve
        already reviewed.
      </p>

      <h3>What we don&apos;t collect</h3>
      <ul>
        <li>We don&apos;t use third-party analytics or behavioural tracking.</li>
        <li>We don&apos;t sell your data to anyone, ever.</li>
        <li>We don&apos;t serve ads.</li>
      </ul>

      <h2>How we use it</h2>

      <ul>
        <li>
          <strong>To run the service:</strong> show you your projects, deliver
          designs, send notifications when something needs your attention.
        </li>
        <li>
          <strong>To communicate with you:</strong> email you about your
          requests, status changes, and account.
        </li>
        <li>
          <strong>To improve the portal:</strong> understand which features get
          used and which don&apos;t.
        </li>
      </ul>

      <h2>Who we share it with</h2>

      <p>
        We use a small number of trusted service providers to operate the
        portal. They process data on our behalf, under contract, and only for
        the purpose of running the service:
      </p>

      <ul>
        <li>
          <strong>Supabase</strong> — database, authentication, file storage
        </li>
        <li>
          <strong>Vercel</strong> — application hosting
        </li>
        <li>
          <strong>Resend</strong> — transactional email delivery
        </li>
        <li>
          <strong>Google</strong> — sign-in (we receive only what you authorize
          when signing in)
        </li>
      </ul>

      <p>
        We do not share your data with any other third party except when
        required by law.
      </p>

      <h2>Where it&apos;s stored</h2>

      <p>
        Your data is stored on infrastructure managed by Supabase and Vercel,
        which use data centres in the United States and the European Union.
        Files are stored in Supabase Storage with row-level security: only you,
        members of your client team, and your designer can access your project
        files.
      </p>

      <h2>How long we keep it</h2>

      <p>
        We keep your project data for as long as your client engagement is
        active, plus a reasonable archive period afterwards (typically 12
        months) so we can hand you back files if you ask. After that, we delete
        it.
      </p>

      <p>
        You can request deletion of all your data at any time by emailing{" "}
        <a href="mailto:hello@vimistudio.com">hello@vimistudio.com</a>. We will
        confirm and complete the deletion within 30 days.
      </p>

      <h2>Your rights</h2>

      <ul>
        <li>
          <strong>Access:</strong> request a copy of the data we hold about you.
        </li>
        <li>
          <strong>Correction:</strong> ask us to fix anything that&apos;s wrong.
        </li>
        <li>
          <strong>Deletion:</strong> ask us to delete your data.
        </li>
        <li>
          <strong>Export:</strong> ask us to export your project files in a
          portable format.
        </li>
      </ul>

      <p>
        Email <a href="mailto:hello@vimistudio.com">hello@vimistudio.com</a> for
        any of the above. We&apos;ll respond within 7 days.
      </p>

      <h2>Cookies</h2>

      <p>
        We use a small number of essential cookies to keep you signed in and to
        remember your interface preferences (like language). We do not use
        tracking, advertising, or third-party analytics cookies.
      </p>

      <h2>Children</h2>

      <p>
        Vimi Studio is a B2B service for design clients. The portal is not
        intended for or directed at children under 16. If you believe a minor
        has created an account, please contact us and we will remove it.
      </p>

      <h2>Changes to this policy</h2>

      <p>
        We&apos;ll update this page when our practices change. The
        &ldquo;Last updated&rdquo; date at the top reflects the most recent
        change. For material changes, we&apos;ll email active clients before
        the change takes effect.
      </p>
    </LegalPage>
  );
}
