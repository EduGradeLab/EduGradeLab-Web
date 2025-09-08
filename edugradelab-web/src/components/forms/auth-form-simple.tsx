/**
 * Simple Auth Form Component
 * Basit authentication form - Landing page için
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, ArrowRight } from 'lucide-react';

export const AuthForm: React.FC = () => {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold">EduGradeLab</CardTitle>
        <p className="text-gray-600">Sınav değerlendirme platformu</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Link href="/auth/login">
          <Button className="w-full bg-blue-600 hover:bg-blue-700">
            Giriş Yap
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
        
        <Link href="/auth/register">
          <Button variant="outline" className="w-full">
            Yeni Hesap Oluştur
          </Button>
        </Link>
        
        <div className="text-center pt-4">
          <p className="text-sm text-gray-600">
            AI destekli sınav kağıdı analizi ve değerlendirme sistemi
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
