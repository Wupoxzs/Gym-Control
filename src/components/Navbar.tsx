import React from "react";
import { ClipboardList, History, Sparkles } from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const tabs = [
    { id: "routines", label: "Rutinas", icon: ClipboardList },
    { id: "history", label: "Historial", icon: History },
    { id: "coach", label: "Coach IA", icon: Sparkles },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200 px-6 pb-safe shadow-sm">
      <div className="max-w-md mx-auto flex justify-around py-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center w-20 py-1 transition-all duration-150 select-none cursor-pointer ${
                isActive 
                  ? "text-black scale-105 font-bold" 
                  : "text-zinc-400 hover:text-black"
              }`}
            >
              <div className="relative p-1">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? "stroke-[2.5px]" : "stroke-[1.75px]"}`} />
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">{tab.label}</span>
              {isActive && (
                <div className="absolute -bottom-1.5 w-6 h-0.5 bg-black rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

