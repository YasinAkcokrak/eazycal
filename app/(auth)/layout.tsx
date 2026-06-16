import { Camera } from "lucide-react"
import { getTranslations } from "next-intl/server"

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("auth.branding")

  const features = [
    { icon: "📸", text: t("feature1") },
    { icon: "🤖", text: t("feature2") },
    { icon: "📊", text: t("feature3") },
  ]

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* Left — gradient brand panel */}
      <div className="md:w-1/2 bg-gradient-to-br from-[#E24B4A] to-[#c53030] flex flex-col items-center justify-center p-8 md:p-12 text-white">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/20 backdrop-blur mb-6 mx-auto">
            <Camera className="h-8 w-8 text-white" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">EazyCal</h1>
          <p className="mt-3 text-lg md:text-xl text-white/85 font-medium">{t("tagline")}</p>

          <ul className="hidden md:flex flex-col gap-3 mt-10 text-left">
            {features.map(({ icon, text }) => (
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
