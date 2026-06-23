const { syncSportsNews } = require('../services/sportsNews.service');

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

let isRunning = false;

async function runSyncSafely() {
  if (isRunning) return;
  isRunning = true;
  try {
    await syncSportsNews();
  } catch (err) {
    console.error('❌ Lỗi đồng bộ tin thể thao:', err.message);
  } finally {
    isRunning = false;
  }
}

function msUntilNext6AmVietnam() {
  const now = new Date();
  const vnMinutes = Math.floor(now.getTime() / 60000) + 7 * 60;
  const startOfVnDay = Math.floor(vnMinutes / 1440) * 1440;
  const vn6amMinutes = startOfVnDay + 6 * 60;
  const targetMinutes = vnMinutes >= vn6amMinutes ? vn6amMinutes + 1440 : vn6amMinutes;
  const targetUtcMs = (targetMinutes - 7 * 60) * 60000;
  return Math.max(targetUtcMs - now.getTime(), 60_000);
}

function scheduleDailySync() {
  const scheduleNext = () => {
    const delay = msUntilNext6AmVietnam();
    console.log(`⏰ Đồng bộ tin thể thao tiếp theo sau ${Math.round(delay / 3600000)} giờ (6h sáng VN)`);
    setTimeout(async () => {
      await runSyncSafely();
      scheduleNext();
    }, delay);
  };

  scheduleNext();
  setInterval(runSyncSafely, ONE_DAY_MS);
}

function startSportsNewsSync() {
  runSyncSafely();
  scheduleDailySync();
}

module.exports = { startSportsNewsSync, runSyncSafely };
