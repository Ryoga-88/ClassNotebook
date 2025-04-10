"use client";
import { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { ChatRoom } from "@/types/chatRoom";

interface Message {
  id: string;
  text: string;
  createdAt: Date;
  userId: string;
  displayName: string;
  isSystemMessage?: boolean;
}

interface ChatRoomContentProps {
  isOpen: boolean;
  roomId: string;
  userId: string;
  userdisplayName: string;
  allowedUsers: string[]; // アクセス許可されたユーザーIDのリスト
  onFileUpload?: (file: File) => Promise<string | null>; // ファイルアップロード関数
}

export default function ChatRoomContent({
  isOpen,
  roomId,
  userId,
  userdisplayName,
  onFileUpload,
}: ChatRoomContentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [roomData, setRoomData] = useState<ChatRoom | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUsers, setUploadedUsers] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<
    { uid: string; fileName: string; fileUrl: string }[]
  >([]);
  const [isUploadOnlyMode, setIsUploadOnlyMode] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef<number>(0);

  // チャットルーム情報と権限の一元管理
  useEffect(() => {
    if (!roomId || !userId) return;

    console.log(
      "チャットルームのリアルタイムリスナーを設定します",
      roomId,
      userId
    );
    setIsLoading(true);

    // チャットルーム情報のリアルタイム更新リスナー
    const unsubscribe = onSnapshot(
      doc(db, "chatRooms", roomId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          console.log("チャットルーム更新データ:", data);

          // チャットルームデータの更新
          const chatRoomData: ChatRoom = {
            id: roomId,
            title: data.title || "",
            createdAt: data.createdAt?.toDate() || new Date(),
            createdBy: data.createdBy || "",
            fileId: data.fileId,
            fileUrl: data.fileUrl,
            fileName: data.fileName,
            allowedUsers: data.allowedUsers || [],
          };

          setRoomData(chatRoomData);

          // アップロード済みユーザーリストの更新
          const allowedUsersList = data.allowedUsers || [];
          setUploadedUsers(allowedUsersList);

          // アクセス権限の判定
          const isUploadOnly = !!data._uploadOnly;
          const hasUploaded = allowedUsersList.includes(userId);

          console.log(
            "チャットルーム情報更新:",
            chatRoomData,
            "アップロード専用モード:",
            isUploadOnly,
            "アクセス権限:",
            hasUploaded,
            "ユーザーID:",
            userId,
            "アップロード済みユーザー:",
            allowedUsersList
          );

          if (isUploadOnly) {
            setIsUploadOnlyMode(true);
            setHasAccess(false);
          } else if (hasUploaded) {
            setHasAccess(true);
            setIsUploadOnlyMode(false);
          } else {
            setHasAccess(false);
            setIsUploadOnlyMode(true);
          }

          setIsLoading(false);
        } else {
          console.log("チャットルームが存在しません:", roomId);
          setHasAccess(false);
          setIsUploadOnlyMode(false);
          setIsLoading(false);
        }
      },
      (error) => {
        console.error("チャットルーム監視エラー:", error);
        setIsLoading(false);
      }
    );

    return () => {
      console.log("チャットルームリスナーを解除します");
      unsubscribe();
    };
  }, [roomId, userId]);

  // チャットルームに関連するファイルを取得
  useEffect(() => {
    if (!roomId) return;

    console.log("ファイル情報取得リスナーを設定します", roomId);

    // リアルタイム更新のためのリスナーを設定
    const unsubscribe = onSnapshot(
      query(
        collection(db, `chatRooms/${roomId}/files`),
        orderBy("uploadedAt", "desc")
      ),
      (querySnapshot) => {
        const files: { uid: string; fileName: string; fileUrl: string }[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log("ファイルデータ:", data);

          files.push({
            uid: data.uid || data.uploadedBy || "不明なユーザー",
            fileName: data.fileName || "名前なしファイル",
            fileUrl: data.fileUrl || "",
          });
        });

        console.log("アップロードされたファイル一覧:", files);
        setUploadedFiles(files);
      },
      (error) => {
        console.error("ファイル監視エラー:", error);
        setUploadedFiles([]);
      }
    );

    return () => {
      console.log("ファイルリスナーを解除します");
      unsubscribe();
    };
  }, [roomId]);

  // メッセージを読み込む（アクセス権限がある場合のみ）
  useEffect(() => {
    if (!hasAccess || !roomId) return;

    console.log("メッセージリスナーを設定します", roomId);

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
          isSystemMessage: data.isSystemMessage || false,
        });
      });

      console.log(`${loadedMessages.length}件のメッセージを読み込みました`);
      setMessages(loadedMessages);
    });

    return () => {
      console.log("メッセージリスナーを解除します");
      unsubscribe();
    };
  }, [roomId, hasAccess]);

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
        block: "start",
      });
    }
  };

  // ファイルアップロードハンドラー - 修正版
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onFileUpload || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setIsUploading(true);

    try {
      console.log("ファイルアップロード開始:", file.name);

      // ファイルをアップロード
      const result = await onFileUpload(file);

      if (result) {
        console.log("ファイルアップロード成功:", result);
        // アップロード成功メッセージ
        // alert(
        //   "ファイルのアップロードが完了しました。チャットルームへのアクセス権限が更新されるまでお待ちください。"
        // );
      } else {
        console.error("ファイルアップロード結果がnullです");
        alert("ファイルのアップロードに失敗しました。もう一度お試しください。");
      }
    } catch (error) {
      console.error("ファイルアップロードエラー:", error);
      alert("ファイルのアップロードに失敗しました。もう一度お試しください。");
    } finally {
      setIsUploading(false);
    }
  };

  // ローディング中
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">ロード中...</p>
      </div>
    );
  }

  // アップロード専用モードまたはアクセス権限がない場合はアップロード画面を表示
  if (!hasAccess || isUploadOnlyMode) {
    return (
      <div
        className={`flex flex-col h-full p-4 ${
          isOpen ? "w-full right-0" : "w-dvw"
        }`}
      >
        {/* チャットルーム情報 */}
        {/* <div className="bg-white p-4 rounded-lg mb-6"> */}
        {/* <h2 className="text-xl font-bold text-gray-800">
            {roomData?.title || "チャットルーム"}
          </h2> */}
        {/* <p className="text-sm text-gray-500">
            作成者:{" "}
            {roomData?.createdBy === userId
              ? "あなた"
              : roomData?.createdBy || "不明"}
          </p> */}
        {/* デバッグ情報 - 本番環境では削除する */}
        {/* <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
            <p>ルームID: {roomId}</p>
            <p>ユーザーID: {userId}</p>
            <p>アクセス権限: {hasAccess ? "あり" : "なし"}</p>
            <p>
              アップロード専用モード: {isUploadOnlyMode ? "はい" : "いいえ"}
            </p>
            <p>アップロード済みユーザー数: {uploadedUsers.length}</p>
          </div> */}
        {/* </div> */}

        <div className="flex-grow flex flex-col items-center justify-center">
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200 max-w-md mb-6">
            <p className="text-blue-600 font-bold text-xl mb-4">
              ファイル提出が必要です
            </p>
            <p className="text-blue-700 mb-4">
              ファイルをアップロードしたユーザーのみ閲覧できます。
            </p>

            <div className="mt-4 p-2 bg-white rounded-lg">
              <p className="font-medium text-gray-800 mb-2">提出状況:</p>

              {/* アップロード済みユーザー */}
              {uploadedUsers.length > 0 ? (
                <div className="text-left space-y-2">
                  {uploadedUsers.map((uid) => (
                    <p key={uid} className="text-gray-700">
                      <span className="font-medium">
                        {uid === userId ? "あなた" : userdisplayName}
                      </span>
                      <span className="text-green-600 ml-2">
                        {uid === roomData?.createdBy
                          ? "提出済みです！"
                          : "提出済みです！"}
                      </span>
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  まだ誰も提出していません
                </p>
              )}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg w-full max-w-md border border-gray-200">
            <h3 className="text-lg font-bold mb-3 text-center">
              ファイルをアップロードする
            </h3>
            <p className="text-sm text-gray-600 mb-4 text-center">
              ファイルをアップロードすると、このチャットルームにアクセスできます。
            </p>

            <label className="block w-full">
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploading}
              />
              <div className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded text-center cursor-pointer transition duration-200">
                {isUploading ? "アップロード中..." : "アップロード"}
              </div>
            </label>

            {/* {isUploading && (
              <p className="text-blue-500 text-sm mt-2 text-center">
                アップロード中...
              </p>
            )} */}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col h-full ${
        isOpen ? "md:w-full w-1/2 right-0" : "w-dvw"
      }`}
    >
      {/* アップロードされたファイル一覧 */}
      {hasAccess && uploadedFiles.length > 0 && (
        <div className="bg-gray-50 p-4 border-b border-gray-200">
          <div className="flex items-center justify-between space-x-4 mb-4">
            <div className="text-lg font-semibold">ファイル</div>
            <label className="block">
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploading}
              />
              <div className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-2 rounded text-center cursor-pointer transition duration-200">
                {isUploading ? "アップロード中..." : "アップロード"}
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="bg-white p-3 rounded-lg shadow-sm border border-gray-200"
              >
                <div className="flex flex-col items-center justify-between mb-1">
                  <p className="font-medium text-gray-800 truncate">
                    {file.fileName}
                  </p>
                  <p className="text-xs text-gray-500 mb-2">
                    アップロード者:{" "}
                    {file.uid === userId ? "あなた" : userdisplayName}
                  </p>
                </div>

                <a
                  href={file.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm inline-block"
                >
                  ファイルを開く
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* メッセージ一覧 */}
      <div ref={messagesContainerRef} className="flex-grow overflow-y-auto p-4">
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
                    msg.isSystemMessage
                      ? "bg-blue-100 text-blue-800"
                      : msg.userId === userId
                      ? "bg-green-500 text-black rounded-br-none"
                      : "bg-gray-200 rounded-bl-none"
                  }`}
                >
                  {msg.userId !== userId && !msg.isSystemMessage && (
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
            <div ref={endOfMessagesRef} />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-gray-500">メッセージがありません</p>
          </div>
        )}
      </div>
    </div>
  );
}
