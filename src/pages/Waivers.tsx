import { useState, useRef } from 'react';
import { useStore } from '../store';
import Layout from '../components/Layout';
import { FileText, CheckCircle, PenTool } from 'lucide-react';

export default function Waivers() {
  const { currentUser, waivers, waiverSignatures, signWaiver, settings } = useStore();
  const [signingWaiverId, setSigningWaiverId] = useState<string | null>(null);
  const [signatureName, setSignatureName] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  if (!currentUser) return null;

  const activeWaiver = waivers.find(w => w.isActive);
  const mySignatures = waiverSignatures.filter(s => s.userId === currentUser.id);
  const hasSignedCurrent = activeWaiver ? mySignatures.some(s => s.waiverId === activeWaiver.id) : true;

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setHasDrawn(true);

    const handleMove = (ev: MouseEvent) => {
      ctx.lineTo(ev.clientX - rect.left, ev.clientY - rect.top);
      ctx.stroke();
    };
    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  const handleSign = () => {
    if (!activeWaiver || !signingWaiverId) return;
    const canvas = canvasRef.current;
    const signatureData = canvas ? canvas.toDataURL() : signatureName;
    signWaiver(activeWaiver.id, signatureData);
    setSigningWaiverId(null);
    setHasDrawn(false);
    setSignatureName('');
  };

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Waivers</h1>

      {!hasSignedCurrent && activeWaiver ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Action Required</h2>
          <p className="text-yellow-700 mb-4">You need to sign the current waiver before participating in events.</p>
          <button onClick={() => setSigningWaiverId(activeWaiver.id)}
            className="px-6 py-2 text-white rounded-lg font-medium hover:opacity-90 transition" style={{ backgroundColor: settings.primaryColor }}>
            Sign Waiver Now
          </button>
        </div>
      ) : hasSignedCurrent ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">You have signed the current waiver (v{activeWaiver?.version})</span>
          </div>
        </div>
      ) : null}

      {/* Waiver Content */}
      {activeWaiver && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{activeWaiver.title}</h2>
          <p className="text-xs text-gray-500 mb-4">Version {activeWaiver.version} • {new Date(activeWaiver.createdAt).toLocaleDateString()}</p>
          <div className="prose prose-sm max-w-none text-gray-600 border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-64 overflow-y-auto">
            {activeWaiver.content.split('\n').map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </div>
      )}

      {/* Signature History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Signature History</h2>
        <div className="space-y-3">
          {mySignatures.map(sig => {
            const waiver = waivers.find(w => w.id === sig.waiverId);
            return (
              <div key={sig.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{waiver?.title || 'Unknown Waiver'}</p>
                  <p className="text-xs text-gray-500">Version {sig.waiverVersion} • Signed {new Date(sig.signedAt).toLocaleDateString()}</p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            );
          })}
          {mySignatures.length === 0 && <p className="text-gray-500 text-center py-4">No waivers signed yet</p>}
        </div>
      </div>

      {/* Signing Modal */}
      {signingWaiverId && activeWaiver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sign Waiver: {activeWaiver.title}</h3>
            <p className="text-sm text-gray-600 mb-4">By signing below, you agree to the terms of the waiver above.</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Type your name (digital signature)</label>
              <input type="text" value={signatureName} onChange={e => setSignatureName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Your full name" />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Or draw your signature</label>
              <canvas ref={canvasRef} width={400} height={150}
                onMouseDown={handleCanvasMouseDown}
                className="w-full border border-gray-300 rounded-lg cursor-crosshair bg-white" />
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setSigningWaiverId(null); setHasDrawn(false); }}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
              <button onClick={handleSign} disabled={!signatureName && !hasDrawn}
                className="flex-1 py-2 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition" style={{ backgroundColor: settings.primaryColor }}>
                Sign & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
