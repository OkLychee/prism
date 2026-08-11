import React from 'react';
import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  badge?: string | number;
}

export interface SidebarGroup {
  id: string;
  title?: string;
  items: SidebarNavItem[];
}

interface SidebarProps {
  groups: SidebarGroup[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobile?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  groups,
  isCollapsed,
  onToggleCollapse,
  isMobile = false,
  onMobileClose,
}) => {
  return (
    <aside
      className={`flex flex-col h-full bg-color-bg-sidebar border-r border-theme-border transition-all duration-300 ease-in-out shrink-0 ${
        isMobile
          ? 'w-[256px]'
          : isCollapsed
          ? 'w-[68px]'
          : 'w-[256px]'
      }`}
    >
      {/* 1. Sidebar Header (Logo Area) */}
      <div className="h-[60px] flex items-center px-4 border-b border-theme-border shrink-0 justify-between">
        <div className="flex items-center space-x-3 overflow-hidden">
          <img
            src="/logo.png"
            alt="Prism Logo"
            className="w-8 h-8 rounded-lg object-cover shrink-0"
          />
          {(!isCollapsed || isMobile) && (
            <div className="truncate">
              <span className="font-bold text-sm tracking-wide text-color-text-main block truncate">
                Prism
              </span>
              <span className="text-[10px] text-color-text-muted font-mono block truncate">
                AI Assessment Platform
              </span>
            </div>
          )}
        </div>
        {isMobile && (
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-xl bg-color-bg-card border border-theme-border text-color-text-muted hover:text-color-text-main transition cursor-pointer"
            title="Close Menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. Sidebar Body (Flexible Height, Grouped Items, Vertical Scrollbar) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
        {groups.map((group) => (
          <div key={group.id} className="space-y-1">
            {/* Group Title Header */}
            {group.title && (!isCollapsed || isMobile) && (
              <div className="px-3 pt-2 pb-1 text-[10px] font-semibold text-color-text-muted uppercase tracking-wider">
                {group.title}
              </div>
            )}

            {/* Group Items */}
            {group.items.map((item) => {
              const isActive = item.active;
              const showText = !isCollapsed || isMobile;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.onClick) item.onClick();
                    if (isMobile && onMobileClose) onMobileClose();
                  }}
                  title={!showText ? item.label : undefined}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary-red-muted text-primary-red border border-primary-red/30 font-semibold'
                      : 'text-color-text-muted hover:text-color-text-main hover:bg-color-bg-card'
                  } ${!showText ? 'justify-center px-0' : ''}`}
                >
                  <div className={`shrink-0 ${isActive ? 'text-primary-red' : 'text-color-text-muted'}`}>
                    {item.icon}
                  </div>
                  {showText && <span className="truncate flex-1 text-left">{item.label}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* 3. Sidebar Footer (Desktop Bottom-Left Collapse Toggle Button) */}
      {!isMobile && (
        <div className="p-3 border-t border-theme-border shrink-0 flex items-center justify-start">
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-xl bg-color-bg-card border border-theme-border hover:border-primary-red/40 text-color-text-muted hover:text-color-text-main transition flex items-center justify-center cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-color-text-muted" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-color-text-muted" />
            )}
          </button>
        </div>
      )}
    </aside>
  );
};
