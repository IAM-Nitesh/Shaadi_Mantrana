import { NextRequest, NextResponse } from 'next/server';
import { config } from '../../../../../../services/configService';
import logger from '../../../../../../utils/logger';
import { withRouteLogging } from '../../../../route-logger';

async function handlePost(
  request: NextRequest,
  { params }: { params: { userId: string; action: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const { userId, action } = params;
    const body = await request.json();

    const response = await fetch(`${config.apiBaseUrl}/api/admin/users/${userId}/${action}`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    logger.error(`Admin user ${params.action} API error:`, error);
    return NextResponse.json(
      { error: `Failed to ${params.action} user` },
      { status: 500 }
    );
  }
}

export const POST = withRouteLogging(handlePost);

async function handlePatch(
  request: NextRequest,
  { params }: { params: { userId: string; action: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const { userId, action } = params;
    const body = await request.json();

    const response = await fetch(`${config.apiBaseUrl}/api/admin/users/${userId}/${action}`, {
      method: 'PATCH',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    logger.error(`Admin user ${params.action} API error:`, error);
    return NextResponse.json(
      { error: `Failed to ${params.action} user` },
      { status: 500 }
    );
  }
}

export const PATCH = withRouteLogging(handlePatch);