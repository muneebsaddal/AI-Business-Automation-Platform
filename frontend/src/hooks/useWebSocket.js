import { useEffect, useMemo, useRef, useState } from 'react'

import { useAuthStore } from '../store/authStore'

function buildWebSocketUrl(taskId, token) {
  const apiUrl = import.meta.env.VITE_API_URL || window.location.origin
  const url = new URL(`/ws/${taskId}`, apiUrl)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.searchParams.set('token', token)
  return url.toString()
}

export function useWebSocket(taskId, { enabled = true, onComplete } = {}) {
  const token = useAuthStore((state) => state.accessToken)
  const [events, setEvents] = useState([])
  const [connectionState, setConnectionState] = useState('idle')
  const socketRef = useRef(null)
  const reconnectRef = useRef(null)

  const wsUrl = useMemo(() => {
    if (!taskId || !token) return null
    return buildWebSocketUrl(taskId, token)
  }, [taskId, token])

  useEffect(() => {
    if (!enabled || !wsUrl) return undefined

    let shouldReconnect = true

    const connect = () => {
      setConnectionState('connecting')
      const socket = new WebSocket(wsUrl)
      socketRef.current = socket

      socket.onopen = () => setConnectionState('open')
      socket.onmessage = (message) => {
        const event = JSON.parse(message.data)
        setEvents((current) => [...current, event])
        if (event.event === 'complete') {
          shouldReconnect = false
          setConnectionState('complete')
          onComplete?.(event)
          socket.close()
        }
      }
      socket.onerror = () => setConnectionState('error')
      socket.onclose = () => {
        socketRef.current = null
        if (shouldReconnect) {
          setConnectionState('reconnecting')
          reconnectRef.current = window.setTimeout(connect, 1500)
        }
      }
    }

    connect()

    return () => {
      shouldReconnect = false
      if (reconnectRef.current) window.clearTimeout(reconnectRef.current)
      socketRef.current?.close()
    }
  }, [enabled, wsUrl, onComplete])

  return { events, connectionState }
}

