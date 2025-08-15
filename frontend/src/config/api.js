// API Configuration for MedCounsel V2.2.0
const API_CONFIG = {
  // Base URL for all API calls
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://medcounsel-v2-2-0-api-prod.drkashyap867.workers.dev',
  
  // API Endpoints
  ENDPOINTS: {
    // Health check
    HEALTH: '/health',
    
    // Statistics
    STATS: '/api/stats',
    
    // Colleges
    COLLEGES: '/api/colleges',
    
    // Analytics
    ANALYTICS_DASHBOARD: '/api/analytics/dashboard',
    ANALYTICS_TRENDS: '/api/analytics/trends',
    
    // Cutoff
    CUTOFF_YEARS: '/api/cutoff/years',
    CUTOFF_CATEGORIES: '/api/cutoff/categories',
    CUTOFF_ROUNDS: '/api/cutoff/rounds',
    CUTOFF_SEARCH: '/api/cutoff/search',
    CUTOFF_TRENDS: '/api/cutoff/trends',
    
    // Dropdowns
    DROPDOWN_STREAMS: '/api/dropdown/streams',
    DROPDOWN_COURSES: '/api/dropdown/courses',
    DROPDOWN_STATES: '/api/dropdown/states',
    DROPDOWN_BRANCHES: '/api/dropdown/branches',
    
    // Search
    SEARCH_SUGGESTIONS: '/api/search/suggestions',
    
    // Medical Seats
    MEDICAL_SEATS: '/api/medical-seats',
    COMPREHENSIVE_STATS: '/api/comprehensive-stats',
    
    // Counselling
    COUNSELLING_DATA: '/api/counselling-data',
    COUNSELLING_TYPES: '/api/counselling-types',
    COUNSELLING_ROUNDS: '/api/counselling-rounds',
    
    // Foundation
    FOUNDATION: '/api/foundation',
  },
  
  // Helper function to build full API URLs
  buildUrl: (endpoint) => {
    return `${API_CONFIG.BASE_URL}${endpoint}`;
  },
  
  // Helper function to build URLs with query parameters
  buildUrlWithParams: (endpoint, params) => {
    const url = new URL(API_CONFIG.buildUrl(endpoint));
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        url.searchParams.append(key, params[key]);
      }
    });
    return url.toString();
  }
};

export default API_CONFIG;
