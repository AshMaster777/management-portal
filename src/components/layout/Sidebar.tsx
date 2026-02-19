import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Tags, Layers, BarChart3, Settings, LogOut, FileText, Download, User, HelpCircle, Coins, Users, Handshake, ClipboardList } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Sales', href: '/admin/sales', icon: BarChart3 },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Categories', href: '/admin/categories', icon: Layers },
  { name: 'Tags', href: '/admin/tags', icon: Tags },
  { name: 'FAQ', href: '/admin/faqs', icon: HelpCircle },
  { name: 'Licenses', href: '/admin/licenses', icon: FileText },
  { name: 'Downloads', href: '/admin/downloads', icon: Download },
  { name: 'Credits', href: '/admin/credits', icon: Coins },
  { name: 'Partners', href: '/admin/partners', icon: Handshake },
  { name: 'Partnerships', href: '/admin/partnerships', icon: ClipboardList },
  { name: 'Staff', href: '/admin/staff', icon: Users },
  { name: 'Account Details', href: '/admin/account', icon: User },
];

export function Sidebar() {
  return (
    <div className="flex h-screen w-60 flex-col bg-bg-primary border-r border-border-primary">
      <div className="flex h-14 items-center px-5 border-b border-border-primary">
        <h1 className="text-base font-bold text-text-primary tracking-tight">Bavaria Admin</h1>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-3">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent/10 text-accent font-semibold'
                  : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
              }`
            }
          >
            <item.icon className="mr-3 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            {item.name}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-border-primary p-3 space-y-1">
        <NavLink
          to="/admin/account"
          className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
        >
          <Settings className="mr-3 h-4 w-4 flex-shrink-0" aria-hidden="true" />
          Settings
        </NavLink>
        <div className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-red-400 hover:bg-bg-hover hover:text-red-300 transition-colors cursor-pointer">
          <LogOut className="mr-3 h-4 w-4 flex-shrink-0" aria-hidden="true" />
          Logout
        </div>
      </div>
      <div className="border-t border-border-primary p-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
            A
          </div>
          <div className="text-sm overflow-hidden">
            <p className="font-medium text-text-primary truncate text-xs">Admin User</p>
            <p className="text-xs text-text-muted truncate">admin@bavaria.hub</p>
          </div>
        </div>
      </div>
    </div>
  );
}
