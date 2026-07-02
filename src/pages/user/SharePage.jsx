import { useShareLogic } from '../../hooks/useShareLogic'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { MobileShareUI } from '../../components/mobile/MobileShareUI'
import { DesktopShareUI } from '../../components/desktop/DesktopShareUI'

export function SharePage() {
  const logic = useShareLogic()
  const isDesktop = useMediaQuery('(min-width: 1280px)')

  if (isDesktop) {
    return <DesktopShareUI {...logic} />
  }

  return <MobileShareUI {...logic} />
}
