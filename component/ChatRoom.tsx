"use client";
import { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

interface Message {
  id: string;
  text: string;
  createdAt: Date;
  userId: string;
  displayName: string;
}

interface ChatRoomContentProps {
  roomId: string;
  userId: string;
}

export default function ChatRoomContent({
  roomId,
  userId,
}: ChatRoomContentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef<number>(0);

  // メッセージを読み込む
  useEffect(() => {
    const q = query(
      collection(db, `chatRooms/${roomId}/messages`),
      orderBy("createdAt", "asc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const loadedMessages: Message[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        loadedMessages.push({
          id: doc.id,
          text: data.text,
          createdAt: data.createdAt.toDate(),
          userId: data.userId,
          displayName: data.displayName || "匿名ユーザー",
        });
      });
      setMessages(loadedMessages);
    });

    return () => unsubscribe();
  }, [roomId]);

  // メッセージが更新されたらスクロール
  useEffect(() => {
    // 初回ロード時または新しいメッセージが追加された時にスクロール
    const isNewMessageAdded = messages.length > prevMessagesLengthRef.current;

    if (
      messages.length > 0 &&
      (isNewMessageAdded || prevMessagesLengthRef.current === 0)
    ) {
      scrollToBottom();
    }

    // 現在のメッセージ数を保存
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  // 最新メッセージへスクロール
  const scrollToBottom = () => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start", // endからstartに変更
      });
    }
  };

  return (
    <div
      ref={messagesContainerRef}
      className="flex-grow overflow-y-auto p-4" // 下部のパディングを削除
    >
      {messages.length > 0 ? (
        <div className="space-y-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.userId === userId ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  msg.userId === userId
                    ? "bg-green-500 text-black rounded-br-none"
                    : "bg-gray-200 rounded-bl-none"
                }`}
              >
                {msg.userId !== userId && (
                  <p className="text-xs font-bold mb-1">{msg.displayName}</p>
                )}
                <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                <p className="text-xs mt-1 text-right">
                  {formatDistanceToNow(msg.createdAt, {
                    addSuffix: true,
                    locale: ja,
                  })}
                </p>
              </div>
            </div>
          ))}
          <div ref={endOfMessagesRef} /> {/* 高さを持たせる */}
        </div>
      ) : (
        <div className="flex h-full items-center justify-center">
          <p className="text-gray-500">メッセージがありません</p>
        </div>
      )}
    </div>
  );
}
