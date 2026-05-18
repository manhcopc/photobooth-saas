import localforage from 'localforage';

export const readStorage = async (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = await localforage.getItem(key);
    // localforage sẽ trả về null nếu key chưa từng được lưu
    return value !== null ? value : fallback;
  } catch (err) {
    console.error("Lỗi khi đọc storage:", err);
    return fallback;
  }
}

export const writeStorage = async (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    await localforage.setItem(key, value); 
  } catch (err) {
    console.error("Lỗi khi lưu vào storage:", err);
  }
}

export const removeStorage = async (key) => {
  if (typeof window === 'undefined') return;
  try {
    await localforage.removeItem(key);
  } catch (err) {
    console.error("Lỗi khi xóa storage:", err);
  }
}