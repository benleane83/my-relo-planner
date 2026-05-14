import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, BookOpen, CalendarDays, ListChecks, ShoppingCart, Menu, Globe } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/research', label: 'Research', icon: BookOpen },
  { to: '/timeline', label: 'Timeline', icon: CalendarDays },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/shopping', label: 'Shopping', icon: ShoppingCart },
];

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  return (
    <>
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15">
          <Globe className="size-4 text-primary" />
        </div>
        <h1 className="text-lg font-semibold tracking-tight">Relocation Planner</h1>
      </div>
      <Separator />
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onNavClick}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary/15 text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground'
                )
              }
            >
              <Icon className="size-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <Separator />
      <div className="p-4 text-xs text-muted-foreground/60">
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
      <aside className="sidebar-texture relative hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar-background md:flex">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="sidebar-texture relative fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar-background md:hidden">
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
            <Menu className="size-5" />
          </Button>
          <span className="text-sm font-semibold">Relocation Planner</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        {/* Desktop top bar — theme toggle */}
        <div className="hidden items-center justify-end border-b px-6 py-2 md:flex">
          <ThemeToggle />
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
