'use client';

import { useState, useEffect } from 'react';

export default function Prices() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          'https://csgoskins.gg/api/v1/advanced-item-details',
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CSGOSKINS_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              page: 6,
              limit: 12,
            }),
          }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
        
        const responseData = await response.json();
        setData(responseData);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-b from-black via-gray-900 to-black">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-b from-black via-gray-900 to-black">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-linear-to-b from-black via-gray-900 to-black">
      <main className="flex flex-col items-center justify-start gap-8 py-12 px-4 w-full">
        <h1 className="text-5xl font-bold text-white text-center">Advanced Item Details</h1>
        
        <div className="w-full max-w-6xl">
          <pre className="bg-gray-950 border border-gray-700 rounded-lg p-6 text-gray-300 overflow-x-auto text-sm">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </main>
    </div>
  );
}
