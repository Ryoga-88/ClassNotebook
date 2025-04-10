"use client";
import Footer from "@/component/footer";
import Header from "@/component/header";
import Sidebar from "@/component/sidebar";
import ChatRoomContent from "@/component/ChatRoom";
import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useRouter } from "next/navigation";
import { auth, db, storage } from "../lib/firebase";
import { signOut } from "firebase/auth";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { ChatRoom } from "@/types/chatRoom";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Home() {
  const [isOpen, setIsOpen] = useState(true);
  const { user, loading } = useAuth();
  const router = useRouter();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [message, setMessage] = useState("");

  // チャットルームをFirestoreから取得（アクセス権限のあるもののみ）
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "chatRooms"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const rooms: ChatRoom[] = [];
      querySnapshot.forEach((doc) => {
        const room = { id: doc.id, ...doc.data() } as ChatRoom;
        // 全てのチャットルームを表示
        rooms.push(room);
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
      // チャットルーム用の一意のIDを生成
      const roomId = Date.now().toString();

      // チャットルームをFirestoreに追加
      await addDoc(collection(db, "chatRooms"), {
        title,
        createdAt: new Date(),
        createdBy: user.uid,
        allowedUsers: [], // 初期状態では誰もアクセスできない（ファイルアップロード後に追加）
        fileId: roomId, // ファイルIDを設定（Storageのフォルダ名として使用）
      });

      console.log(
        `チャットルーム「${title}」を作成しました。ファイルID: ${roomId}`
      );
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
  const selectChatRoom = async (room: ChatRoom) => {
    // 選択したルームのアクセス権限を確認
    try {
      const roomDoc = await getDoc(doc(db, "chatRooms", room.id));
      if (roomDoc.exists()) {
        const roomData = roomDoc.data() as ChatRoom;

        // ファイルをアップロード済みかどうか（allowedUsersに含まれているかどうか）
        // 作成者であっても、ファイルをアップロードする必要がある
        const hasUploaded =
          user &&
          roomData.allowedUsers &&
          roomData.allowedUsers.includes(user.uid);

        if (hasUploaded) {
          // ファイルをアップロード済みの場合はチャットルームにアクセス可能
          setSelectedRoom(room);
        } else {
          // それ以外の場合は、ファイルアップロード用の特別な画面を表示
          // ファイルアップロード専用モードとしてroomIdだけを保存
          setSelectedRoom({
            ...room,
            // アップロード専用モードであることを示すフラグを追加
            _uploadOnly: true,
          } as ChatRoom);

          // 作成者であっても、ファイルをアップロードする必要があることを明示
          // const isCreator = roomData.createdBy === user?.uid;
          // if (isCreator) {
          //   alert(
          //     "あなたはこのチャットルームの作成者ですが、閲覧するにはファイルをアップロードしてください。"
          //   );
          // } else {
          //   alert(
          //     "このチャットルームを閲覧するには、ファイルをアップロードしてください。"
          //   );
          // }
        }
      }
    } catch (error) {
      console.error("Error checking room access:", error);
    }
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

  // 既存のチャットルームにファイルをアップロードする関数
  const uploadFile = async (file: File): Promise<string | null> => {
    if (!user || !selectedRoom) return null;

    let downloadUrl = "";
    let uploadSuccess = false;

    try {
      // アップロード中の状態を管理（ChatRoomコンポーネント側で処理）

      // チャットルームのfileIdを取得（チャットルーム作成時に生成されたID）
      const roomDoc = await getDoc(doc(db, "chatRooms", selectedRoom.id));
      if (!roomDoc.exists()) return null;

      const roomData = roomDoc.data();
      const fileId = roomData.fileId || Date.now().toString();

      // チャットルームのフォルダにファイルを保存
      // 形式: files/[チャットルームID]/[ユーザーID]_[ファイル名]
      const storageRef = ref(
        storage,
        `files/${fileId}/${user.uid}_${file.name}`
      );

      try {
        // ファイルをアップロード
        const snapshot = await uploadBytes(storageRef, file);
        downloadUrl = await getDownloadURL(snapshot.ref);
        console.log("アップロード完了！", downloadUrl);
        uploadSuccess = true;
      } catch (storageError) {
        console.error("Storageへのアップロードに失敗しました:", storageError);
        return null; // Storageへのアップロードが失敗した場合は早期リターン
      }

      // Storageへのアップロードが成功した場合のみ続行
      if (!uploadSuccess) return null;

      try {
        // 現在のチャットルームのドキュメントを取得
        const currentAllowedUsers = roomData.allowedUsers || [];

        // ユーザーがまだallowedUsersに含まれていない場合は追加
        if (!currentAllowedUsers.includes(user.uid)) {
          await updateDoc(doc(db, "chatRooms", selectedRoom.id), {
            allowedUsers: [...currentAllowedUsers, user.uid],
          });
        }
      } catch (updateError) {
        console.error("allowedUsersの更新に失敗しました:", updateError);
        // allowedUsersの更新に失敗しても、ファイルのアップロードは成功しているので続行
      }

      // ファイル情報を保存するサブコレクションを作成
      try {
        await addDoc(collection(db, `chatRooms/${selectedRoom.id}/files`), {
          fileName: file.name,
          fileUrl: downloadUrl,
          uploadedBy: user.uid,
          uploadedAt: new Date(),
          uid: user.uid, // uidフィールドを追加
          displayName: user.displayName || user.email || "ユーザー",
        });
        console.log("ファイル情報をFirestoreに保存しました");
      } catch (fileError) {
        console.error("ファイル情報の保存に失敗しました:", fileError);
        // ファイル情報の保存に失敗しても処理を続行
      }

      // メッセージとしてファイルリンクを追加
      try {
        await addDoc(collection(db, `chatRooms/${selectedRoom.id}/messages`), {
          text: `${
            user.displayName || user.email || "ユーザー"
          }さんがファイル「${file.name}」をアップロードしました。`,
          // }」をアップロードしました。\n${downloadUrl}`,
          createdAt: new Date(),
          userId: user.uid,
          displayName: user.displayName || user.email || "ユーザー",
          isSystemMessage: true,
        });
        console.log("ファイルアップロードメッセージを追加しました");
      } catch (messageError) {
        console.error("メッセージの追加に失敗しました:", messageError);
        // メッセージの追加に失敗しても処理を続行
      }

      try {
        // チャットルームの最新情報を取得して選択状態を更新
        const updatedRoomDoc = await getDoc(
          doc(db, "chatRooms", selectedRoom.id)
        );

        if (updatedRoomDoc.exists()) {
          const updatedRoomData = updatedRoomDoc.data();
          const updatedRoom = {
            id: selectedRoom.id,
            ...updatedRoomData,
          } as ChatRoom;

          // アップロード専用モードを解除して通常のチャットルームとして表示
          const normalRoom = { ...updatedRoom };
          if (normalRoom._uploadOnly) {
            delete normalRoom._uploadOnly;
          }

          // 選択中のチャットルームを更新
          setSelectedRoom(normalRoom);

          console.log(
            "チャットルーム状態を更新しました。アクセス権限あり:",
            normalRoom
          );
        }
      } catch (updateError) {
        console.error("チャットルーム状態の更新に失敗しました:", updateError);
        // 状態更新に失敗しても処理を続行
      }

      // Storageへのアップロードが成功していれば、成功を返す
      return uploadSuccess ? selectedRoom.id : null;
    } catch (error) {
      console.error("ファイルアップロードエラー:", error);
      // Storageへのアップロードが成功していれば、成功を返す
      return uploadSuccess ? selectedRoom.id : null;
    }
  };

  // ユーザーのアクセス権限追加関数
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // const addUserAccess = async (roomId: string, userEmail: string) => {
  //   if (!user) return;

  //   try {
  //     // ルームドキュメントを取得
  //     const roomDoc = await getDoc(doc(db, "chatRooms", roomId));
  //     if (roomDoc.exists()) {
  //       const roomData = roomDoc.data();
  //       const currentAllowedUsers = roomData.allowedUsers || [];

  //       // 仮のユーザーID（実際の実装では認証システムを使用すべき）
  //       const targetUserId = userEmail; // 実際にはメールアドレスからユーザーIDを検索

  //       // 既に追加されていなければ追加
  //       if (!currentAllowedUsers.includes(targetUserId)) {
  //         await updateDoc(doc(db, "chatRooms", roomId), {
  //           allowedUsers: [...currentAllowedUsers, targetUserId],
  //         });
  //         alert(`ユーザー ${userEmail} にアクセス権限を付与しました`);
  //       } else {
  //         alert(`ユーザー ${userEmail} は既にアクセス権限を持っています`);
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error adding user access:", error);
  //   }
  // };

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
          isOpen ? "w-full md:w-1/4 md:min-w-1/4 min-w-1/2" : "w-0"
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
              <ChatRoomContent
                isOpen={isOpen}
                roomId={selectedRoom.id}
                userId={user.uid}
                userdisplayName={user.displayName || user.email || "ユーザー"}
                allowedUsers={
                  selectedRoom._uploadOnly
                    ? ["_uploadOnly"]
                    : selectedRoom.allowedUsers || []
                }
                onFileUpload={uploadFile}
              />
            </div>
          ) : (
            <div className="p-4 pt-16">
              <h1 className="text-2xl font-bold mb-4">
                ようこそ、{user.displayName || user.email}さん
              </h1>
              <p>左側のサイドバーからチャットルームを選択してください。</p>
              <p className="mt-4 text-gray-600">
                チャットルームを選択すると、ファイルをアップロードしてチャットに参加できます。
              </p>
            </div>
          )}
        </main>
        <Footer
          isOpen={isOpen}
          message={message}
          setMessage={setMessage}
          sendMessage={sendMessage}
          isRoomSelected={!!selectedRoom}
        />
      </div>
    </div>
  );
}
