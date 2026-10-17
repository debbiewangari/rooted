// A bottom sheet: backdrop fades in, panel slides up from the screen edge.
// Stays mounted while closing so the slide-down transition can play instead
// of the content just disappearing.
export function Drawer({ open, onClose, title, children }) {
  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-card bg-pure-white px-6 pt-4 pb-8 shadow-xl-2 transition-transform duration-300 ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mx-auto h-1 w-10 rounded-pill bg-black/15" />
        <div className="mt-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-display text-lg font-semibold text-ink-black">{title}</h2>}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-pill text-black/40"
          >
            ✕
          </button>
        </div>
        <div className="mt-2">{children}</div>
      </div>
    </>
  )
}
