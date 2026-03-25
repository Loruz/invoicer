import { getAuthenticatedUser } from "@/lib/auth";
import { SettingsForm } from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const user = await getAuthenticatedUser();
  return <SettingsForm user={user} />;
}
