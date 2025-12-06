import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params;
    const path = pathArray.join('/');
    const imageUrl = `https://cdn.dolabb.com/${path}`;

    console.log('Proxying image from:', imageUrl);

    // Use Node.js https module to bypass SSL certificate validation
    const imageBuffer = await new Promise<Buffer>((resolve, reject) => {
      const req = https.get(
        imageUrl,
        {
          rejectUnauthorized: false, // Ignore SSL certificate errors
        },
        (res) => {
          if (res.statusCode && res.statusCode !== 200) {
            reject(new Error(`Failed to fetch image: ${res.statusCode}`));
            return;
          }

          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => resolve(Buffer.concat(chunks)));
          res.on('error', reject);
        }
      );
      
      req.on('error', (error) => {
        console.error('HTTPS request error:', error);
        reject(error);
      });
      
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });

    // Determine content type from URL or default to jpeg
    const contentType =
      path.match(/\.(jpg|jpeg)$/i)
        ? 'image/jpeg'
        : path.match(/\.png$/i)
        ? 'image/png'
        : path.match(/\.gif$/i)
        ? 'image/gif'
        : path.match(/\.webp$/i)
        ? 'image/webp'
        : 'image/jpeg';

    // Return the image with proper headers
    // Convert Buffer to ArrayBuffer for NextResponse compatibility
    const arrayBuffer = new ArrayBuffer(imageBuffer.length);
    new Uint8Array(arrayBuffer).set(imageBuffer);
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error proxying image:', error);
    return new NextResponse('Error loading image', { status: 500 });
  }
}

