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
      features: [
        'College search and filtering',
        'Cutoff data analysis',
        'Seat availability tracking'
      ]
    }), { headers: corsHeaders });
  }

  // Analytics API
  if (path.startsWith('/api/analytics')) {
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
