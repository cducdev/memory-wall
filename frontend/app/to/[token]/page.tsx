'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { publicAPI } from '@/lib/api'
import HandGestureDetector from '@/components/HandGestureDetector'
import Image from 'next/image'

interface Memory {
  content: string
  emoji?: string
  image_url?: string
}

export default function MemoryPage() {
  const params = useParams()
  const token = params?.token as string | undefined
  const [data, setData] = useState<{ receiver_name: string; memories: Memory[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [handGestureEnabled, setHandGestureEnabled] = useState(false)
  const [zoomScale, setZoomScale] = useState(1)

  useEffect(() => {
    const fetchMemory = async () => {
      if (!token) {
        setError('Token không hợp lệ')
        setLoading(false)
        return
      }
      
      try {
        const result = await publicAPI.getMemory(token)
        setData(result)
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Không tìm thấy memory')
      } finally {
        setLoading(false)
      }
    }

    fetchMemory()
  }, [token])

  useEffect(() => {
    document.documentElement.style.setProperty('--zoom-scale', zoomScale.toString())
  }, [zoomScale])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-spin">💖</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Không tìm thấy memory</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>
      
      <div className="max-w-3xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            {data.receiver_name} 💖
          </h1>
          <p className="text-gray-600">Những kỷ niệm dành cho bạn</p>
        </motion.div>

        <div className="space-y-8">
          {data.memories.map((memory, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
              }}
              transition={{ 
                delay: index * 0.3,
                duration: 0.6,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{ 
                scale: 1.02,
                y: -10,
                transition: { duration: 0.3 }
              }}
              className="card relative"
              style={{
                transform: `scale(var(--zoom-scale, 1))`,
                transformOrigin: 'center',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 40px rgba(236, 72, 153, 0.1)',
              }}
            >
              {/* Floating animation */}
              <motion.div
                animate={{
                  y: [0, -15, 0],
                }}
                transition={{
                  duration: 4 + index * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative"
              >
                {memory.emoji && (
                  <motion.div 
                    className="text-6xl mb-4 text-center"
                    animate={{
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    {memory.emoji}
                  </motion.div>
                )}
                
                <p className="text-lg text-gray-800 mb-4 whitespace-pre-wrap leading-relaxed font-serif">
                  {memory.content}
                </p>

                {memory.image_url && (
                  <motion.div 
                    className="mt-4 rounded-lg overflow-hidden"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Image
                      src={memory.image_url}
                      alt="Memory"
                      width={800}
                      height={600}
                      className="w-full h-auto rounded-lg shadow-xl"
                    />
                  </motion.div>
                )}
              </motion.div>
              
              {/* Decorative elements */}
              <div className="absolute -top-2 -right-2 w-20 h-20 bg-pink-200 rounded-full opacity-20 blur-2xl"></div>
              <div className="absolute -bottom-2 -left-2 w-24 h-24 bg-purple-200 rounded-full opacity-20 blur-2xl"></div>
            </motion.div>
          ))}
        </div>

        {data.memories.length === 0 && (
          <div className="card text-center">
            <div className="text-6xl mb-4">💭</div>
            <p className="text-gray-600">Chưa có memory nào</p>
          </div>
        )}
      </div>

      {/* Hand Gesture Control */}
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={() => setHandGestureEnabled(!handGestureEnabled)}
          className="bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all"
          title="Bật/tắt hand gesture control"
        >
          {handGestureEnabled ? '👋' : '✋'}
        </button>
      </div>

      <HandGestureDetector
        enabled={handGestureEnabled}
        onZoomChange={setZoomScale}
      />
    </div>
  )
}

