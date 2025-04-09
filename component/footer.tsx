"use client";
import React, { useEffect, useRef } from "react";

const Footer: React.FC = () => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // テキストエリアの高さを自動調整する関数
  const adjustHeight = (): void => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(64, textarea.scrollHeight)}px`;
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      adjustHeight();
      textarea.addEventListener("input", adjustHeight);
      return () => textarea.removeEventListener("input", adjustHeight);
    }
  }, []);

  return (
    <div className="border-t border-gray-300 p-2 fixed bottom-0 w-full bg-white">
      <textarea
        ref={textareaRef}
        placeholder="メッセージを入力"
        className="w-full border-none outline-none p-2 resize-none rounded"
        rows={2}
        onChange={adjustHeight}
      />
    </div>
  );
};

export default Footer;
