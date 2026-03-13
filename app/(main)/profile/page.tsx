import { Header } from "@/components/header"
import { ProfilePage } from "@/components/profile/profile-page"

export default function ProfilePageRoute() {
  return (
    <>
      <Header title="User Profile & Settings" />
      <main className="flex-1 overflow-auto">
        <ProfilePage />
      </main>
    </>
  )
}
