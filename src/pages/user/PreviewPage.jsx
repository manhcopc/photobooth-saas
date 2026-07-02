import { usePreviewLogic } from '../../hooks/usePreviewLogic'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { MobilePreviewUI } from '../../components/mobile/MobilePreviewUI'
import { DesktopPreviewUI } from '../../components/desktop/DesktopPreviewUI'

export function PreviewPage() {
  const logic = usePreviewLogic()
  const isDesktop = useMediaQuery('(min-width: 1280px)')

  if (isDesktop) {
    return <DesktopPreviewUI {...logic} />
  }

  return <MobilePreviewUI {...logic} />
}
