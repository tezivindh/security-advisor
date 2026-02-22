'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  Shield,
  LayoutDashboard,
  GitBranch,
  GitPullRequest,
  Globe,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/repositories', label: 'Repositories', icon: GitBranch },
  { href: '/pr-automation', label: 'PR Automation', icon: GitPullRequest },
  { href: '/live-scan', label: 'Live Scan', icon: Globe },
  { href: '/team', label: 'Team', icon: Users },
  { href: '/pricing', label: 'Pricing', icon: BarChart3 },
];

function SidebarNav() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <aside className="fixed inset-y-0 left-0 w-56 bg-[#0d0d12] border-r border-white/5 flex flex-col z-40">
      {/* Logo */}
      <div className="h-14 flex items-center gap-2 px-4 border-b border-white/5">
        <Shield className="h-5 w-5 text-red-500" />
        <span className="font-semibold text-sm tracking-tight">SecOps</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all',
                active
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {active && <ChevronRight className="h-3 w-3 ml-auto text-white/30" />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-white/5">
        {user && (
          <div className="flex items-center gap-2.5 mb-2 px-2">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.login}
                width={28}
                height={28}
                className="rounded-full"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs">
                {user.login[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{user.login}</div>
              <div className="text-xs text-white/30 capitalize">{user.plan}</div>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, fetchMe, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <SidebarNav />
      <main className="ml-56 min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
