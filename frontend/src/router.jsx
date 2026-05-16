import { Navigate, createBrowserRouter } from 'react-router-dom'

import App from './App.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { isShowcaseMode } from './config/showcase.js'
import Dashboard from './pages/Dashboard.jsx'
import Login from './pages/Login.jsx'
import NewTask from './pages/NewTask.jsx'
import Register from './pages/Register.jsx'
import Settings from './pages/Settings.jsx'
import TaskDetail from './pages/TaskDetail.jsx'
import TaskHistory from './pages/TaskHistory.jsx'

export const router = createBrowserRouter([
  { path: '/login', element: isShowcaseMode ? <Navigate to="/" replace /> : <Login /> },
  { path: '/register', element: isShowcaseMode ? <Navigate to="/" replace /> : <Register /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <App />,
        children: [
          { path: '/', element: <Dashboard /> },
          { path: '/tasks/new', element: <NewTask /> },
          { path: '/tasks', element: <TaskHistory /> },
          { path: '/tasks/:id', element: <TaskDetail /> },
          { path: '/settings', element: <Settings /> },
        ],
      },
    ],
  },
])
