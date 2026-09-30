// Hàm chuyển đổi 'YYYY-MM-DD' hoặc chuỗi ISO sang định dạng 'd/m/y'
function formatDateDMY(dateInput) {
  if (!dateInput) return '-';

  const date = new Date(dateInput);

  // Kiểm tra nếu date không hợp lệ
  if (isNaN(date.getTime())) return '-';

  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  // Kết quả dạng: 29/9/2026 14:05:09
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

export { formatDateDMY };