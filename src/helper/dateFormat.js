// Hàm chuyển đổi 'YYYY-MM-DD' hoặc chuỗi ISO sang định dạng 'd/m/y'
function formatDateDMY(dateString) {
  if (!dateString) return null;
  // Xử lý cắt chuỗi nếu là dạng '2026-09-29T...' hoặc '2026-09-29'
  const cleanDateStr = dateString.split('T')[0];
  const parts = cleanDateStr.split('-');
  
  if (parts.length === 3) {
    const [year, month, day] = parts;
    // Bỏ số 0 ở đầu nếu muốn gọn (ví dụ: 09 -> 9), hoặc giữ nguyên tùy ý bạn
    return `${parseInt(day, 10)}/${parseInt(month, 10)}/${year}`;
  }
  
  // Trường hợp fallback nếu chuỗi khác định dạng
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

export { formatDateDMY };