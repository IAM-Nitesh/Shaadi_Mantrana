import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Health Check API: Checking system health...');
    
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5500';
    
    // Test backend connectivity
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const response = await fetch(`${backendUrl}/api/auth/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const backendHealth = await response.json();
        console.log('✅ Health Check API: Backend is healthy');
        
        return NextResponse.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          frontend: {
            status: 'healthy',
            environment: process.env.NODE_ENV || 'development'
          },
          backend: backendHealth
        });
      } else {
        console.log(`⚠️ Health Check API: Backend returned ${response.status}`);
        return NextResponse.json({
          status: 'degraded',
          timestamp: new Date().toISOString(),
          frontend: {
            status: 'healthy',
            environment: process.env.NODE_ENV || 'development'
          },
          backend: {
            status: 'unhealthy',
            error: `HTTP ${response.status}`
          }
        }, { status: 503 });
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('❌ Health Check API: Backend timeout');
        return NextResponse.json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          frontend: {
            status: 'healthy',
            environment: process.env.NODE_ENV || 'development'
          },
          backend: {
            status: 'timeout',
            error: 'Backend request timeout'
          }
        }, { status: 503 });
      }
      
      console.error('❌ Health Check API: Backend connection error:', fetchError);
      return NextResponse.json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        frontend: {
          status: 'healthy',
          environment: process.env.NODE_ENV || 'development'
        },
        backend: {
          status: 'unreachable',
          error: fetchError instanceof Error ? fetchError.message : 'Unknown error'
        }
      }, { status: 503 });
    }
    
  } catch (error) {
    console.error('❌ Health Check API: Error:', error);
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      frontend: {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      backend: {
        status: 'unknown'
      }
    }, { status: 500 });
  }
} 