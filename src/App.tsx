import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppLayout, RequireAuth } from './components/AppLayout'
import { LandingPage } from './pages/Landing'
import { LoginPage } from './pages/Login'
import { RegisterPage } from './pages/Register'
import { HomePage } from './pages/Home'
import { CreatePage } from './pages/Create'
import { ProfilePage } from './pages/Profile'
import { EditProfilePage } from './pages/EditProfile'
import { ExplorePage } from './pages/Explore'
import { ActivityPage } from './pages/Activity'
import { MessagesPage } from './pages/Messages'
import { ChatPage } from './pages/Chat'
import { ReelsPage } from './pages/Reels'
import { PostDetailPage } from './pages/PostDetail'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || undefined}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<RequireAuth />}>
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<HomePage />} />
              <Route path="create" element={<CreatePage />} />
              <Route path="explore" element={<ExplorePage />} />
              <Route path="reels" element={<ReelsPage />} />
              <Route path="activity" element={<ActivityPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="edit-profile" element={<EditProfilePage />} />
              <Route path="u/:uid" element={<ProfilePage />} />
              <Route path="post/:postId" element={<PostDetailPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="messages/:conversationId" element={<ChatPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
