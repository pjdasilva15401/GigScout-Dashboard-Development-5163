import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import SafeIcon from '../common/SafeIcon'
import AuthModal from './AuthModal'
import AdminPanel from './AdminPanel'
import EmailPreferences from './EmailPreferences'
import * as FiIcons from 'react-icons/fi'

const { FiTarget, FiUser, FiLogOut, FiSettings, FiBell } = FiIcons

const Header = () => {
  const { user, signOut } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState('signin')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [showEmailPreferences, setShowEmailPreferences] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setShowUserMenu(false)
  }

  const openAuthModal = (mode) => {
    setAuthMode(mode)
    setShowAuthModal(true)
  }

  // Check if user is admin (you can modify this logic)
  const isAdmin = user?.email === 'admin@gigscout.com' || user?.user_metadata?.role === 'admin'

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white shadow-sm border-b border-gray-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-primary rounded-lg p-2">
                <SafeIcon icon={FiTarget} className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">GigScout</h1>
                <p className="text-xs text-gray-500">Social Media Job Scanner</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <SafeIcon icon={FiUser} className="text-gray-600 text-lg" />
                    <span className="hidden sm:block text-sm text-gray-700 max-w-32 truncate">
                      {user.email}
                    </span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-10">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                      </div>
                      
                      <button
                        onClick={() => {
                          setShowEmailPreferences(true)
                          setShowUserMenu(false)
                        }}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <SafeIcon icon={FiBell} className="text-gray-400" />
                        <span>Email Alerts</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            setShowAdminPanel(true)
                            setShowUserMenu(false)
                          }}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <SafeIcon icon={FiSettings} className="text-gray-400" />
                          <span>Admin Panel</span>
                        </button>
                      )}

                      <button
                        onClick={handleSignOut}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <SafeIcon icon={FiLogOut} className="text-gray-400" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openAuthModal('signin')}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => openAuthModal('signup')}
                    className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />

      <AdminPanel
        isOpen={showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
      />

      <EmailPreferences
        isOpen={showEmailPreferences}
        onClose={() => setShowEmailPreferences(false)}
      />
    </>
  )
}

export default Header