// @/types/chatRoom.ts に追加
export interface ChatRoom {
  id: string;
  title: string;
  createdAt: Date;
  createdBy: string;
  fileId?: string; // アップロードされたファイルのID
  fileUrl?: string; // アップロードされたファイルのURL
  fileName?: string; // アップロードされたファイルの名前
  allowedUsers: string[]; // アクセス許可されたユーザーIDのリスト
  _uploadOnly?: boolean; // アップロード専用モードかどうか（内部使用）
}
