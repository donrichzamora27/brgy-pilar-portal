import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AdminRoute from './routes/AdminRoute';
import Navbar from './components/common/Navbar';
import AnnouncementsPage from './pages/public/AnnouncementsPage';
import AchievementsPage from './pages/public/AchievementsPage';
import ProposalsPage from './pages/public/ProposalsPage';
import OfficialsPage from './pages/public/OfficialsPage';
import PostDetailPage from './pages/public/PostDetailPage';
import OfficialsAdminPage from './pages/admin/OfficialsAdminPage';
import ApprovalQueuePage from './pages/admin/ApprovalQueuePage';
import PostEditorPage from './pages/admin/PostEditorPage';
import ResidentLoginPage from './pages/auth/ResidentLoginPage';
import ResidentRegisterPage from './pages/auth/ResidentRegisterPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Navigate to="/announcements" replace />} />
                <Route path="/announcements" element={<AnnouncementsPage />} />
                <Route path="/achievements" element={<AchievementsPage />} />
                <Route path="/proposals" element={<ProposalsPage />} />
                <Route path="/officials" element={<OfficialsPage />} />
                <Route path="/posts/:slug" element={<PostDetailPage />} />

                <Route path="/login" element={<ResidentLoginPage />} />
                <Route path="/register" element={<ResidentRegisterPage />} />
                <Route path="/admin/login" element={<AdminLoginPage />} />

                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <ApprovalQueuePage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/posts"
                  element={
                    <AdminRoute>
                      <ApprovalQueuePage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/posts/new"
                  element={
                    <AdminRoute>
                      <PostEditorPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/posts/:id/edit"
                  element={
                    <AdminRoute>
                      <PostEditorPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/officials"
                  element={
                    <AdminRoute>
                      <OfficialsAdminPage />
                    </AdminRoute>
                  }
                />

                <Route path="*" element={<Navigate to="/announcements" replace />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}