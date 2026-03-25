import { getAuthenticatedUser } from "@/lib/auth";
import { TemplateEditor } from "@/components/settings/template-editor";

export default async function InvoiceTemplatePage() {
  const user = await getAuthenticatedUser();
  return <TemplateEditor user={user} />;
}
