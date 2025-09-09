/**
 * Environment Variables Test
 * Bu dosya Vercel deployment'da env vars'ların yüklenip yüklenmediğini test eder
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Environment variables'ları kontrol et
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      BLOB_READ_WRITE_TOKEN: !!process.env.BLOB_READ_WRITE_TOKEN,
      NODE_ENV: process.env.NODE_ENV,
    };

    const missingVars = Object.entries(envCheck)
      .filter(([key, value]) => key !== 'NODE_ENV' && !value)
      .map(([key]) => key);

    const response = {
      status: missingVars.length === 0 ? 'success' : 'error',
      environment: process.env.NODE_ENV,
      variables: envCheck,
      missing: missingVars,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { 
      status: missingVars.length === 0 ? 200 : 500 
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV,
    }, { status: 500 });
  }
}
