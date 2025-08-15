import {
  AlertCircle,
  ArrowRight,
  ArrowUp,
  BarChart3,
  Building2,
  Calendar,
  ClipboardList,
  Database,
  GraduationCap,
  Loader2,
  MapPin,
  Menu,
  Moon,
  School,
  Search,
  Stethoscope,
  Sun,
  Target,
  Target as TargetIcon,
  TrendingUp,
  X
} from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTheme } from '../context/ThemeContext'

const CutoffRanks = () => {
  const { isDark, toggleTheme } = useTheme()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStream, setSelectedStream] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [selectedCounsellingType, setSelectedCounsellingType] = useState('')
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('')
  const [selectedRound, setSelectedRound] = useState('')
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
    branches: [],
    states: []
  })
  const [loadingDropdowns, setLoadingDropdowns] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Back to top functionality
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
          streams: streamsData.success ? streamsData.data.sort((a, b) => a.label.localeCompare(b.label)) : [],
          courses: coursesData.success ? coursesData.data.sort((a, b) => a.label.localeCompare(b.label)) : [],
          states: statesData.success ? statesData.data.sort((a, b) => a.label.localeCompare(b.label)) : [],
          branches: []
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

  // Auto-search when filters change or page loads - OPTIMIZED
  useEffect(() => {
    // Only search if we have dropdown data loaded and at least one filter is set
    if (!loadingDropdowns) {
      // Check if any filter actually has a meaningful value (not empty string)
      const hasFilters = selectedStream || selectedCourse || selectedState || selectedCounsellingType || selectedAcademicYear || selectedRound;
      if (hasFilters && hasFilters.trim() !== '') {
        console.log('🔄 Auto-triggering search with current filters')
        // Use debounced search for better performance
        const timeoutId = setTimeout(() => {
          handleSearch('') // Empty string will use current filters
        }, 300); // 300ms delay for better UX

        return () => clearTimeout(timeoutId);
      }
    }
  }, [selectedStream, selectedCourse, selectedState, selectedCounsellingType, selectedAcademicYear, selectedRound, loadingDropdowns])

  const handleSearch = useCallback(async (query) => {
    // Handle both string parameters and event objects
    let searchQuery;
    if (typeof query === 'string') {
      searchQuery = query.trim();
    } else if (query && query.target && query.target.value) {
      searchQuery = query.target.value.trim();
    } else {
      searchQuery = searchTerm.trim();
    }

    // If no search query but we have filters, use a default search
    if (!searchQuery && !selectedStream && !selectedCourse && !selectedState && !selectedCounsellingType && !selectedAcademicYear && !selectedRound) {
      console.log('❌ No search query and no filters set')
      return
    }

    // If no search query but we have filters, use a default search term
    if (!searchQuery) {
      searchQuery = 'MD General Medicine' // Default search term when only filters are set
    }

    console.log('🔍 Starting search for:', searchQuery)
    setSearching(true)
    setShowResults(true)
    setShowSuggestions(false)

    try {
      // Use cutoff search endpoint for cutoff-specific data
      const endpoint = '/api/cutoff/search'
      const params = new URLSearchParams({
        limit: '100'
      })

      // Add cutoff-specific filters
      if (selectedCounsellingType) params.append('counselling_type', selectedCounsellingType)
      if (selectedAcademicYear) params.append('counselling_year', selectedAcademicYear)
      if (selectedRound) params.append('round_number', selectedRound)
      if (selectedCourse) params.append('course_name', selectedCourse)
      if (selectedState) params.append('college_name', selectedState) // Use state to filter colleges
      if (searchQuery && searchQuery !== 'MD General Medicine') params.append('college_name', searchQuery) // Search by college name

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

      if (data && Array.isArray(data) && data.length > 0) {
        // Cutoff search returns array of cutoff records
        console.log('✅ Setting cutoff results:', data.length)
        setSearchResults(data)
        setGroupedResults([]) // Clear grouped results since cutoff data is individual records
        console.log('✅ Cutoff search successful, results:', data.length)

        // Store in recent searches
        const newSearch = {
          query: searchQuery || 'Cutoff Search',
          timestamp: new Date().toISOString(),
          resultCount: data.length
        }

        setRecentSearches(prev => {
          const filtered = prev.filter(s => s.query !== (searchQuery || 'Cutoff Search'))
          return [newSearch, ...filtered].slice(0, 10)
        })

        console.log('✅ Search successful, total results:', data.length)
        console.log('✅ State after search - searchResults:', data.length)
      } else {
        console.log('❌ No cutoff results found - data:', data)
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
  }, [selectedStream, selectedCourse, selectedState, selectedCounsellingType, selectedAcademicYear, selectedRound, searchTerm])

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
    setSelectedCounsellingType(filter.counsellingType || '')
    setSelectedState(filter.state || '')
    // Search for the filter name instead of searchTerm
    setCurrentPage(1) // Reset to first page for new search
    handleSearch(filter.name)
  }

  const handleStreamChange = useCallback(async (stream) => {
    setSelectedStream(stream)
    setSelectedCourse('') // Reset course when stream changes
    setSelectedBranch('') // Reset branch when stream changes
    setSelectedCounsellingType('') // Reset counselling type for better sync
    setSelectedAcademicYear('') // Reset year for better sync
    setSelectedRound('') // Reset round for better sync

    if (stream) {
      try {
        const response = await fetch(`/api/dropdown/courses?stream=${encodeURIComponent(stream)}`)
        const data = await response.json()
        if (data.success) {
          setDropdownData(prev => ({
            ...prev,
            courses: data.data.sort((a, b) => a.label.localeCompare(b.label)) // Alphabetical sorting
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
            courses: data.data.sort((a, b) => a.label.localeCompare(b.label)) // Alphabetical sorting
          }))
        }
      } catch (err) {
        console.error('Error fetching all courses:', err)
      }
    }
  }, [])

  const handleCourseChange = useCallback(async (course) => {
    setSelectedCourse(course)
    setSelectedBranch('')
    setSelectedCounsellingType('') // Reset counselling type for better sync
    setSelectedAcademicYear('') // Reset year for better sync
    setSelectedRound('') // Reset round for better sync

    // Fetch branches for the selected course
    if (course) {
      try {
        const response = await fetch(`/api/dropdown/branches?course=${encodeURIComponent(course)}`)
        const data = await response.json()
        if (data.success) {
          setDropdownData(prev => ({
            ...prev,
            branches: data.data.sort((a, b) => a.label.localeCompare(b.label)) // Alphabetical sorting
          }))
        }
      } catch (err) {
        console.error('Error fetching branches:', err)
        setDropdownData(prev => ({
          ...prev,
          branches: []
        }))
      }
    } else {
      setDropdownData(prev => ({
        ...prev,
        branches: []
      }))
    }
  }, [])

  const handleStateChange = useCallback((state) => {
    setSelectedState(state)
    setSelectedCounsellingType('') // Reset counselling type for better sync
    setSelectedAcademicYear('') // Reset year for better sync
    setSelectedRound('') // Reset round for better sync
  }, [])

  // Pagination logic
  const totalPages = Math.ceil(searchResults.length / resultsPerPage)
  const startIndex = (currentPage - 1) * resultsPerPage
  const endIndex = startIndex + resultsPerPage
  const currentResults = searchResults.slice(startIndex, endIndex)

  const goToPage = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Helper function to get category count for display
  const getCategoryCount = (result) => {
    // For now, each result represents one category, but this can be expanded
    // when we have multiple categories per college/course combination
    return 1
  }

  // Function to group cutoff results by college/course combination - OPTIMIZED with useMemo
  const getGroupedCutoffResults = useMemo(() => {
    if (!searchResults || searchResults.length === 0) return []

    // Group results by college_id, course_id, counselling_type, counselling_year, round_number
    const grouped = {}

    searchResults.forEach(result => {
      const key = `${result.college_id}-${result.course_id}-${result.counselling_type}-${result.counselling_year}-${result.round_number}`

      if (!grouped[key]) {
        grouped[key] = {
          college_name: result.college_name || 'Unknown College',
          course_name: result.course_name || 'Unknown Course',
          state: getStateFromCollege(result.college_name),
          city: getCityFromCollege(result.college_name),
          stream: getStreamFromCourse(result.course_name),
          counselling_type: result.counselling_type,
          counselling_year: result.counselling_year,
          round_number: result.round_number,
          round_name: result.round_name,
          totalSeats: 0,
          fees_amount: result.fees_amount,
          categories: []
        }
      }

      // Add category information based on counselling type
      let category, quota
      if (result.counselling_type === 'AIQ_PG' || result.counselling_type === 'AIQ_UG') {
        category = result.aiq_category || 'N/A'
        quota = result.aiq_quota || 'AIQ'
      } else {
        category = result.state_category || 'N/A'
        quota = result.state_quota || 'State'
      }

      grouped[key].categories.push({
        category: category,
        quota: quota,
        cutoff_rank: result.cutoff_rank,
        seats_available: result.seats_available,
        seats_filled: result.seats_filled,
        cutoff_percentile: result.cutoff_percentile
      })

      // Accumulate total seats
      grouped[key].totalSeats += result.seats_available || 0
    })

    // Convert to array and sort by college name
    return Object.values(grouped).sort((a, b) => a.college_name.localeCompare(b.college_name))
  }, [searchResults])

  // Helper functions to extract information from enhanced database
  const getStreamFromCourse = (courseName) => {
    if (!courseName) return 'MEDICAL'
    if (courseName.includes('BDS') || courseName.includes('MDS')) return 'DENTAL'
    if (courseName.includes('DNB')) return 'DNB'
    return 'MEDICAL'
  }

  const getStateFromCollege = (collegeName) => {
    if (!collegeName) return 'Unknown State'
    if (collegeName.includes('Delhi')) return 'Delhi'
    if (collegeName.includes('Karnataka') || collegeName.includes('Manipal') || collegeName.includes('Bangalore') || collegeName.includes('Mysore')) return 'Karnataka'
    if (collegeName.includes('Puducherry')) return 'Puducherry'
    return 'Unknown State'
  }

  const getCityFromCollege = (collegeName) => {
    if (!collegeName) return 'Unknown City'
    if (collegeName.includes('New Delhi')) return 'New Delhi'
    if (collegeName.includes('Manipal')) return 'Manipal'
    if (collegeName.includes('Bangalore')) return 'Bangalore'
    if (collegeName.includes('Mysore')) return 'Mysore'
    if (collegeName.includes('Puducherry')) return 'Puducherry'
    return 'Unknown City'
  }

  const popularSearches = [
    { name: 'MD General Medicine', stream: 'medical', course: 'MD General Medicine', counsellingType: 'AIQ_PG' },
    { name: 'MS General Surgery', stream: 'medical', course: 'MS General Surgery', counsellingType: 'AIQ_PG' },
    { name: 'MDS Conservative Dentistry', stream: 'dental', course: 'MDS Conservative Dentistry', counsellingType: 'AIQ_PG' },
    { name: 'AIQ PG Counselling', stream: 'medical', counsellingType: 'AIQ_PG' },
    { name: 'Karnataka Counselling', stream: 'medical', counsellingType: 'KEA' }
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
                Cutoff Analysis
              </span>
            </h1>
            <p className="hero-subtitle text-xl mb-8 text-gray-600 dark:text-gray-400 leading-relaxed opacity-0 transform translate-y-5 animate-[slideUp_0.8s_ease_forwards_0.4s]">
              Explore {stats?.total || 0}+ cutoff ranks,
              {stats?.totalSeats || 0}+ seats across AIQ and State counselling systems,
              with comprehensive analysis and trends.
            </p>
            <div className="hero-stats flex gap-8 opacity-0 transform translate-y-5 animate-[slideUp_0.8s_ease_forwards_0.6s]">
              <div className="stat-item text-center">
                <span className="stat-number text-4xl font-extrabold block mb-2">
                  {stats?.total || 0}
                </span>
                <span className="stat-label text-sm opacity-80 uppercase tracking-wider">Cutoffs</span>
              </div>
              <div className="stat-item text-center">
                <span className="stat-number text-4xl font-extrabold block mb-2">
                  {stats?.totalSeats || 0}
                </span>
                <span className="stat-label text-sm opacity-80 uppercase tracking-wider">Seats</span>
              </div>
              <div className="stat-item text-center">
                <span className="stat-number text-4xl font-extrabold block mb-2">
                  {stats?.byType ? stats.byType.length : 0}
                </span>
                <span className="stat-label text-sm opacity-80 uppercase tracking-wider">Rounds</span>
              </div>
            </div>
          </div>

          {/* Hero Visual - Floating Cards - Exact replica */}
          <div className="hero-visual flex justify-center items-center opacity-0 transform translate-x-8 animate-[slideInRight_0.8s_ease_forwards_0.8s]">
            <div className="floating-cards relative w-80 h-80">
              <div className="card aiq absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl flex flex-col items-center justify-center gap-2 shadow-2xl transition-all duration-300 animate-[float_6s_ease-in-out_infinite] hover:translate-y-[-10px] hover:scale-105">
                <Target className="h-8 w-8" />
                <span className="text-sm font-semibold uppercase tracking-wider">AIQ</span>
              </div>
              <div className="card state absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl flex flex-col items-center justify-center gap-2 shadow-2xl transition-all duration-300 animate-[float_6s_ease-in-out_infinite_2s] hover:translate-y-[-10px] hover:scale-105">
                <MapPin className="h-8 w-8" />
                <span className="text-sm font-semibold uppercase tracking-wider">State</span>
              </div>
              <div className="card analysis absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl flex flex-col items-center justify-center gap-2 shadow-2xl transition-all duration-300 animate-[float_6s_ease-out_infinite_4s] hover:translate-y-[-10px] hover:scale-105">
                <TrendingUp className="h-8 w-8" />
                <span className="text-sm font-semibold uppercase tracking-wider">Analysis</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Navigation Section */}
      <nav className="modern-nav bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-lg sticky top-0 z-50 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-6">
              <a href="/" className="nav-link flex items-center space-x-3 text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 group hover-lift">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  MedCounsel
                </span>
              </a>

              {/* Navigation Links */}
              <div className="nav-links hidden md:flex items-center space-x-8">
                <a href="/" className="nav-link group flex items-center space-x-2 px-4 py-2 rounded-xl text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-all duration-300 hover-lift">
                  <div className="nav-icon-container p-1.5 bg-blue-200 dark:bg-blue-800/40 rounded-lg group-hover:bg-blue-300 dark:group-hover:bg-blue-700/50 transition-colors duration-300">
                    <School className="h-4 w-4" />
                  </div>
                  <span className="font-semibold">COLLEGE</span>
                </a>

                <a href="/counselling-data" className="nav-link group flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-300 hover-lift">
                  <div className="nav-icon-container p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/40 transition-colors duration-300">
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <span className="font-semibold">COUNSELLING</span>
                </a>

                <a href="/cutoff-ranks" className="nav-link group flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-300 hover-lift">
                  <div className="nav-icon-container p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-800/40 transition-colors duration-300">
                    <TargetIcon className="h-4 w-4" />
                  </div>
                  <span className="font-semibold">CUTOFF</span>
                </a>
              </div>
            </div>

            {/* Right Side Controls */}
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="theme-toggle p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 group hover-lift"
                aria-label="Toggle theme"
              >
                <div className="group-hover:scale-110 transition-transform duration-300">
                  {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </div>
              </button>

              {/* Back to Top */}
              <button
                onClick={scrollToTop}
                className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 group hover-lift"
                aria-label="Back to top"
              >
                <div className="group-hover:scale-110 transition-transform duration-300">
                  <ArrowUp className="h-5 w-5" />
                </div>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="mobile-menu md:hidden mt-4 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col space-y-3">
                <a
                  href="/"
                  className="mobile-menu-item flex items-center space-x-3 px-4 py-3 rounded-xl text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-all duration-300"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="p-2 bg-blue-200 dark:bg-blue-800/40 rounded-lg">
                    <School className="h-4 w-4" />
                  </div>
                  <span className="font-semibold">COLLEGE</span>
                </a>

                <a
                  href="/counselling-data"
                  className="mobile-menu-item flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <span className="font-semibold">COUNSELLING</span>
                </a>

                <a
                  href="/cutoff-ranks"
                  className="mobile-menu-item flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-300"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <TargetIcon className="h-4 w-4" />
                  </div>
                  <span className="font-semibold">CUTOFF</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Search Section - Exact replica of the old static site */}
      <section className="search-section py-20 bg-white dark:bg-gray-800 relative z-10">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="search-header text-center mb-12 pt-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Find Your Cutoff Analysis
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Search by college, course, rank, or counselling details
            </p>
          </div>

          <div className="search-box bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 mb-8 transition-all duration-400 shadow-2xl relative z-10 overflow-visible">
            <div className="search-input-group relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
              <input
                type="text"
                placeholder="Search for colleges, courses, ranks, or counselling details..."
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

            {/* Advanced Filters - MOBILE OPTIMIZED */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Advanced Filters</span>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                >
                  {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </button>
              </div>

              {/* Desktop Filters - Hidden on mobile */}
              <div className="hidden lg:block space-y-4">
                {/* First Line: Stream, Course, Branch, State */}
                <div className="flex items-center space-x-4">
                  {/* Stream Dropdown */}
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">Stream</label>
                    <select
                      value={selectedStream}
                      onChange={(e) => handleStreamChange(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white min-w-[120px]"
                      disabled={loadingDropdowns || !dropdownData.streams || !dropdownData.streams.length}
                    >
                      <option value="">All Streams</option>
                      {dropdownData.streams && dropdownData.streams.map((stream) => (
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
                      onChange={(e) => handleCourseChange(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white min-w-[140px]"
                      disabled={loadingDropdowns || !dropdownData.courses || !dropdownData.courses.length}
                    >
                      <option value="">All Courses</option>
                      {dropdownData.courses && dropdownData.courses.map((course) => (
                        <option key={course.value} value={course.value}>
                          {course.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Branch Dropdown */}
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">Branch</label>
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white min-w-[160px]"
                      disabled={loadingDropdowns || !selectedCourse || !dropdownData.branches || !dropdownData.branches.length}
                    >
                      <option value="">All Branches</option>
                      {dropdownData.branches && dropdownData.branches.map((branch) => (
                        <option key={branch.value} value={branch.value}>
                          {branch.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* State Dropdown */}
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">State</label>
                    <select
                      value={selectedState}
                      onChange={(e) => handleStateChange(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white min-w-[140px]"
                      disabled={loadingDropdowns || !dropdownData.states || !dropdownData.states.length}
                    >
                      <option value="">All States</option>
                      {dropdownData.states && dropdownData.states.sort((a, b) => a.label.localeCompare(b.label)).map((state) => (
                        <option key={state.value} value={state.value}>
                          {state.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Second Line: Counselling Type, Academic Year, Round */}
                <div className="flex items-center space-x-4">
                  {/* Counselling Type Dropdown */}
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">Counselling Type</label>
                    <select
                      value={selectedCounsellingType || ''}
                      onChange={(e) => setSelectedCounsellingType(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white min-w-[160px]"
                    >
                      <option value="">All Types</option>
                      <option value="AIQ_PG">AIQ PG Counselling</option>
                      <option value="AIQ_UG">AIQ UG Counselling</option>
                      <option value="KEA">Karnataka (KEA)</option>
                    </select>
                  </div>

                  {/* Academic Year Dropdown */}
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">Academic Year</label>
                    <select
                      value={selectedAcademicYear || ''}
                      onChange={(e) => setSelectedAcademicYear(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white min-w-[140px]"
                    >
                      <option value="">All Years</option>
                      <option value="2024">2024</option>
                      <option value="2023">2023</option>
                    </select>
                  </div>

                  {/* Round Dropdown */}
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">Round</label>
                    <select
                      value={selectedRound || ''}
                      onChange={(e) => setSelectedRound(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white min-w-[120px]"
                    >
                      <option value="">All Rounds</option>
                      <option value="1">Round 1</option>
                      <option value="2">Round 2</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Mobile Filters - Collapsible */}
              <div className={`lg:hidden ${mobileMenuOpen ? 'block' : 'hidden'} space-y-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700`}>
                {/* Mobile: Single Column Layout */}
                <div className="space-y-4">
                  {/* Stream Dropdown */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Stream</label>
                    <select
                      value={selectedStream}
                      onChange={(e) => handleStreamChange(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loadingDropdowns || !dropdownData.streams || !dropdownData.streams.length}
                    >
                      <option value="">All Streams</option>
                      {dropdownData.streams && dropdownData.streams.map((stream) => (
                        <option key={stream.value} value={stream.value}>
                          {stream.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Course Dropdown */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Course</label>
                    <select
                      value={selectedCourse}
                      onChange={(e) => handleCourseChange(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loadingDropdowns || !dropdownData.courses || !dropdownData.courses.length}
                    >
                      <option value="">All Courses</option>
                      {dropdownData.courses && dropdownData.courses.map((course) => (
                        <option key={course.value} value={course.value}>
                          {course.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Branch Dropdown */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branch</label>
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loadingDropdowns || !selectedCourse || !dropdownData.branches || !dropdownData.branches.length}
                    >
                      <option value="">All Branches</option>
                      {dropdownData.branches && dropdownData.branches.map((branch) => (
                        <option key={branch.value} value={branch.value}>
                          {branch.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* State Dropdown */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">State</label>
                    <select
                      value={selectedState}
                      onChange={(e) => handleStateChange(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loadingDropdowns || !dropdownData.states || !dropdownData.states.length}
                    >
                      <option value="">All States</option>
                      {dropdownData.states && dropdownData.states.sort((a, b) => a.label.localeCompare(b.label)).map((state) => (
                        <option key={state.value} value={state.value}>
                          {state.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Counselling Type Dropdown */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Counselling Type</label>
                    <select
                      value={selectedCounsellingType || ''}
                      onChange={(e) => setSelectedCounsellingType(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Types</option>
                      <option value="AIQ_PG">AIQ PG Counselling</option>
                      <option value="AIQ_UG">AIQ UG Counselling</option>
                      <option value="KEA">Karnataka (KEA)</option>
                    </select>
                  </div>

                  {/* Academic Year Dropdown */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Academic Year</label>
                    <select
                      value={selectedAcademicYear || ''}
                      onChange={(e) => setSelectedAcademicYear(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Years</option>
                      <option value="2024">2024</option>
                      <option value="2023">2023</option>
                    </select>
                  </div>

                  {/* Round Dropdown */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Round</label>
                    <select
                      value={selectedRound || ''}
                      onChange={(e) => setSelectedRound(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Rounds</option>
                      <option value="1">Round 1</option>
                      <option value="2">Round 2</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Search with Current Filters Button - MOBILE OPTIMIZED */}
            <div className="flex justify-center mb-6">
              <button
                onClick={() => handleSearch('')}
                disabled={searching || (!selectedStream && !selectedCourse && !selectedState && !selectedCounsellingType && !selectedAcademicYear && !selectedRound)}
                className="w-full lg:w-auto px-6 py-4 lg:py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed text-base lg:text-sm"
              >
                {searching ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Searching...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Search className="h-5 w-5" />
                    <span className="hidden sm:inline">Search with Current Filters</span>
                    <span className="sm:hidden">Search</span>
                  </div>
                )}
              </button>
            </div>

            {/* Popular Searches - MOBILE OPTIMIZED */}
            <div className="popular-searches mb-6">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Popular Searches:</h4>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                {popularSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickFilter(search)}
                    className="w-full sm:w-auto px-3 py-3 sm:py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-sm rounded-lg transition-colors duration-200 text-center"
                  >
                    <span className="hidden sm:inline">{search.name}</span>
                    <span className="sm:hidden text-xs">{search.name.length > 15 ? search.name.substring(0, 15) + '...' : search.name}</span>
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
              ) : searchResults.length > 0 ? (
                <>
                  {/* Display cutoff results grouped by college/course with all categories - MOBILE OPTIMIZED */}
                  <div className="results-grid grid grid-cols-1 gap-4 lg:gap-6 mb-6">
                    {getGroupedCutoffResults().map((group, index) => (
                      <div key={index} className="result-card bg-white dark:bg-gray-800 rounded-xl p-4 lg:p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
                        {/* College Header - Line 1: College Name - MOBILE OPTIMIZED */}
                        <div className="mb-3">
                          <h3 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white leading-tight line-clamp-2">
                            {group.college_name || 'Unknown College'}
                          </h3>
                        </div>

                        {/* Line 2: Stream, State, City - MOBILE OPTIMIZED */}
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 text-sm text-gray-600 dark:text-gray-400 mb-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 w-fit">
                            {group.stream || 'MEDICAL'}
                          </span>
                          <span className="flex items-center space-x-1">
                            <span>📍</span>
                            <span className="truncate">{group.state || 'Unknown State'}</span>
                          </span>
                          {group.city && (
                            <span className="flex items-center space-x-1">
                              <span>🏙️</span>
                              <span className="truncate">{group.city}</span>
                            </span>
                          )}
                        </div>

                        {/* Line 3: Course and Total Seats - MOBILE OPTIMIZED */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 mb-4">
                          <div className="flex-1">
                            <h4 className="text-base lg:text-lg font-semibold text-gray-800 dark:text-gray-200">
                              {group.course_name || 'Course'} Courses
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Available Seats ({group.totalSeats})
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl lg:text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {group.categories.length}
                            </div>
                            <div className="text-xs text-gray-500">Categories</div>
                          </div>
                        </div>

                        {/* Counselling Info - MOBILE OPTIMIZED */}
                        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 sm:space-y-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                              <span className="font-medium">Counselling:</span>
                              <span className="truncate">{group.counselling_type || 'N/A'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">Round:</span> {group.round_number || 'N/A'}
                              <span className="mx-2">•</span>
                              <span className="font-medium">Year:</span> {group.counselling_year || 'N/A'}
                            </div>
                          </div>
                        </div>

                        {/* Cutoff Categories Dropdown - Same as Available Courses */}
                        <div className="mb-4">
                          <details className="group">
                            <summary className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                              <div className="flex items-center space-x-2">
                                <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                                  Cutoff Categories ({group.categories.length})
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                  {group.totalSeats} total seats
                                </span>
                                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 transform group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </summary>
                            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                              {group.categories.map((category, catIndex) => (
                                <div key={catIndex} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                      {category.category || 'N/A'}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      ({category.quota || 'N/A'})
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                                      {category.seats_available || 0} seats
                                    </span>
                                    <span className="text-xs text-blue-600 dark:text-blue-400">
                                      {category.cutoff_rank || 'N/A'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </details>
                        </div>

                        {/* Additional Info - Removed redundant total seats and fees */}
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                            <span>Click to expand categories for detailed cutoff ranks</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Search Summary - MOBILE OPTIMIZED */}
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
                        Cutoff Search Results
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center lg:justify-center gap-3 lg:gap-4 text-sm text-blue-600 dark:text-blue-400">
                        <span className="flex items-center justify-center sm:justify-start space-x-1">
                          <Target className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{searchResults.length} cutoff records found</span>
                        </span>
                        {selectedCounsellingType && (
                          <span className="flex items-center justify-center sm:justify-start space-x-1">
                            <Target className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">Type: {selectedCounsellingType}</span>
                          </span>
                        )}
                        {selectedCourse && (
                          <span className="flex items-center justify-center sm:justify-start space-x-1">
                            <GraduationCap className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">Course: {selectedCourse}</span>
                          </span>
                        )}
                        {selectedStream && (
                          <span className="flex items-center justify-center sm:justify-start space-x-1">
                            <Stethoscope className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">Stream: {selectedStream.toUpperCase()}</span>
                          </span>
                        )}
                        {selectedAcademicYear && (
                          <span className="flex items-center justify-center sm:justify-start space-x-1">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">Year: {selectedAcademicYear}</span>
                          </span>
                        )}
                        {selectedRound && (
                          <span className="flex items-center justify-center sm:justify-start space-x-1">
                            <TrendingUp className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">Round: {selectedRound}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Results Summary */}
                  <div className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Showing {startIndex + 1}-{Math.min(endIndex, searchResults.length)} of {searchResults.length} cutoff records
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
                            className={`px-3 py-2 text-sm font-medium rounded-md ${page === currentPage
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
              <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">AIQ Counselling</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.byType?.find(t => t.type === 'aiq')?.count?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <MapPin className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">State Counselling</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.byType?.find(t => t.type === 'state')?.count?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Rounds</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.byType?.find(t => t.type === 'rounds')?.count?.toLocaleString() || '0'}
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
                {stats?.totalSeats?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Why Choose Our Cutoff Analysis?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-3xl mx-auto">
            Your comprehensive platform for cutoff analysis with advanced features and real-time data insights
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI-Powered Analysis</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Get intelligent insights and predictions based on historical cutoff data and trends
            </p>
          </div>

          <div className="text-center">
            <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Database className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Comprehensive Data</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Access detailed information about cutoffs, seat availability, and counselling rounds
            </p>
          </div>

          <div className="text-center">
            <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Real-time Updates</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Get up-to-date information about cutoffs with live statistics and trend analysis
            </p>
          </div>
        </div>
      </section>



      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="back-to-top fixed bottom-20 right-4 md:right-10 z-10 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover-lift"
          aria-label="Back to top"
        >
          <ArrowUp className="h-6 w-6" />
        </button>
      )}
    </div>
  )
}

export default CutoffRanks
