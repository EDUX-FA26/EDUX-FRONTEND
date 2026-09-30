   function getTodayVNDate() {
        const now = new Date();
        const vnTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
        const year = vnTime.getFullYear();
        const month = String(vnTime.getMonth() + 1).padStart(2, '0');
        const day = String(vnTime.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    export { getTodayVNDate };

