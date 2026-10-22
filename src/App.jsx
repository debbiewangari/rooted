import { Route, Routes } from 'react-router-dom'
import { NavBar } from './components/NavBar'
import { Home } from './pages/Home'
import { Search } from './pages/Search'
import { Library } from './pages/Library'
import { JournalEntry } from './pages/JournalEntry'
import { Bible } from './pages/Bible'
import { BibleRead } from './pages/BibleRead'
import { SavedVerses } from './pages/SavedVerses'
import { Themes } from './pages/Themes'
import { ThemeNew } from './pages/ThemeNew'
import { ThemeDetail } from './pages/ThemeDetail'
import { ThemeEdit } from './pages/ThemeEdit'
import { SeriesList } from './pages/SeriesList'
import { SeriesNew } from './pages/SeriesNew'
import { SeriesDetail } from './pages/SeriesDetail'
import { SeriesEdit } from './pages/SeriesEdit'
import { CalendarDay } from './pages/CalendarDay'
import { CalendarPage } from './pages/CalendarPage'
import { EventDetail } from './pages/EventDetail'
import { EventEdit } from './pages/EventEdit'
import { EventDay } from './pages/EventDay'
import { Events } from './pages/Events'
import { Settings } from './pages/Settings'
import { Login } from './pages/Login'
import { useAuth } from './lib/auth.jsx'
import { supabaseConfigured } from './lib/supabase'

export default function App() {
  const { user, loading } = useAuth()

  if (supabaseConfigured && loading) {
    return <div className="min-h-screen bg-white" />
  }

  if (!supabaseConfigured || !user) {
    return <Login />
  }

  return (
    <div className="min-h-screen bg-cream-paper pb-20">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/journal" element={<Library />} />
        <Route path="/journal/new" element={<JournalEntry />} />
        <Route path="/journal/:id" element={<JournalEntry />} />
        <Route path="/series" element={<SeriesList />} />
        <Route path="/series/new" element={<SeriesNew />} />
        <Route path="/series/:id" element={<SeriesDetail />} />
        <Route path="/series/:id/edit" element={<SeriesEdit />} />
        <Route path="/bible" element={<Bible />} />
        <Route path="/bible/read" element={<BibleRead />} />
        <Route path="/bible/saved" element={<SavedVerses />} />
        <Route path="/themes" element={<Themes />} />
        <Route path="/themes/new" element={<ThemeNew />} />
        <Route path="/themes/:id" element={<ThemeDetail />} />
        <Route path="/themes/:id/edit" element={<ThemeEdit />} />
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
