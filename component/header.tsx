// import Image from "next/image";
import { IoSearch } from "react-icons/io5";
import { Menu, X } from "lucide-react";

interface HeaderProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Header = ({ isOpen, toggleSidebar }: HeaderProps) => {
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
        <div className="p-2">名前 名前</div>
      </div>
      <div>
        <IoSearch size={40} className="p-2" />
      </div>
    </div>
  );
};

export default Header;
