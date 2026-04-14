import { useState } from "react";
import { useAuth, useSignIn } from "@clerk/clerk-react";
import { Mail, KeyRound, Loader2, Eye, EyeOff } from "lucide-react";
import Kitchen from "./pages/Kitchen";

export default function App() {
  const { isLoaded, isSignedIn } = useAuth();
  const { signIn, setActive } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) return;

    setLoading(true);
    setError("");

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive!({ session: result.createdSessionId });
      } else {
        setError("Error al iniciar sesión. Intenta de nuevo.");
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.message || "Credenciales incorrectas.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: "linear-gradient(to bottom right, #0a8b9b, #153f43)",
        }}
      >
        <div className="w-8 h-8 border-4 border-white/20 border-t-white/80 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div
        className="min-h-screen flex flex-col justify-center items-center px-6"
        style={{
          background: "linear-gradient(to bottom right, #0a8b9b, #153f43)",
        }}
      >
        <div className="w-full max-w-sm flex flex-col items-center">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <img
              src="/logo-short-green.webp"
              alt="Xquisito"
              className="w-16 h-16"
            />
            <h1 className="text-white text-2xl font-semibold">Xquisito Crew</h1>
            <p className="text-white/50 text-sm">
              Inicia sesión para continuar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Email"
                autoComplete="username email"
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent"
              />
            </div>

            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Contraseña"
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent [&::-ms-reveal]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && <p className="text-rose-400 text-sm px-1">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full py-3 rounded-full text-white font-medium transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              style={{
                background: "linear-gradient(to right, #0a7a88, #0f2f34)",
              }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Entrando..." : "Iniciar sesión"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <Kitchen />;
}
