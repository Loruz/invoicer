import { useAuth } from "@clerk/chrome-extension";
import { TimerView } from "./timer-view";
import { SignInView } from "./sign-in-view";

export function AuthGuard() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return isSignedIn ? <TimerView /> : <SignInView />;
}
