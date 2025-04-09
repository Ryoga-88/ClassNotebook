import { Menu, X, LogOut } from "lucide-react";
import { ChatRoom } from "@/types/chatRoom";

interface HeaderProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  onSignOut: () => void;
  userName?: string;
  selectedRoom: ChatRoom | null;
}

const Header = ({
  isOpen,
  toggleSidebar,
  onSignOut,
  // userName = "ユーザー",
  selectedRoom,
}: HeaderProps) => {
  return (
    <div className="flex flex-row justify-between items-center p-1 border-b-1 border-gray-300">
      <div className="p-2 flex flex-row items-center gap-2">
        <button
          className="z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
          onClick={toggleSidebar}
          aria-label={isOpen ? "サイドバーを閉じる" : "サイドバーを開く"}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="p-2">{selectedRoom?.title || "ルーム未選択"}</div>
      </div>
      <div className="flex items-center gap-4 mr-2">
        <button
          onClick={onSignOut}
          className="flex items-center gap-1 p-2 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="サインアウト"
        >
          <LogOut size={20} />
          <span className="hidden sm:inline">ログアウト</span>
        </button>
      </div>
    </div>
  );
};

export default Header;
