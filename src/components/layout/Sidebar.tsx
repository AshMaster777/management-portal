import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Tags, Layers, BarChart3, Settings, LogOut, Download, HelpCircle, Coins, Users, Handshake, ClipboardList, Code2, ChevronLeft, ChevronRight, Store } from 'lucide-react';
import { useState } from 'react';

const navigationGroups = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { name: 'Sales', href: '/admin/sales', icon: BarChart3 },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
      { name: 'Products', href: '/admin/products', icon: Package },
      { name: 'Categories', href: '/admin/categories', icon: Layers },
      { name: 'Tags', href: '/admin/tags', icon: Tags },
    ],
  },
  {
    label: 'Store',
    items: [
      { name: 'Downloads', href: '/admin/downloads', icon: Download },
      { name: 'Credits', href: '/admin/credits', icon: Coins },
      { name: 'FAQ', href: '/admin/faqs', icon: HelpCircle },
    ],
  },
  {
    label: 'Partners',
    items: [
      { name: 'Partners', href: '/admin/partners', icon: Handshake },
      { name: 'Partnerships', href: '/admin/partnerships', icon: ClipboardList },
    ],
  },
  {
    label: 'Team',
    items: [
      { name: 'Staff', href: '/admin/staff', icon: Users },
      { name: 'Developers', href: '/admin/developers', icon: Code2 },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`flex h-screen flex-col bg-bg-card border-r border-border-light shadow-[4px_0_24px_rgba(0,0,0,0.15)] z-10 relative transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border-light">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-accent/40 to-accent/20 flex items-center justify-center shadow-lg shadow-accent/10">
              <Store className="h-5 w-5 text-accent" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-text-primary tracking-tight leading-none">Bavaria</h1>
              <p className="text-[10px] text-text-muted font-medium">Admin Portal</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto h-9 w-9 rounded-xl bg-gradient-to-br from-accent/40 to-accent/20 flex items-center justify-center shadow-lg shadow-accent/10">
            <Store className="h-5 w-5 text-accent" strokeWidth={2.5} />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors text-text-muted hover:text-text-primary ml-auto"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-6">
        {navigationGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <div className="px-3 mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{group.label}</p>
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    title={collapsed ? item.name : undefined}
                    className={`group relative flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-accent/15 text-accent shadow-sm'
                        : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                    } ${collapsed ? 'justify-center' : ''}`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent rounded-r-full"></div>
                    )}
                    <item.icon 
                      className={`${collapsed ? '' : 'mr-3'} h-[18px] w-[18px] flex-shrink-0 transition-transform ${
                        isActive ? 'scale-110' : 'group-hover:scale-105'
                      }`} 
                      strokeWidth={2.5}
                    />
                    {!collapsed && <span className="truncate">{item.name}</span>}
                    {!collapsed && isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Actions */}
      <div className="border-t border-border-light p-3 space-y-1">
        <NavLink
          to="/admin/account"
          title={collapsed ? 'Settings' : undefined}
          className={`group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          <Settings className={`${collapsed ? '' : 'mr-3'} h-[18px] w-[18px] flex-shrink-0 group-hover:rotate-90 transition-transform duration-300`} strokeWidth={2.5} />
          {!collapsed && 'Settings'}
        </NavLink>
        <div 
          title={collapsed ? 'Logout' : undefined}
          className={`group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium text-rose-300 hover:bg-rose-500/15 transition-all cursor-pointer ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className={`${collapsed ? '' : 'mr-3'} h-[18px] w-[18px] flex-shrink-0 group-hover:scale-110 transition-transform`} strokeWidth={2.5} />
          {!collapsed && 'Logout'}
        </div>
      </div>

      {/* User Profile */}
      <div className="border-t border-border-light p-3">
        <div className={`flex items-center gap-3 p-2.5 rounded-xl hover:bg-bg-hover transition-colors cursor-pointer ${collapsed ? 'justify-center' : ''}`}>
          <div className="relative">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center text-accent font-bold text-xs shadow-inner ring-2 ring-accent/20">
              A
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-bg-card"></div>
          </div>
          {!collapsed && (
            <div className="text-xs overflow-hidden flex-1">
              <p className="font-bold text-text-primary truncate">Admin User</p>
              <p className="text-[10px] text-text-muted truncate">admin@bavaria.hub</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
