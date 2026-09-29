// Hàm tạo mảng các ngày liên tục từ startDate đến endDate và nhóm theo tháng
function generateCalendarHeatmap(rawData, totalDays = 90) {
  const map = new Map();
  if (Array.isArray(rawData)) {
    rawData.forEach(item => {
      // Giả định item có dạng { date: 'YYYY-MM-DD', count: number }
      const dateStr = item.date ? item.date.split('T')[0] : '';
      if (dateStr) {
        map.set(dateStr, item.count || item.total || (item.active ? 1 : 0));
      }
    });
  }

  const today = new Date();
  const daysList = [];

  // Tạo danh sách từ totalDays ngày trước đến hôm nay
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const count = map.get(dateStr) || 0;
    
    daysList.push({
      date: dateStr,
      count,
      month: d.toLocaleString('default', { month: 'short' }), // Ví dụ: 'Th 1', 'Jan'...
      monthNum: d.getMonth(),
      year: d.getFullYear(),
      dayOfWeek: d.getDay() // 0: Chủ nhật, 1: Thứ 2,...
    });
  }

  // Nhóm theo tháng để hiển thị phân chia
  const groupedByMonth = daysList.reduce((acc, curr) => {
    const key = `${curr.year}-${curr.monthNum}`;
    if (!acc[key]) {
      acc[key] = {
        monthName: `${curr.month}/${curr.year}`,
        days: []
      };
    }
    acc[key].days.push(curr);
    return acc;
  }, {});

  return Object.values(groupedByMonth);
}

export { generateCalendarHeatmap };