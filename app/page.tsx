"use client";
import Footer from "@/component/footer";
import Header from "@/component/header";
import Sidebar from "@/component/sidebar";
import { useState } from "react";

export default function Home() {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="flex flex-row w-dvw h-dvh overflow-hidden">
      <div
        className={`${
          isOpen ? "w-1/4" : "w-0"
        } border-r border-gray-300 transition-all duration-300 overflow-hidden relative`}
      >
        {isOpen && <Sidebar />}
      </div>

      {/* メインコンテンツ部分 */}
      <div className="flex-grow flex flex-col h-full">
        <Header isOpen={isOpen} toggleSidebar={toggleSidebar} />
        <main className="flex-grow relative">
          {/* サイドバー開閉ボタン */}
          {/* <button
            className="absolute top-4 left-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
            onClick={toggleSidebar}
            aria-label={isOpen ? "サイドバーを閉じる" : "サイドバーを開く"}
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button> */}

          <div className="p-4 pt-16">メインコンテンツがここに入ります</div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
