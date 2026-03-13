export function SignInView() {
  const appUrl =
    import.meta.env.VITE_APP_URL || "http://localhost:3000";

  return (
    <div className="flex flex-col items-center justify-center h-[400px] p-6 text-center">
      <h2 className="text-xl font-bold mb-2">Invoicer</h2>
      <p className="text-gray-600 mb-4">
        Sign in on the web app to use the extension.
      </p>
      <a
        href={`${appUrl}/sign-in`}
        target="_blank"
        rel="noreferrer"
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
      >
        Open Web App
      </a>
    </div>
  );
}
