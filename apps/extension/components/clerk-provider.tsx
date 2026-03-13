import { ClerkProvider } from "@clerk/chrome-extension";

const PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";
const SYNC_HOST =
  import.meta.env.VITE_CLERK_SYNC_HOST || "http://localhost";
const APP_URL =
  import.meta.env.VITE_APP_URL || "http://localhost:3000";

export function ExtensionClerkProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      syncHost={SYNC_HOST}
      signOutUrl={APP_URL}
    >
      {children}
    </ClerkProvider>
  );
}
