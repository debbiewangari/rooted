import { Route, Routes } from 'react-router-dom'
import { NavBar } from './components/NavBar'
import { Home } from './pages/Home'
import { Library } from './pages/Library'
import { JournalEntry } from './pages/JournalEntry'
import { Bible } from './pages/Bible'
import { Themes } from './pages/Themes'
import { ThemeNew } from './pages/ThemeNew'
import { ThemeDetail } from './pages/ThemeDetail'
import { CalendarDay } from './pages/CalendarDay'
import { CalendarPage } from './pages/CalendarPage'
import { EventDetail } from './pages/EventDetail'
import { EventEdit } from './pages/EventEdit'
import { EventDay } from './pages/EventDay'
import { Events } from './pages/Events'
import { Settings } from './pages/Settings'

export default function App() {
  return (
    <div className="min-h-screen bg-cream-paper pb-20">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/journal" element={<Library />} />
        <Route path="/journal/new" element={<JournalEntry />} />
        <Route path="/journal/:id" element={<JournalEntry />} />
        <Route path="/bible" element={<Bible />} />
        <Route path="/themes" element={<Themes />} />
        <Route path="/themes/new" element={<ThemeNew />} />
        <Route path="/themes/:id" element={<ThemeDetail />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/calendar/:date" element={<CalendarDay />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/events/:id/edit" element={<EventEdit />} />
        <Route path="/events/:id/day/:date" element={<EventDay />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      <NavBar />
    </div>
  )
}
