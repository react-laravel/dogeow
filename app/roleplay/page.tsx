import { HomeRoleplayCard } from '@/components/app/HomeRoleplayCard'
import { PageContainer } from '@/components/layout'

export default function RoleplayPage() {
  return (
    <>
      <div className="sr-only">
        <h1>角色对话</h1>
        <p>基于 MiniMax M2-her 的角色扮演对话页面。</p>
      </div>

      <PageContainer maxWidth="6xl" className="py-4 sm:py-6">
        <HomeRoleplayCard />
      </PageContainer>
    </>
  )
}
