import { useAuth, SignIn } from "@clerk/clerk-react";
import Kitchen from "./pages/Kitchen";

export default function App() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Xquisito Crew
          </h1>
          <SignIn routing="hash" />
        </div>
      </div>
    );
  }

  return <Kitchen />;
}
