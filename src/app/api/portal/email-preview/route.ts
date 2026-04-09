import { NextResponse } from "next/server";
import { render } from "@react-email/components";
import { CommentAddedEmail } from "@/lib/email/templates/comment";
import { StatusChangedEmail } from "@/lib/email/templates/status";
import { DeliverableUploadedEmail } from "@/lib/email/templates/deliverable";
import { InviteEmail } from "@/lib/email/templates/invite";

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Dev only" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const template = searchParams.get("template") || "comment";

  let element: React.ReactElement;

  switch (template) {
    case "comment":
      element = CommentAddedEmail(CommentAddedEmail.PreviewProps);
      break;
    case "status":
      element = StatusChangedEmail(StatusChangedEmail.PreviewProps);
      break;
    case "deliverable":
      element = DeliverableUploadedEmail(DeliverableUploadedEmail.PreviewProps);
      break;
    case "invite":
      element = InviteEmail(InviteEmail.PreviewProps);
      break;
    default:
      return NextResponse.json(
        { error: `Unknown template: ${template}. Use: comment, status, deliverable, invite` },
        { status: 400 }
      );
  }

  const html = await render(element);

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
