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
          dark: isEnded ? '#64748B' : '#1E1E1E',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-none animate-in fade-in">
      <div 
        id="qr-modal-container"
        className="relative w-full max-w-sm neo-card overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b-2 border-[#1E1E1E] bg-[#FFF8F0]">
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 rounded-md border-2 border-[#1E1E1E] ${isEnded ? 'bg-[#FACC15] text-[#1E1E1E]' : 'bg-[#4F46E5] text-white'}`}>
              <QrCode className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <h3 className="text-xs font-black text-[#1E1E1E] font-display uppercase">
                  {isEnded ? 'Room PIN (Ended)' : 'Scan to Join Live'}
                </h3>
                {isEnded ? (
                  <span className="neo-badge bg-gray-200 text-[#1E1E1E]">
                    ENDED
                  </span>
                ) : status === 'live' ? (
                  <span className="neo-badge bg-[#34D399] text-[#1E1E1E] flex items-center space-x-1">
                    <Radio className="w-2.5 h-2.5 animate-pulse" />
                    <span>LIVE</span>
                  </span>
                ) : (
                  <span className="neo-badge bg-[#FACC15] text-[#1E1E1E] flex items-center space-x-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>LOBBY</span>
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-500 font-mono truncate max-w-[200px]">{eventTitle}</p>
            </div>
          </div>
          <button
            id="qr-modal-close-btn"
            onClick={onClose}
            className="neo-btn bg-white p-1 text-[#1E1E1E]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Body */}
        <div className="p-5 flex flex-col items-center text-center">
          
          {/* Warning Banner if Session is Ended */}
          {isEnded && (
            <div className="w-full mb-3 p-2.5 bg-[#FB7185]/20 border-2 border-[#1E1E1E] rounded-lg text-left flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-[#FB7185] shrink-0 mt-0.5" />
              <div className="text-[11px] text-[#1E1E1E] leading-tight font-medium">
                <span className="font-black block uppercase font-mono">Sesi Polling Telah Ditutup</span>
                Sesi ini sudah selesai dan tidak menerima peserta baru. Klik <strong>Reset Data</strong> di Presenter Cockpit untuk membuka kembali polling.
              </div>
            </div>
          )}

          <div className={`p-3 bg-white rounded-xl border-2 border-[#1E1E1E] mb-3 relative ${isEnded ? 'opacity-50 grayscale' : ''}`} style={{ boxShadow: '4px 4px 0px #1E1E1E' }}>
            <canvas ref={canvasRef} className="rounded-md" />
            {isEnded && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
                <span className="px-3 py-1 bg-[#1E1E1E] text-white border-2 border-white rounded-md text-xs font-black uppercase tracking-wider font-mono">
                  Session Concluded
                </span>
              </div>
            )}
          </div>

          <div className="w-full bg-[#FFF8F0] border-2 border-[#1E1E1E] rounded-lg p-2.5 mb-3">
            <div className="text-[10px] text-gray-500 font-black uppercase tracking-wider mb-0.5 font-mono">
              Room PIN Code
            </div>
            <div className={`text-2xl font-black tracking-widest font-mono ${isEnded ? 'text-gray-400' : 'text-[#1E1E1E]'}`}>
              {roomCode}
            </div>
          </div>

          <p className="text-xs text-gray-600 mb-4">
            {isEnded ? (
              <span className="text-gray-500 italic font-mono text-[11px]">
                PIN room ini sudah tidak aktif untuk join peserta baru.
              </span>
            ) : (
              <>
                Scan with your phone camera, or open{' '}
                <span className="font-bold text-[#1E1E1E]">{window.location.host}</span> and type code{' '}
                <span className="font-black text-[#4F46E5] font-mono">{roomCode}</span>.
              </>
            )}
          </p>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 w-full">
            <button
              id="qr-modal-copy-btn"
              onClick={handleCopyLink}
              disabled={isEnded}
              className="neo-btn bg-white text-[#1E1E1E] px-3 py-2 text-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#34D399]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
            </button>

            <button
              id="qr-modal-download-btn"
              onClick={handleDownloadQR}
              className="neo-btn bg-[#FACC15] text-[#1E1E1E] px-3 py-2 text-xs"
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
