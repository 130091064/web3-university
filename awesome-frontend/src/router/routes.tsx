import { lazy } from 'react';

export const DashboardPage = lazy(() => import('@pages/Dashboard/DashboardPage'));
export const CoursesPage = lazy(() => import('@pages/Courses/CoursesPage'));
export const SwapPage = lazy(() => import('@pages/Swap/SwapPage'));
export const VaultPage = lazy(() => import('@pages/Vault/VaultPage'));
export const MePage = lazy(() => import('@pages/Me/MePage'));
