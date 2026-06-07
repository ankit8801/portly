import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import MainLayout from './layout/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'

// Auth Pages
const Login = lazy(() => import('./pages/auth/Login'))
const Signup = lazy(() => import('./pages/auth/Signup'))
const Onboarding = lazy(() => import('./pages/auth/Onboarding'))

// Dashboard
const DashboardLayout = lazy(() => import('./pages/DashboardLayout'))
const ProjectsTab = lazy(() => import('./pages/dashboard/ProjectsTab'))
const PortfolioTab = lazy(() => import('./pages/dashboard/PortfolioTab'))
const AnalyticsTab = lazy(() => import('./pages/dashboard/AnalyticsTab'))
const SettingsTab = lazy(() => import('./pages/dashboard/SettingsTab'))

// Public Pages (Explore & Product)
const Home = lazy(() => import('./pages/Home'))
const ExploreCreators = lazy(() => import('./pages/ExploreCreators'))
const ExploreProjects = lazy(() => import('./pages/ExploreProjects'))
const Pricing = lazy(() => import('./pages/Pricing'))

// User Portfolio Pages
const UserPortfolio = lazy(() => import('./pages/Gallery')) // We will refactor Gallery to be the user's public portfolio
const UserProjectDetails = lazy(() => import('./pages/ProjectDetails')) // Refactor to /u/:username/:slug

// Minimal loading fallback
const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background z-[100]">
    <div className="w-12 h-12 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
  </div>
)

function App() {
  return (
    <>
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
          },
          success: {
            iconTheme: { primary: '#c8a96b', secondary: '#1a1a1a' }
          }
        }} 
      />
      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait">
          <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Onboarding (Needs Auth, but no Profile) */}
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Protected Dashboard Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<ProjectsTab />} />
              <Route path="projects" element={<ProjectsTab />} />
              <Route path="portfolio" element={<PortfolioTab />} />
              <Route path="analytics" element={<AnalyticsTab />} />
              <Route path="settings" element={<SettingsTab />} />
            </Route>
          </Route>

          {/* Main App Routes (Explore, User Portfolios) */}
          <Route element={<MainLayout />}>
            {/* Explore Landing */}
            <Route path="/" element={<Home />} />
            
            {/* User Portfolio */}
            <Route path="/u/:username" element={<UserPortfolio />} />
            <Route path="/u/:username/:slug" element={<UserProjectDetails />} />
            
            {/* Product Pages */}
            <Route path="/explore-creators" element={<ExploreCreators />} />
            <Route path="/explore-projects" element={<ExploreProjects />} />
            <Route path="/pricing" element={<Pricing />} />
          </Route>
        </Routes>
      </AnimatePresence>
      </Suspense>
    </>
  )
}

export default App
