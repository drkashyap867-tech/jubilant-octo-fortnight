import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Search, Filter, TrendingUp, Calendar, GraduationCap, MapPin, Award, Users, ArrowUp, Sun, Moon, Menu, X } from 'lucide-react';

const Cutoff = () => {
    const { theme, toggleTheme } = useTheme();
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    // Cutoff data states
    const [years, setYears] = useState([]);
    const [categories, setCategories] = useState([]);
    const [rounds, setRounds] = useState([]);
    const [cutoffData, setCutoffData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({});
    
    // Filter states
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedRound, setSelectedRound] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCollege, setSelectedCollege] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedQuota, setSelectedQuota] = useState('');
    const [minRank, setMinRank] = useState('');
    const [maxRank, setMaxRank] = useState('');
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);
    const [totalItems, setTotalItems] = useState(0);
    
    // Trends states
    const [trendsData, setTrendsData] = useState([]);
    const [showTrends, setShowTrends] = useState(false);

    useEffect(() => {
        fetchInitialData();
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (selectedYear && selectedCategory) {
            fetchRounds(selectedCategory, selectedYear);
        }
    }, [selectedYear, selectedCategory]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            
            // Fetch years
            const yearsResponse = await fetch('/api/cutoff/years');
            const yearsData = await yearsResponse.json();
            if (yearsData.success) {
                setYears(yearsData.data);
                setSelectedYear(yearsData.data[0] || '');
            }
            
            // Fetch categories
            const categoriesResponse = await fetch('/api/cutoff/categories');
            const categoriesData = await categoriesResponse.json();
            if (categoriesData.success) {
                setCategories(categoriesData.data);
                setSelectedCategory(categoriesData.data[0]?.value || '');
            }
            
            // Fetch stats
            const statsResponse = await fetch('/api/stats');
            const statsData = await statsResponse.json();
            setStats(statsData);
            
        } catch (error) {
            console.error('Error fetching initial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRounds = async (category, year) => {
        try {
            const response = await fetch(`/api/cutoff/rounds/${category}/${year}`);
            const data = await response.json();
            if (data.success) {
                setRounds(data.data);
                setSelectedRound(data.data[0]?.value || '');
            }
        } catch (error) {
            console.error('Error fetching rounds:', error);
        }
    };

    const searchCutoffData = async () => {
        if (!selectedYear || !selectedCategory || !selectedRound) {
            alert('Please select Year, Category, and Round');
            return;
        }

        try {
            setLoading(true);
            const params = new URLSearchParams({
                year: selectedYear,
                category: selectedCategory,
                round: selectedRound,
                college: selectedCollege,
                course: selectedCourse,
                quota: selectedQuota,
                minRank: minRank,
                maxRank: maxRank,
                limit: itemsPerPage * 5 // Get more data for pagination
            });

            const response = await fetch(`/api/cutoff/search?${params}`);
            const data = await response.json();
            
            if (data.success) {
                setCutoffData(data.data);
                setTotalItems(data.total);
                setCurrentPage(1);
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Error searching cutoff data:', error);
            alert('Error searching cutoff data');
        } finally {
            setLoading(false);
        }
    };

    const fetchTrends = async () => {
        if (!selectedCollege || !selectedCourse) {
            alert('Please select College and Course for trends');
            return;
        }

        try {
            setLoading(true);
            const params = new URLSearchParams({
                college: selectedCollege,
                course: selectedCourse,
                quota: selectedQuota,
                years: 3
            });

            const response = await fetch(`/api/cutoff/trends?${params}`);
            const data = await response.json();
            
            if (data.success) {
                setTrendsData(data.data);
                setShowTrends(true);
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Error fetching trends:', error);
            alert('Error fetching trends');
        } finally {
            setLoading(false);
        }
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Pagination logic
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentData = cutoffData.slice(startIndex, endIndex);

    // Smart pagination with ellipsis
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 7;
        
        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 4) {
                for (let i = 1; i <= 5; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 3) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 4; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            }
        }
        
        return pages;
    };

    const handlePageChange = (page) => {
        if (page !== '...' && page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
            {/* Modern Navigation */}
            <nav className="modern-nav glass">
                <div className="nav-brand">
                    <GraduationCap className="nav-icon" />
                    <span>Medical Counselling</span>
                </div>
                
                <div className="nav-links">
                    <a href="/" className="nav-link">COLLEGE</a>
                    <a href="/counselling" className="nav-link">COUNSELLING</a>
                    <a href="/cutoff" className="nav-link nav-link-active">CUTOFF</a>
                </div>
                
                <div className="nav-actions">
                    <button onClick={toggleTheme} className="theme-toggle">
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    
                    <button 
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="mobile-menu-btn"
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="mobile-menu">
                    <a href="/" className="mobile-menu-item">COLLEGE</a>
                    <a href="/counselling" className="mobile-menu-item">COUNSELLING</a>
                    <a href="/cutoff" className="mobile-menu-item">CUTOFF</a>
                </div>
            )}

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8">
                {/* Header Section */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4 gradient-text">
                        Cutoff Analysis & Trends
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300">
                        Comprehensive cutoff data for medical counselling across India
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="stat-card glass">
                        <div className="stat-icon">
                            <Calendar className="w-8 h-8" />
                        </div>
                        <div className="stat-content">
                            <h3 className="stat-value">{years.length}</h3>
                            <p className="stat-label">Available Years</p>
                        </div>
                    </div>
                    
                    <div className="stat-card glass">
                        <div className="stat-icon">
                            <GraduationCap className="w-8 h-8" />
                        </div>
                        <div className="stat-content">
                            <h3 className="stat-value">{categories.length}</h3>
                            <p className="stat-label">Categories</p>
                        </div>
                    </div>
                    
                    <div className="stat-card glass">
                        <div className="stat-icon">
                            <Award className="w-8 h-8" />
                        </div>
                        <div className="stat-content">
                            <h3 className="stat-value">{stats.totalColleges || 'N/A'}</h3>
                            <p className="stat-label">Total Colleges</p>
                        </div>
                    </div>
                    
                    <div className="stat-card glass">
                        <div className="stat-icon">
                            <Users className="w-8 h-8" />
                        </div>
                        <div className="stat-content">
                            <h3 className="stat-value">{stats.totalSeats || 'N/A'}</h3>
                            <p className="stat-label">Total Seats</p>
                        </div>
                    </div>
                </div>

                {/* Search Bar - Matching Dashboard Design */}
                <div className="mb-8">
                    <div className="relative max-w-4xl mx-auto">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Search for colleges, courses, or specific cutoff ranks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && searchCutoffData()}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                                onClick={searchCutoffData}
                                disabled={!selectedYear || !selectedCategory || !selectedRound}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                    'Search'
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Advanced Filters - Matching Dashboard Design */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Advanced Filters:</span>
                    </div>
                </div>
                
                <div className="flex items-center space-x-4 mb-8">
                    {/* Year Dropdown */}
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">Year</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white min-w-[120px]"
                        >
                            <option value="">All Years</option>
                            {years.map((year) => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>

                    {/* Category Dropdown */}
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">Category</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white min-w-[140px]"
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Round Dropdown */}
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">Round</label>
                        <select
                            value={selectedRound}
                            onChange={(e) => setSelectedRound(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white min-w-[140px]"
                            disabled={!selectedYear || !selectedCategory}
                        >
                            <option value="">All Rounds</option>
                            {rounds.map((round) => (
                                <option key={round.value} value={round.value}>{round.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* College Dropdown */}
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">College</label>
                        <input
                            type="text"
                            placeholder="College name..."
                            value={selectedCollege}
                            onChange={(e) => setSelectedCollege(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white min-w-[160px]"
                        />
                    </div>

                    {/* Course Dropdown */}
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">Course</label>
                        <input
                            type="text"
                            placeholder="Course name..."
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white min-w-[140px]"
                        />
                    </div>

                    {/* Quota Dropdown */}
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">Quota</label>
                        <select
                            value={selectedQuota}
                            onChange={(e) => setSelectedQuota(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white min-w-[120px]"
                        >
                            <option value="">All Quotas</option>
                            <option value="GENERAL">General</option>
                            <option value="OBC">OBC</option>
                            <option value="SC">SC</option>
                            <option value="ST">ST</option>
                            <option value="EWS">EWS</option>
                            <option value="NRI">NRI</option>
                            <option value="MANAGEMENT">Management</option>
                        </select>
                    </div>
                </div>

                {/* Rank Range Filters */}
                <div className="flex items-center space-x-4 mb-8">
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">Min Rank</label>
                        <input
                            type="number"
                            placeholder="Min rank..."
                            value={minRank}
                            onChange={(e) => setMinRank(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white min-w-[120px]"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">Max Rank</label>
                        <input
                            type="number"
                            placeholder="Max rank..."
                            value={maxRank}
                            onChange={(e) => setMaxRank(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white min-w-[120px]"
                        />
                    </div>

                    <div className="flex flex-col justify-end">
                        <button
                            onClick={searchCutoffData}
                            disabled={!selectedYear || !selectedCategory || !selectedRound}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                                'Search Cutoff Data'
                            )}
                        </button>
                    </div>
                </div>

                {/* Trends Button */}
                <div className="mb-8">
                    <button 
                        onClick={fetchTrends}
                        disabled={loading || !selectedCollege || !selectedCourse}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center"
                    >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        View Trends
                    </button>
                </div>

                {/* Trends Section */}
                {showTrends && trendsData.length > 0 && (
                    <div className="trends-section glass mb-8">
                        <h2 className="text-2xl font-semibold mb-6 flex items-center">
                            <TrendingUp className="w-6 h-6 mr-2" />
                            Cutoff Trends (Last 3 Years)
                        </h2>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr>
                                        <th>Year</th>
                                        <th>Category</th>
                                        <th>Opening Rank</th>
                                        <th>Closing Rank</th>
                                        <th>Total Seats</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {trendsData.map((trend, index) => (
                                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <td className="px-4 py-2">{trend.year}</td>
                                            <td className="px-4 py-2">{trend.category}</td>
                                            <td className="px-4 py-2">{trend.opening_rank || 'N/A'}</td>
                                            <td className="px-4 py-2">{trend.closing_rank || 'N/A'}</td>
                                            <td className="px-4 py-2">{trend.total_seats || 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Results Section */}
                {cutoffData.length > 0 && (
                    <div className="results-section glass">
                        <h2 className="text-2xl font-semibold mb-6">
                            Search Results ({totalItems} records)
                        </h2>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr>
                                        <th>College/Institute</th>
                                        <th>Course</th>
                                        <th>Category</th>
                                        <th>Quota</th>
                                        <th>All India Rank</th>
                                        <th>State</th>
                                        <th>Total Seats</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentData.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <td className="px-4 py-2 font-medium">{item.college_name}</td>
                                            <td className="px-4 py-2">{item.course_name}</td>
                                            <td className="px-4 py-2">{item.category || 'N/A'}</td>
                                            <td className="px-4 py-2">{item.quota || 'N/A'}</td>
                                            <td className="px-4 py-2 font-bold">{item.all_india_rank || 'N/A'}</td>
                                            <td className="px-4 py-2">{item.state || 'N/A'}</td>
                                            <td className="px-4 py-2">{item.total_seats || 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="pagination-container mt-6">
                                <div className="pagination">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="page-link"
                                    >
                                        Previous
                                    </button>
                                    
                                    {getPageNumbers().map((page, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handlePageChange(page)}
                                            className={`page-link ${page === currentPage ? 'active' : ''} ${page === '...' ? 'disabled' : ''}`}
                                            disabled={page === '...'}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="page-link"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* No Results Message */}
                {cutoffData.length === 0 && !loading && selectedYear && selectedCategory && selectedRound && (
                    <div className="text-center py-12">
                        <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">No Results Found</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Try adjusting your search criteria or filters
                        </p>
                    </div>
                )}
            </div>

            {/* Back to Top Button */}
            {showBackToTop && (
                <button
                    onClick={scrollToTop}
                    className="back-to-top"
                    aria-label="Back to top"
                >
                    <ArrowUp size={20} />
                </button>
            )}
        </div>
    );
};

export default Cutoff;
