import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import LandingPage from './LandingPage'

export default function Home() {
  const [searchParams] = useSearchParams()
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('otp')

  useEffect(() => {
    const param = searchParams.get('auth')
    if (param === 'login') {
      setAuthMode('otp')
      setAuthOpen(true)
    } else if (param === 'register') {
      setAuthMode('register')
      setAuthOpen(true)
    }
  }, [searchParams])

  const handleOpenAuth = (mode) => {
    setAuthMode(mode || 'otp')
    setAuthOpen(true)
  }

  return (
    <LandingPage onOpenAuth={handleOpenAuth} />
  )
}
