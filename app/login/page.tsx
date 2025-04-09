"use client";

import { useState } from "react";
import { signInWithPopup, GoogleAuthProvider, AuthError } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [error, setError] = useState<string>("");
  const router = useRouter();

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push("/");
    } catch (error) {
      const authError = error as AuthError;
      setError(authError.message);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <h1 className="text-2xl font-bold mb-6">ログイン</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="w-full items-center justify-center flex">
        <button
          onClick={handleGoogleLogin}
          className="w-full max-w-md bg-blue-500 hover:bg-blue-600 text-white font-bold rounded  border-none focus:outline-none transition duration-200 ease-in-out px-4 py-2 mx-4"
        >
          <span>Googleでログイン</span>
        </button>
      </div>
    </div>
  );
}
