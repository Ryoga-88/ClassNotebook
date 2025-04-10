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
    <div className="flex flex-col md:flex-row h-screen">
      <div className="w-full md:w-1/2 h-1/2 md:h-full bg-sky-700 flex items-center justify-start px-16">
        <div>
          <h1 className="text-3xl md:text-5xl font-bold md:font-extrabold text-white mb-2">
            Class Notebook
          </h1>
          <h3 className="text-xl md:text-2xl font-semibold text-white mb-4">
            一緒に考えれば、もっと解ける。
          </h3>
          <p className="text-lg text-white opacity-75 md:block hidden">
            <strong>Class Notebook</strong>
            は、学生同士が課題を出し合い、互いに知識を共有しながら最適な解決策を導く学習支援ツールです。
          </p>
          <p className="text-lg text-white opacity-75 mt-4">
            一緒に考えれば、もっと解ける。協力することで深まる理解と、新たな発見を提供します。
          </p>
        </div>
      </div>
      <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col items-center justify-center p-12">
        <h1 className="text-2xl font-bold mb-6">ログイン</h1>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="w-full items-center justify-center flex">
          <button
            onClick={handleGoogleLogin}
            className="w-full max-w-md bg-sky-600 hover:bg-sky-700 text-white font-bold rounded  border-none focus:outline-none transition duration-200 ease-in-out px-4 py-2 mx-4"
          >
            <span>Googleでログイン</span>
          </button>
        </div>
      </div>
    </div>
  );
}
