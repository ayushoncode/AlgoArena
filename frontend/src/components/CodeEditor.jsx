// Stub — CodeEditor wrapper around Monaco (Day 19)
export default function CodeEditor({ value, onChange, language = 'javascript' }) {
  return (
    <div className="w-full h-full bg-arena-surface border border-arena-border rounded-xl flex items-center justify-center">
      <p className="text-arena-muted text-sm">Monaco Editor loads here (Day 19)</p>
    </div>
  )
}
