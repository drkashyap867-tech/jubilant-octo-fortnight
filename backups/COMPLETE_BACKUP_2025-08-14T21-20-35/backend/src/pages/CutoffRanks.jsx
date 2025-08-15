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
    BarChart3,
    Hash,
    Star
} from 'lucide-react';

const CutoffRanks = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        counselling_type_id: '',
        academic_year: '',
        round_id: '',
        college_name: '',
        course_name: '',
        quota: '',
        category: '',
        max_rank: '',
        limit: 100
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState(null);

    // Fetch cutoff ranks data
    const fetchCutoffRanks = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams(filters);
            const response = await fetch(`/api/cutoff-ranks-enhanced?${queryParams}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            setData(result.data);
            setError(null);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching cutoff ranks:', err);
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
                setStats(result.cutoff);
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
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
        fetchCutoffRanks();
    };

    // Reset filters
    const resetFilters = () => {
        setFilters({
            counselling_type_id: '',
            academic_year: '',
            round_id: '',
            college_name: '',
            course_name: '',
            quota: '',
            category: '',
            max_rank: '',
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
        fetchCutoffRanks();
        fetchStats();
    }, []);

    // Load data when filters change
    useEffect(() => {
        fetchCutoffRanks();
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
                        🎯 Cutoff Ranks Database
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Comprehensive cutoff rank information for medical admissions across all counselling rounds
                    </p>
                </div>

                {/* Statistics Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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

                        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-slate-700">
                            <div className="flex items-center">
                                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                                    <Hash className="h-6 w-6 text-red-600 dark:text-red-400" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Lowest Rank</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.lowest_rank?.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Additional Stats Row */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-slate-700">
                            <div className="flex items-center">
                                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                                    <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Highest Rank</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.highest_rank?.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-slate-700">
                            <div className="flex items-center">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                                    <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Rank</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.average_rank ? Math.round(stats.average_rank).toLocaleString() : 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-slate-700">
                            <div className="flex items-center">
                                <div className="p-2 bg-pink-100 dark:bg-pink-900 rounded-lg">
                                    <TrendingUp className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Quota Types</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.quota_types?.toLocaleString()}</p>
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
                                    value={filters.counselling_type_id}
                                    onChange={(e) => handleFilterChange('counselling_type_id', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                >
                                    <option value="">All Types</option>
                                    <option value="1">AIQ_PG</option>
                                    <option value="2">AIQ_UG</option>
                                    <option value="3">KEA</option>
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
                                    <option value="2020-2021">2020-2021</option>
                                    <option value="2021-2022">2021-2022</option>
                                    <option value="2022-2023">2022-2023</option>
                                    <option value="2023-2024">2023-2024</option>
                                    <option value="2024-2025">2024-2025</option>
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
                                    <option value="1">R1</option>
                                    <option value="2">R2</option>
                                    <option value="3">R3</option>
                                    <option value="4">R4</option>
                                    <option value="5">R5</option>
                                    <option value="6">STRAY</option>
                                    <option value="7">SPECIAL_STRAY</option>
                                    <option value="8">MOPUP</option>
                                    <option value="9">EXTENDED_STRAY</option>
                                    <option value="10">STRAY_BDS</option>
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

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Max Rank
                            </label>
                            <input
                                type="number"
                                value={filters.max_rank}
                                onChange={(e) => handleFilterChange('max_rank', e.target.value)}
                                placeholder="Enter max rank..."
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
                            Cutoff Ranks ({data.length} results)
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
                                No cutoff ranks found matching your criteria
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
                                            Cutoff Rank
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Seats Available
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
                                                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                        {item.cutoff_rank?.toLocaleString() || 'N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Users className="h-4 w-4 text-gray-400 mr-2" />
                                                    <span className="text-sm text-gray-900 dark:text-white">
                                                        {item.seats_available || 0}
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

export default CutoffRanks;
