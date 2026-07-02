import { useBoothStartLogic } from '../../hooks/useBoothStartLogic'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { MobileBoothStartUI } from '../../components/mobile/MobileBoothStartUI'
import { DesktopBoothStartUI } from '../../components/desktop/DesktopBoothStartUI'

export function BoothStartPage() {
  const logic = useBoothStartLogic()
  const isDesktop = useMediaQuery('(min-width: 1280px)')

  if (isDesktop) {
    return <DesktopBoothStartUI {...logic} />
  }

  return <MobileBoothStartUI {...logic} />
}
