import { Camera } from "lucide-react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* Left — gradient brand panel */}
      <div className="md:w-1/2 bg-gradient-to-br from-[#E24B4A] to-[#c53030] flex flex-col items-center justify-center p-8 md:p-12 text-white">
        {/* Mobile: compact header; Desktop: centred hero */}
        <div className="text-center max-w-sm">
          {/* Logo mark */}
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/20 backdrop-blur mb-6 mx-auto">
            <Camera className="h-8 w-8 text-white" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">EazyCal</h1>
          <p className="mt-3 text-lg md:text-xl text-white/85 font-medium">Track calories with AI</p>

          {/* Feature bullets — hidden on mobile to keep it compact */}
          <ul className="hidden md:flex flex-col gap-3 mt-10 text-left">
            {[
              { icon: "📸", text: "Photograph your meal to log it instantly" },
              { icon: "🤖", text: "AI estimates calories and macros" },
              { icon: "📊", text: "Track progress toward your daily goals" },
            ].map(({ icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="text-xl leading-none mt-0.5">{icon}</span>
                <span className="text-white/80 text-sm leading-snug">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-background min-h-[60vh] md:min-h-screen">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

    </div>
  )
}
