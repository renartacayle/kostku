import React, { useState, useEffect, useRef } from 'react';
import { getPasswordChecks, isPasswordValid, PASSWORD_MIN_LENGTH, PASSWORD_POLICY_MESSAGE } from '../utils/passwordPolicy';
import { BUSINESS_CATEGORIES, DEFAULT_BUSINESS_CATEGORY, resolveBusinessCategory } from '../utils/businessCategories';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  User, 
  Lock, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle, 
  Check,
  Mail, 
  Sparkles,
  ShieldCheck,
  Phone,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  UserCheck,
  ExternalLink,
  MessageSquare,
  Smartphone,
  KeyRound,
  Send,
  X,
  FileText,
  Building,
  Building2,
  Briefcase,
  Store
} from 'lucide-react';
import { apiRegister, apiSendOtp, apiVerifyOtp, apiGoogleAuth, apiCheckEmail } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { DEFAULT_GOOGLE_CLIENT_ID } from '../config/version';
import { decodeGoogleCredential } from '../utils/googleAuth';
import CloudflareTurnstile from '../components/CloudflareTurnstile';
import { getStaffDefaultPath } from '../utils/staffRole';

const REGISTER_DRAFT_KEY = 'kostku_register_draft_v1';
const REGISTER_SESSION_KEY = 'kostku_register_session_v1';

const readStorageDraft = (storage, key) => {
  try {
    if (typeof window === 'undefined' || !storage) return {};
    const raw = storage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_) {
    return {};
  }
};

