"use client"

import * as z from "zod"
import { useForm, Controller } from "react-hook-form"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"

// Keep your original imports and schema
import { LoginSchema } from "@/lib/validations/login-schema"
import { login } from "@/lib/auth-actions/login"
import Image from "next/image"

// Custom styled alert components for errors and success
const FormError = ({ message }: { message?: string }) => {
  if (!message) return null
  return (
    <div className="bg-red-950/30 border border-red-900/50 text-red-300 px-4 py-3 rounded-lg mb-4 backdrop-blur-sm">
      {message}
    </div>
  )
}

const FormSuccess = ({ message }: { message?: string }) => {
  if (!message) return null
  return (
    <div className="bg-emerald-950/30 border border-emerald-900/50 text-emerald-300 px-4 py-3 rounded-lg mb-4 backdrop-blur-sm">
      {message}
    </div>
  )
}

export const LoginForm = () => {


  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showTwoFactor, setShowTwoFactor] = useState(false)
  const [error, setError] = useState<string | undefined>("")
  const [success, setSuccess] = useState<string | undefined>("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof LoginSchema>) => {
    setError("")
    setSuccess("")
    setIsLoading(true)
    try {
      const data = await login(values)
      if (data?.error) {
        setError(data.error)
      } else if (data.success) {
        // On successful login, redirect to the dashboard
        window.location.assign("/dashboard")
      }
    } catch (error) {
      setError(`An unexpected error occurred. Please try again. ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="min-h-screen bg-black flex relative overflow-hidden">
      {/* Pitch black background with subtle gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-950 to-black"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.02),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.01),transparent_50%)]"></div>
      
      {/* Left Panel - Architectural Building Design */}
      <div className="hidden lg:flex lg:w-7/12 bg-transparent p-8 xl:p-16 flex-col justify-center items-center relative z-10">
        <div className="relative w-full max-w-lg flex flex-col items-center">
          {/* Modern architectural building lines */}
          <div className="relative w-96 h-96 flex items-center justify-center mb-12">
            
            {/* Building Structure - Main Tower */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-80">
              {/* Building outline */}
              <div className="absolute inset-0 border-l border-r border-t border-white/20 bg-gradient-to-b from-white/5 to-transparent"></div>
              
              {/* Vertical lines (building edges) */}
              <div className="absolute left-0 top-0 w-px h-full bg-gradient-to-b from-white/30 to-white/10"></div>
              <div className="absolute right-0 top-0 w-px h-full bg-gradient-to-b from-white/30 to-white/10"></div>
              <div className="absolute left-1/3 top-0 w-px h-full bg-gradient-to-b from-white/15 to-transparent"></div>
              <div className="absolute right-1/3 top-0 w-px h-full bg-gradient-to-b from-white/15 to-transparent"></div>
              
              {/* Floor lines */}
              <div className="absolute w-full h-px bg-white/10 top-[10%]"></div>
              <div className="absolute w-full h-px bg-white/10 top-[20%]"></div>
              <div className="absolute w-full h-px bg-white/10 top-[30%]"></div>
              <div className="absolute w-full h-px bg-white/10 top-[40%]"></div>
              <div className="absolute w-full h-px bg-white/10 top-[50%]"></div>
              <div className="absolute w-full h-px bg-white/10 top-[60%]"></div>
              <div className="absolute w-full h-px bg-white/10 top-[70%]"></div>
              <div className="absolute w-full h-px bg-white/10 top-[80%]"></div>
              <div className="absolute w-full h-px bg-white/10 top-[90%]"></div>
              
              {/* Window grid effect */}
              <div className="absolute inset-4 grid grid-cols-3 grid-rows-8 gap-2">
                {[...Array(24)].map((_, i) => (
                  <div 
                    key={i} 
                    className="border border-white/5 bg-white/2 animate-pulse"
                    style={{ animationDelay: `${i * 0.1}s`, animationDuration: '4s' }}
                  ></div>
                ))}
              </div>
            </div>
            
            {/* Left Building Wing */}
            <div className="absolute bottom-0 left-12 w-32 h-60">
              <div className="absolute inset-0 border-l border-r border-t border-white/15 bg-gradient-to-b from-white/3 to-transparent"></div>
              {/* Floor lines */}
              <div className="absolute w-full h-px bg-white/8 top-[15%]"></div>
              <div className="absolute w-full h-px bg-white/8 top-[30%]"></div>
              <div className="absolute w-full h-px bg-white/8 top-[45%]"></div>
              <div className="absolute w-full h-px bg-white/8 top-[60%]"></div>
              <div className="absolute w-full h-px bg-white/8 top-[75%]"></div>
              <div className="absolute w-full h-px bg-white/8 top-[90%]"></div>
              {/* Vertical detail lines */}
              <div className="absolute left-1/4 top-0 w-px h-full bg-white/5"></div>
              <div className="absolute right-1/4 top-0 w-px h-full bg-white/5"></div>
            </div>
            
            {/* Right Building Wing */}
            <div className="absolute bottom-0 right-12 w-32 h-60">
              <div className="absolute inset-0 border-l border-r border-t border-white/15 bg-gradient-to-b from-white/3 to-transparent"></div>
              {/* Floor lines */}
              <div className="absolute w-full h-px bg-white/8 top-[15%]"></div>
              <div className="absolute w-full h-px bg-white/8 top-[30%]"></div>
              <div className="absolute w-full h-px bg-white/8 top-[45%]"></div>
              <div className="absolute w-full h-px bg-white/8 top-[60%]"></div>
              <div className="absolute w-full h-px bg-white/8 top-[75%]"></div>
              <div className="absolute w-full h-px bg-white/8 top-[90%]"></div>
              {/* Vertical detail lines */}
              <div className="absolute left-1/4 top-0 w-px h-full bg-white/5"></div>
              <div className="absolute right-1/4 top-0 w-px h-full bg-white/5"></div>
            </div>
            
            {/* Perspective/depth lines */}
            <div className="absolute bottom-0 left-12 w-px h-64 bg-gradient-to-t from-white/20 to-transparent transform -skew-x-12"></div>
            <div className="absolute bottom-0 right-12 w-px h-64 bg-gradient-to-t from-white/20 to-transparent transform skew-x-12"></div>
            
            {/* Ground/foundation lines */}
            <div className="absolute bottom-0 w-full h-px bg-white/20"></div>
            <div className="absolute bottom-2 w-full h-px bg-white/10"></div>
            <div className="absolute bottom-4 w-full h-px bg-white/5"></div>
            
            {/* Logo placement - floating above the building */}
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20">
              <div className="relative bg-black/50 backdrop-blur-sm p-4 rounded-lg border border-white/10">
                <Image src='/rdrdc-logo.png' height={70} width={70} alt="rdrdc-logo" />
              </div>
            </div>
            
            {/* Architectural detail lines extending outward */}
            <div className="absolute top-1/4 left-0 w-12 h-px bg-gradient-to-l from-white/10 to-transparent"></div>
            <div className="absolute top-1/3 right-0 w-12 h-px bg-gradient-to-r from-white/10 to-transparent"></div>
            <div className="absolute top-1/2 left-0 w-16 h-px bg-gradient-to-l from-white/15 to-transparent"></div>
            <div className="absolute top-1/2 right-0 w-16 h-px bg-gradient-to-r from-white/15 to-transparent"></div>
            
            {/* Blueprint-style corner marks */}
            <div className="absolute top-0 left-0">
              <div className="w-8 h-px bg-white/20"></div>
              <div className="w-px h-8 bg-white/20"></div>
            </div>
            <div className="absolute top-0 right-0">
              <div className="w-8 h-px bg-white/20 absolute right-0"></div>
              <div className="w-px h-8 bg-white/20 absolute right-0"></div>
            </div>
            <div className="absolute bottom-0 left-0">
              <div className="w-8 h-px bg-white/20 absolute bottom-0"></div>
              <div className="w-px h-8 bg-white/20 absolute bottom-0"></div>
            </div>
            <div className="absolute bottom-0 right-0">
              <div className="w-8 h-px bg-white/20 absolute right-0 bottom-0"></div>
              <div className="w-px h-8 bg-white/20 absolute right-0 bottom-0"></div>
            </div>
          </div>
          
          {/* Centered branding */}
          <div className="text-center">
            <h1 className="text-white text-4xl font-bold mb-3 whitespace-nowrap">RD Realty Development Corporation</h1>
            <p className="text-gray-400 text-base">Property Management System</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-5/12 bg-black/95 backdrop-blur-sm flex items-center justify-center p-6 lg:p-8 relative z-10 border-l border-gray-900/50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center gap-3 mb-8">
            <Image src='/rdrdc-logo.png' height={60} width={60} alt="rdrdc-logo" />
            <div className="text-center">
              <h1 className="text-gray-50 text-xl font-bold">RD Realty Development Corp</h1>
              <p className="text-gray-500 text-xs">Property Management System</p>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-gray-50 text-3xl font-semibold mb-2">
              {showTwoFactor ? "Two-Factor Authentication" : "Welcome back! 👋"}
            </h2>
            {!showTwoFactor && (
              <p className="text-gray-400">Access your property management dashboard</p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {showTwoFactor ? (
              // --- 2FA Code Field ---
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Verification Code
                </label>
                <Controller
                  name="code"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="123456"
                      disabled={isLoading}
                      className="w-full h-14 bg-black border border-gray-800 rounded-lg px-4 text-gray-100 text-xl tracking-wider text-center focus:border-white focus:outline-none transition-all duration-200 focus:ring-1 focus:ring-white/20"
                    />
                  )}
                />
                {errors.code && (
                  <p className="text-red-400 text-sm mt-1">{errors.code.message}</p>
                )}
              </div>
            ) : (
              <>
                {/* --- Email Field --- */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="email"
                        placeholder="Enter your email address"
                        disabled={isLoading}
                        className="w-full h-14 bg-black border border-gray-800 rounded-lg px-4 text-gray-100 focus:border-white focus:outline-none transition-all duration-200 focus:ring-1 focus:ring-white/20"
                      />
                    )}
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                {/* --- Password Field --- */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-gray-300 text-sm font-medium">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <Controller
                      name="password"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          disabled={isLoading}
                          className="w-full h-14 bg-black border border-gray-800 rounded-lg px-4 pr-12 text-gray-100 focus:border-white focus:outline-none transition-all duration-200 focus:ring-1 focus:ring-white/20"
                        />
                      )}
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
                  )}
                </div>

                {/* --- Remember Me --- */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="remember"
                      className="w-4 h-4 text-white bg-black border-gray-700 rounded focus:ring-white focus:ring-2"
                    />
                    <label htmlFor="remember" className="ml-2 text-gray-400 text-sm">
                      Remember me
                    </label>
                  </div>
                  <Link 
                    href="/auth/forgot-password" 
                    className="text-white hover:text-gray-300 text-sm font-medium transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              </>
            )}

            {/* Error and Success Messages */}
            <FormError message={error} />
            <FormSuccess message={success} />

            {/* --- Submit Button --- */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-white hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-500 text-black font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-white/20"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                  <span>{showTwoFactor ? "Verifying..." : "Signing in..."}</span>
                </>
              ) : (
                <span>{showTwoFactor ? "Verify & Access System" : "Login"}</span>
              )}
            </button>

            {/* Footer Links */}
            {!showTwoFactor && (
              <div className="text-center pt-4 border-t border-gray-900/50">
                <p className="text-gray-500 text-sm">
                  Need access to the system?{' '}
                  <Link 
                    href="/auth/register" 
                    className="text-white hover:text-gray-300 font-medium transition-colors"
                  >
                    Request Account
                  </Link>
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}