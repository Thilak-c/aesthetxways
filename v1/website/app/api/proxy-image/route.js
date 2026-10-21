import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    
    if (!imageUrl) {
      return new Response('Missing URL parameter', { status: 400 });
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      return new Response('Invalid URL', { status: 400 });
    }

    // Restrict to HTTP/HTTPS protocols
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return new Response('Forbidden protocol', { status: 403 });
    }

    // Block private and localhost IP ranges
    const hostname = parsedUrl.hostname.toLowerCase();
    const isPrivate =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('169.254.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local');

    if (isPrivate) {
      return new Response('Access to private network forbidden', { status: 403 });
    }

    // Server-to-server fetch avoids browser CORS limitations
    const res = await fetch(imageUrl);
    if (!res.ok) {
      return new Response(`Failed to fetch image: ${res.statusText}`, { status: res.status });
    }

    const contentType = res.headers.get('Content-Type') || '';
    if (!contentType.startsWith('image/')) {
      return new Response('Target resource is not an image', { status: 400 });
    }

    const blob = await res.blob();
    const headers = new Headers();
    headers.set('Content-Type', res.headers.get('Content-Type') || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(blob, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Image proxy failed:', error);
    return new Response('Proxy error', { status: 500 });
  }
}
