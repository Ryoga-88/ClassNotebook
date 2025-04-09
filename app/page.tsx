"use client";
import Footer from "@/component/footer";
import Header from "@/component/header";
import Sidebar from "@/component/sidebar";
import ChatRoomContent from "@/component/ChatRoom";
import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useRouter } from "next/navigation";
import { auth, db } from "../lib/firebase";
import { signOut } from "firebase/auth";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { ChatRoom } from "@/types/chatRoom";

export default function Home() {
  const [isOpen, setIsOpen] = useState(true);
  const { user, loading } = useAuth();
  const router = useRouter();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [message, setMessage] = useState("");

  // チャットルームをFirestoreから取得
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "chatRooms"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const rooms: ChatRoom[] = [];
      querySnapshot.forEach((doc) => {
        rooms.push({ id: doc.id, ...doc.data() } as ChatRoom);
      });
      setChatRooms(rooms);
    });

    return () => unsubscribe();
  }, [user]);

  // 未ログイン時はログインページにリダイレクト
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // メッセージ送信関数
  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!message.trim() || !selectedRoom || !user) return;

    try {
      await addDoc(collection(db, `chatRooms/${selectedRoom.id}/messages`), {
        text: message,
        createdAt: new Date(),
        userId: user.uid,
        displayName: user.displayName || user.email || "ユーザー",
      });

      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // チャットルーム追加関数
  const addChatRoom = async (title: string) => {
    if (!user) return;

    try {
      await addDoc(collection(db, "chatRooms"), {
        title,
        createdAt: new Date(),
        createdBy: user.uid,
      });
    } catch (error) {
      console.error("Error adding chat room:", error);
    }
  };

  // チャットルーム削除関数
  const deleteChatRoom = async (roomId: string) => {
    try {
      await deleteDoc(doc(db, "chatRooms", roomId));
      if (selectedRoom?.id === roomId) {
        setSelectedRoom(null);
      }
    } catch (error) {
      console.error("Error deleting chat room:", error);
    }
  };

  // チャットルーム選択関数
  const selectChatRoom = (room: ChatRoom) => {
    setSelectedRoom(room);
  };

  // サインアウト処理関数
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // ロード中または未ログイン時はローディング表示
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-row h-dvh overflow-hidden">
      <div
        className={`${
          isOpen ? "w-full md:w-1/4" : "w-0"
        } border-r border-gray-300 transition-all duration-300 overflow-hidden relative`}
      >
        {isOpen && (
          <Sidebar
            chatRooms={chatRooms}
            onAddRoom={addChatRoom}
            onDeleteRoom={deleteChatRoom}
            onSelectRoom={selectChatRoom}
            selectedRoom={selectedRoom}
          />
        )}
      </div>

      {/* メインコンテンツ部分 */}
      <div className="flex-grow flex flex-col h-full">
        <Header
          isOpen={isOpen}
          toggleSidebar={toggleSidebar}
          onSignOut={handleSignOut}
          userName={user.displayName || user.email || "ユーザー"}
          selectedRoom={selectedRoom}
        />
        <main className="flex-grow relative overflow-y-auto pb-20">
          {selectedRoom ? (
            <div>
              <ChatRoomContent roomId={selectedRoom.id} userId={user.uid} />
            </div>
          ) : (
            <div className="p-4 pt-16">
              <h1 className="text-2xl font-bold mb-4">
                ようこそ、{user.displayName || user.email}さん
              </h1>
              <p>左側のサイドバーからチャットルームを選択してください</p>
            </div>
          )}
        </main>
        <Footer
          message={message}
          setMessage={setMessage}
          sendMessage={sendMessage}
          isRoomSelected={!!selectedRoom}
        />
      </div>
    </div>
  );
}
