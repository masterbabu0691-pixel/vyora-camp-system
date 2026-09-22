"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (res?.ok) {
      router.push("/dashboard");
    } else {
      setError("Invalid username or password.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-10 rounded-xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-[#002642] tracking-tight">Vyora</h1>
          <p className="text-sm font-bold text-[#008C8C] uppercase tracking-widest mt-1">Camp System</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm font-bold text-center mb-6">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
            <input 
              required type="text" 
              className="w-full border-2 border-gray-200 p-3 rounded-md focus:border-[#008C8C] outline-none transition font-semibold" 
              value={username} onChange={e => setUsername(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
            <input 
              required type="password" 
              className="w-full border-2 border-gray-200 p-3 rounded-md focus:border-[#008C8C] outline-none transition font-semibold" 
              value={password} onChange={e => setPassword(e.target.value)} 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#008C8C] text-white py-3 rounded-md font-bold text-lg hover:bg-[#006b6b] transition disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}