import { ExtensionClerkProvider } from "../../components/clerk-provider";
import { AuthGuard } from "../../components/auth-guard";

export default function App() {
  return (
    <ExtensionClerkProvider>
      <div className="w-[360px] min-h-[400px] bg-white">
        <AuthGuard />
      </div>
    </ExtensionClerkProvider>
  );
}
