'use client'

import { useEffect, useRef, useState } from 'react'
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection'
import '@tensorflow/tfjs-core'
import '@tensorflow/tfjs-backend-webgl'

interface HandGestureDetectorProps {
  onZoomChange: (scale: number) => void
  enabled: boolean
}

export default function HandGestureDetector({ onZoomChange, enabled }: HandGestureDetectorProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [showGuide, setShowGuide] = useState(true)
  const detectorRef = useRef<handPoseDetection.HandDetector | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const lastDistanceRef = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled) return

    const initHandDetection = async () => {
      try {
        const model = handPoseDetection.SupportedModels.MediaPipeHands
        const detectorConfig = {
          runtime: 'mediapipe' as const,
          solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
          modelType: 'full' as const,
        }

        const detector = await handPoseDetection.createDetector(model, detectorConfig)
        detectorRef.current = detector

        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
          setIsInitialized(true)
        }

        const detectHands = async () => {
          if (!videoRef.current || !detectorRef.current || !enabled) return

          const hands = await detectorRef.current.estimateHands(videoRef.current)

          if (hands.length >= 2) {
            // Calculate distance between two index fingers
            const hand1 = hands[0]
            const hand2 = hands[1]

            const index1 = hand1.keypoints.find((kp) => kp.name === 'index_finger_tip')
            const index2 = hand2.keypoints.find((kp) => kp.name === 'index_finger_tip')

            if (index1 && index2) {
              const distance = Math.sqrt(
                Math.pow(index1.x - index2.x, 2) + Math.pow(index1.y - index2.y, 2)
              )

              if (lastDistanceRef.current !== null) {
                const diff = lastDistanceRef.current - distance
                // Pinch in = zoom out, pinch out = zoom in
                if (Math.abs(diff) > 0.05) {
                  const scaleChange = diff * 0.5
                  const currentScale = parseFloat(
                    document.documentElement.style.getPropertyValue('--zoom-scale') || '1'
                  )
                  const newScale = Math.max(0.5, Math.min(2, currentScale + scaleChange))
                  document.documentElement.style.setProperty('--zoom-scale', newScale.toString())
                  onZoomChange(newScale)
                }
              }

              lastDistanceRef.current = distance
            }
          } else {
            lastDistanceRef.current = null
          }

          animationFrameRef.current = requestAnimationFrame(detectHands)
        }

        detectHands()
      } catch (error) {
        console.error('Error initializing hand detection:', error)
      }
    }

    initHandDetection()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      }
      if (detectorRef.current) {
        detectorRef.current.dispose()
      }
    }
  }, [enabled, onZoomChange])

  if (!enabled) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {showGuide && (
        <div className="bg-white rounded-lg shadow-lg p-4 mb-2 max-w-xs">
          <button
            onClick={() => setShowGuide(false)}
            className="float-right text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
          <p className="text-sm text-gray-700">
            <strong>Hướng dẫn:</strong> Đưa 2 ngón tay trỏ lên camera và thực hiện cử chỉ pinch để
            zoom in/out
          </p>
        </div>
      )}
      <div className="relative">
        <video
          ref={videoRef}
          className="w-32 h-24 rounded-lg border-2 border-pink-400 object-cover"
          style={{ transform: 'scaleX(-1)' }}
          muted
        />
        {isInitialized && (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
            <span className="text-white text-xs">Hand Detection Active</span>
          </div>
        )}
      </div>
    </div>
  )
}


