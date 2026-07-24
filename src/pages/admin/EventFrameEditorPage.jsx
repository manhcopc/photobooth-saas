import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { FrameLayoutEditor } from "../../components/admin/FrameLayoutEditor";
import { defaultFrameConfig } from "../../data/mockEvents";
import {
  getEventBySlug,
  updateEvent,
  uploadEventFrame,
} from "../../services/eventService";
import {
  createDefaultSlots,
  createEventFrame,
  FRAME_RENDER_MODES,
  getFrameById,
  getFramesByEventId,
  normalizeFrameLayout,
  setDefaultFrame,
  updateEventFrame,
  uploadFrameAsset,
} from "../../services/eventFrameService";

const loadLocalImageSize = (file, fallback) =>
  new Promise((resolve) => {
    if (!file) return resolve(fallback);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(fallback);
    };
    img.src = url;
  });

const getLocalPreviewUrl = (file) => (file ? URL.createObjectURL(file) : "");

const inspectImageFile = (file) =>
  new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      const canvas = document.createElement("canvas");
      const maxSampleSize = 360;
      const scale = Math.min(1, maxSampleSize / Math.max(width, height));
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      ).data;
      let hasAlpha = false;
      for (let index = 3; index < pixels.length; index += 4) {
        if (pixels[index] < 255) {
          hasAlpha = true;
          break;
        }
      }
      URL.revokeObjectURL(url);
      resolve({ width, height, hasAlpha, type: file.type });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Không thể đọc file ảnh."));
    };
    image.src = url;
  });

const buildAssetWarnings = ({ backgroundMeta, overlayMeta, renderMode }) => {
  const warnings = [];
  if (overlayMeta && !overlayMeta.hasAlpha) {
    warnings.push(
      "Overlay này không có vùng trong suốt, ảnh chụp có thể bị che mất."
    );
  }
  if (
    renderMode === FRAME_RENDER_MODES.backgroundOverlay &&
    backgroundMeta &&
    overlayMeta &&
    (backgroundMeta.width !== overlayMeta.width ||
      backgroundMeta.height !== overlayMeta.height)
  ) {
    warnings.push(
      `Background (${backgroundMeta.width}x${backgroundMeta.height}) và overlay (${overlayMeta.width}x${overlayMeta.height}) khác kích thước.`
    );
  }
  return warnings;
};

