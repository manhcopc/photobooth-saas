import { useCaptureLogic } from '../../hooks/useCaptureLogic'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { MobileCaptureUI } from '../../components/mobile/MobileCaptureUI'
import { DesktopCaptureUI } from '../../components/desktop/DesktopCaptureUI'

export function CapturePage() {
  const logic = useCaptureLogic()
  const isDesktop = useMediaQuery('(min-width: 1280px)')

  useKeyboardShortcuts({
    ' ': logic.handleStart,
    'escape': () => logic.navigate(`/e/${logic.event?.slug}`),
  })

  if (isDesktop) {
    return <DesktopCaptureUI {...logic} />
  }

  return <MobileCaptureUI {...logic} />
}

