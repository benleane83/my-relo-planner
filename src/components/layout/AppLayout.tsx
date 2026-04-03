import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/research', label: 'Research', icon: '📖' },
  { to: '/timeline', label: 'Timeline', icon: '📅' },
  { to: '/tasks', label: 'Tasks', icon: '✅' },
  { to: '/shopping', label: 'Shopping', icon: '🛒' },
];

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  return (
    <>
      <div className="flex items-center gap-2 px-6 py-5">
        <span className="text-xl">🌏</span>
        <h1 className="text-lg font-semibold tracking-tight">My Relo Planner</h1>
      </div>
      <Separator />
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onNavClick}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <Separator />
      <div className="p-4 text-xs text-muted-foreground">
        Relocation Tracker v1
      </div>
    </>
  );
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar — always visible, normal flow */}
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-card md:flex">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card md:hidden">
            <SidebarContent onNavClick={() => setMobileOpen(false)} />
          </aside>
        </>
      )}

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header — only on small screens */}
        <header className="flex items-center gap-3 border-b px-4 py-3 md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <span className="text-xl">☰</span>
          </Button>
          <span className="text-sm font-semibold">My Relo Planner</span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
