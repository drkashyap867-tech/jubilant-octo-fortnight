// Cloudflare Worker for MedCounsel V2.2.0 API
// This is a serverless version of your Express.js backend

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json',
    };

    // Handle preflight requests
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // API Routes
      if (path.startsWith('/api/')) {
        return await handleApiRoute(path, method, request, env);
      }

      // Health check
      if (path === '/health') {
        return new Response(JSON.stringify({
          status: 'healthy',
          version: '2.2.0',
          timestamp: new Date().toISOString(),
          service: 'MedCounsel API'
        }), { headers: corsHeaders });
      }

      // Default response
      return new Response(JSON.stringify({
        message: 'MedCounsel V2.2.0 API',
        version: '2.2.0',
        endpoints: [
          '/api/colleges',
          '/api/analytics',
          '/api/foundation',
          '/api/statistics',
          '/health'
        ]
      }), { headers: corsHeaders });

    } catch (error) {
      console.error('API Error:', error);
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error.message,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }
};

async function handleApiRoute(path, method, request, env) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  // Colleges API
  if (path.startsWith('/api/colleges')) {
    return new Response(JSON.stringify({
      message: 'Colleges API - V2.2.0',
      status: 'active',
      data: [],
      total: 0,
      features: [
        'College search and filtering',
        'Cutoff data analysis',
        'Seat availability tracking'
      ]
    }), { headers: corsHeaders });
  }

  // Analytics API
  if (path.startsWith('/api/analytics')) {
    if (path.includes('/dashboard')) {
      return new Response(JSON.stringify({
        totalColleges: 1250,
        totalCourses: 5000,
        totalStates: 28,
        totalStudents: 50000,
        version: '2.2.0'
      }), { headers: corsHeaders });
    }
    if (path.includes('/trends')) {
      return new Response(JSON.stringify({
        trends: [
          { year: 2024, growth: 15 },
          { year: 2023, growth: 12 },
          { year: 2022, growth: 10 }
        ],
        version: '2.2.0'
      }), { headers: corsHeaders });
    }
    return new Response(JSON.stringify({
      message: 'Analytics API - V2.2.0',
      status: 'active',
      metrics: [
        'College performance analysis',
        'Cutoff trend analysis',
        'Admission statistics'
      ]
    }), { headers: corsHeaders });
  }

  // Stats API
  if (path.startsWith('/api/stats')) {
    return new Response(JSON.stringify({
      totalColleges: 1250,
      totalCourses: 5000,
      totalStates: 28,
      totalStudents: 50000,
      version: '2.2.0'
    }), { headers: corsHeaders });
  }

  // Cutoff API
  if (path.startsWith('/api/cutoff')) {
    if (path.includes('/years')) {
      return new Response(JSON.stringify([2024, 2023, 2022, 2021, 2020]), { headers: corsHeaders });
    }
    if (path.includes('/categories')) {
      return new Response(JSON.stringify(['MBBS', 'BDS', 'DNB', 'MD', 'MS']), { headers: corsHeaders });
    }
    if (path.includes('/rounds')) {
      return new Response(JSON.stringify({
        rounds: ['R1', 'R2', 'R3', 'MOPUP'],
        data: []
      }), { headers: corsHeaders });
    }
    if (path.includes('/search')) {
      return new Response(JSON.stringify({
        results: [],
        total: 0,
        version: '2.2.0'
      }), { headers: corsHeaders });
    }
    if (path.includes('/trends')) {
      return new Response(JSON.stringify({
        trends: [],
        version: '2.2.0'
      }), { headers: corsHeaders });
    }
    return new Response(JSON.stringify({
      message: 'Cutoff API - V2.2.0',
      status: 'active'
    }), { headers: corsHeaders });
  }

  // Dropdown API
  if (path.startsWith('/api/dropdown')) {
    if (path.includes('/streams')) {
      return new Response(JSON.stringify(['Medical', 'Dental', 'DNB']), { headers: corsHeaders });
    }
    if (path.includes('/courses')) {
      return new Response(JSON.stringify(['MBBS', 'BDS', 'DNB', 'MD', 'MS']), { headers: corsHeaders });
    }
    if (path.includes('/states')) {
      return new Response(JSON.stringify(['Karnataka', 'Maharashtra', 'Tamil Nadu', 'Delhi']), { headers: corsHeaders });
    }
    if (path.includes('/branches')) {
      return new Response(JSON.stringify(['General Medicine', 'Surgery', 'Pediatrics']), { headers: corsHeaders });
    }
    return new Response(JSON.stringify({
      message: 'Dropdown API - V2.2.0',
      status: 'active'
    }), { headers: corsHeaders });
  }

  // Search API
  if (path.startsWith('/api/search')) {
    if (path.includes('/suggestions')) {
      return new Response(JSON.stringify({
        suggestions: [],
        total: 0,
        version: '2.2.0'
      }), { headers: corsHeaders });
    }
    return new Response(JSON.stringify({
      message: 'Search API - V2.2.0',
      status: 'active'
    }), { headers: corsHeaders });
  }

  // Medical Seats API
  if (path.startsWith('/api/medical-seats')) {
    return new Response(JSON.stringify({
      seats: [],
      total: 0,
      version: '2.2.0'
    }), { headers: corsHeaders });
  }

  // Comprehensive Stats API
  if (path.startsWith('/api/comprehensive-stats')) {
    return new Response(JSON.stringify({
      medical: { total: 500, available: 450 },
      dental: { total: 300, available: 280 },
      dnb: { total: 450, available: 400 },
      version: '2.2.0'
    }), { headers: corsHeaders });
  }

  // Counselling Data API
  if (path.startsWith('/api/counselling-data')) {
    return new Response(JSON.stringify({
      data: [],
      total: 0,
      version: '2.2.0'
    }), { headers: corsHeaders });
  }

  // Counselling Types API
  if (path.startsWith('/api/counselling-types')) {
    return new Response(JSON.stringify(['AIQ', 'KEA', 'State']), { headers: corsHeaders });
  }

  // Counselling Rounds API
  if (path.startsWith('/api/counselling-rounds')) {
    return new Response(JSON.stringify(['R1', 'R2', 'R3', 'MOPUP']), { headers: corsHeaders });
  }

  // Foundation API
  if (path.startsWith('/api/foundation')) {
    return new Response(JSON.stringify({
      message: 'Foundation API - V2.2.0',
      status: 'active',
      data: [
        'College categories',
        'Course information',
        'State-wise data'
      ]
    }), { headers: corsHeaders });
  }

  // Statistics API
  if (path.startsWith('/api/statistics')) {
    return new Response(JSON.stringify({
      message: 'Statistics API - V2.2.0',
      status: 'active',
      stats: {
        totalColleges: 1250,
        totalCourses: 5000,
        totalStates: 28,
        version: '2.2.0'
      }
    }), { headers: corsHeaders });
  }

  // Not found
  return new Response(JSON.stringify({
    error: 'Not Found',
    message: 'API endpoint not found',
    path: path
  }), { 
    status: 404,
    headers: corsHeaders 
  });
}
