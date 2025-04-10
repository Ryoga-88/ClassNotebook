"use client";
import React, { useEffect, useRef, KeyboardEvent } from "react";
import { Send } from "lucide-react";

interface FooterProps {
  isOpen: boolean;
  message: string;
  setMessage: (message: string) => void;
  sendMessage: (e?: React.FormEvent) => void;
  isRoomSelected: boolean;
}

const Footer: React.FC<FooterProps> = ({
  isOpen,
  message,
  setMessage,
  sendMessage,
  isRoomSelected,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // テキストエリアの高さを自動調整する関数
  const adjustHeight = (): void => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(
      120,
      Math.max(64, textarea.scrollHeight)
    )}px`;
  };

  // Enterキーで送信、Shift+Enterで改行
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      adjustHeight();
      textarea.addEventListener("input", adjustHeight);
      return () => textarea.removeEventListener("input", adjustHeight);
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [message]);

  if (!isRoomSelected) {
    return (
      <div className="border-t border-gray-300 p-2 fixed bottom-0 w-dvw bg-white">
        <p className="items-center justify-center text-gray-500 overflow-scroll">
          ルームを選択するとメッセージを送信できます
        </p>
      </div>
    );
  }

  return (
    <div
      className={`border-t border-gray-300 p-3 fixed bottom-0 ${
        isOpen ? "md:w-3/4 w-1/2 right-0" : "w-dvw"
      } bg-white transition-all duration-300`}
    >
      <form
        onSubmit={sendMessage}
        className="flex items-center gap-2 justify-center"
      >
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力"
          className="flex-grow border border-none rounded-lg p-1 resize-none overflow-hidden focus:outline-none focus:border-none"
          style={{ minHeight: "64px" }}
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className={`p-3 rounded-full ${
            message.trim()
              ? "bg-blue-500 hover:bg-blue-600 text-white"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default Footer;
