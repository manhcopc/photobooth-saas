import { useSelectPhotosLogic } from '../../hooks/useSelectPhotosLogic'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { MobileSelectPhotosUI } from '../../components/mobile/MobileSelectPhotosUI'
import { DesktopSelectPhotosUI } from '../../components/desktop/DesktopSelectPhotosUI'

export function SelectPhotosPage() {
  const logic = useSelectPhotosLogic()
  const isDesktop = useMediaQuery('(min-width: 1280px)')

  if (isDesktop) {
    return <DesktopSelectPhotosUI {...logic} />
  }

  return <MobileSelectPhotosUI {...logic} />
}