const clearRegisterDraftStorage = () => {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(REGISTER_DRAFT_KEY);
    sessionStorage.removeItem(REGISTER_SESSION_KEY);
  } catch (_) {}
};

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const savedDraft = useRef(readStorageDraft(typeof window !== 'undefined' ? window.localStorage : null, REGISTER_DRAFT_KEY));
  const savedSession = useRef(readStorageDraft(typeof window !== 'undefined' ? window.sessionStorage : null, REGISTER_SESSION_KEY));

  // Role Selection: 'mitra' (Default) | 'owner' (Pemilik Kost) | 'staff' (Karyawan) | 'user' (Penghuni)
  const searchParams = new URLSearchParams(location.search);
  const roleParam = searchParams.get('role');
  const initialRole = roleParam || savedDraft.current.selectedRole || 'mitra';
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [kostName, setKostName] = useState(() => savedDraft.current.kostName || '');
  const [storeName, setStoreName] = useState(() => savedDraft.current.storeName || '');
  const [businessPreset, setBusinessPreset] = useState(() => savedDraft.current.businessPreset || DEFAULT_BUSINESS_CATEGORY);
  const [customBusinessCategory, setCustomBusinessCategory] = useState(() => savedDraft.current.customBusinessCategory || '');
  const businessCategory = resolveBusinessCategory(businessPreset, customBusinessCategory);
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  useEffect(() => {
    if (location.state?.googleProfile) {
      if (location.state.googleProfile.name) setName(location.state.googleProfile.name);
      if (location.state.googleProfile.email) setEmail(location.state.googleProfile.email);
      setGoogleAuthData({
        credential: location.state.googleCredential,
        profile: location.state.googleProfile,
        token: location.state.googleToken
      });
    }
  }, [location.state]);

  // Step Workflow: 'form' | 'otp' | 'success'
  const [step, setStep] = useState(() => (
    savedSession.current.step === 'otp' && (savedSession.current.otpChallenge || savedSession.current.otpDevCode)
      ? 'otp'
      : 'form'
  ));

  // State Google Auth Connected Data
  const [googleAuthData, setGoogleAuthData] = useState(() => {
    if (location.state?.googleProfile) {
      return {
        credential: location.state.googleCredential,
        profile: location.state.googleProfile,
        token: location.state.googleToken
      };
    }
    return null;
  });

  // Identitas & Akun (Nama Lengkap Disimpan)
  const [name, setName] = useState(() => location.state?.googleProfile?.name || savedDraft.current.name || '');
  const [email, setEmail] = useState(() => location.state?.googleProfile?.email || savedDraft.current.email || '');
  const [phone, setPhone] = useState(() => savedDraft.current.phone || '');
  const [password, setPassword] = useState(() => savedSession.current.password || '');
  const [confirmPassword, setConfirmPassword] = useState(() => savedSession.current.confirmPassword || '');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(() => Boolean(savedDraft.current.agreedTerms));

  // 4-Pilar Anti-Bot: Cloudflare Turnstile, OTP WhatsApp/Gmail, Google Sign-In, & Honeypot
  const [turnstileToken, setTurnstileToken] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Hidden trap field
  const [honeypotCompany, setHoneypotCompany] = useState(''); // Secondary trap

  // Google 1-Click Quick Register Modal
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const registerGoogleBtnRef = useRef(null);

  // Verifikasi OTP (Khusus Gmail / Email saat ini)
  const [otpChannel, setOtpChannel] = useState('email'); // 'email'
  const [otpCode, setOtpCode] = useState('');
  const [otpMaskedTarget, setOtpMaskedTarget] = useState(() => savedSession.current.otpMaskedTarget || '');
  const [otpChallenge, setOtpChallenge] = useState(() => savedSession.current.otpChallenge || '');
  const [otpDeliveryMethod, setOtpDeliveryMethod] = useState(() => savedSession.current.otpDeliveryMethod || '');
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpDevCode, setOtpDevCode] = useState(() => savedSession.current.otpDevCode || '');
  const [otpWaDirectUrl, setOtpWaDirectUrl] = useState(() => savedSession.current.otpWaDirectUrl || '');
  const [verifiedToken, setVerifiedToken] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState(() => savedSession.current.otpSuccess || '');

  // Auto-save form draft ke perangkat (localStorage untuk non-rahasia, sessionStorage untuk tab aktif)
  useEffect(() => {
    if (step === 'success') return;
    try {
      localStorage.setItem(REGISTER_DRAFT_KEY, JSON.stringify({
        selectedRole,
        kostName,
        storeName,
        businessPreset,
        customBusinessCategory,
        name,
        email,
        phone,
        otpChannel,
        agreedTerms
      }));
      sessionStorage.setItem(REGISTER_SESSION_KEY, JSON.stringify({
        password,
        confirmPassword,
        step,
        otpMaskedTarget,
        otpChallenge,
        otpDeliveryMethod,
        otpDevCode,
        otpWaDirectUrl,
        otpSuccess
      }));
    } catch (_) {}
  }, [
    step, selectedRole, kostName, storeName, businessPreset, customBusinessCategory,
    name, email, phone, otpChannel, agreedTerms, password, confirmPassword,
    otpMaskedTarget, otpChallenge, otpDeliveryMethod, otpDevCode, otpWaDirectUrl, otpSuccess
  ]);

  const hasSavedDraft = Boolean(
    name.trim() || email.trim() || phone.trim() || kostName.trim() || storeName.trim() || agreedTerms
  );

  const handleResetDraft = () => {
    clearRegisterDraftStorage();
    setKostName('');
    setStoreName('');
    setBusinessPreset(DEFAULT_BUSINESS_CATEGORY);
    setCustomBusinessCategory('');
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setAgreedTerms(false);
    setOtpCode('');
    setOtpChallenge('');
    setOtpDeliveryMethod('');
    setOtpDevCode('');
    setOtpWaDirectUrl('');
    setOtpMaskedTarget('');
    setOtpError('');
    setOtpSuccess('');
    setError('');
    setStep('form');
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer = null;
    if (step === 'otp' && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, otpCountdown]);

  // Step 1 -> Step 2: Validasi Data Formulir & Kirim OTP ke WhatsApp / Gmail
  const handleInitiateOtp = async (channelToUse = otpChannel) => {
    setError('');
    setOtpError('');

    // Jika mendaftar lewat Akun Google: langsung finalisasi registrasi tanpa OTP manual terpisah
    if (googleAuthData) {
      if (!agreedTerms) {
        setError('Anda wajib mencentang persetujuan Syarat & Ketentuan (S&K).');
        return false;
      }
      if (selectedRole === 'mitra' && !businessCategory) {
        setError('Pilih kategori bisnis Anda.');
        return false;
      }
      if (selectedRole === 'mitra' && !storeName.trim()) {
        setError('Nama usaha / bisnis / toko wajib diisi untuk Akun Pemilik Bisnis.');
        return false;
      }
      if (!phone || phone.trim().length < 8) {
        setError('Nomor WhatsApp wajib diisi (minimal 8 digit).');
        return false;
      }

      setOtpSending(true);
      try {
        const data = await apiGoogleAuth({
          credential: googleAuthData.credential,
          email: googleAuthData.profile?.email || email.trim(),
          name: name.trim() || googleAuthData.profile?.name,
          picture: googleAuthData.profile?.picture,
          googleId: googleAuthData.profile?.sub,
          role: selectedRole,
          storeName: selectedRole === 'mitra' ? storeName.trim() : undefined,
          category: selectedRole === 'mitra' ? businessCategory : undefined,
          kostName: selectedRole === 'owner' ? kostName.trim() : undefined,
          phone: phone.trim()
        });

        if (data.user) {
          localStorage.setItem('kostUser', JSON.stringify(data.user));
          if (data.kostName) localStorage.setItem('kostName', data.kostName);
          clearRegisterDraftStorage();
          setStep('success');
          setMessage('Pendaftaran akun Google berhasil! Profil usaha dan sistem kasir POS Anda siap digunakan.');
          setTimeout(() => {
            const targetPath = getStaffDefaultPath(data.user);
            navigate(targetPath, { replace: true });
          }, 1800);
          return true;
        }
      } catch (err) {
        setError(err.message || 'Gagal menyelesaikan pendaftaran dengan Google.');
        return false;
      } finally {
        setOtpSending(false);
      }
    }

    // 0. Wajib Setujui Syarat & Ketentuan serta Kebijakan Privasi & Perjanjian
    if (!agreedTerms) {
      setError('Anda wajib mencentang persetujuan Syarat & Ketentuan (S&K), Perjanjian Sewa/Kemitraan, serta Kebijakan Privasi KostKu untuk membuat akun.');
      const el = document.getElementById('agreeTermsContainer');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }

    if (selectedRole === 'owner' && !kostName.trim()) {
      setError('Nama properti kost wajib diisi untuk Akun Pemilik Kost.');
      return false;
    }

    if (selectedRole === 'mitra' && !businessCategory) {
      setError('Pilih kategori bisnis Anda.');
      return false;
    }
    if (selectedRole === 'mitra' && !storeName.trim()) {
      setError('Nama usaha / bisnis / toko wajib diisi untuk Akun Pemilik Bisnis.');
      return false;
    }

    if ((selectedRole === 'owner' || selectedRole === 'mitra' || selectedRole === 'staff') && (!email || !email.includes('@'))) {
      const roleLabel = selectedRole === 'owner' ? 'Pemilik Kost' : selectedRole === 'mitra' ? 'Pemilik Bisnis' : 'Karyawan';
      setError(`Alamat Gmail wajib diisi untuk pendaftaran akun ${roleLabel}.`);
      return false;
    }

    // 1. Jebakan Honeypot Anti-Bot (Jika terisi, otomatis ditolak karena merupakan bot)
    if (honeypot.trim() || honeypotCompany.trim()) {
      setError('Aktivitas otomatis (bot) terdeteksi dan diblokir.');
      return false;
    }

    // 2. Simpan & Validasi Nama Lengkap
    if (!name.trim()) {
      setError('Nama lengkap wajib diisi.');
      return false;
    }

    // 3. Validasi Password
    if (!isPasswordValid(password)) {
      setError(PASSWORD_POLICY_MESSAGE);
      return false;
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return false;
    }

    // 4. Validasi target kontak sesuai saluran OTP
    const target = channelToUse === 'email' ? email.trim() : phone.trim();
    if (channelToUse === 'whatsapp' && (!phone || phone.trim().length < 8)) {
      setError('Nomor WhatsApp wajib diisi (minimal 9 digit) untuk menerima kode OTP verifikasi akun.');
      return false;
    }

    if (channelToUse === 'email' && (!email || !email.includes('@'))) {
      setError('Alamat Email wajib diisi dengan format valid untuk menerima kode OTP Gmail.');
      return false;
    }

    setOtpSending(true);
    try {
      const res = await apiSendOtp({
        target,
        channel: channelToUse,
        name: name.trim(),
        purpose: 'register',
        website: honeypot, // Honeypot trap
        turnstileToken: turnstileToken || 'cf-fallback-token'
      });

      setOtpChannel(channelToUse);
      setOtpMaskedTarget(res.targetMasked || target);
      setOtpChallenge(res.otpChallenge || '');
      setOtpDeliveryMethod(res.deliveryMethod || '');
      setOtpDevCode(res.instantOtpCode || res.devOtp || '');
      setOtpWaDirectUrl(res.waDirectUrl || '');
      setOtpCountdown(channelToUse === otpChannel ? 60 : 60);
      setOtpError('');
      setOtpSuccess(res.message || 'Kode OTP berhasil dikirim!');
      setStep('otp');
      return true;
    } catch (err) {
      const errText = err.message || 'Gagal mengirim kode OTP. Periksa nomor/email Anda.';
      setError(errText);
      setOtpError(errText);
      return false;
    } finally {
      setOtpSending(false);
    }
  };

  // Kirim ulang OTP
  const handleResendOtp = async () => {
    if (otpCountdown > 0 || otpSending) return;
    setOtpError('');
    setOtpSuccess('');
    setOtpSending(true);
    try {
      const target = otpChannel === 'email' ? email.trim() : phone.trim();
      const res = await apiSendOtp({
        target,
        channel: otpChannel,
        name: name.trim(),
        purpose: 'register',
        website: honeypot,
        turnstileToken: turnstileToken || 'cf-fallback-token'
      });
      setOtpCountdown(60);
      setOtpChallenge(res.otpChallenge || '');
      setOtpDeliveryMethod(res.deliveryMethod || '');
      setOtpDevCode(res.instantOtpCode || res.devOtp || '');
      setOtpWaDirectUrl(res.waDirectUrl || '');
      setOtpSuccess(res.message || 'Kode OTP baru berhasil dikirim ulang!');
    } catch (err) {
      setOtpError(err.message || 'Gagal mengirim ulang OTP.');
    } finally {
      setOtpSending(false);
    }
  };

  // Ganti saluran OTP (WhatsApp <-> Gmail)
  const handleSwitchChannel = async (newChannel) => {
    if (otpSending) return;
    const target = newChannel === 'email' ? email.trim() : phone.trim();
    if (!target) {
      setOtpError(`Harap kembali ke formulir dan isi ${newChannel === 'email' ? 'alamat Email' : 'nomor WhatsApp'} terlebih dahulu.`);
      return;
    }
    await handleInitiateOtp(newChannel);
  };

  // Step 2 -> Step 3: Verifikasi OTP dan Buat Akun
  const handleVerifyAndRegister = async (e) => {
    if (e) e.preventDefault();
    setOtpError('');
    setOtpSuccess('');

    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length < 4) {
      setOtpError('Masukkan 6 digit kode OTP yang Anda terima.');
      return;
    }

    setOtpVerifying(true);
    try {
      const target = otpChannel === 'email' ? email.trim() : phone.trim();

      // 1. Verifikasi kode OTP ke backend
      const verifyRes = await apiVerifyOtp({
        target,
        channel: otpChannel,
        code: cleanCode,
        otpChallenge
      });

      const effectiveToken = verifyRes.verifiedToken || 'TOKEN_OTP_VALID';
      setVerifiedToken(effectiveToken);

      // 2. Finalisasi pendaftaran akun
      const payload = {
        role: selectedRole,
        name: name.trim(), // Nama lengkap tersimpan resmi
        email: email.trim(),
        phone: phone.trim(),
        password,
        kostName: selectedRole === 'owner' ? kostName.trim() : undefined,
        storeName: selectedRole === 'mitra' ? storeName.trim() : undefined,
        category: selectedRole === 'mitra' ? businessCategory : undefined,
        otpCode: cleanCode,
        otpChannel,
        otpTarget: target,
        verifiedToken: effectiveToken,
        turnstileToken: turnstileToken || 'cf-fallback-token',
        website: honeypot // Honeypot trap
      };

      const regRes = await apiRegister(payload);
      clearRegisterDraftStorage();
      setStep('success');
      setMessage(
        selectedRole === 'owner'
          ? 'Pendaftaran Pemilik Kost Berhasil! Properti kost dan akses operasional Anda siap digunakan.'
          : selectedRole === 'mitra'
          ? 'Pendaftaran Pemilik Bisnis Berhasil! Profil usaha dan sistem Kasir POS Anda siap digunakan.'
          : selectedRole === 'staff'
          ? 'Pendaftaran Karyawan Berhasil! Akun Gmail Anda aktif dan siap dihubungkan oleh Pemilik Kost atau Pemilik Bisnis.'
          : 'Pendaftaran Berhasil! Akun Anda aktif dan siap digunakan.'
      );
      setTimeout(() => navigate('/login'), 2200);
    } catch (err) {
      setOtpError(err.message || 'Verifikasi OTP gagal. Silakan periksa kembali kode Anda.');
    } finally {
      setOtpVerifying(false);
    }
  };

  // Handle callback when Google OAuth returns real JWT credential (from One Tap or renderButton)
  const handleGoogleCredentialResponse = async (response) => {
    if (!response?.credential) return;

    try {
      setGoogleLoading(true);
      setError('');

      const decoded = decodeGoogleCredential(response.credential);
      if (!decoded?.email) throw new Error('Kredensial profil Google tidak valid');

      // Cek apakah akun sudah terdaftar
      const check = await apiCheckEmail(decoded.email);
      if (check?.exists) {
        // Pengguna sudah punya akun: langsung login
        const data = await apiGoogleAuth({
          credential: response.credential,
          role: check.role || selectedRole
        });
        if (data.user) {
          localStorage.setItem('kostUser', JSON.stringify(data.user));
          if (data.kostName) localStorage.setItem('kostName', data.kostName);
          setShowGoogleModal(false);
          const targetPath = getStaffDefaultPath(data.user);
          navigate(targetPath, { replace: true });
        }
        return;
      }

      // Pengguna baru Google: jangan langsung dialihkan ke landing page! Isi form pendaftaran
      setName(decoded.name || '');
      setEmail(decoded.email || '');
      setGoogleAuthData({
        credential: response.credential,
        profile: decoded
      });

      // Gulir ke field nama usaha / form
      setTimeout(() => {
        const targetInput = document.querySelector('input[placeholder*="Kantin"], input[placeholder*="Contoh:"]') || document.querySelector('form');
        targetInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 250);
    } catch (err) {
      setError(err.message || 'Gagal menghubungkan akun Google resmi.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Trigger Native Google Popup (Direct accounts.google.com UI)
  const triggerGoogleOAuthPopup = () => {
    setError('');
    const activeCid = import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;

    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2 && activeCid) {
      let oauthSafetyTimer = null;
      try {
        setGoogleLoading(true);
        oauthSafetyTimer = setTimeout(() => {
          setGoogleLoading(false);
        }, 45000);
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: activeCid,
          scope: 'email profile openid',
          error_callback: (err) => {
            if (oauthSafetyTimer) clearTimeout(oauthSafetyTimer);
            setGoogleLoading(false);
            if (err?.type === 'popup_failed_to_open') {
              setError('Popup Google diblokir browser. Izinkan popup atau gunakan form pendaftaran email & password.');
            }
          },
          callback: async (tokenResponse) => {
            if (oauthSafetyTimer) clearTimeout(oauthSafetyTimer);
            if (tokenResponse.error) {
              console.error('Google OAuth error:', tokenResponse);
              setGoogleLoading(false);
              if (tokenResponse.error !== 'popup_closed_by_user') {
                setError(`Google Sign-In: ${tokenResponse.error_description || tokenResponse.error}`);
              }
              return;
            }

            try {
              const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
              });
              if (!userRes.ok) throw new Error('Gagal memverifikasi profil Google');
              const profile = await userRes.json();

              if (profile?.email) {
                const check = await apiCheckEmail(profile.email);
                if (check?.exists) {
                  const data = await apiGoogleAuth({
                    email: profile.email,
                    name: profile.name,
                    picture: profile.picture,
                    googleId: profile.sub,
                    role: check.role || selectedRole
                  });
                  if (data.user) {
                    localStorage.setItem('kostUser', JSON.stringify(data.user));
                    if (data.kostName) localStorage.setItem('kostName', data.kostName);
                    setShowGoogleModal(false);
                    const targetPath = getStaffDefaultPath(data.user);
                    navigate(targetPath, { replace: true });
                  }
                  return;
                }
              }

              // Pengguna baru Google: isi form pendaftaran
              setName(profile.name || '');
              setEmail(profile.email || '');
              setGoogleAuthData({
                profile,
                token: tokenResponse.access_token
              });
              setTimeout(() => {
                const targetInput = document.querySelector('input[placeholder*="Kantin"], input[placeholder*="Contoh:"]') || document.querySelector('form');
                targetInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 250);
            } catch (err) {
              setError(err.message || 'Gagal mendaftar dengan akun Google.');
            } finally {
              setGoogleLoading(false);
            }
          }
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('Gagal memicu Google OAuth2 Popup, fallback ke modal:', err);
        setGoogleLoading(false);
      }
    }

    setShowGoogleModal(true);
  };

  // Initialize official Google Identity Services (GSI) on Register page
  useEffect(() => {
    const activeCid = import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;
    if (!activeCid || typeof window === 'undefined') return;

    const setupGsi = () => {
      if (!window.google?.accounts?.id) return;

      try {
        window.google.accounts.id.initialize({
          client_id: activeCid,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (registerGoogleBtnRef.current) {
          registerGoogleBtnRef.current.innerHTML = '';
          const containerW = registerGoogleBtnRef.current.clientWidth || (typeof window !== 'undefined' ? window.innerWidth - 72 : 320);
          window.google.accounts.id.renderButton(registerGoogleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'signup_with',
            shape: 'pill',
            width: Math.min(320, Math.max(220, Math.floor(containerW))),
            logo_alignment: 'left'
          });
        }
      } catch (err) {
        console.warn('Inisialisasi Google Identity Register gagal:', err);
      }
    };

    if (window.google?.accounts?.id) {
      setupGsi();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          setupGsi();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [showGoogleModal]);

  // Google 1-Click Quick Register / Login (In-App Fallback)
  const handleGoogleQuickSignup = async (e) => {
    if (e) e.preventDefault();
    if (!googleEmail || !googleEmail.includes('@')) {
      setError('Masukkan alamat email Google yang valid (contoh: nama@gmail.com)');
      return;
    }

    try {
      setGoogleLoading(true);
      setError('');
      const effectiveName = googleName.trim() || googleEmail.split('@')[0];
      const data = await apiGoogleAuth({
        email: googleEmail.trim().toLowerCase(),
        name: effectiveName,
        role: selectedRole
      });

      if (data.user) {
        localStorage.setItem('kostUser', JSON.stringify(data.user));
        if (data.kostName) localStorage.setItem('kostName', data.kostName);
        setShowGoogleModal(false);
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Gagal mendaftar dengan akun Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Cek kelengkapan formulir dengan pesan jelas untuk feedback instan
  const getSubmitBlockerReason = () => {
    if (!name.trim()) return 'Isi Nama Lengkap Anda terlebih dahulu.';
    if (selectedRole === 'owner' && !kostName.trim()) return 'Isi Nama Properti Kost Anda.';
    if (selectedRole === 'mitra' && !storeName.trim()) return 'Isi Nama Usaha / Bisnis / Toko Anda.';
    if (selectedRole === 'mitra' && !businessCategory) return 'Pilih Kategori Usaha / Bisnis Anda.';
    if ((selectedRole === 'owner' || selectedRole === 'mitra' || selectedRole === 'staff') && (!email || !email.includes('@'))) {
      return 'Isi alamat Gmail / Email yang valid.';
    }
    if (otpChannel === 'email' && (!email || !email.includes('@'))) {
      return 'Isi alamat Email yang valid untuk menerima OTP Email.';
    }
    if (!phone || phone.trim().length < 8) return 'Isi Nomor WhatsApp aktif (minimal 8 digit).';
    if (!googleAuthData) {
      if (!isPasswordValid(password)) return PASSWORD_POLICY_MESSAGE;
      if (password !== confirmPassword) return 'Konfirmasi password belum cocok dengan password.';
    }
    if (!agreedTerms) return 'Centang kotak persetujuan Syarat & Ketentuan (S&K) di atas.';
    return null;
  };

  // Kondisi Tombol Lanjut ke OTP Aktif (validasi form utama)
  const isSubmitDisabled = () => {
    if (otpSending) return true;
    return Boolean(getSubmitBlockerReason());
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 10%, rgba(37, 99, 235, 0.15) 0%, var(--bg-main) 70%)',
      padding: 'clamp(1rem, 3.5vw, 2.25rem) clamp(0.65rem, 2.5vw, 1rem)'
    }}>
      <div className="card glass-panel animate-fade-in" style={{
        maxWidth: '560px',
        width: '100%',
        padding: 'clamp(1.1rem, 3.5vw, 2rem) clamp(0.95rem, 3.5vw, 1.85rem)',
        border: '1px solid var(--border-light)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
        borderRadius: '20px',
        minWidth: 0,
        boxSizing: 'border-box'
      }}>
        
        {/* Top Back & Cancel Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '10px',
              background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)',
              border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
              color: isLight ? '#1e293b' : '#cbd5e1',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => {
              e.currentTarget.style.color = isLight ? '#0f172a' : '#ffffff';
              e.currentTarget.style.background = isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.color = isLight ? '#1e293b' : '#cbd5e1';
              e.currentTarget.style.background = isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)';
            }}
            title="Kembali ke halaman sebelumnya"
          >
            <ArrowLeft size={15} />
            <span>Kembali</span>
          </button>

          <Link
            to="/"
            style={{
              fontSize: '0.8rem',
              color: isLight ? '#64748b' : '#94a3b8',
              textDecoration: 'none',
              fontWeight: 500,
              transition: 'color 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.color = isLight ? '#0f172a' : '#f1f5f9'}
            onMouseOut={e => e.currentTarget.style.color = isLight ? '#64748b' : '#94a3b8'}
            title="Batalkan registrasi dan kembali ke beranda"
          >
            Batal
          </Link>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <img 
            src="/logo.png" 
            alt="Logo KostKu" 
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              objectFit: 'contain',
              marginBottom: '1rem',
              boxShadow: 'var(--shadow-glow)'
            }} 
          />
          <h1 style={{ margin: '0 0 6px 0', fontSize: 'clamp(1.35rem, 4.5vw, 1.75rem)', fontWeight: 800 }}>
            Daftar Akun KostKu
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.88rem' }}>
            Verifikasi instan via Email OTP &amp; Cloudflare Turnstile (Anti-Bot Tanpa Captcha).
          </p>
        </div>

        {/* Program Jaminan & Fitur "Pelindung KostKu" Banner */}
        <div style={{
          background: isLight 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(37, 99, 235, 0.08) 100%)' 
            : 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(37, 99, 235, 0.15) 100%)',
          border: isLight ? '1.5px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '16px',
          padding: '14px 16px',
          marginBottom: '1.5rem',
          boxShadow: isLight ? '0 4px 15px rgba(16, 185, 129, 0.1)' : '0 4px 20px rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.35)',
              flexShrink: 0
            }}>
              <ShieldCheck size={16} />
            </div>
            <strong style={{ color: isLight ? '#065f46' : '#6ee7b7', fontSize: '0.88rem' }}>
              Dilindungi oleh Program Pelindung KostKu
            </strong>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Setiap akun terdaftar otomatis tercakup dalam jaminan keamanan resmi platform:
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '8px', fontSize: '0.74rem' }}>
              <div style={{ background: isLight ? '#ffffff' : 'rgba(0, 0, 0, 0.25)', padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <strong>Owner Kost:</strong> Uang sewa aman &amp; anti-penunggak
              </div>
              <div style={{ background: isLight ? '#ffffff' : 'rgba(0, 0, 0, 0.25)', padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <strong>Bisnis Mitra:</strong> Anti-fake order &amp; kasir tercatat
              </div>
              <div style={{ background: isLight ? '#ffffff' : 'rgba(0, 0, 0, 0.25)', padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <strong>Karyawan:</strong> Akun Gmail &amp; jam kerja sah
              </div>
              <div style={{ background: isLight ? '#ffffff' : 'rgba(0, 0, 0, 0.25)', padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <strong>Penghuni:</strong> Garansi 100% anti-kost fiktif
              </div>
            </div>
          </div>
        </div>

        {step === 'form' && (
          <>
            {/* ═════════════════════════════════════════════════════
                PILIHAN PERAN AKUN: PEMILIK KOST vs PEMILIK BISNIS vs KARYAWAN vs PENGHUNI
                ═════════════════════════════════════════════════════ */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Pilih Tipe Akun Anda <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))',
                gap: '8px'
              }}>
                {/* 1. Pemilik Kost (Owner) */}
                <div 
                  onClick={() => setSelectedRole('owner')}
                  style={{
                    padding: '12px 6px',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    border: selectedRole === 'owner' 
                      ? '2px solid #3b82f6' 
                      : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)'),
                    background: selectedRole === 'owner' 
                      ? (isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.18)') 
                      : (isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)'),
                    boxShadow: selectedRole === 'owner' ? '0 4px 15px rgba(59, 130, 246, 0.25)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ marginBottom: '4px', display: 'flex', justifyContent: 'center', color: selectedRole === 'owner' ? '#3b82f6' : 'var(--text-secondary)' }}><Building2 size={22} /></div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: selectedRole === 'owner' ? '#3b82f6' : 'var(--text-primary)' }}>
                    Pemilik Kost
                  </div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Properti &amp; Kamar
                  </div>
                </div>

                {/* 2. Pemilik Bisnis (Mitra UMKM / Kantin / Cafe / Toko) */}
                <div 
                  onClick={() => setSelectedRole('mitra')}
                  style={{
                    padding: '12px 6px',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    border: selectedRole === 'mitra' 
                      ? '2px solid #f59e0b' 
                      : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)'),
                    background: selectedRole === 'mitra' 
                      ? (isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.18)') 
                      : (isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)'),
                    boxShadow: selectedRole === 'mitra' ? '0 4px 15px rgba(245, 158, 11, 0.25)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ marginBottom: '4px', display: 'flex', justifyContent: 'center', color: selectedRole === 'mitra' ? '#f59e0b' : 'var(--text-secondary)' }}><Store size={22} /></div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: selectedRole === 'mitra' ? '#f59e0b' : 'var(--text-primary)' }}>
                    Pemilik Bisnis
                  </div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Kantin, Cafe &amp; Toko
                  </div>
                </div>

                {/* 3. Karyawan / Staf (Staff) */}
                <div 
                  onClick={() => setSelectedRole('staff')}
                  style={{
                    padding: '12px 6px',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    border: selectedRole === 'staff' 
                      ? '2px solid #10b981' 
                      : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)'),
                    background: selectedRole === 'staff' 
                      ? (isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.18)') 
                      : (isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)'),
                    boxShadow: selectedRole === 'staff' ? '0 4px 15px rgba(16, 185, 129, 0.25)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ marginBottom: '4px', display: 'flex', justifyContent: 'center', color: selectedRole === 'staff' ? '#10b981' : 'var(--text-secondary)' }}><Briefcase size={22} /></div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: selectedRole === 'staff' ? '#10b981' : 'var(--text-primary)' }}>
                    Karyawan
                  </div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Staf Operasional
                  </div>
                </div>

                {/* 4. Penghuni / Penyewa (User) */}
                <div 
                  onClick={() => setSelectedRole('user')}
                  style={{
                    padding: '12px 6px',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    border: selectedRole === 'user' 
                      ? '2px solid #8b5cf6' 
                      : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)'),
                    background: selectedRole === 'user' 
                      ? (isLight ? '#f5f3ff' : 'rgba(139, 92, 246, 0.18)') 
                      : (isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)'),
                    boxShadow: selectedRole === 'user' ? '0 4px 15px rgba(139, 92, 246, 0.25)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ marginBottom: '4px', display: 'flex', justifyContent: 'center', color: selectedRole === 'user' ? '#8b5cf6' : 'var(--text-secondary)' }}><Home size={22} /></div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: selectedRole === 'user' ? '#8b5cf6' : 'var(--text-primary)' }}>
                    Penghuni
                  </div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Penyewa Kamar
                  </div>
                </div>
              </div>

              {/* Penjelasan Peran Terpilih */}
              <div style={{
                marginTop: '8px',
                padding: '8px 12px',
                borderRadius: '10px',
                fontSize: '0.76rem',
                lineHeight: 1.45,
                background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)'
              }}>
                {selectedRole === 'owner' && (
                  <span><strong>Akun Pemilik Kost (Owner):</strong> Kelola properti kost, kamar sewa, tagihan penghuni, pantau kasir, &amp; daftarkan akun staf karyawan menggunakan Gmail mereka masing-masing.</span>
                )}
                {selectedRole === 'mitra' && (
                  <span><strong>Akun Pemilik Bisnis (Mitra UMKM / Kantin / Cafe / Toko):</strong> Kelola usaha komersial, katalog menu &amp; foto produk, meja barcode QR self-order, dapur KDS, pembukuan kasir POS, &amp; staf kasir.</span>
                )}
                {selectedRole === 'staff' && (
                  <span><strong>Akun Karyawan / Staf:</strong> Masuk menggunakan akun Gmail Anda sendiri untuk operasional kasir POS, dapur, dan absensi yang dihubungkan oleh Pemilik Kost atau Pemilik Bisnis.</span>
                )}
                {selectedRole === 'user' && (
                  <span><strong>Akun Penghuni Kost:</strong> Cari kamar kost, ajukan sewa, pesan menu kantin meja QR, dan bayar tagihan sewa kamar secara online.</span>
                )}
              </div>
            </div>

            {/* ═════════════════════════════════════════════════════
                PILIHAN 1: DAFTAR RESMI DENGAN GOOGLE (100% REAL)
                ═════════════════════════════════════════════════════ */}
            <div style={{ marginBottom: '1.5rem', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Official Google GSI Rendered Button (Single Real Button) */}
              <div 
                ref={registerGoogleBtnRef} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  width: '100%', 
                  minHeight: '44px'
                }} 
              />
              <div style={{ textAlign: 'center', marginTop: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: isLight ? '#2563eb' : '#60a5fa', fontWeight: 600 }}>
                  ✦ Masuk cepat Google sebagai {selectedRole === 'owner' ? 'Pemilik Kost' : selectedRole === 'mitra' ? 'Pemilik Bisnis' : selectedRole === 'staff' ? 'Karyawan' : 'Penghuni'}: 1-klik terverifikasi
                </span>
                <div style={{ fontSize: '0.7rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '3px' }}>
                  Dengan mendaftar via Google, Anda menyetujui S&amp;K &amp; Kebijakan Privasi KostKu.
                </div>
              </div>
            </div>

            {/* Separator */}
            <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '1.25rem', fontSize: '0.8rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
              <span style={{ margin: '0 10px', color: 'var(--text-muted)' }}>atau daftar dengan Email &amp; Password</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
            </div>

            {/* Indikator Draft Tersimpan di Perangkat */}
            {hasSavedDraft && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '10px',
                marginBottom: '1rem',
                background: isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.1)',
                border: `1px solid ${isLight ? '#bbf7d0' : 'rgba(16, 185, 129, 0.28)'}`,
                fontSize: '0.76rem',
                color: isLight ? '#166534' : '#86efac'
              }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                  <CheckCircle size={14} color="#10b981" style={{ flexShrink: 0 }} />
                  Isian formulir tersimpan otomatis di perangkat ini
                </span>
                <button
                  type="button"
                  onClick={handleResetDraft}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: isLight ? '#b91c1c' : '#fca5a5',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: '2px 4px',
                    textDecoration: 'underline',
                    flexShrink: 0
                  }}
                >
                  Hapus Draft
                </button>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--accent-danger)',
                padding: '12px 14px',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleInitiateOtp(); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* ═════════════════════════════════════════════════════
                PILAR 4: HONEYPOT TRAP (TERSEMBUNYI DARI MANUSIA)
                Bot otomatis akan mengisi form ini dan langsung diblokir
                ═════════════════════════════════════════════════════ */}
            <div style={{ display: 'none', position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }} aria-hidden="true">
              <label htmlFor="website">Jangan isi kolom ini jika Anda manusia</label>
              <input 
                id="website"
                type="text" 
                name="website" 
                tabIndex={-1} 
                autoComplete="off" 
                value={honeypot} 
                onChange={e => setHoneypot(e.target.value)} 
              />
              <input 
                type="text" 
                name="company_url" 
                tabIndex={-1} 
                autoComplete="off" 
                value={honeypotCompany} 
                onChange={e => setHoneypotCompany(e.target.value)} 
              />
            </div>

            {/* ═════════════════════════════════════════════════════
                SECTION 1: DATA AKUN & KONTAK RESMI (NAMA LENGKAP TERSIMPAN)
                ═════════════════════════════════════════════════════ */}
            <div>
              <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={16} color="#60a5fa" /> 
                Data Akun &amp; Kontak
              </h4>

              {googleAuthData && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  background: isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.15)',
                  border: '1.5px solid #3b82f6',
                  marginBottom: '1rem'
                }}>
                  {googleAuthData.profile?.picture ? (
                    <img src={googleAuthData.profile.picture} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                      G
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      ✓ Terhubung Akun Google: {googleAuthData.profile?.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {googleAuthData.profile?.email} • Lengkapi nama usaha & nomor WhatsApp di bawah
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setGoogleAuthData(null); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: isLight ? '#2563eb' : '#60a5fa',
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                      textDecoration: 'underline'
                    }}
                  >
                    Batal Google
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {/* Nama Lengkap Pengguna */}
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {selectedRole === 'owner' ? 'Nama Lengkap Pemilik Kost' : selectedRole === 'mitra' ? 'Nama Lengkap Pemilik Bisnis' : selectedRole === 'staff' ? 'Nama Lengkap Karyawan' : 'Nama Lengkap'} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder={selectedRole === 'owner' ? 'Contoh: H. Ahmad Supriyadi' : selectedRole === 'mitra' ? 'Contoh: Ibu Siti Rahayu' : selectedRole === 'staff' ? 'Contoh: Budi Santoso (Kasir)' : 'Contoh: Budi Santoso'} 
                    className="input-field" 
                  />
                </div>

                {/* Nama Properti Kost (Khusus Pemilik Kost / Owner) */}
                {selectedRole === 'owner' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Nama Properti Kost <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={kostName} 
                      onChange={e => setKostName(e.target.value)} 
                      placeholder="Contoh: Kost Griya Harmoni 1" 
                      className="input-field" 
                    />
                  </div>
                )}

                {/* Nama Usaha & Kategori (Khusus Pemilik Bisnis / Mitra UMKM) */}
                {selectedRole === 'mitra' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Nama Usaha / Bisnis / Toko <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input 
                        type="text" 
                        required 
                        value={storeName} 
                        onChange={e => setStoreName(e.target.value)} 
                        placeholder="Contoh: Kantin Riuh Barokah, Cafe Kopi Senja, Laundry Kilat" 
                        className="input-field" 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Kategori Bisnis / Usaha <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <div data-testid="register-business-category" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                        {BUSINESS_CATEGORIES.map((cat) => {
                          const active = businessPreset === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              data-testid={`register-category-${cat.id}`}
                              onClick={() => setBusinessPreset(cat.id)}
                              style={{
                                textAlign: 'left',
                                padding: '10px 12px',
                                borderRadius: '12px',
                                border: active ? '2px solid #f59e0b' : '1px solid var(--border-color, rgba(148,163,184,0.35))',
                                background: active ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                minHeight: '48px'
                              }}
                            >
                              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: active ? '#f59e0b' : 'var(--text-primary)' }}>{cat.label}</div>
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{cat.hint}</div>
                            </button>
                          );
                        })}
                      </div>
                      {businessPreset === 'Lainnya' && (
                        <input
                          type="text"
                          required
                          value={customBusinessCategory}
                          onChange={(e) => setCustomBusinessCategory(e.target.value)}
                          placeholder="Tulis jenis usaha (mis: Barbershop, Bengkel)"
                          className="input-field"
                          style={{ marginTop: '8px' }}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Email & No WhatsApp (Atas Bawah Vertikal) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {selectedRole === 'owner' ? 'Akun Gmail Pemilik Kost' : selectedRole === 'mitra' ? 'Akun Gmail Pemilik Bisnis' : selectedRole === 'staff' ? 'Akun Gmail Pribadi Karyawan' : 'Email (Opsional)'} {(selectedRole === 'owner' || selectedRole === 'mitra' || selectedRole === 'staff') && <span style={{ color: '#ef4444' }}>*</span>}
                    </label>
                    <input 
                      type="email" 
                      required={selectedRole === 'owner' || selectedRole === 'mitra' || selectedRole === 'staff'}
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      placeholder={selectedRole === 'staff' ? 'karyawan@gmail.com' : selectedRole === 'mitra' ? 'bisnis@gmail.com' : 'owner@gmail.com'} 
                      className="input-field" 
                      disabled={Boolean(googleAuthData)}
                      style={googleAuthData ? { opacity: 0.85, background: 'rgba(255,255,255,0.05)', cursor: 'not-allowed' } : {}}
                    />
                    {(selectedRole === 'owner' || selectedRole === 'mitra' || selectedRole === 'staff') && (
                      <span style={{ fontSize: '0.68rem', color: selectedRole === 'staff' ? '#10b981' : selectedRole === 'mitra' ? '#f59e0b' : '#3b82f6', display: 'block', marginTop: '3px' }}>
                        {googleAuthData ? '✓ Terverifikasi via Akun Google' : '* Gunakan Gmail aktif Anda'}
                      </span>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Nomor WhatsApp / HP <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input 
                      type="tel" 
                      required
                      value={phone} 
                      onChange={e => setPhone(e.target.value)} 
                      placeholder="Contoh: 081234567890" 
                      className="input-field" 
                    />
                  </div>
                </div>

                {/* Password & Konfirmasi Password (Atas Bawah Vertikal) */}
                {!googleAuthData ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Password <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type={showPassword ? 'text' : 'password'} 
                          required 
                          value={password} 
                          onChange={e => setPassword(e.target.value)} 
                          placeholder={`Min. ${PASSWORD_MIN_LENGTH} karakter (huruf & angka)`} 
                          className="input-field" 
                          style={{ paddingRight: '40px' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer'
                          }}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <div data-testid="password-checklist" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: '8px' }}>
                        {getPasswordChecks(password).map((c) => (
                          <span key={c.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 600, color: c.ok ? '#10b981' : 'var(--text-secondary)' }}>
                            {c.ok ? <Check size={13} /> : <span style={{ width: 13, height: 13, borderRadius: '50%', border: '1.5px solid currentColor', display: 'inline-block', boxSizing: 'border-box' }} />}
                            {c.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Konfirmasi Password <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        required 
                        value={confirmPassword} 
                        onChange={e => setConfirmPassword(e.target.value)} 
                        placeholder="Ketik ulang password untuk konfirmasi" 
                        className="input-field" 
                      />
                      {confirmPassword && password !== confirmPassword && (
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#ef4444', display: 'block', marginTop: '4px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={13} /> Konfirmasi password belum cocok</span>
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    fontSize: '0.78rem',
                    color: isLight ? '#047857' : '#86efac',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Check size={16} />
                    <span>Terverifikasi dengan Akun Google. Anda dapat masuk langsung 1-klik tanpa password manual.</span>
                  </div>
                )}

                {/* Informasi Metode Verifikasi OTP Email (Hanya untuk Pendaftaran Manual Biasa) */}
                {!googleAuthData && (
                  <div style={{
                    margin: '0.25rem 0',
                    background: isLight ? '#f0f9ff' : 'rgba(56, 189, 248, 0.08)',
                    border: `1px solid ${isLight ? '#bae6fd' : 'rgba(56, 189, 248, 0.25)'}`,
                    borderRadius: '14px',
                    padding: '12px 14px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <label style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <KeyRound size={15} color="#0284c7" /> Verifikasi OTP via Email
                      </label>
                      <span style={{ fontSize: '0.7rem', color: isLight ? '#0369a1' : '#38bdf8', background: isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.14)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                        Aktif
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: isLight ? '#475569' : '#94a3b8', lineHeight: 1.45 }}>
                      Kode keamanan 6 digit akan dikirim langsung ke alamat Gmail / Email yang Anda daftarkan.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ═════════════════════════════════════════════════════
                PILAR 1: CLOUDFLARE TURNSTILE (INVISIBLE / SEAMLESS)
                ═════════════════════════════════════════════════════ */}
            <CloudflareTurnstile 
              onVerify={(token) => setTurnstileToken(token)}
              action="register"
            />

            {/* ═════════════════════════════════════════════════════
                KLAUSUL HUKUM: PERSETUJUAN SYARAT & KETENTUAN (CLICKWRAP)
                ═════════════════════════════════════════════════════ */}
            <div 
              id="agreeTermsContainer"
              style={{
                marginTop: '1.25rem',
                marginBottom: '1rem',
                padding: '14px 16px',
                borderRadius: '14px',
                background: agreedTerms 
                  ? (isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.12)') 
                  : (isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.04)'),
                border: agreedTerms 
                  ? '1.5px solid #10b981' 
                  : (isLight ? '1.5px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.2)'),
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: agreedTerms 
                  ? (isLight ? '0 2px 10px rgba(16, 185, 129, 0.18)' : '0 0 15px rgba(16, 185, 129, 0.2)') 
                  : (isLight ? '0 1px 3px rgba(0,0,0,0.05)' : 'none')
              }}
              onClick={() => setAgreedTerms(!agreedTerms)}
            >
              <input 
                type="checkbox" 
                id="agreeTermsCheckbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                style={{
                  marginTop: '3px',
                  width: '20px',
                  height: '20px',
                  accentColor: '#2563eb',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ 
                    fontSize: '0.72rem', 
                    fontWeight: 700, 
                    letterSpacing: '0.05em', 
                    textTransform: 'uppercase',
                    color: agreedTerms ? '#10b981' : (isLight ? '#dc2626' : '#f87171')
                  }}>
                    {agreedTerms ? '✓ Persetujuan Dikonfirmasi' : 'Wajib Dicentang'}
                  </span>
                </div>
                <label 
                  htmlFor="agreeTermsCheckbox" 
                  style={{ 
                    fontSize: '0.82rem', 
                    color: isLight ? '#1e293b' : '#f1f5f9', 
                    lineHeight: 1.6, 
                    cursor: 'pointer', 
                    margin: 0,
                    userSelect: 'none',
                    display: 'block'
                  }}
                >
                  Saya menyatakan telah membaca, memahami, dan menyetujui seluruh{' '}
                  <Link 
                    to="/syarat-ketentuan" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: isLight ? '#1d4ed8' : '#60a5fa', fontWeight: 800, textDecoration: 'underline' }}
                  >
                    Syarat & Ketentuan Layanan (S&K)
                  </Link>
                  ,{' '}
                  <Link 
                    to="/kebijakan-privasi" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: isLight ? '#1d4ed8' : '#60a5fa', fontWeight: 800, textDecoration: 'underline' }}
                  >
                    Kebijakan Privasi
                  </Link>
                  , serta <strong>Perjanjian Sewa-Menyewa & Kemitraan Layanan KostKu</strong>. <span style={{ color: '#ef4444', fontWeight: 800 }}>*</span>
                </label>

                {/* Tombol Cepat Baca Syarat & Ketentuan Pop-up */}
                <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTermsModal(true);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      background: isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.15)',
                      border: isLight ? '1px solid #bae6fd' : '1px solid rgba(56, 189, 248, 0.3)',
                      color: isLight ? '#0284c7' : '#38bdf8',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <FileText size={13} />
                    <span>Baca Ringkasan Syarat &amp; Ketentuan</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Inline Feedback Langsung di Dekat Tombol Kirim OTP */}
            {error && (
              <div style={{
                background: isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: isLight ? '#b91c1c' : '#fca5a5',
                padding: '10px 12px',
                borderRadius: '10px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {otpSending && (
              <div style={{
                background: isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.14)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                color: isLight ? '#1d4ed8' : '#93c5fd',
                padding: '10px 12px',
                borderRadius: '10px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <RefreshCw size={15} className="animate-spin" style={{ flexShrink: 0 }} />
                <span>Menyiapkan &amp; mengirim kode OTP ke {otpChannel === 'whatsapp' ? 'WhatsApp' : 'Email'} Anda...</span>
              </div>
            )}

            {!error && !otpSending && getSubmitBlockerReason() && (
              <div style={{
                background: isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.1)',
                border: `1px solid ${isLight ? '#fde68a' : 'rgba(245, 158, 11, 0.3)'}`,
                color: isLight ? '#92400e' : '#fcd34d',
                padding: '8px 12px',
                borderRadius: '10px',
                fontSize: '0.76rem',
                display: 'flex',
                alignItems: 'center',
                gap: '7px'
              }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                <span><strong>Lengkapi:</strong> {getSubmitBlockerReason()}</span>
              </div>
            )}

            {/* Tombol Aksi: Batal / Lanjut ke OTP */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '0.25rem' }}>
              <button 
                type="button" 
                onClick={() => {
                  if (window.history.length > 1) {
                    navigate(-1);
                  } else {
                    navigate('/');
                  }
                }}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '13px', fontSize: '0.92rem', borderRadius: '12px' }}
              >
                Batal
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={otpSending} 
                style={{ 
                  flex: 2,
                  padding: '13px', 
                  fontSize: '0.95rem', 
                  borderRadius: '12px',
                  fontWeight: 700,
                  gap: '8px',
                  justifyContent: 'center',
                  opacity: isSubmitDisabled() ? 0.82 : 1
                }}
              >
                {otpSending ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> {googleAuthData ? 'Mendaftarkan Akun...' : 'Mengirim OTP...'}
                  </>
                ) : googleAuthData ? (
                  <>
                    <Check size={18} /> Selesaikan Pendaftaran &amp; Buka Kasir →
                  </>
                ) : (
                  <>
                    Lanjut ke OTP Email <ArrowRight size={16}/>
                  </>
                )}
              </button>
            </div>
          </form>
        </>
      )}

      {/* ═════════════════════════════════════════════════════
          STEP 2: VERIFIKASI OTP (WHATSAPP ATAU GMAIL)
          ═════════════════════════════════════════════════════ */}
      {step === 'otp' && (
        <div className="animate-scale-up">
          {/* Header Badge */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              width: 64,
              height: 64,
              margin: '0 auto 1rem',
              borderRadius: '20px',
              background: otpChannel === 'whatsapp'
                ? 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)'
                : 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: otpChannel === 'whatsapp'
                ? '0 0 25px rgba(34, 197, 94, 0.4)'
                : '0 0 25px rgba(56, 189, 248, 0.4)'
            }}>
              {otpChannel === 'whatsapp' ? (
                <MessageSquare size={32} color="white" />
              ) : (
                <Mail size={32} color="white" />
              )}
            </div>
            <h2 style={{ margin: '0 0 6px', fontSize: '1.5rem', fontWeight: 800 }}>
              Verifikasi Kode OTP
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Kode keamanan 6 digit telah dikirim ke {otpChannel === 'whatsapp' ? 'WhatsApp' : 'Gmail / Email'}:
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              padding: '6px 14px',
              borderRadius: '9999px',
              marginTop: '8px',
              fontWeight: 700,
              color: otpChannel === 'whatsapp' ? '#4ade80' : '#38bdf8',
              fontSize: '0.9rem'
            }}>
              {otpChannel === 'whatsapp' ? <Smartphone size={15} /> : <Mail size={15} />}
              <span>{otpMaskedTarget}</span>
            </div>
          </div>

          {/* Error & Success Messages */}
          {otpError && (
            <div style={{
              background: isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '10px 14px',
              borderRadius: '12px',
              color: isLight ? '#b91c1c' : '#fca5a5',
              fontSize: '0.82rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
              <span>{otpError}</span>
            </div>
          )}

          {otpSuccess && (
            <div style={{
              background: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              padding: '10px 14px',
              borderRadius: '12px',
              color: isLight ? '#065f46' : '#86efac',
              fontSize: '0.82rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0 }} />
              <span>{otpSuccess}</span>
            </div>
          )}

          {/* Form Input OTP */}
          <form onSubmit={handleVerifyAndRegister}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{
                display: 'block',
                textAlign: 'center',
                fontSize: '0.82rem',
                color: '#94a3b8',
                marginBottom: '8px'
              }}>
                Masukkan 6 Digit Kode OTP
              </label>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                autoFocus
                value={otpCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtpCode(val);
                  if (otpError) setOtpError('');
                }}
                placeholder="• • • • • •"
                style={{
                  width: '100%',
                  textAlign: 'center',
                  fontSize: '2rem',
                  letterSpacing: '0.45em',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '2px solid rgba(59, 130, 246, 0.4)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  outline: 'none',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
                }}
              />
            </div>

            {/* Quick Auto-Fill / Kode Verifikasi Instan Fallback */}
            {otpDevCode && (
              <div style={{
                background: isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.12)',
                border: '1px dashed rgba(59, 130, 246, 0.4)',
                padding: '10px 12px',
                borderRadius: '10px',
                marginBottom: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '0.78rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ color: isLight ? '#1e3a8a' : '#93c5fd' }}>
                    <strong>{otpDeliveryMethod === 'instant_fallback' ? 'Kode Verifikasi Instan:' : 'Kode Dev/Uji:'}</strong>{' '}
                    <code style={{ background: isLight ? '#dbeafe' : 'rgba(0,0,0,0.35)', padding: '2px 7px', borderRadius: '4px', fontWeight: 800, color: isLight ? '#1d4ed8' : '#bfdbfe' }}>{otpDevCode}</code>
                  </span>
                  <button
                    type="button"
                    onClick={() => setOtpCode(otpDevCode)}
                    style={{
                      background: isLight ? '#2563eb' : 'rgba(59, 130, 246, 0.28)',
                      border: 'none',
                      color: '#ffffff',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      flexShrink: 0
                    }}
                  >
                    Isi Otomatis
                  </button>
                </div>
                {otpDeliveryMethod === 'instant_fallback' && (
                  <span style={{ color: isLight ? '#475569' : '#94a3b8', fontSize: '0.72rem', lineHeight: 1.4 }}>
                    Pengiriman Email gateway belum aktif untuk alamat ini. Ketuk &ldquo;Isi Otomatis&rdquo; untuk melanjutkan.
                  </span>
                )}
              </div>
            )}

            {/* Timer & Resend Controls */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.82rem', color: '#94a3b8' }}>
              {otpCountdown > 0 ? (
                <span>
                  Kirim ulang kode dalam <strong style={{ color: '#60a5fa' }}>{otpCountdown} detik</strong>
                </span>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: isLight ? '#475569' : '#cbd5e1' }}>Belum menerima kode?</span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={otpSending}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#60a5fa',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '0.82rem',
                      textDecoration: 'underline'
                    }}
                  >
                    {otpSending ? 'Mengirim...' : 'Kirim Ulang OTP'}
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setStep('form')}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '12px', fontSize: '0.88rem', gap: '6px' }}
              >
                <ArrowLeft size={16} /> Ubah Formulir
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={otpVerifying || otpCode.length < 4}
                style={{
                  flex: 1.5,
                  padding: '12px',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  gap: '8px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
                  boxShadow: '0 4px 18px rgba(37, 99, 235, 0.4)'
                }}
              >
                {otpVerifying ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Memverifikasi...
                  </>
                ) : (
                  <>
                    <Check size={16} /> Verifikasi & Buat Akun
                  </>
                )}
              </button>
            </div>

            {/* Cancel Entire Registration Escape Hatch */}
            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Batalkan proses pendaftaran akun? Anda akan kembali ke beranda.')) {
                    navigate('/');
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
                onMouseOver={e => e.currentTarget.style.color = '#cbd5e1'}
                onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}
              >
                Batalkan Pendaftaran & Kembali ke Beranda
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════
          STEP 3: SUKSES
          ═════════════════════════════════════════════════════ */}
      {step === 'success' && (
        <div className="animate-scale-up" style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          <div style={{
            width: 72,
            height: 72,
            margin: '0 auto 1.25rem',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 35px rgba(16, 185, 129, 0.45)'
          }}>
            <CheckCircle size={40} color="white" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 8px 0', color: isLight ? '#0f172a' : '#f8fafc' }}>
            Pendaftaran Berhasil!
          </h2>
          <p style={{ color: isLight ? '#475569' : '#94a3b8', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
            Nomor kontak Anda telah terverifikasi resmi via <strong>{otpChannel === 'whatsapp' ? 'WhatsApp' : 'Gmail'}</strong> dan dilindungi oleh <strong>Cloudflare Turnstile</strong>.
          </p>
          <div style={{
            background: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.1)',
            border: `1px solid ${isLight ? '#86efac' : 'rgba(16, 185, 129, 0.3)'}`,
            borderRadius: '12px',
            padding: '12px',
            color: isLight ? '#065f46' : '#a7f3d0',
            fontWeight: 600,
            fontSize: '0.82rem',
            marginBottom: '1.5rem'
          }}>
            Akun siap digunakan. Anda sedang dialihkan ke halaman Masuk...
          </div>
          <button
            onClick={() => navigate('/login')}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontWeight: 700 }}
          >
            Masuk ke Akun Sekarang →
          </button>
        </div>
      )}

        {/* Footer Link */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Sudah memiliki akun terdaftar?{' '}
          <Link to="/login" style={{ color: isLight ? '#2563eb' : '#60a5fa', fontWeight: 700, textDecoration: 'none' }}>
            Masuk di sini
          </Link>
        </div>

        {/* Legal Footer Links */}
        <div style={{
          marginTop: '1.25rem',
          textAlign: 'center',
          fontSize: '0.78rem',
          color: isLight ? '#475569' : '#64748b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <button 
            type="button" 
            onClick={() => setShowTermsModal(true)}
            style={{ background: 'none', border: 'none', padding: 0, color: isLight ? '#475569' : '#94a3b8', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem' }}
          >
            Syarat &amp; Ketentuan
          </button>
          <span>•</span>
          <Link to="/kebijakan-privasi" style={{ color: isLight ? '#475569' : '#94a3b8', textDecoration: 'none', fontWeight: 600 }}>
            Kebijakan Privasi
          </Link>
          <span>•</span>
          <Link to="/tentang-kami" style={{ color: isLight ? '#475569' : '#94a3b8', textDecoration: 'none', fontWeight: 600 }}>
            Tentang Kami
          </Link>
        </div>

      </div>

      {/* ═════════════════════════════════════════════════════
          MODAL POPUP: SYARAT & KETENTUAN RESMI KOSTKU
          ═════════════════════════════════════════════════════ */}
      {showTermsModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: isLight ? '#ffffff' : '#0f172a',
            border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '20px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden'
          }}>
            {/* Header Modal */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}>
                  <FileText size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Syarat &amp; Ketentuan Layanan KostKu
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    Pembaruan Resmi • Berlaku untuk Pemilik Kost, Karyawan, dan Penghuni
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Scroll */}
            <div style={{ padding: '20px', overflowY: 'auto', fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              <div style={{ marginBottom: '14px', padding: '12px', borderRadius: '12px', background: isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                <strong style={{ color: isLight ? '#1d4ed8' : '#93c5fd', display: 'block', marginBottom: '4px' }}>
                  Ringkasan Ketentuan Akun &amp; Peran:
                </strong>
                Platform KostKu memfasilitasi pengelolaan kost mandiri, keuangan, kasir kantin/POS, dan manajemen karyawan menggunakan akun Gmail masing-masing pihak demi transparansi dan keamanan.
              </div>

              <h4 style={{ color: 'var(--text-primary)', margin: '14px 0 6px 0', fontSize: '0.9rem' }}>
                1. Akun Pemilik Kost (Owner)
              </h4>
              <p style={{ margin: '0 0 10px 0' }}>
                Pemilik Kost memiliki hak penuh untuk mengelola properti kost, kamar, tarif sewa, penagihan penghuni, pembukuan keuangan properti, serta mendaftarkan dan menghapus akun staf karyawan/penjaga kost. Pemilik bertanggung jawab penuh atas kebenaran legalitas properti dan pemenuhan hak karyawan.
              </p>

              <h4 style={{ color: 'var(--text-primary)', margin: '14px 0 6px 0', fontSize: '0.9rem' }}>
                2. Akun Pemilik Bisnis (Mitra UMKM / Kantin / Cafe / Toko)
              </h4>
              <p style={{ margin: '0 0 10px 0' }}>
                Pemilik Bisnis memiliki hak independen untuk mengelola profil usaha, katalog produk &amp; menu makanan, meja QR self-order, dapur KDS, pembukuan kasir POS mandiri, serta mendaftarkan dan menghapus staf kasir mereka menggunakan akun Gmail pribadi karyawan.
              </p>

              <h4 style={{ color: 'var(--text-primary)', margin: '14px 0 6px 0', fontSize: '0.9rem' }}>
                3. Akun Karyawan &amp; Staf Operasional (Staff)
              </h4>
              <p style={{ margin: '0 0 10px 0' }}>
                Karyawan login menggunakan akun Gmail pribadi masing-masing yang telah didaftarkan oleh Pemilik Kost atau Pemilik Bisnis. Karyawan memiliki akses operasional yang didelegasikan (Kasir POS, Dapur KDS, Absensi GPS) dan dilarang menyalahgunakan data pesanan pelanggan.
              </p>

              <h4 style={{ color: 'var(--text-primary)', margin: '14px 0 6px 0', fontSize: '0.9rem' }}>
                4. Hak Pengelolaan &amp; Penghapusan Akun Karyawan
              </h4>
              <p style={{ margin: '0 0 10px 0' }}>
                Pemilik Kost dan Pemilik Bisnis berhak setiap saat menambahkan akun staf baru atau menghapus akun staf karyawan dari sistem properti atau toko mereka. Saat akun karyawan dihapus oleh Owner/Mitra, hak akses login Gmail staf tersebut ke sistem cabang akan dicabut seketika.
              </p>

              <h4 style={{ color: 'var(--text-primary)', margin: '14px 0 6px 0', fontSize: '0.9rem' }}>
                5. Pembayaran, Biaya Layanan &amp; TriPay Gateway
              </h4>
              <p style={{ margin: '0 0 10px 0' }}>
                Sistem mengintegrasikan pembayaran QRIS &amp; Virtual Account otomatis melalui TriPay Gateway resmi dengan skema biaya admin transparan:
                <br />• <strong>Transaksi Mitra (Kantin/Toko):</strong> Biaya admin flat Rp 100 per transaksi pesanan/nota.
                <br />• <strong>Transaksi Kost (Sewa Kamar):</strong> Biaya admin flat Rp 500 dibebankan ke Pelanggan/Penghuni sehingga Pemilik Kost menerima pelunasan sewa kamar secara penuh 100% tanpa potongan.
              </p>

              <h4 style={{ color: 'var(--text-primary)', margin: '14px 0 6px 0', fontSize: '0.9rem' }}>
                6. Privasi &amp; Perlindungan Data
              </h4>
              <p style={{ margin: '0 0 10px 0' }}>
                Data identitas, nomor kontak WhatsApp, dan akun Gmail pengguna dienkripsi secara aman dan tidak akan dialihkan ke pihak lain tanpa persetujuan sah.
              </p>

              <h4 style={{ color: '#10b981', margin: '14px 0 6px 0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} color="#10b981" /> 7. Program Jaminan "Pelindung KostKu"
              </h4>
              <p style={{ margin: '0 0 10px 0' }}>
                Seluruh pengguna terikat dan dilindungi oleh ekosistem <strong>Pelindung KostKu</strong> yang mencakup:
                <br />• <strong>Jaminan Pemilik Kost:</strong> Pembayaran sewa aman terverifikasi otomatis (anti-bukti transfer palsu), pencatatan deposit jaminan kerusakan, dan pengingat jatuh tempo WhatsApp.
                <br />• <strong>Jaminan Pemilik Bisnis:</strong> Validasi pesanan meja QR fisik (anti-fake order) dan audit trail kasir POS real-time.
                <br />• <strong>Jaminan Penghuni:</strong> Garansi 100% kamar riil terverifikasi (anti-kost fiktif), jaminan uang kembali 1x24 jam jika kamar zonk/fiktif, dan perlindungan privasi UU PDP.
                <br />• <strong>Jaminan Karyawan:</strong> Otoritas akun Gmail pribadi staf dan keabsahan jam kerja berbasis absensi geolocation GPS.
              </p>
            </div>

            {/* Footer Modal Actions */}
            <div style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)'
            }}>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setAgreedTerms(true);
                  setShowTermsModal(false);
                }}
                className="btn btn-primary"
                style={{
                  padding: '8px 18px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  gap: '6px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  color: '#ffffff'
                }}
              >
                <Check size={16} />
                <span>Saya Membaca &amp; Menyetujui</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Register;
