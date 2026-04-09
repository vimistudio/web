import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY || "");
  }
  return _resend;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  react: React.ReactElement;
}

export async function sendEmail(
  options: SendEmailOptions
): Promise<{ success: boolean; id?: string; error?: string }> {
  const safeMode =
    process.env.EMAIL_SAFE_MODE !== "false"; // defaults to true if unset

  let recipient = options.to;
  let subject = options.subject;

  if (safeMode) {
    const safeRecipients = process.env.EMAIL_SAFE_RECIPIENTS?.trim();
    if (!safeRecipients) {
      console.warn(
        "[email] Safe mode active but EMAIL_SAFE_RECIPIENTS is empty. No email sent."
      );
      return { success: false, error: "Safe mode: no recipients configured" };
    }
    subject = `[TEST: ${options.to}] ${options.subject}`;
    recipient = safeRecipients.split(",")[0].trim();
    console.log(
      `[email] Safe mode: redirecting from ${options.to} to ${recipient}`
    );
  }

  const from = process.env.EMAIL_FROM || "Vimi Studio <onboarding@resend.dev>";

  try {
    const { data, error } = await getResend().emails.send({
      from,
      to: recipient,
      subject,
      react: options.react,
    });

    if (error) {
      console.error("[email] Resend error:", error);
      return { success: false, error: error.message };
    }

    console.log(`[email] Sent to ${recipient} (id: ${data?.id})`);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error("[email] Unexpected error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
