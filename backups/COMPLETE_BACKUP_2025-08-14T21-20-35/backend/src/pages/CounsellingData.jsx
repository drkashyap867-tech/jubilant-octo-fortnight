import React, { useState, useEffect } from 'react';
import { 
    Search, 
    Filter, 
    MapPin, 
    GraduationCap, 
    Users, 
    Building2,
    TrendingUp,
    Calendar,
    BookOpen,
    Target,
    Award,
    Clock,
    BarChart3
} from 'lucide-react';

const CounsellingData = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        counselling_type: '',
        academic_year: '',
        round_id: '',
        college_name: '',
        course_name: '',
        quota: '',
        category: '',
        limit: 100
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState(null);
    const [counsellingTypes, setCounsellingTypes] = useState([]);
    const [rounds, setRounds] = useState([]);
    const [years, setYears] = useState([]);

    // Fetch counselling data
    const fetchCounsellingData = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams(filters);
            const response = await fetch(`/api/counselling-data?${queryParams}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            setData(result.data);
            setError(null);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching counselling data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch statistics
    const fetchStats = async () => {
        try {
            const response = await fetch('/api/comprehensive-stats');
            if (response.ok) {
                const result = await response.json();
                setStats(result.counselling);
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    // Fetch metadata for filters
    const fetchMetadata = async () => {
        try {
            // Fetch counselling types
            const typesResponse = await fetch('/api/counselling-types');
            if (typesResponse.ok) {
                const typesData = await typesResponse.json();
                setCounsellingTypes(typesData);
            }

            // Fetch rounds
            const roundsResponse = await fetch('/api/counselling-rounds');
            if (roundsResponse.ok) {
                const roundsData = await roundsResponse.json();
                setRounds(roundsData);
            }

            // Generate academic years (2020-2021 to 2024-2025)
            const currentYear = new Date().getFullYear();
            const yearsList = [];
            for (let i = 2020; i <= currentYear; i++) {
                yearsList.push(`${i}-${i + 1}`);
            }
            setYears(yearsList);

        } catch (err) {
            console.error('Error fetching metadata:', err);
        }
    };

    // Handle filter changes
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // Apply filters
    const applyFilters = () => {
        fetchCounsellingData();
    };

    // Reset filters
    const resetFilters = () => {
        setFilters({
            counselling_type: '',
            academic_year: '',
            round_id: '',
            college_name: '',
            course_name: '',
            quota: '',
            category: '',
            limit: 100
        });
        setSearchTerm('');
    };

    // Search functionality
    const handleSearch = () => {
        if (searchTerm.trim()) {
            setFilters(prev => ({
                ...prev,
                college_name: searchTerm.trim()
            }));
        }
    };

    // Load data on component mount
    useEffect(() => {
        fetchCounsellingData();
        fetchStats();
        fetchMetadata();
    }, []);

    // Load data when filters change
    useEffect(() => {
        fetchCounsellingData();
    }, [filters]);

    if (loading && !data.length) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        🎓 Counselling Data Database
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Comprehensive counselling information across all rounds, types, and academic years
                    </p>
                </div>

                {/* Statistics Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-slate-700">
                            <div className="flex items-center">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                    <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Records</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_records?.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-slate-700">
                            <div className="flex items-center">
                                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                                    <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Counselling Types</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.counselling_types?.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-slate-700">
                            <div className="flex items-center">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                    <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rounds</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.rounds?.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-slate-700">
                            <div className="flex items-center">
                                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                                    <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Academic Years</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.years?.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Search and Filters */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-slate-700 mb-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Search */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Search Colleges
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search for colleges..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                />
                                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            </div>
                            <button
                                onClick={handleSearch}
                                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Search
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Counselling Type
                                </label>
                                <select
                                    value={filters.counselling_type}
                                    onChange={(e) => handleFilterChange('counselling_type', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                >
                                    <option value="">All Types</option>
                                    {counsellingTypes.map((type, index) => (
                                        <option key={index} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Academic Year
                                </label>
                                <select
                                    value={filters.academic_year}
                                    onChange={(e) => handleFilterChange('academic_year', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                >
                                    <option value="">All Years</option>
                                    {years.map((year, index) => (
                                        <option key={index} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Round
                                </label>
                                <select
                                    value={filters.round_id}
                                    onChange={(e) => handleFilterChange('round_id', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                >
                                    <option value="">All Rounds</option>
                                    {rounds.map((round, index) => (
                                        <option key={index} value={round.id}>{round.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Limit
                                </label>
                                <select
                                    value={filters.limit}
                                    onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                >
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                    <option value={200}>200</option>
                                    <option value={500}>500</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Course Name
                            </label>
                            <input
                                type="text"
                                value={filters.course_name}
                                onChange={(e) => handleFilterChange('course_name', e.target.value)}
                                placeholder="Enter course name..."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Quota
                            </label>
                            <input
                                type="text"
                                value={filters.quota}
                                onChange={(e) => handleFilterChange('quota', e.target.value)}
                                placeholder="Enter quota..."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Category
                            </label>
                            <input
                                type="text"
                                value={filters.category}
                                onChange={(e) => handleFilterChange('category', e.target.value)}
                                placeholder="Enter category..."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 mt-6">
                        <button
                            onClick={applyFilters}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <Filter className="h-4 w-4" />
                            Apply Filters
                        </button>
                        <button
                            onClick={resetFilters}
                            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Results */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Counselling Data ({data.length} results)
                        </h2>
                    </div>

                    {error && (
                        <div className="p-6 text-center">
                            <div className="text-red-600 dark:text-red-400 text-lg">
                                Error: {error}
                            </div>
                        </div>
                    )}

                    {!error && data.length === 0 && !loading && (
                        <div className="p-6 text-center">
                            <div className="text-gray-500 dark:text-gray-400 text-lg">
                                No counselling data found matching your criteria
                            </div>
                        </div>
                    )}

                    {!error && data.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-slate-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            College
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Course
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Counselling Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Round
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Academic Year
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Quota
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            All India Rank
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Seats
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Fees
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                                    {data.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {item.college_name || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <GraduationCap className="h-5 w-5 text-gray-400 mr-2" />
                                                    <div className="text-sm text-gray-900 dark:text-white">
                                                        {item.course_name || 'N/A'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                    {item.counselling_type_name || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                    {item.round_name || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                                    <span className="text-sm text-gray-900 dark:text-white">
                                                        {item.academic_year || 'N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                                    {item.quota || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                                    {item.category || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Target className="h-4 w-4 text-gray-400 mr-2" />
                                                    <span className="text-sm text-gray-900 dark:text-white">
                                                        {item.all_india_rank || 'N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Users className="h-4 w-4 text-gray-400 mr-2" />
                                                    <span className="text-sm text-gray-900 dark:text-white">
                                                        {item.seats || 0}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <TrendingUp className="h-4 w-4 text-gray-400 mr-2" />
                                                    <span className="text-sm text-gray-900 dark:text-white">
                                                        ₹{item.fees ? item.fees.toLocaleString() : '0'}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CounsellingData;
