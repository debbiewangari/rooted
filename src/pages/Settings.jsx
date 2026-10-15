import { useRef, useState } from 'react'
import { FilledButton, OutlinedButton } from '../components/Button'
import { exportAllData, importAllData } from '../lib/db'

export function Settings() {
  const fileRef = useRef(null)
  const [status, setStatus] = useState('')

  async function handleExport() {
    const data = await exportAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rooted-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setStatus('Importing…')
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await importAllData(data)
      setStatus('Import complete. Reload the app to see everything.')
    } catch {
      setStatus('Could not import that file — make sure it is a Rooted backup JSON.')
    }
    e.target.value = ''
  }

  return (
    <div className="min-h-screen px-6 pt-10 pb-6">
      <p className="font-label text-xs uppercase tracking-label text-deep-indigo">Settings</p>
      <h1 className="font-display text-4xl uppercase text-deep-indigo">Backup &amp; Restore</h1>
      <p className="mt-2 font-body text-sm text-black/60">
        Rooted keeps everything on this device only. Export a backup file to keep your data safe, move it to another
        device, or restore it later.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        <FilledButton type="button" onClick={handleExport}>
          Export data
        </FilledButton>

        <OutlinedButton type="button" onClick={() => fileRef.current?.click()}>
          Import data
        </OutlinedButton>
        <input ref={fileRef} type="file" accept="application/json" onChange={handleImportFile} className="sr-only" />

        {status && <p className="font-body text-sm text-black/60">{status}</p>}
      </div>
    </div>
  )
}
