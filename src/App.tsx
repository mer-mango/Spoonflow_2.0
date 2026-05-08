import { Navigate, Route, Routes } from 'react-router-dom'
import { MobileNav } from './components/layout/MobileNav'
import { Sidebar } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'
import { ToastProvider } from './components/shared/Toast'
import { CalendarPage } from './pages/CalendarPage'
import { ContactsPage } from './pages/ContactsPage'
import { ContentEditorPage } from './pages/ContentEditorPage'
import { ContentPage } from './pages/ContentPage'
import { GoalsPage } from './pages/GoalsPage'
import { NurturePage } from './pages/NurturePage'
import { SettingsPage } from './pages/SettingsPage'
import { TasksPage } from './pages/TasksPage'
import { TodayPage } from './pages/TodayPage'

function App() {
  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-[var(--bg)]">
        <Sidebar />
        <main className="w-full p-4 pb-24 lg:p-8">
          <TopBar />
          <Routes>
            <Route path="/" element={<Navigate to="/today" />} />
            <Route path="/today" element={<TodayPage />} />
           <Route path="/contacts" element={<ContactsPage />} />
<Route path="/contacts/new" element={<ContactsPage />} />
<Route path="/contacts/:id" element={<ContactsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/content" element={<ContentPage />} />
            <Route path="/content/:id" element={<ContentEditorPage />} />
            <Route path="/content/new" element={<ContentEditorPage />} />
            <Route path="/nurture" element={<NurturePage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/:section" element={<SettingsPage />} />
          </Routes>
        </main>
        <MobileNav />
      </div>
    </ToastProvider>
  )
}

export default App
