import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ProgressSteps } from "../../components/common/ProgressSteps";
import { Button } from "../../components/common/Button";
import { PhotoGrid } from "../../components/booth/PhotoGrid";
import { getCaptures, saveSelectedPhotos } from "../../store/booth";

export function SelectPhotosPage() {
  const { slug = "pink-party" } = useParams();
  const navigate = useNavigate();

  // 1. Khởi tạo mảng rỗng và state loading
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState([]);

  // 2. Lấy dữ liệu bất đồng bộ khi component mount
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        // Đảm bảo hàm getCaptures của bạn có return về mảng (fallback [])
        const data = await getCaptures();
        setPhotos(data || []);
      } catch (error) {
        console.error("Lỗi khi load ảnh:", error);
        setPhotos([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPhotos();
  }, []);

  // 3. Chỉ kiểm tra điều kiện redirect KHI ĐÃ LOAD XONG
  useEffect(() => {
    if (!isLoading && photos.length < 6) {
      navigate(`/booth/${slug}/capture`);
    }
  }, [navigate, photos.length, slug, isLoading]);

  const toggle = (photo) => {
    setSelected((current) => {
      if (current.includes(photo))
        return current.filter((item) => item !== photo);
      if (current.length >= 3) return current;
      return [...current, photo];
    });
  };

  const continueToPreview = async () => {
    // Nếu saveSelectedPhotos cũng dùng localforage, hãy thêm async/await ở đây
    console.log("Saving selected photos to storage...");
    await saveSelectedPhotos(selected);
    navigate(`/booth/${slug}/preview`);
  };

  // 4. (Tùy chọn) Hiển thị màn hình loading trong lúc chờ
  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        Đang tải ảnh...
      </div>
    );
  }

  return (
    <div className="min-h-svh md:min-h-[820px]">
      <ProgressSteps active={2} />
      <section className="px-5 pb-28">
        <h1 className="text-3xl font-black text-slate-950">
          Chọn 3 ảnh đẹp nhất
        </h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          Đã chọn {selected.length}/3 ảnh. Không thể chọn quá 3 ảnh.
        </p>
        <div className="mt-5">
          <PhotoGrid onToggle={toggle} photos={photos} selected={selected} />
        </div>
      </section>
      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md bg-white/90 p-5 backdrop-blur md:absolute">
        <Button
          className="w-full"
          disabled={selected.length !== 3}
          onClick={() => {
            continueToPreview();
            console.log("Selected photos:", selected);
          }}
        >
          Tiếp tục ghép ảnh
        </Button>
      </div>
    </div>
  );
}
