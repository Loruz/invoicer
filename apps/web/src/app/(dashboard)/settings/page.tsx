import { getAuthenticatedUser } from "@/lib/auth";
import { SettingsForm } from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const user = await getAuthenticatedUser();
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <SettingsForm user={user} />
    </div>
  );
}
