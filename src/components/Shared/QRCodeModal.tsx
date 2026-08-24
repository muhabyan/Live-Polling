import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, Download, QrCode, AlertTriangle, Radio, Clock } from 'lucide-react';
import { EventStatus } from '../../types';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  eventTitle: string;
  status?: EventStatus;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  eventTitle,
  status = 'waiting',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = React.useState(false);

  const joinUrl = `${window.location.origin}/?code=${roomCode}`;
  const isEnded = status === 'ended';

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, joinUrl, {
        width: 240,
        margin: 2,
        color: {
          dark: isEnded ? '#64748B' : '#0F172A',
          light: '#FFFFFF',
        },
      });
    }
  }, [isOpen, joinUrl, isEnded]);

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
            <div className={`p-1.5 rounded-lg ${isEnded ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
              <QrCode className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <h3 className="text-xs font-bold text-slate-900 font-display">
                  {isEnded ? 'Room PIN (Ended)' : 'Scan to Join Live'}
                </h3>
                {isEnded ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                    ENDED
                  </span>
                ) : status === 'live' ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                    <Radio className="w-2.5 h-2.5 animate-pulse" />
                    <span>LIVE</span>
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center space-x-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>LOBBY</span>
                  </span>
                )}
              </div>
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
          
          {/* Warning Banner if Session is Ended */}
          {isEnded && (
            <div className="w-full mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-left flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-amber-900 leading-tight">
                <span className="font-bold block">Sesi Polling Telah Ditutup</span>
                Sesi ini sudah selesai dan tidak menerima peserta baru. Klik <strong>Reset Data</strong> di Presenter Cockpit untuk membuka kembali polling.
              </div>
            </div>
          )}

          <div className={`p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs mb-3 relative ${isEnded ? 'opacity-50 grayscale' : ''}`}>
            <canvas ref={canvasRef} className="rounded-lg" />
            {isEnded && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/10 rounded-2xl">
                <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold shadow-md uppercase tracking-wider">
                  Session Concluded
                </span>
              </div>
            )}
          </div>

          <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 mb-3">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">
              Room PIN Code
            </div>
            <div className={`text-2xl font-black tracking-widest font-mono-numbers ${isEnded ? 'text-slate-500' : 'text-slate-900'}`}>
              {roomCode}
            </div>
          </div>

          <p className="text-xs text-slate-600 mb-4">
            {isEnded ? (
              <span className="text-slate-500 italic">
                PIN room ini sudah tidak aktif untuk join peserta baru.
              </span>
            ) : (
              <>
                Scan with your phone camera, or open{' '}
                <span className="font-bold text-slate-900">{window.location.host}</span> and type code{' '}
                <span className="font-bold text-indigo-600 font-mono-numbers">{roomCode}</span>.
              </>
            )}
          </p>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 w-full">
            <button
              id="qr-modal-copy-btn"
              onClick={handleCopyLink}
              disabled={isEnded}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
