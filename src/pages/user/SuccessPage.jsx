import { PartyPopper } from "lucide-react";
import { Button } from "../../components/common/Button";
import { useCurrentEvent } from "../../hooks/useCurrentEvent";
import { EventNotFoundPage } from "./EventNotFoundPage";
import { EventInactivePage } from "./EventInactivePage";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { getActiveSession } from "../../services/photoStorage";

export function SuccessPage() {
  const { event, loading } = useCurrentEvent();
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    if (event) {
      getActiveSession(event.id).then(setSessionId);
    }
  }, [event]);

  const baseUrl =
    import.meta.env.VITE_PUBLIC_APP_URL || "https://photobooth-saas.vercel.app";
  const successUrl = "https://photobooth-saas.vercel.app";
  const shareUrl = `${successUrl}/share/${sessionId}`;

  if (loading) {
    return (
      <div className="grid min-h-svh place-items-center p-6 font-bold text-purple-700 md:min-h-[820px]">
        Đang tải sự kiện...
      </div>
    );
  }

  if (!event) return <EventNotFoundPage />;
  if (event.status !== "active") return <EventInactivePage />;

  return (
    <div className="grid min-h-svh place-items-center p-6 text-center md:min-h-[820px]">
      <div>
        <div className="mx-auto grid h-28 w-28 place-items-center rounded-[2rem] bg-gradient-to-br from-pink-400 to-purple-600 text-white shadow-xl shadow-pink-200">
          <PartyPopper size={48} />
        </div>
        <h1 className="mt-8 text-4xl font-black text-slate-950">Hoàn tất!</h1>
        <p className="mt-3 text-sm font-semibold text-slate-500">
          Ảnh của bạn đã được lưu vào gallery của sự kiện {event.name}.
        </p>

        {sessionId && (
          <div className="mt-6 flex flex-col items-center">
            <p className="text-sm font-bold text-slate-600 mb-2">
              Quét mã để tải về điện thoại
            </p>
            <div className="rounded-2xl bg-white p-3 shadow-sm border border-slate-100 inline-block">
              <QRCodeSVG value={shareUrl} size={150} level="M" />
            </div>
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-xs font-semibold text-purple-600 underline"
            >
              Hoặc bấm vào đây để mở
            </a>
          </div>
        )}

        <Button className="mt-8 w-full" to={`/e/${event.slug}`}>
          Chụp lượt mới
        </Button>
      </div>
    </div>
  );
}
