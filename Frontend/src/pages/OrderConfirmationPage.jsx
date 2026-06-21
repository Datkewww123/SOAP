// src/pages/OrderConfirmationPage.jsx
import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

export default function OrderConfirmationPage() {
  const location = useLocation();
  const orderCode = location.state?.orderCode;

  // Web Audio API để tổng hợp âm thanh "ting" giống như khi thêm vào giỏ hàng
  const playChimeSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(1318.51, now); // Nốt E6 trong trẻo, ting ting
      
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.8);
    } catch (e) {
      console.warn("AudioContext blocked or not supported", e);
    }
  };

  useEffect(() => {
    // Phát âm thanh "ting" khi load trang đặt hàng thành công
    playChimeSound();
  }, []);

  return (
    <div className="min-h-[75vh] bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4">
      {/* Container Card */}
      <div className="relative bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 rounded-2xl shadow-2xl w-full max-w-md p-8 overflow-hidden border border-gray-100 dark:border-slate-700 animate-slide-up transform transition-all duration-300 text-center">
        
        {/* Bouncing success icon (giống hệt modal giỏ hàng) */}
        <div className="w-20 h-20 bg-green-100 dark:bg-green-950/40 rounded-full flex items-center justify-center text-green-500 dark:text-green-400 text-4xl mb-4 shadow-inner mx-auto animate-bounce">
          <i className="fas fa-check-circle" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold tracking-tight mb-2 text-gray-800 dark:text-white">
          Đặt Hàng Thành Công!
        </h1>
        
        {/* Order Code banner if exists */}
        {orderCode && (
          <div className="inline-block bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-mono text-sm px-4 py-1.5 rounded-lg border border-green-100 dark:border-green-800/40 mb-4 font-bold">
            Mã đơn hàng: {orderCode}
          </div>
        )}

        {/* Description text */}
        <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed mb-6">
          Cảm ơn bạn đã mua sắm tại <strong>THSPORT</strong>. Chúng tôi sẽ liên hệ với bạn để xác nhận đơn hàng và tiến hành giao hàng trong thời gian sớm nhất.
        </p>

        {/* Action Button */}
        <div className="space-y-3">
          <Link
            to="/"
            className="w-full py-3.5 px-4 rounded-xl text-sm font-bold bg-primary hover:bg-red-700 text-white text-center shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition-all block cursor-pointer"
          >
            Quay về Trang chủ
          </Link>
          <Link
            to="/tra-cuu-don-hang"
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 transition-colors block text-center"
          >
            Tra cứu đơn hàng của bạn
          </Link>
        </div>

      </div>
    </div>
  );
}