export function EventFrameEditorPage() {
  const { slug, frameId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const mode = frameId
    ? "edit"
    : location.pathname.endsWith("/frames/new")
    ? "new"
    : "legacy";
  const [event, setEvent] = useState(null);
  const [currentFrame, setCurrentFrame] = useState(null);
  const [layout, setLayout] = useState(
    normalizeFrameLayout(defaultFrameConfig, defaultFrameConfig.overlaySrc)
  );
  const [renderMode, setRenderMode] = useState(FRAME_RENDER_MODES.overlayOnly);
  const [preferredCameraFacing, setPreferredCameraFacing] = useState("user");
  const [preferredOrientation, setPreferredOrientation] = useState("portrait");
  const [overlayUrl, setOverlayUrl] = useState(defaultFrameConfig.overlaySrc);
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [overlayFile, setOverlayFile] = useState(null);
  const [backgroundFile, setBackgroundFile] = useState(null);
  const [overlayMeta, setOverlayMeta] = useState(null);
  const [backgroundMeta, setBackgroundMeta] = useState(null);
  const [assetWarnings, setAssetWarnings] = useState([]);
  const [frameName, setFrameName] = useState("Frame mới");
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const data = await getEventBySlug(slug);
      if (!mounted || !data) return;
      setEvent(data);

      if (frameId) {
        const frame = await getFrameById(frameId);
        if (!mounted || !frame) return;
        setCurrentFrame(frame);
        setFrameName(frame.name);
        setSetAsDefault(frame.isDefault);
        setRenderMode(frame.renderMode || FRAME_RENDER_MODES.overlayOnly);
        setPreferredCameraFacing(frame.preferredCameraFacing || "user");
        setPreferredOrientation(frame.preferredOrientation || "portrait");
        setOverlayUrl(frame.overlayUrl || frame.frameUrl || "");
        setBackgroundUrl(frame.backgroundUrl || "");
        setLayout(
          normalizeFrameLayout(
            frame.layoutConfig,
            frame.overlayUrl || frame.frameUrl
          )
        );
        setOverlayMeta(null);
        setBackgroundMeta(null);
        setAssetWarnings([]);
        return;
      }

      if (mode === "legacy") {
        const legacyFrameUrl = data.frameUrl || defaultFrameConfig.overlaySrc;
        setRenderMode(FRAME_RENDER_MODES.overlayOnly);
        setPreferredCameraFacing("user");
        setPreferredOrientation("portrait");
        setOverlayUrl(legacyFrameUrl);
        setBackgroundUrl("");
        setLayout(normalizeFrameLayout(data.layoutConfig, legacyFrameUrl));
        setOverlayMeta(null);
        setBackgroundMeta(null);
        setAssetWarnings([]);
      } else {
        setFrameName("Frame mới");
        setRenderMode(FRAME_RENDER_MODES.overlayOnly);
        setPreferredCameraFacing("user");
        setPreferredOrientation("portrait");
        setOverlayUrl("");
        setBackgroundUrl("");
        setLayout(normalizeFrameLayout(defaultFrameConfig, ""));
        setOverlayMeta(null);
        setBackgroundMeta(null);
        setAssetWarnings([]);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [frameId, mode, slug]);

  const title = useMemo(() => {
    if (mode === "new") return "Thêm frame";
    if (mode === "edit") return "Chỉnh bố cục frame";
    return "Chỉnh frame legacy";
  }, [mode]);

  const onSlotChange = (index, field, value) => {
    setLayout((current) => ({
      ...current,
      slots: current.slots.map((slot, slotIndex) =>
        slotIndex === index ? { ...slot, [field]: Number(value) } : slot
      ),
    }));
  };

  const onTextBoxChange = (field, value) => {
    setLayout((current) => ({
      ...current,
      textBox: {
        ...(current.textBox || {
          x: 0,
          y: 0,
          width: 400,
          height: 100,
          fontSize: 40,
          fontFamily: "Arial",
          color: "#000000",
          align: "center",
        }),
        [field]: ["x", "y", "width", "height", "fontSize"].includes(field)
          ? Number(value)
          : value,
      },
    }));
  };

  const toggleTextBox = (e) => {
    const checked = e.target.checked;
    setLayout((current) => {
      const next = { ...current };
      if (checked) {
        next.textBox = next.textBox || {
          x: Math.round(current.canvas.width / 2 - 200),
          y: Math.round(current.canvas.height - 200),
          width: 400,
          height: 100,
          fontSize: 60,
          fontFamily: "Arial",
          color: "#000000",
          align: "center",
        };
      } else {
        delete next.textBox;
      }
      return next;
    });
  };

  const applyAssetDimension = async (file, previewUrl) => {
    const dimension = await loadLocalImageSize(file, layout.canvas);
    setLayout((current) => ({
      ...current,
      canvas: dimension,
      outputWidth: dimension.width,
      outputHeight: dimension.height,
      overlaySrc: previewUrl || current.overlaySrc,
      slots:
        current?.slots?.length === 3
          ? current.slots
          : createDefaultSlots(dimension.width, dimension.height),
    }));
  };

  const onUploadOverlay = async (file) => {
    if (!file) return;
    if (!["image/png", "image/webp"].includes(file.type)) {
      setMessage("Overlay phải là file PNG hoặc WebP.");
      return;
    }
    setMessage("");
    const metadata = await inspectImageFile(file);
    setOverlayMeta(metadata);
    setAssetWarnings(
      buildAssetWarnings({ backgroundMeta, overlayMeta: metadata, renderMode })
    );
    setOverlayFile(file);
    const localUrl = getLocalPreviewUrl(file);
    setOverlayUrl(localUrl);
    await applyAssetDimension(file, localUrl);
  };

  const onUploadBackground = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Background phải là file ảnh hợp lệ.");
      return;
    }
    setMessage("");
    const metadata = await inspectImageFile(file);
    setBackgroundMeta(metadata);
    setAssetWarnings(
      buildAssetWarnings({ backgroundMeta: metadata, overlayMeta, renderMode })
    );
    setBackgroundFile(file);
    const localUrl = getLocalPreviewUrl(file);
    setBackgroundUrl(localUrl);
    await applyAssetDimension(file, overlayUrl);
  };

  const resetDefault = () => {
    setLayout((current) => ({
      ...current,
      slots: createDefaultSlots(current.canvas.width, current.canvas.height),
    }));
    setMessage("Đã đặt lại mặc định.");
  };

  const validate = () => {
    if (!layout.canvas.width || !layout.canvas.height)
      return "Canvas không hợp lệ.";
    if (!Array.isArray(layout.slots) || layout.slots.length !== 3)
      return "Cần đúng 3 vùng ảnh.";
    if (
      layout.slots.some(
        (slot) =>
          !Number.isFinite(Number(slot.x)) ||
          !Number.isFinite(Number(slot.y)) ||
          slot.width <= 0 ||
          slot.height <= 0
      )
    )
      return "Layout config không hợp lệ. Vui lòng kiểm tra x/y/width/height của từng vùng ảnh.";
    if (!overlayFile && !overlayUrl)
      return "Vui lòng upload overlay image cho frame.";
    if (mode !== "legacy" && !frameName.trim())
      return "Vui lòng nhập tên frame.";
    return "";
  };

  const save = async () => {
    if (!event) return;
    const error = validate();
    if (error) {
      setMessage(error);
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const targetFrameId = currentFrame?.id || frameId || `new-${Date.now()}`;
      let uploadedOverlayUrl =
        currentFrame?.overlayUrl ||
        currentFrame?.frameUrl ||
        (mode === "legacy" ? event.frameUrl : overlayUrl);
      let uploadedBackgroundUrl =
        currentFrame?.backgroundUrl || backgroundUrl || "";

      if (overlayFile) {
        uploadedOverlayUrl =
          mode === "legacy"
            ? await uploadEventFrame({
                eventSlug: event.slug,
                file: overlayFile,
              })
            : await uploadFrameAsset({
                eventSlug: event.slug,
                file: overlayFile,
                assetType: "overlay",
                frameId: targetFrameId,
              });
      }
      if (backgroundFile && mode !== "legacy") {
        uploadedBackgroundUrl = await uploadFrameAsset({
          eventSlug: event.slug,
          file: backgroundFile,
          assetType: "background",
          frameId: targetFrameId,
        });
      }

      const nextLayout = normalizeFrameLayout(
        { ...layout, overlaySrc: uploadedOverlayUrl },
        uploadedOverlayUrl
      );

      if (mode === "new") {
        const existingFrames = await getFramesByEventId(event.id);
        const shouldBeDefault = setAsDefault || existingFrames.length === 0;
        const created = await createEventFrame({
          eventId: event.id,
          name: frameName.trim(),
          frameUrl: uploadedOverlayUrl,
          overlayUrl: uploadedOverlayUrl,
          backgroundUrl:
            renderMode === FRAME_RENDER_MODES.backgroundOverlay
              ? uploadedBackgroundUrl
              : "",
          renderMode,
          preferredCameraFacing,
          preferredOrientation,
          layoutConfig: nextLayout,
          isDefault: shouldBeDefault,
          isActive: true,
          sortOrder: existingFrames.length,
        });
        if (shouldBeDefault) await setDefaultFrame(event.id, created.id);
        navigate(`/admin/events/${event.slug}`, { replace: true });
        return;
      }

      if (mode === "edit" && currentFrame) {
        await updateEventFrame(currentFrame.id, {
          ...currentFrame,
          name: frameName.trim(),
          frameUrl: uploadedOverlayUrl,
          overlayUrl: uploadedOverlayUrl,
          backgroundUrl:
            renderMode === FRAME_RENDER_MODES.backgroundOverlay
              ? uploadedBackgroundUrl
              : "",
          renderMode,
          preferredCameraFacing,
          preferredOrientation,
          layoutConfig: nextLayout,
          isDefault: setAsDefault || currentFrame.isDefault,
          isActive: currentFrame.isActive,
        });
        setMessage("Đã lưu bố cục frame thành công.");
      } else {
        await updateEvent(event.id, {
          ...event,
          frameUrl: uploadedOverlayUrl,
          layoutConfig: nextLayout,
        });
        setMessage("Đã lưu frame legacy thành công.");
      }
      setOverlayFile(null);
      setBackgroundFile(null);
      setOverlayUrl(uploadedOverlayUrl);
      setBackgroundUrl(uploadedBackgroundUrl);
      setLayout(nextLayout);
    } catch (saveError) {
      setMessage(saveError.message || "Không thể lưu frame.");
    } finally {
      setSaving(false);
    }
  };

  if (!event)
    return (
      <div className="rounded-3xl bg-white p-8 font-bold">Đang tải...</div>
    );

  return (
    <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h1 className="text-2xl font-black">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{event.name}</p>
        <div className="mt-4">
          <FrameLayoutEditor
            backgroundUrl={backgroundUrl}
            frameUrl={overlayUrl}
            layoutConfig={layout}
            renderMode={renderMode}
            showMock
            onLayoutChange={setLayout}
          />
        </div>
        <div className="mt-4 grid gap-3 text-sm">
          {backgroundUrl &&
          renderMode === FRAME_RENDER_MODES.backgroundOverlay ? (
            <div className="rounded-2xl border p-2">
              <p className="mb-1 font-bold">
                Background{" "}
                {backgroundMeta
                  ? `· ${backgroundMeta.width}x${backgroundMeta.height}`
                  : ""}
              </p>
              <img
                alt="Preview background"
                className="max-h-36 rounded-xl object-contain"
                src={backgroundUrl}
              />
            </div>
          ) : null}
          {overlayUrl ? (
            <div className="rounded-2xl border p-2">
              <p className="mb-1 font-bold">
                Overlay{" "}
                {overlayMeta
                  ? `· ${overlayMeta.width}x${overlayMeta.height}`
                  : ""}
              </p>
              <img
                alt="Preview overlay"
                className="max-h-36 rounded-xl object-contain"
                src={overlayUrl}
              />
            </div>
          ) : null}
          {assetWarnings.map((warning) => (
            <p
              className="rounded-2xl bg-amber-50 p-3 font-bold text-amber-700"
              key={warning}
            >
              {warning}
            </p>
          ))}
        </div>
      </article>

      <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            className="rounded-xl bg-purple-50 px-4 py-2 font-bold text-purple-700"
            to={`/admin/events/${event.slug}`}
          >
            Quay lại event
          </Link>
          <button
            className="rounded-xl bg-slate-200 px-4 py-2 font-bold"
            onClick={resetDefault}
            type="button"
          >
            Đặt lại mặc định
          </button>
          <button
            className="rounded-xl bg-purple-600 px-4 py-2 font-bold text-white disabled:opacity-60"
            disabled={saving}
            onClick={save}
            type="button"
          >
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>

        {mode !== "legacy" ? (
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-bold">
              Tên frame
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2"
                onChange={(e) => setFrameName(e.target.value)}
                value={frameName}
              />
            </label>
            <label className="inline-flex items-center gap-2 self-end text-sm font-bold">
              <input
                checked={setAsDefault}
                onChange={(e) => setSetAsDefault(e.target.checked)}
                type="checkbox"
              />{" "}
              Đặt làm frame mặc định
            </label>
            <label className="text-sm font-bold">
              Kiểu render
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2"
                onChange={(event) => {
                  const nextMode = event.target.value;
                  setRenderMode(nextMode);
                  setAssetWarnings(
                    buildAssetWarnings({
                      backgroundMeta,
                      overlayMeta,
                      renderMode: nextMode,
                    })
                  );
                }}
                value={renderMode}
              >
                <option value={FRAME_RENDER_MODES.overlayOnly}>
                  Chỉ overlay
                </option>
                <option value={FRAME_RENDER_MODES.backgroundOverlay}>
                  Background + overlay
                </option>
              </select>
            </label>
          </div>
        ) : null}

        {mode !== "legacy" ? (
          <div className="mb-4 rounded-2xl bg-slate-50 p-4">
            <h3 className="mb-3 text-lg font-black text-slate-950">
              Cài đặt camera
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-bold">
                Camera mặc định
                <select
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  onChange={(event) =>
                    setPreferredCameraFacing(event.target.value)
                  }
                  value={preferredCameraFacing}
                >
                  <option value="user">Cam trước</option>
                  <option value="environment">Cam sau</option>
                </select>
              </label>
              <label className="text-sm font-bold">
                Hướng chụp
                <select
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  onChange={(event) =>
                    setPreferredOrientation(event.target.value)
                  }
                  value={preferredOrientation}
                >
                  <option value="portrait">Dọc</option>
                  <option value="landscape">Ngang</option>
                </select>
              </label>
            </div>
          </div>
        ) : null}

        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          {renderMode === FRAME_RENDER_MODES.backgroundOverlay ? (
            <label className="grid gap-2 text-sm font-bold">
              Upload background image
              <input
                accept="image/png,image/webp,image/jpeg"
                className="rounded-lg border px-3 py-2"
                onChange={(e) => onUploadBackground(e.target.files?.[0])}
                type="file"
              />
            </label>
          ) : null}
          <label className="grid gap-2 text-sm font-bold">
            Upload overlay image
            <input
              accept="image/png,image/webp"
              className="rounded-lg border px-3 py-2"
              onChange={(e) => onUploadOverlay(e.target.files?.[0])}
              type="file"
            />
          </label>
        </div>

        <p className="mb-4 text-sm text-slate-500">
          Preview mô phỏng đúng thứ tự lớp: background → ảnh mẫu → overlay. Giá
          trị slot lưu theo kích thước canvas thật.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {layout.slots.map((slot, index) => (
            <div
              className="rounded-2xl border border-slate-200 p-3"
              key={index}
            >
              <p className="mb-2 font-black text-center text-slate-500">Vùng ảnh {index + 1}</p>
              <p className="text-xs text-center text-slate-400">Kéo thả trên hình bên trái để chỉnh</p>
            </div>
          ))}
        </div>

        <div className="mt-6 mb-4 rounded-2xl bg-slate-50 p-4">
          <label className="mb-3 flex items-center gap-2 text-lg font-black text-slate-950 cursor-pointer">
            <input
              type="checkbox"
              checked={!!layout.textBox}
              onChange={toggleTextBox}
              className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-600"
            />
            Bật tính năng Ghi tên / Lời chúc
          </label>
          {layout.textBox && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <p className="col-span-full mb-2 text-xs text-slate-400">Kéo thả khung chữ trên hình bên trái để điều chỉnh vị trí (X, Y) và kích thước (WIDTH, HEIGHT).</p>

              <label className="grid gap-1 text-sm font-bold">
                Cỡ chữ
                <input
                  className="rounded-lg border px-2 py-1"
                  onChange={(e) => onTextBoxChange("fontSize", e.target.value)}
                  type="number"
                  value={layout.textBox.fontSize || 40}
                />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Màu chữ
                <input
                  className="h-8 w-full rounded cursor-pointer border px-1"
                  onChange={(e) => onTextBoxChange("color", e.target.value)}
                  type="color"
                  value={layout.textBox.color || "#000000"}
                />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Font chữ
                <select
                  className="rounded-lg border px-2 py-1"
                  onChange={(e) =>
                    onTextBoxChange("fontFamily", e.target.value)
                  }
                  value={layout.textBox.fontFamily || "Arial"}
                >
                  <option value="Arial">Arial</option>
                  <option value="'Pacifico', cursive">iCiel Pacifico</option>
                  <option value="'UVN Ke Chuyen 1', sans-serif">
                    UVN Ke Chuyen 1
                  </option>
                  <option value="'UVN Ke Chuyen 2', sans-serif">
                    UVN Ke Chuyen 2
                  </option>
                  <option value="'UVN Ke Chuyen 3', sans-serif">
                    UVN Ke Chuyen 3
                  </option>
                  <option value="'UVN Nguyen Du', serif">UVN Nguyen Du</option>
                  <option value="'NVN January', cursive">NVN January</option>
                  <option value="'Bricolage Grotesque', sans-serif">
                    Bricolage Grotesque
                  </option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="'Courier New', Courier, monospace">
                    Courier New
                  </option>
                  <option value="Georgia, serif">Georgia</option>
                </select>
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Căn lề
                <select
                  className="rounded-lg border px-2 py-1"
                  onChange={(e) => onTextBoxChange("align", e.target.value)}
                  value={layout.textBox.align || "center"}
                >
                  <option value="left">Trái</option>
                  <option value="center">Giữa</option>
                  <option value="right">Phải</option>
                </select>
              </label>
            </div>
          )}
        </div>
        {message ? (
          <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-700">
            {message}
          </p>
        ) : null}
      </article>
    </section>
  );
}
