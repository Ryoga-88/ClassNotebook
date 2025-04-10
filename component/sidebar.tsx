"use client";
import { useState } from "react";
import { PlusCircle, Trash2 } from "lucide-react";
import { ChatRoom } from "@/types/chatRoom";

interface SidebarProps {
  chatRooms: ChatRoom[];
  onAddRoom: (title: string) => void;
  onDeleteRoom: (roomId: string) => void;
  onSelectRoom: (room: ChatRoom) => void;
  selectedRoom: ChatRoom | null;
}

const Sidebar = ({
  chatRooms,
  onAddRoom,
  onDeleteRoom,
  onSelectRoom,
  selectedRoom,
}: SidebarProps) => {
  const [newRoomTitle, setNewRoomTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddRoom = () => {
    if (newRoomTitle.trim()) {
      onAddRoom(newRoomTitle.trim());
      setNewRoomTitle("");
      setIsAdding(false);
    }
  };

  // 日本語の辞書順にチャットルームをソート
  const sortedChatRooms = [...chatRooms].sort((a, b) =>
    a.title.localeCompare(b.title, "ja")
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-center">授業名</h2>
      </div>

      <div className="flex-grow overflow-y-auto p-2">
        {sortedChatRooms.length > 0 ? (
          <ul className="space-y-1">
            {sortedChatRooms.map((room) => (
              <li
                key={room.id}
                className={`
                  flex justify-between items-center p-2 rounded-md cursor-pointer
                  ${
                    selectedRoom?.id === room.id
                      ? "bg-blue-100"
                      : "hover:bg-gray-100"
                  }
                `}
                onClick={() => onSelectRoom(room)}
              >
                <span className="truncate">{room.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteRoom(room.id);
                  }}
                  className="text-gray-500 hover:text-red-500"
                  aria-label="ルームを削除"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center p-4">
            チャットルームがありません
          </p>
        )}
      </div>

      <div className="p-4 border-t border-gray-200">
        {isAdding ? (
          <div className="flex flex-col space-y-2">
            <input
              type="text"
              value={newRoomTitle}
              onChange={(e) => setNewRoomTitle(e.target.value)}
              placeholder="ルーム名を入力"
              className="px-3 py-2 border border-gray-200 focus:outline-none rounded-md"
              autoFocus
            />
            <div className="flex space-x-2 md:flex-row flex-col space-y-2 items-center">
              <button
                onClick={handleAddRoom}
                className="flex-1 bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 w-full mx-1"
              >
                追加
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewRoomTitle("");
                }}
                className="flex-1 bg-gray-200 px-3 py-1 rounded-md hover:bg-gray-300 w-full mx-1"
              >
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center space-x-1 bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600"
          >
            <PlusCircle size={16} />
            <span>追加</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
