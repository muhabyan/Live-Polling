import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, Download, QrCode } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  eventTitle: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  eventTitle,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = React.useState(false);

  const joinUrl = `${window.location.origin}/?code=${roomCode}`;

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, joinUrl, {
        width: 240,
        margin: 2,
        color: {
          dark: '#0F172A',
          light: '#FFFFFF',
        },
      });
    }
  }, [isOpen, joinUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `PulseLive-${roomCode}-QR.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div 
        id="qr-modal-container"
        className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 font-display">Scan to Join Live</h3>
              <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{eventTitle}</p>
            </div>
          </div>
          <button
            id="qr-modal-close-btn"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Body */}
        <div className="p-5 flex flex-col items-center text-center">
          <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs mb-3">
            <canvas ref={canvasRef} className="rounded-lg" />
          </div>

          <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 mb-3">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">
              Room PIN Code
            </div>
            <div className="text-2xl font-black tracking-widest text-slate-900 font-mono-numbers">
              {roomCode}
            </div>
          </div>

          <p className="text-xs text-slate-600 mb-4">
            Scan with your phone camera, or open{' '}
            <span className="font-bold text-slate-900">{window.location.host}</span> and type code{' '}
            <span className="font-bold text-indigo-600 font-mono-numbers">{roomCode}</span>.
          </p>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 w-full">
            <button
              id="qr-modal-copy-btn"
              onClick={handleCopyLink}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
            </button>

            <button
              id="qr-modal-download-btn"
              onClick={handleDownloadQR}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-2xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download QR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
