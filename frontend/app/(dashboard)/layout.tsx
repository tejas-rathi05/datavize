'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useIsAuthenticated, useUser, useIsLoading } from '@/hooks/use-auth-store'
import SidebarLayout from '@/components/sidebar/sidebar-layout'

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isAuthenticated = useIsAuthenticated()
  const user = useUser()
  const isLoading = useIsLoading()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Only redirect if we're not loading and definitely not authenticated
    if (!isLoading && !isAuthenticated && !user) {
      console.log('No user found, redirecting to login')
      // Store the current path so we can redirect back after login
      sessionStorage.setItem('redirectAfterLogin', pathname)
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, user, router, pathname])

  // Show loading state while authentication is being restored
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-pulse">
          <img src="/images/icon.png" alt="logo" className="h-20 object-contain" />

        </div>
      </div>
    )
  }

  // Don't render anything if no user (will redirect)
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  console.log('Dashboard layout: User authenticated:', user.email)

  return (
    <SidebarLayout>
      {children}
    </SidebarLayout>
  );
}
