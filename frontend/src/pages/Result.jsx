// Placeholder page — Result (Week 8 will add win/lose + Elo delta display)
export default function Result() {
  return (
    <div className="min-h-screen flex items-center justify-center animate-fade-in">
      <div className="card max-w-md w-full text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-xl bg-arena-yellow/20 flex items-center justify-center">
          <svg className="w-6 h-6 text-arena-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-arena-text">Match Result</h1>
        <p className="text-arena-muted text-sm">Win/Lose screen + Elo delta coming in Week 8</p>
        <div className="flex gap-3 justify-center">
          <a href="/lobby" className="btn-primary text-sm">Play Again →</a>
        </div>
      </div>
    </div>
  )
}
