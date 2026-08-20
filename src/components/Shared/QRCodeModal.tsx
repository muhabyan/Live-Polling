import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, Download, ExternalLink, QrCode } from 'lucide-react';

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
        width: 260,
        margin: 2,
        color: {
          dark: '#1E293B',
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
    link.download = `StageSync-${roomCode}-QR.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        id="qr-modal-container"
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Scan to Join Live</h3>
              <p className="text-xs text-slate-500 truncate max-w-[240px]">{eventTitle}</p>
            </div>
          </div>
          <button
            id="qr-modal-close-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Body */}
        <div className="p-6 flex flex-col items-center text-center">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm mb-4">
            <canvas ref={canvasRef} className="rounded-lg" />
          </div>

          <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">
              Room Access Code
            </div>
            <div className="text-3xl font-semibold tracking-widest text-slate-900 font-mono">
              {roomCode}
            </div>
          </div>

          <p className="text-sm text-slate-600 mb-6">
            Point smartphone camera at the QR code, or go to{' '}
            <span className="font-semibold text-slate-900">{window.location.host}</span> and enter code{' '}
            <span className="font-semibold text-slate-900">{roomCode}</span>.
          </p>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              id="qr-modal-copy-btn"
              onClick={handleCopyLink}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
            </button>

            <button
              id="qr-modal-download-btn"
              onClick={handleDownloadQR}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm shadow-sm hover:shadow transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download QR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
