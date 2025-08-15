import React, { useState, useEffect } from 'react'
import { 
  Building2, 
  Users, 
  MapPin, 
  Calendar,
  TrendingUp,
  Award,
  Stethoscope,
  GraduationCap,
  Target,
  Database,
  Zap,
  Shield,
  Star,
  Activity,
  BarChart3,
  Search,
  Filter,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Info,
  Heart,
  Loader2
} from 'lucide-react'

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStream, setSelectedStream] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [groupedResults, setGroupedResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [recentSearches, setRecentSearches] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [resultsPerPage] = useState(12)
  const [dropdownData, setDropdownData] = useState({
    streams: [],
    courses: [],
    states: []
  })
  const [loadingDropdowns, setLoadingDropdowns] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats')
        const data = await response.json()
        setStats(data)
      } catch (err) {
        setError('Failed to fetch statistics')
        console.error('Error fetching stats:', err)
      } finally {
        setLoading(false)
      }
    }

    const fetchDropdownData = async () => {
      try {
        setLoadingDropdowns(true)
        
        // Fetch streams
        const streamsResponse = await fetch('/api/dropdown/streams')
        const streamsData = await streamsResponse.json()
        
        // Fetch courses
        const coursesResponse = await fetch('/api/dropdown/courses')
        const coursesData = await coursesResponse.json()
        
        // Fetch states
        const statesResponse = await fetch('/api/dropdown/states')
        const statesData = await statesResponse.json()
        
        setDropdownData({
          streams: streamsData.success ? streamsData.data : [],
          courses: coursesData.success ? coursesData.data : [],
          states: statesData.success ? statesData.data : []
        })
      } catch (err) {
        console.error('Error fetching dropdown data:', err)
      } finally {
        setLoadingDropdowns(false)
      }
    }

    fetchStats()
    fetchDropdownData()
    
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  const handleSearch = async (query) => {
    // Handle both string parameters and event objects
    let searchQuery;
    if (typeof query === 'string') {
      searchQuery = query.trim();
    } else if (query && query.target && query.target.value) {
      searchQuery = query.target.value.trim();
    } else {
      searchQuery = searchTerm.trim();
    }
    
    if (!searchQuery) return
    
    console.log('🔍 Starting search for:', searchQuery)
    setSearching(true)
    setShowResults(true)
    setShowSuggestions(false)
    
    try {
      // Use comprehensive search for better results
      const endpoint = '/api/search/comprehensive'
      const params = new URLSearchParams({
        q: searchQuery,
        limit: '100'
      })
      
      // Add advanced filters if they're set
      if (selectedCourse) params.append('courseType', selectedCourse)
      if (selectedState) params.append('state', selectedState)
      if (selectedStream) params.append('stream', selectedStream)
      
      // Store the search term for display
      setSearchTerm(searchQuery)
      
      const url = `${endpoint}?${params.toString()}`
      
      console.log('🌐 Making request to:', url)
      
      const response = await fetch(url)
      const data = await response.json()
      
      console.log('📊 Search response:', data)
      console.log('📊 Response total:', data.total)
      console.log('📊 Response groupedResults:', data.groupedResults)
      console.log('📊 Response groupedResults length:', data.groupedResults?.length)
      
      if (data && data.total > 0) {
        // Comprehensive search returns grouped results in data.data
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          console.log('✅ Setting grouped results:', data.data.length)
          setGroupedResults(data.data)
          setSearchResults([]) // Clear individual results since we have grouped ones
          console.log('✅ Comprehensive search successful, grouped results:', data.data.length)
        } else if (data.groupedResults && Array.isArray(data.groupedResults)) {
          // Fallback to groupedResults if data.data is not available
          console.log('✅ Setting grouped results from groupedResults:', data.groupedResults.length)
          setGroupedResults(data.groupedResults)
          setSearchResults([])
          console.log('✅ Comprehensive search successful, grouped results:', data.groupedResults.length)
        } else {
          // Fallback to individual results if no grouped results
          console.log('✅ Setting individual results:', data.data?.length || 0)
          setSearchResults(data.data || [])
          setGroupedResults([])
          console.log('✅ Comprehensive search successful, individual results:', data.data?.length || 0)
        }
        
        // Store in recent searches
        const newSearch = {
          query: searchQuery,
          timestamp: new Date().toISOString(),
          resultCount: data.total
        }
        
        setRecentSearches(prev => {
          const filtered = prev.filter(s => s.query !== searchQuery)
          return [newSearch, ...filtered].slice(0, 10)
        })
        
        console.log('✅ Search successful, total results:', data.total)
        console.log('✅ State after search - groupedResults:', data.groupedResults?.length || 0)
        console.log('✅ State after search - searchResults:', data.data?.length || 0)
      } else {
        console.log('❌ No results found - data.total:', data.total)
        console.log('❌ No results found - data.groupedResults:', data.groupedResults)
        setSearchResults([])
        setGroupedResults([])
      }
    } catch (error) {
      console.error('❌ Search error:', error)
      setSearchResults([])
      setGroupedResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleInputChange = async (e) => {
    const value = e.target.value
    setSearchTerm(value)
    
    // Clear suggestions immediately for better UX
    if (value.length < 2) {
      setShowSuggestions(false)
      setSuggestions([])
      return
    }
    
    // Debounce API calls to reduce lag
    clearTimeout(window.suggestionTimeout)
    window.suggestionTimeout = setTimeout(async () => {
      try {
        setLoadingSuggestions(true)
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(value)}`)
        const data = await response.json()
        if (data.success && data.data) {
          setSuggestions(data.data)
          setShowSuggestions(true)
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error)
      } finally {
        setLoadingSuggestions(false)
      }
    }, 300) // 300ms delay
  }

  const handleSuggestionClick = (suggestion) => {
    const suggestionValue = suggestion.value || suggestion.display || suggestion.name || ''
    if (suggestionValue) {
      setSearchTerm(suggestionValue)
      setShowSuggestions(false)
      handleSearch(suggestionValue)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleQuickFilter = (filter) => {
    setSelectedStream(filter.stream || '')
    setSelectedCourse(filter.course || '')
    setSelectedState(filter.state || '')
    // Search for the filter name instead of searchTerm
    setCurrentPage(1) // Reset to first page for new search
    handleSearch(filter.name)
  }

  const handleStreamChange = async (stream) => {
    setSelectedStream(stream)
    setSelectedCourse('') // Reset course when stream changes
    
    if (stream) {
      try {
        const response = await fetch(`/api/dropdown/courses?stream=${encodeURIComponent(stream)}`)
        const data = await response.json()
        if (data.success) {
          setDropdownData(prev => ({
            ...prev,
            courses: data.data
          }))
        }
      } catch (err) {
        console.error('Error fetching courses for stream:', err)
      }
    } else {
      // If no stream selected, fetch all courses
      try {
        const response = await fetch('/api/dropdown/courses')
        const data = await response.json()
        if (data.success) {
          setDropdownData(prev => ({
            ...prev,
            courses: data.data
          }))
        }
      } catch (err) {
        console.error('Error fetching all courses:', err)
      }
    }
  }

  // Pagination logic
  const totalPages = Math.ceil((groupedResults.length > 0 ? groupedResults.length : searchResults.length) / resultsPerPage)
  const startIndex = (currentPage - 1) * resultsPerPage
  const endIndex = startIndex + resultsPerPage
  const currentResults = groupedResults.length > 0 
    ? groupedResults.slice(startIndex, endIndex)
    : searchResults.slice(startIndex, endIndex)

  const goToPage = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const popularSearches = [
    { name: 'MBBS in Karnataka', stream: 'medical', course: 'mbbs', state: 'karnataka' },
    { name: 'BDS Colleges', stream: 'dental', course: 'bds' },
    { name: 'DNB Hospitals', stream: 'dnb' },
    { name: 'Government Medical Colleges', stream: 'medical' },
    { name: 'Private Dental Colleges', stream: 'dental' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading comprehensive statistics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 text-lg">{error}</p>
        </div>
      </div>
    )
  }

  const data = stats || {}

  return (
    <div className="space-y-0">
      {/* Hero Section - Exact replica of the old static site */}
      <section className="hero relative overflow-hidden bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 pt-24 pb-20 -mt-20">
        <div className="hero-container grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto px-4">
          {/* Hero Content */}
          <div className="hero-content">
            <h1 className="hero-title text-5xl font-bold mb-6 leading-tight">
              <span className="title-line block opacity-0 transform translate-y-8 animate-[slideUp_0.8s_ease_forwards]">
                Discover Your Perfect
              </span>
              <span className="title-line highlight block opacity-0 transform translate-y-8 animate-[slideUp_0.8s_ease_forwards_0.2s] bg-gradient-to-r from-indigo-500 to-emerald-500 bg-clip-text text-transparent">
                Medical Institution
              </span>
            </h1>
            <p className="hero-subtitle text-xl mb-8 text-gray-600 dark:text-gray-400 leading-relaxed opacity-0 transform translate-y-5 animate-[slideUp_0.8s_ease_forwards_0.4s]">
              Explore {data.total || 0}+ colleges, 
              {data.totalSeats || 0}+ seats across India's premier medical, 
              dental, and DNB institutions.
            </p>
            <div className="hero-stats flex gap-8 opacity-0 transform translate-y-5 animate-[slideUp_0.8s_ease_forwards_0.6s]">
              <div className="stat-item text-center">
                <span className="stat-number text-4xl font-extrabold block mb-2">
                  {data.total || 0}
                </span>
                <span className="stat-label text-sm opacity-80 uppercase tracking-wider">Colleges</span>
              </div>
              <div className="stat-item text-center">
                <span className="stat-number text-4xl font-extrabold block mb-2">
                  {data.totalSeats || 0}
                </span>
                <span className="stat-label text-sm opacity-80 uppercase tracking-wider">Seats</span>
              </div>
              <div className="stat-item text-center">
                <span className="stat-number text-4xl font-extrabold block mb-2">
                  {data.byType ? data.byType.length : 0}
                </span>
                <span className="stat-label text-sm opacity-80 uppercase tracking-wider">Streams</span>
              </div>
            </div>
          </div>
          
          {/* Hero Visual - Floating Cards - Exact replica */}
          <div className="hero-visual flex justify-center items-center opacity-0 transform translate-x-8 animate-[slideInRight_0.8s_ease_forwards_0.8s]">
            <div className="floating-cards relative w-80 h-80">
              <div className="card medical absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl flex flex-col items-center justify-center gap-2 shadow-2xl transition-all duration-300 animate-[float_6s_ease-in-out_infinite] hover:translate-y-[-10px] hover:scale-105">
                <Heart className="h-8 w-8" />
                <span className="text-sm font-semibold uppercase tracking-wider">Medical</span>
              </div>
              <div className="card dental absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl flex flex-col items-center justify-center gap-2 shadow-2xl transition-all duration-300 animate-[float_6s_ease-in-out_infinite_2s] hover:translate-y-[-10px] hover:scale-105">
                <Stethoscope className="h-8 w-8" />
                <span className="text-sm font-semibold uppercase tracking-wider">Dental</span>
              </div>
              <div className="card dnb absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl flex flex-col items-center justify-center gap-2 shadow-2xl transition-all duration-300 animate-[float_6s_ease-out_infinite_4s] hover:translate-y-[-10px] hover:scale-105">
                <Building2 className="h-8 w-8" />
                <span className="text-sm font-semibold uppercase tracking-wider">DNB</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section - Exact replica of the old static site */}
      <section className="search-section py-20 bg-white dark:bg-gray-800 relative z-10">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="search-header text-center mb-12 pt-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Find Your Institution
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Search by name, course, state, or specialization
            </p>
          </div>
          
          <div className="search-box bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 mb-8 transition-all duration-400 shadow-2xl relative z-10 overflow-visible">
            <div className="search-input-group relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search for colleges, courses, or locations..." 
                value={searchTerm}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="w-full pl-12 pr-20 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white text-lg"
              />
              <button 
                onClick={handleSearch}
                disabled={searching}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white p-3 rounded-lg transition-colors duration-200"
              >
                {searching ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ArrowRight className="h-5 w-5" />
                )}
              </button>
            </div>
            
            {showSuggestions && suggestions.length > 0 && (
              <div className="search-suggestions bg-white dark:bg-gray-700 rounded-lg shadow-md p-3 mb-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Suggestions:</h4>
                <ul className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <li 
                      key={index} 
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="cursor-pointer text-gray-800 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900 p-2 rounded-md"
                    >
                      {suggestion.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Advanced Filters */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-gray-600 dark:text-gray-400">Advanced Filters:</span>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Stream Dropdown */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">Stream</label>
                  <select
                    value={selectedStream}
                    onChange={(e) => handleStreamChange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white min-w-[120px]"
                    disabled={loadingDropdowns}
                  >
                    <option value="">All Streams</option>
                    {dropdownData.streams.map((stream) => (
                      <option key={stream.value} value={stream.value}>
                        {stream.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Course Dropdown */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">Course</label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white min-w-[140px]"
                    disabled={loadingDropdowns || !dropdownData.courses.length}
                  >
                    <option value="">All Courses</option>
                    {dropdownData.courses.map((course) => (
                      <option key={course.value} value={course.value}>
                        {course.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* State Dropdown */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">State</label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white min-w-[140px]"
                    disabled={loadingDropdowns}
                  >
                    <option value="">All States</option>
                    {dropdownData.states.map((state) => (
                      <option key={state.value} value={state.value}>
                        {state.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Popular Searches */}
            <div className="popular-searches mb-6">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Popular Searches:</h4>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickFilter(search)}
                    className="px-3 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-sm rounded-lg transition-colors duration-200"
                  >
                    {search.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="recent-searches mb-6">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Recent Searches:</h4>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(search.query)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors duration-200"
                    >
                      {search.query} ({search.resultCount} results)
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Search Results - Exact replica of port 3000 */}
          {showResults && (
            <div className="search-results bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              
              <div className="results-header flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Search Results
                </h3>
                <div className="results-count text-gray-600 dark:text-gray-400">
                  Found <span className="font-semibold">
                    {groupedResults.length > 0 ? groupedResults.length : searchResults.length}
                  </span> results
                </div>
              </div>
              
              {searching ? (
                <div className="text-center py-8">
                  <Loader2 className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">Searching...</p>
                </div>
              ) : (groupedResults.length > 0 || searchResults.length > 0) ? (
                <>
                  {/* Show grouped results if available, otherwise show individual results */}
                  {groupedResults.length > 0 ? (
                    <div className="results-grid grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      {currentResults.map((group, index) => (
                        <div key={index} className="result-card bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
                          {/* College Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                                {group.college_name}
                              </h3>
                              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  {(group.college_type || group.type || 'COLLEGE').toUpperCase()}
                                </span>
                                <span>📍 {group.state}</span>
                                {group.city && <span>🏙️ {group.city}</span>}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {group.courses.length}
                              </div>
                              <div className="text-xs text-gray-500">Courses</div>
                            </div>
                          </div>
                          
                          {/* Available Courses Dropdown */}
                          <div className="mb-4">
                            <details className="group">
                              <summary className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                                <div className="flex items-center space-x-2">
                                  <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                                    Available Courses ({group.courses.length})
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                    {group.courses.reduce((total, course) => total + (course.seats || 0), 0)} total seats
                                  </span>
                                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 transform group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </summary>
                              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                                {group.courses.map((course, courseIndex) => (
                                  <div key={courseIndex} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                        {course.course_name}
                                      </span>
                                      {course.course_type && course.course_type !== course.course_name && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          ({course.course_type})
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                                        {course.seats || 0} seats
                                      </span>
                                      {course.quota_details && course.quota_details !== '{}' && (
                                        <span className="text-xs text-blue-600 dark:text-blue-400">
                                          📊
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </details>
                          </div>
                          
                          {/* Address */}
                          {group.address && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                <span className="font-medium">Address:</span> {group.address}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="results-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {currentResults.map((result, index) => (
                        <div key={index} className="result-card bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow duration-200">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{result.name}</h4>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {result.type}
                            </span>
                          </div>
                          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <p><span className="font-medium">Course:</span> {result.course}</p>
                            <p><span className="font-medium">State:</span> {result.state}</p>
                            <p><span className="font-medium">Address:</span> {result.address}</p>
                            {result.seats > 0 && (
                              <p className="text-green-600 dark:text-green-400 font-medium">
                                {result.seats} seats available
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Search Summary */}
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                        Search Results for "{searchTerm}"
                      </h3>
                      <div className="flex items-center justify-center space-x-4 text-sm text-blue-600 dark:text-blue-400">
                        <span className="flex items-center space-x-1">
                          <Building2 className="h-4 w-4" />
                          <span>{groupedResults.length > 0 ? groupedResults.length : searchResults.length} colleges found</span>
                        </span>
                        {selectedStream && (
                          <span className="flex items-center space-x-1">
                            <Stethoscope className="h-4 w-4" />
                            <span>Stream: {selectedStream.toUpperCase()}</span>
                          </span>
                        )}
                        {selectedCourse && (
                          <span className="flex items-center space-x-1">
                            <GraduationCap className="h-4 w-4" />
                            <span>Course: {selectedCourse}</span>
                          </span>
                        )}
                        {selectedState && (
                          <span className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>State: {selectedState}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Results Summary */}
                  <div className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {groupedResults.length > 0 ? (
                      `Showing ${startIndex + 1}-${Math.min(endIndex, groupedResults.length)} of ${groupedResults.length} colleges`
                    ) : (
                      `Showing ${startIndex + 1}-${Math.min(endIndex, searchResults.length)} of ${searchResults.length} results`
                    )}
                  </div>
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center space-x-2">
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        Previous
                      </button>
                      
                      {/* Smart Pagination with ellipsis */}
                      {(() => {
                        const pages = [];
                        const maxVisiblePages = 7; // Show max 7 page numbers
                        
                        if (totalPages <= maxVisiblePages) {
                          // If total pages is small, show all
                          for (let i = 1; i <= totalPages; i++) {
                            pages.push(i);
                          }
                        } else {
                          // Smart pagination for large numbers
                          if (currentPage <= 4) {
                            // Near the beginning: show 1, 2, 3, 4, 5, ..., last
                            for (let i = 1; i <= 5; i++) {
                              pages.push(i);
                            }
                            pages.push('...');
                            pages.push(totalPages);
                          } else if (currentPage >= totalPages - 3) {
                            // Near the end: show 1, ..., last-4, last-3, last-2, last-1, last
                            pages.push(1);
                            pages.push('...');
                            for (let i = totalPages - 4; i <= totalPages; i++) {
                              pages.push(i);
                            }
                          } else {
                            // In the middle: show 1, ..., current-1, current, current+1, ..., last
                            pages.push(1);
                            pages.push('...');
                            pages.push(currentPage - 1);
                            pages.push(currentPage);
                            pages.push(currentPage + 1);
                            pages.push('...');
                            pages.push(totalPages);
                          }
                        }
                        
                        return pages.map((page, index) => (
                          <button
                            key={index}
                            onClick={() => typeof page === 'number' ? goToPage(page) : null}
                            disabled={typeof page !== 'number'}
                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                              page === currentPage
                                ? 'bg-blue-600 text-white'
                                : typeof page === 'number'
                                ? 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                                : 'text-gray-400 bg-transparent border-none cursor-default'
                            }`}
                          >
                            {page}
                          </button>
                        ));
                      })()}
                      
                      <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">No results found</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">Try adjusting your search terms or filters</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto px-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Stethoscope className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Medical Colleges</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.byType?.find(t => t.type === 'medical')?.count?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <GraduationCap className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Dental Colleges</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.byType?.find(t => t.type === 'dental')?.count?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">DNB Colleges</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.byType?.find(t => t.type === 'dnb')?.count?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Seats</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.totalSeats?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Why Choose MedCounsel?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-3xl mx-auto">
            Your comprehensive platform for medical college counseling with advanced features and real-time data
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Search className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Advanced Search</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Find institutions by name, course, state, or specialization with intelligent filtering
            </p>
          </div>
          
          <div className="text-center">
            <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Database className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Comprehensive Data</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Access detailed information about courses, seat availability, and institution details
            </p>
          </div>
          
          <div className="text-center">
            <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Activity className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Real-time Updates</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Get up-to-date information about our database with live statistics and insights
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
