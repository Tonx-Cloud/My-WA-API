'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuthOptimized } from '@/hooks/useAuthOptimized';
import { useStableCallback } from '@/hooks/useStableCallback';
import {
  HomeIcon,
  ChatBubbleLeftRightIcon,
  DevicePhoneMobileIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

// Corrige erro de tipagem dos Heroicons
const HomeIconAny = HomeIcon as any;
const DevicePhoneMobileIconAny = DevicePhoneMobileIcon as any;
const ChatBubbleLeftRightIconAny = ChatBubbleLeftRightIcon as any;
const ChartBarIconAny = ChartBarIcon as any;
const Cog6ToothIconAny = Cog6ToothIcon as any;
const Bars3IconAny = Bars3Icon as any;
const XMarkIconAny = XMarkIcon as any;
const BellIconAny = BellIcon as any;
const UserCircleIconAny = UserCircleIcon as any;
const ArrowRightOnRectangleIconAny = ArrowRightOnRectangleIcon as any;

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIconAny },
  { name: 'InstÃ¢ncias', href: '/dashboard/instances', icon: DevicePhoneMobileIconAny },
  { name: 'Mensagens', href: '/dashboard/messages', icon: ChatBubbleLeftRightIconAny },
  { name: 'RelatÃ³rios', href: '/dashboard/reports', icon: ChartBarIconAny },
  { name: 'ConfiguraÃ§Ãµes', href: '/dashboard/settings', icon: Cog6ToothIconAny },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading, isAuthenticated } = useAuthOptimized();

  const handleLogout = useStableCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro no logout:', error);
      router.push('/login');
    }
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar mobile */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
              aria-label="Fechar sidebar"
            >
              <XMarkIconAny className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <h1 className="text-xl font-bold text-gray-900">My-wa-API</h1>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map(item => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      isActive
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                  >
                    <item.icon
                      className={`${
                        isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                      } mr-4 flex-shrink-0 h-6 w-6`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-bold text-gray-900">My-wa-API</h1>
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                v2.0.0
              </span>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map(item => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      isActive
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <item.icon
                      className={`${
                        isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                      } mr-3 flex-shrink-0 h-6 w-6`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center w-full">
              <div>
                {user?.image ? (
                  <Image
                    className="inline-block h-9 w-9 rounded-full object-cover"
                    src={user.image}
                    alt="Avatar do usuÃ¡rio"
                    width={36}
                    height={36}
                    priority
                  />
                ) : (
                  <UserCircleIconAny className="inline-block h-9 w-9 text-gray-400" />
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-700">{user?.name || 'UsuÃ¡rio'}</p>
                <p className="text-xs font-medium text-gray-500">
                  {user?.email || 'email@exemplo.com'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 p-1 rounded-full text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                aria-label="Logout"
              >
                <ArrowRightOnRectangleIconAny className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Top bar */}
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-50">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <Bars3IconAny className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Top navigation bar for desktop */}
        <div className="hidden md:flex sticky top-0 z-10 flex-shrink-0 h-16 bg-white shadow">
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="flex items-center h-16">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {navigation.find(item => item.href === pathname)?.name || 'Dashboard'}
                    </h2>
                  </div>
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <button
                type="button"
                className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                aria-label="NotificaÃ§Ãµes"
              >
                <BellIconAny className="h-6 w-6" aria-hidden="true" />
              </button>
              <div className="ml-3 relative flex items-center">
                {user?.image ? (
                  <Image
                    className="h-8 w-8 rounded-full object-cover"
                    src={user.image}
                    alt="Avatar do usuÃ¡rio"
                    width={32}
                    height={32}
                    priority
                  />
                ) : (
                  <UserCircleIconAny className="h-8 w-8 text-gray-400" />
                )}
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {user?.name || 'UsuÃ¡rio'}
                </span>
                <button
                  onClick={handleLogout}
                  className="ml-3 p-1 rounded-full text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  aria-label="Logout"
                >
                  <ArrowRightOnRectangleIconAny className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
