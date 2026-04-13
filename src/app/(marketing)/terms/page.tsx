import type { Metadata } from "next";
import { LegalPage } from "../legal/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service — Vimi Studio",
  description:
    "The terms governing your use of the Vimi Studio client portal and design services.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="April 13, 2026">
      <p>
        These terms govern your use of the Vimi Studio client portal at{" "}
        <a href="https://vimistudio.com">vimistudio.com</a> and the design
        services we deliver through it. By signing in to the portal you accept
        these terms.
      </p>

      <p>
        We&apos;ve kept this short and plain. The full commercial terms of any
        engagement (scope, deliverables, payment) are covered in the separate
        retainer or project agreement we sign with each client.
      </p>

      <h2>The service</h2>

      <p>
        Vimi Studio is a design partnership. The portal is the workspace where
        we present design directions, deliver final files, and collaborate on
        feedback with you. The portal itself is provided as part of an active
        client engagement.
      </p>

      <h2>Your account</h2>

      <ul>
        <li>
          You sign in with a Google account whose email has been pre-approved
          by your designer.
        </li>
        <li>
          You&apos;re responsible for keeping your Google account secure.
          Anything done through your account is treated as done by you.
        </li>
        <li>
          If a teammate needs access, ask your designer to invite them. Please
          don&apos;t share login credentials.
        </li>
      </ul>

      <h2>Acceptable use</h2>

      <p>You agree not to:</p>

      <ul>
        <li>
          Use the portal to upload anything illegal, harmful, or that infringes
          someone else&apos;s rights.
        </li>
        <li>
          Attempt to access another client&apos;s data, probe the system for
          vulnerabilities, or interfere with other users.
        </li>
        <li>
          Reverse-engineer or copy the portal software for use outside our
          engagement.
        </li>
      </ul>

      <p>
        We may suspend access if these terms are seriously broken. We&apos;ll
        always tell you why first.
      </p>

      <h2>Ownership of design work</h2>

      <p>
        On full payment of fees for a given deliverable, full intellectual
        property rights in that deliverable transfer to you. Vimi Studio
        retains the right to display the work in our portfolio and case
        studies unless otherwise agreed.
      </p>

      <p>
        Working files (source files, layered designs, exploration directions
        not selected) are released on request as part of standard engagements
        unless the project agreement says otherwise.
      </p>

      <h2>Your content</h2>

      <p>
        You retain ownership of everything you upload to the portal — brand
        assets, references, brief documents, comments. You grant Vimi Studio a
        limited licence to use this content solely to deliver the design work
        you&apos;ve engaged us for.
      </p>

      <h2>Fees and payment</h2>

      <p>
        Fees, payment terms, and engagement structure are governed by the
        separate retainer or project agreement between you and Vimi Studio.
        Use of the portal does not change those terms.
      </p>

      <h2>Service availability</h2>

      <p>
        We aim for high availability but the portal is provided{" "}
        &ldquo;as available&rdquo;. We don&apos;t guarantee uninterrupted
        service. Planned maintenance will be communicated in advance when
        possible. If something goes wrong, email us — we move fast.
      </p>

      <h2>Limitation of liability</h2>

      <p>
        To the maximum extent allowed by law, Vimi Studio is not liable for
        indirect, incidental, or consequential damages arising from use of the
        portal. Our total liability under these terms is limited to the fees
        paid by you in the 3 months preceding the claim.
      </p>

      <p>
        Nothing in these terms limits liability for things that can&apos;t be
        excluded by law (such as fraud or gross negligence).
      </p>

      <h2>Termination</h2>

      <p>
        Either party may end the client engagement under the terms of the
        retainer agreement. When the engagement ends, you can ask us to export
        your project files; we&apos;ll do that within 14 days. Your portal
        access is removed when the engagement ends, but your data is retained
        per the <a href="/privacy">Privacy Policy</a> until you request
        deletion or the archive period elapses.
      </p>

      <h2>Changes to these terms</h2>

      <p>
        We may update these terms over time. The &ldquo;Last updated&rdquo;
        date at the top reflects the most recent change. For material changes
        we&apos;ll email active clients at least 14 days before they take
        effect. Continued use of the portal after that means you accept the
        update.
      </p>

      <h2>Contact</h2>

      <p>
        For any question about these terms, write to{" "}
        <a href="mailto:hello@vimistudio.com">hello@vimistudio.com</a>.
      </p>
    </LegalPage>
  );
}
