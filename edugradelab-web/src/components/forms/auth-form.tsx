/**
 * Login/Register Form Component
 * JWT authentication ile güvenli giriş formu
 * Mobil-first tasarım
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore, useUIStore } from '@/store';
import { LoginFormData, RegisterFormData, ApiResponse, LoginResponse } from '@/types';
import { validateEmail, validatePassword } from '@/lib/auth';
import { Eye, EyeOff, Mail, Lock, User, Loader2 } from 'lucide-react';

export const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});

  const router = useRouter();
  const { login } = useAuthStore();
  const { addNotification } = useUIStore();

  /**
   * Form validasyonu
   */
  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterFormData> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'E-posta adresi gereklidir';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Şifre gereklidir';
    } else if (!isLogin) {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors[0];
      }
    }

    // Register specific validations
    if (!isLogin) {
      // Username validation
      if (!formData.username?.trim()) {
        newErrors.username = 'Kullanıcı adı gereklidir';
      }

      // Confirm password validation
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Şifre onayı gereklidir';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Şifreler eşleşmiyor';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Form gönderimi
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password } as LoginFormData
        : formData;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result: ApiResponse<LoginResponse> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Bir hata oluştu');
      }

      if (result.data) {
        // Authentication başarılı
        login(result.data.user, result.data.token);
        
        addNotification({
          type: 'success',
          title: isLogin ? 'Giriş Başarılı' : 'Kayıt Başarılı',
          message: `Hoş geldiniz, ${result.data.user.username}!`,
        });

        // Dashboard'a yönlendir
        router.push('/dashboard');
      }

    } catch (error) {
      console.error('Auth error:', error);
      
      // Hata durumunda da login sayfasına yönlendir (error gösterme)
      router.push('/auth/login');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Input değişikliklerini handle et
   */
  const handleInputChange = (field: keyof RegisterFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * Form modunu değiştir
   */
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md" variant="elevated" padding="lg">
        <CardHeader className="text-center">
          <CardTitle as="h1" className="text-2xl">
            {isLogin ? 'Giriş Yap' : 'Hesap Oluştur'}
          </CardTitle>
          <CardDescription>
            {isLogin 
              ? 'EduGradeLab hesabınıza giriş yapın' 
              : 'EduGradeLab\'e katılın ve sınav analizi yapmaya başlayın'
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username field (only for register) */}
            {!isLogin && (
              <Input
                label="Kullanıcı Adı"
                type="text"
                value={formData.username}
                onChange={handleInputChange('username')}
                error={errors.username}
                leftIcon={<User className="w-4 h-4" />}
                placeholder="Kullanıcı adınız"
                autoComplete="username"
                disabled={isLoading}
              />
            )}

            {/* Email field */}
            <Input
              label="E-posta"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              error={errors.email}
              leftIcon={<Mail className="w-4 h-4" />}
              placeholder="ornek@email.com"
              autoComplete="email"
              disabled={isLoading}
            />

            {/* Password field */}
            <Input
              label="Şifre"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange('password')}
              error={errors.password}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
              placeholder={isLogin ? 'Şifreniz' : 'Güçlü bir şifre seçin'}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              disabled={isLoading}
            />

            {/* Confirm Password field (only for register) */}
            {!isLogin && (
              <Input
                label="Şifre Onayı"
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                error={errors.confirmPassword}
                leftIcon={<Lock className="w-4 h-4" />}
                placeholder="Şifrenizi tekrar girin"
                autoComplete="new-password"
                disabled={isLoading}
              />
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              size="wide"
              loading={isLoading}
              disabled={isLoading}
              className="mt-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {isLogin ? 'Giriş yapılıyor...' : 'Hesap oluşturuluyor...'}
                </>
              ) : (
                isLogin ? 'Giriş Yap' : 'Hesap Oluştur'
              )}
            </Button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {isLogin ? 'Hesabınız yok mu?' : 'Zaten hesabınız var mı?'}
            </p>
            <Button
              variant="link"
              onClick={toggleMode}
              disabled={isLoading}
              className="mt-1 p-0 h-auto font-medium"
            >
              {isLogin ? 'Hesap oluşturun' : 'Giriş yapın'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
