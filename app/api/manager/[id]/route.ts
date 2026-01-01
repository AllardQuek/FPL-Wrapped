import { NextRequest, NextResponse } from 'next/server';
import { fetchAllManagerData } from '@/lib/fpl-api';
import { generateSeasonSummary } from '@/lib/analysis';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const managerId = parseInt(id, 10);

    if (isNaN(managerId) || managerId <= 0) {
      return NextResponse.json(
        { error: 'Invalid manager ID' },
        { status: 400 }
      );
    }

    // Fetch all data for the manager
    const data = await fetchAllManagerData(managerId);

    // Generate the season summary
    const summary = generateSeasonSummary(data);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching manager data:', error);
    
    const errorMessage = error instanceof Error ? error.message : '';

    // Check if it's a 404 error (manager not found)
    if (errorMessage.includes('404')) {
      return NextResponse.json(
        { error: 'Manager not found. Please check your Team ID.' },
        { status: 404 }
      );
    }

    // Check if it's a 429 error (rate limited)
    if (errorMessage.includes('429')) {
      return NextResponse.json(
        { error: 'The FPL API is currently busy. Please wait a minute and try again.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch manager data. The FPL API might be down or busy. Please try again later.' },
      { status: 500 }
    );
  }
}



