import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import OnboardingClient from "./onboarding-client"

export default async function OnboardingPage() {
  const session = await auth()
  const userId = session!.user.id

  const userProfile = await prisma.userProfile.findUnique({ where: { userId } })
  if (userProfile) redirect("/dashboard")

  return <OnboardingClient userName={session!.user.name ?? ""} />
}
