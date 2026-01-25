// Utiliza a URL da API do backend definida em variável de ambiente
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

import React, { useState, useRef, useEffect } from 'react';
import logo from '../img/logo.png'; // Ajuste o caminho se necessário
import { getJwtExpMs } from '../utils/jwt';

const FALLBACK_SESSION_DURATION = 60 * 60 * 1000; // 1 hora em ms

export const AdminLogin: React.FC = () => {
  const [step, setStep] = useState<'idle' | 'sent' | 'success'>('idle');
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  // Removidos: const [otpDev, setOtpDev] = useState('');
  // Removidos: const [waMessage, setWaMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'sent' && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (timer === 0 && step === 'sent') {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleSendCode = async () => {
    setLoading(true);
    setError('');
    setOtp('');
    setCanResend(false);
    // Removido: setOtpDev('');
    // Removido: setWaMessage('');
    try {
      // Chamada para backend gerar e enviar OTP
      const res = await fetch(`${API_BASE_URL}/api/admin/send-otp`, { method: 'POST' });
      await res.json();
      if (!res.ok) throw new Error('Erro ao enviar código.');
      setStep('sent');
      setTimer(60);
      // Não exibe mais OTP nem wa.me
      inputRef.current?.focus();
    } catch (e: any) {
      setError(e.message || 'Erro ao enviar código.');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/validate-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Código incorreto ou expirado.');
      }
      const data = await res.json();
      setStep('success');
      // Salva token JWT e sessão
      localStorage.setItem('adminToken', data.token);
      const tokenExp = typeof data.token === 'string' ? getJwtExpMs(data.token) : null;
      const expires = typeof tokenExp === 'number' ? tokenExp : Date.now() + FALLBACK_SESSION_DURATION;
      localStorage.setItem('adminSession', JSON.stringify({ expires }));
      setTimeout(() => window.location.href = '/admin', 1000);
    } catch (e: any) {
      setError(e.message || 'Código incorreto ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  // Checagem de sessão ativa (1h)
  useEffect(() => {
    const session = localStorage.getItem('adminSession');
    if (session) {
      const { expires } = JSON.parse(session);
      if (Date.now() < expires) {
        window.location.href = '/admin';
      } else {
        localStorage.removeItem('adminSession');
        localStorage.removeItem('adminToken');
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-blue-200 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center">
        <img src={logo} alt="Portal Imobiliário" className="h-12 mb-4" />
        <h1 className="text-2xl font-bold mb-2 text-blue-900">Acesso Administrativo</h1>
        <p className="text-slate-600 text-center mb-6">Digite o código de acesso enviado para o e-mail do administrador.</p>
        {step === 'idle' && (
          <button
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-lg mb-2"
            onClick={handleSendCode}
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Enviar código'}
          </button>
        )}
        {step === 'sent' && (
          <form onSubmit={handleValidate} className="w-full flex flex-col items-center">
            <label className="mb-2 text-slate-700 font-medium">Código de 6 dígitos</label>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              className="w-full text-center text-2xl tracking-widest border border-slate-300 rounded-lg p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              disabled={loading || timer === 0}
              autoFocus
              required
            />
            <div className="mb-3 text-slate-500 text-sm">
              {timer > 0 ? (
                <span>O código expira em <span className="font-semibold text-blue-700">{timer}s</span></span>
              ) : (
                <span className="text-red-600">Código expirado</span>
              )}
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-lg mb-2"
              disabled={loading || otp.length !== 6 || timer === 0}
            >
              {loading ? 'Validando...' : 'Entrar'}
            </button>
            <button
              type="button"
              className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-blue-700 font-medium rounded-lg transition-colors text-base"
              onClick={handleSendCode}
              disabled={!canResend || loading}
            >
              Reenviar código
            </button>
            {/* Não exibe mais OTP nem wa.me */}
          </form>
        )}
        {step === 'success' && (
          <div className="w-full text-center text-green-600 font-semibold text-lg mt-4">Acesso liberado! Redirecionando...</div>
        )}
        {error && <div className="w-full text-center text-red-600 mt-4">{error}</div>}
      </div>
    </div>
  );
};

export default AdminLogin;
