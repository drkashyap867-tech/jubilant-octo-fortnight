// College Database Frontend JavaScript
console.log('📜 Script.js loaded successfully!');

class CollegeDatabase {
    constructor() {
        console.log('🏗️ CollegeDatabase constructor called...');
        
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.searchResults = [];
        this.currentFilters = {};
        this.currentTheme = 'light';
        
        // Counselling section properties
        this.counsellingData = {
            selectedStream: 'ALL',
            selectedPath: 'ALL',
            filters: {},
            results: [],
            currentPage: 1,
            itemsPerPage: 12
        };
        
        console.log('🏗️ CollegeDatabase properties initialized, calling init()...');
        this.init();
        console.log('🏗️ CollegeDatabase constructor complete!');
    }

    init() {
        console.log('🔧 CollegeDatabase.init() called...');
        
        try {
            console.log('🔧 Initializing theme...');
            this.initTheme();
            
            console.log('🔧 Setting up event listeners...');
            this.setupEventListeners();
            
            // Only initialize main page features if we're on the main page
            if (this.isMainPage()) {
                console.log('🔧 On main page, initializing main page features...');
                this.animateHeroStats();
                this.animateChartBars();
                this.loadStates();
                this.loadCoursesByStream(); // Load all courses initially
                this.setupIntersectionObserver();
                this.loadRealStatistics();
            } else {
                console.log('🔧 Not on main page, skipping main page features...');
            }
            
            // Only initialize counselling section if we're on the counselling page
            if (this.isCounsellingPage()) {
                console.log('🔧 On counselling page, initializing counselling section...');
                this.initCounsellingSection();
            } else {
                console.log('🔧 Not on counselling page, skipping counselling section...');
            }
            
            console.log('🔧 CollegeDatabase.init() completed successfully!');
        } catch (error) {
            console.error('❌ Error in CollegeDatabase.init():', error);
            throw error;
        }
    }

    initTheme() {
        // Check for saved theme preference or default to system preference
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        let theme = 'light';
        
        if (savedTheme) {
            theme = savedTheme;
        } else if (systemPrefersDark) {
            theme = 'dark';
        }
        
        this.setTheme(theme);
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) { // Only auto-change if user hasn't set a preference
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    setTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update theme icon
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) {
            themeIcon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
        
        // Update page title to show current theme
        const title = document.title;
        if (theme === 'dark') {
            document.title = title.replace('College Database', 'College Database 🌙');
        } else {
            document.title = title.replace(' 🌙', '');
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        
        // Add loading state to button
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.classList.add('loading');
        }
        
        // Create transition overlay
        const overlay = document.createElement('div');
        overlay.className = 'theme-transition-overlay';
        document.body.appendChild(overlay);
        
        // Show overlay
        setTimeout(() => overlay.classList.add('show'), 50);
        
        // Switch theme after overlay is visible
        setTimeout(() => {
            this.setTheme(newTheme);
            
            // Hide overlay
            overlay.classList.remove('show');
            
            // Remove overlay after transition
            setTimeout(() => {
                overlay.remove();
                
                // Remove loading state
                if (themeToggle) {
                    themeToggle.classList.remove('loading');
                }
            }, 300);
        }, 100);
        
        // Add smooth transition effect
        document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        
        // Add a subtle animation to the theme toggle button
        if (themeToggle) {
            themeToggle.style.transform = 'rotate(180deg) scale(1.1)';
            setTimeout(() => {
                themeToggle.style.transform = 'rotate(0deg) scale(1)';
            }, 150);
        }
        
        // Trigger a small delay to ensure smooth transition
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
        
        // Show a subtle notification
        this.showThemeNotification(newTheme);
    }

    showThemeNotification(theme) {
        const notification = document.createElement('div');
        notification.className = `theme-notification ${theme}`;
        notification.innerHTML = `
            <i class="fas fa-${theme === 'light' ? 'sun' : 'moon'}"></i>
            <span>Switched to ${theme} mode</span>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    setupEventListeners() {
        // Theme toggle (works on all pages)
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Keyboard shortcut for theme toggle (Ctrl/Cmd + Shift + T)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.toggleTheme();
            }
        });

        // Main page event listeners
        if (this.isMainPage()) {
            this.setupMainPageEventListeners();
        }

        // Counselling page event listeners
        if (this.isCounsellingPage()) {
            this.setupCounsellingEventListeners();
        }
    }

    setupMainPageEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const streamFilter = document.getElementById('streamFilter');
        const courseFilter = document.getElementById('courseFilter');
        const stateFilter = document.getElementById('stateFilter');
        const sortBy = document.getElementById('sortBy');

        if (searchBtn) searchBtn.addEventListener('click', () => this.performSearch());
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.performSearch();
            });
            
            // Auto-complete functionality
            let debounceTimer;
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                
                // Clear previous timer
                clearTimeout(debounceTimer);
                
                // Set new timer for debounced auto-complete
                debounceTimer = setTimeout(() => {
                    this.getAutoCompleteSuggestions(query);
                }, 300); // 300ms delay
            });
            
            // Handle keyboard navigation
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.handleKeyboardNavigation(e.key);
                } else if (e.key === 'Escape') {
                    this.hideAutocomplete();
                }
            });
            
            // Hide auto-complete when input loses focus
            searchInput.addEventListener('blur', () => {
                // Small delay to allow clicking on suggestions
                setTimeout(() => this.hideAutocomplete(), 150);
            });
        }

        // Filter changes
        if (streamFilter) {
            streamFilter.addEventListener('change', () => {
                this.updateFilters();
                // Auto-sync courses with selected stream
                const selectedStream = streamFilter.value;
                this.loadCoursesByStream(selectedStream);
            });
        }
        if (courseFilter) courseFilter.addEventListener('change', () => this.updateFilters());
        if (stateFilter) stateFilter.addEventListener('change', () => this.updateFilters());
        if (sortBy) sortBy.addEventListener('change', () => this.sortResults());

        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(e.target.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // Mobile navigation
        const navToggle = document.querySelector('.nav-toggle');
        const navLinks = document.querySelector('.nav-links');
        
        if (navToggle && navLinks) {
            navToggle.addEventListener('click', () => {
                navLinks.classList.toggle('show');
                navToggle.classList.toggle('active');
            });
        }

        // Auto-complete close button
        const closeAutocomplete = document.getElementById('closeAutocomplete');
        if (closeAutocomplete) {
            closeAutocomplete.addEventListener('click', () => {
                this.hideAutocomplete();
            });
        }

        // Handle window resize and scroll for auto-complete positioning
        window.addEventListener('resize', () => {
            if (document.getElementById('autocompleteDropdown').style.display === 'block') {
                this.repositionAutocomplete();
            }
        });

        window.addEventListener('scroll', () => {
            if (document.getElementById('autocompleteDropdown').style.display === 'block') {
                this.repositionAutocomplete();
            }
        });
    }

    setupCounsellingEventListeners() {
        // Toggle buttons
        const streamToggles = document.querySelectorAll('[data-stream]');
        const pathToggles = document.querySelectorAll('[data-path]');
        
        streamToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                this.selectStream(toggle.dataset.stream);
            });
        });
        
        pathToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                this.selectPath(toggle.dataset.path);
            });
        });

        // Filter selects
        const yearFilter = document.getElementById('yearFilter');
        const stateFilter = document.getElementById('stateFilter');
        const roundFilter = document.getElementById('roundFilter');
        const collegeFilter = document.getElementById('collegeFilter');
        const typeFilter = document.getElementById('typeFilter');
        const courseFilter = document.getElementById('courseFilter');
        const quotaFilter = document.getElementById('quotaFilter');
        const categoryFilter = document.getElementById('categoryFilter');

        if (yearFilter) yearFilter.addEventListener('change', () => this.updateCounsellingFilters());
        if (stateFilter) stateFilter.addEventListener('change', () => this.updateCounsellingFilters());
        if (roundFilter) roundFilter.addEventListener('change', () => this.updateCounsellingFilters());
        if (collegeFilter) collegeFilter.addEventListener('change', () => this.updateCounsellingFilters());
        if (typeFilter) typeFilter.addEventListener('change', () => this.updateCounsellingFilters());
        if (courseFilter) courseFilter.addEventListener('change', () => this.updateCounsellingFilters());
        if (quotaFilter) quotaFilter.addEventListener('change', () => this.updateCounsellingFilters());
        if (categoryFilter) categoryFilter.addEventListener('change', () => this.updateCounsellingFilters());

        // Action buttons
        const applyFilters = document.getElementById('applyFilters');
        const clearFilters = document.getElementById('clearFilters');

        if (applyFilters) applyFilters.addEventListener('click', () => this.performCounsellingSearch());
        if (clearFilters) clearFilters.addEventListener('click', () => this.clearCounsellingFilters());
    }

    initCounsellingSection() {
        this.populateCounsellingFilters();
        this.updateCounsellingDisplay();
    }

    populateCounsellingFilters() {
        // Populate year filter (2020-2024)
        const yearFilter = document.getElementById('yearFilter');
        if (yearFilter) {
            for (let year = 2024; year >= 2020; year--) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearFilter.appendChild(option);
            }
        }

        // Populate round filter
        const roundFilter = document.getElementById('roundFilter');
        if (roundFilter) {
            const rounds = ['ROUND_1', 'ROUND_2', 'ROUND_3', 'ROUND_4', 'ROUND_5', 'ROUND_6', 'ROUND_7', 'ROUND_8', 'ROUND_9', 'ROUND_10', 'SPECIAL_STRAY', 'STRAY_BDS'];
            rounds.forEach(round => {
                const option = document.createElement('option');
                option.value = round;
                option.textContent = round.replace('_', ' ').replace('_', ' ');
                roundFilter.appendChild(option);
            });
        }

        // Populate other filters from foundation data
        this.loadFoundationDataForFilters();
    }

    async loadFoundationDataForFilters() {
        try {
            // Load foundation data for filters
            const response = await fetch('/api/foundation/overview');
            if (response.ok) {
                const data = await response.json();
                this.populateFiltersFromFoundation(data);
            }
        } catch (error) {
            console.error('Error loading foundation data:', error);
        }
    }

    populateFiltersFromFoundation(foundationData) {
        // Populate college filter
        const collegeFilter = document.getElementById('collegeFilter');
        if (collegeFilter && foundationData.colleges) {
            foundationData.colleges.forEach(college => {
                const option = document.createElement('option');
                option.value = college.id;
                option.textContent = college.name;
                collegeFilter.appendChild(option);
            });
        }

        // Populate course filter
        const courseFilter = document.getElementById('courseFilter');
        if (courseFilter && foundationData.courses) {
            foundationData.courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = course.name;
                courseFilter.appendChild(option);
            });
        }

        // Populate quota filter
        const quotaFilter = document.getElementById('quotaFilter');
        if (quotaFilter && foundationData.quotas) {
            foundationData.quotas.forEach(quota => {
                const option = document.createElement('option');
                option.value = quota.id;
                option.textContent = quota.name;
                quotaFilter.appendChild(option);
            });
        }

        // Populate category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter && foundationData.categories) {
            foundationData.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categoryFilter.appendChild(option);
            });
        }

        // Populate type filter
        const typeFilter = document.getElementById('typeFilter');
        if (typeFilter && foundationData.types) {
            foundationData.types.forEach(type => {
                const option = document.createElement('option');
                option.value = type.id;
                option.textContent = type.name;
                typeFilter.appendChild(option);
            });
        }
    }

    selectStream(stream) {
        // Update active state
        document.querySelectorAll('[data-stream]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-stream="${stream}"]`).classList.add('active');
        
        this.counsellingData.selectedStream = stream;
        this.updateCounsellingFilters();
        this.updateCounsellingDisplay();
    }

    selectPath(path) {
        // Update active state
        document.querySelectorAll('[data-path]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-path="${path}"]`).classList.add('active');
        
        this.counsellingData.selectedPath = path;
        this.updateCounsellingFilters();
        this.updateCounsellingDisplay();
    }

    updateCounsellingFilters() {
        // Collect all filter values
        const yearFilter = document.getElementById('yearFilter');
        const stateFilter = document.getElementById('stateFilter');
        const roundFilter = document.getElementById('roundFilter');
        const collegeFilter = document.getElementById('collegeFilter');
        const typeFilter = document.getElementById('typeFilter');
        const courseFilter = document.getElementById('courseFilter');
        const quotaFilter = document.getElementById('quotaFilter');
        const categoryFilter = document.getElementById('categoryFilter');

        this.counsellingData.filters = {
            year: yearFilter ? yearFilter.value : '',
            state: stateFilter ? stateFilter.value : '',
            round: roundFilter ? roundFilter.value : '',
            college: collegeFilter ? collegeFilter.value : '',
            type: typeFilter ? typeFilter.value : '',
            course: courseFilter ? courseFilter.value : '',
            quota: quotaFilter ? quotaFilter.value : '',
            category: categoryFilter ? categoryFilter.value : ''
        };

        // Auto-sync filters based on stream and path selection
        this.autoSyncFilters();
    }

    autoSyncFilters() {
        const { selectedStream, selectedPath } = this.counsellingData;
        
        // If both toggles are set to ALL, show all data
        if (selectedStream === 'ALL' && selectedPath === 'ALL') {
            return;
        }

        // Auto-populate filters based on selection
        this.populateFilterOptions(selectedStream, selectedPath);
    }

    async populateFilterOptions(stream, path) {
        try {
            // This would typically call an API to get filtered options
            // For now, we'll simulate the auto-sync behavior
            console.log(`Auto-syncing filters for ${stream} + ${path}`);
            
            // Update filter options based on stream and path
            // This is where you'd implement the actual auto-sync logic
        } catch (error) {
            console.error('Error auto-syncing filters:', error);
        }
    }

    updateCounsellingDisplay() {
        const { selectedStream, selectedPath, filters } = this.counsellingData;
        const waitingMessage = document.getElementById('waitingMessage');
        const resultsGrid = document.getElementById('counsellingResults');
        const pagination = document.getElementById('counsellingPagination');

        // Check if we should show data or waiting message
        const hasToggleSelection = (selectedStream !== 'ALL' || selectedPath !== 'ALL');
        const hasFilters = Object.values(filters).some(value => value !== '');

        if (hasToggleSelection || hasFilters) {
            // Show results
            if (waitingMessage) waitingMessage.style.display = 'none';
            if (resultsGrid) resultsGrid.style.display = 'grid';
            if (pagination) pagination.style.display = 'flex';
            
            // Perform search to get results
            this.performCounsellingSearch();
        } else {
            // Show waiting message
            if (waitingMessage) waitingMessage.style.display = 'block';
            if (resultsGrid) resultsGrid.style.display = 'none';
            if (pagination) pagination.style.display = 'none';
        }
    }

    async performCounsellingSearch() {
        const { selectedStream, selectedPath, filters } = this.counsellingData;
        
        try {
            // Show loading state
            this.showCounsellingLoading();
            
            // Build query parameters
            const params = new URLSearchParams();
            if (selectedStream !== 'ALL') params.append('stream', selectedStream);
            if (selectedPath !== 'ALL') params.append('path', selectedPath);
            
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });
            
            // For now, we'll simulate the search with mock data
            // In a real implementation, this would call your counselling API
            const mockResults = this.generateMockCounsellingResults(selectedStream, selectedPath, filters);
            
            this.counsellingData.results = mockResults;
            this.displayCounsellingResults(mockResults);
            
        } catch (error) {
            console.error('Error performing counselling search:', error);
            this.showCounsellingError('An error occurred while searching for counselling data.');
        } finally {
            this.hideCounsellingLoading();
        }
    }

    generateMockCounsellingResults(stream, path, filters) {
        // Generate mock data based on selections
        const results = [];
        const count = Math.floor(Math.random() * 20) + 5; // 5-25 results
        
        for (let i = 0; i < count; i++) {
            const result = {
                id: i + 1,
                college: `Sample ${stream} College ${i + 1}`,
                course: path === 'UG' ? 'MBBS' : 'MD',
                stream: stream === 'ALL' ? (Math.random() > 0.5 ? 'MEDICAL' : 'DENTAL') : stream,
                path: path === 'ALL' ? (Math.random() > 0.5 ? 'UG' : 'PG') : path,
                year: filters.year || 2024,
                state: filters.state || 'AIQ',
                round: filters.round || 'ROUND_1',
                quota: filters.quota || 'GENERAL',
                category: filters.category || 'OPEN',
                cutoff: Math.floor(Math.random() * 1000) + 100,
                seats: Math.floor(Math.random() * 50) + 5
            };
            results.push(result);
        }
        
        return results;
    }

    displayCounsellingResults(results) {
        const resultsGrid = document.getElementById('counsellingResults');
        const resultCount = document.getElementById('resultCount');
        
        if (!resultsGrid) return;
        
        // Update result count
        if (resultCount) {
            resultCount.textContent = results.length;
        }
        
        // Clear existing results
        resultsGrid.innerHTML = '';
        
        // Generate result cards
        results.forEach(result => {
            const card = this.createCounsellingResultCard(result);
            resultsGrid.appendChild(card);
        });
        
        // Show pagination if needed
        this.updateCounsellingPagination(results.length);
    }

    createCounsellingResultCard(result) {
        const card = document.createElement('div');
        card.className = 'counselling-result-card';
        
        const streamBadgeClass = result.stream === 'MEDICAL' ? 'badge-medical' : 'badge-dental';
        const pathBadgeClass = result.path === 'UG' ? 'badge-ug' : 'badge-pg';
        
        card.innerHTML = `
            <div class="card-header">
                <h4 class="card-title">${result.college}</h4>
                <div class="card-badges">
                    <span class="card-badge ${streamBadgeClass}">${result.stream}</span>
                    <span class="card-badge ${pathBadgeClass}">${result.path}</span>
                </div>
            </div>
            <div class="card-details">
                <div class="detail-item">
                    <span class="detail-label">Course</span>
                    <span class="detail-value">${result.course}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Year</span>
                    <span class="detail-value">${result.year}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">State</span>
                    <span class="detail-value">${result.state}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Round</span>
                    <span class="detail-value">${result.round.replace(/_/g, ' ')}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Quota</span>
                    <span class="detail-value">${result.quota}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Category</span>
                    <span class="detail-value">${result.category}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Cutoff</span>
                    <span class="detail-value">${result.cutoff}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Seats</span>
                    <span class="detail-value">${result.seats}</span>
                </div>
            </div>
            <div class="card-footer">
                <div class="card-actions">
                    <button class="btn btn-sm btn-primary">View Details</button>
                    <button class="btn btn-sm btn-secondary">Compare</button>
                </div>
            </div>
        `;
        
        return card;
    }

    updateCounsellingPagination(totalResults) {
        const pagination = document.getElementById('counsellingPagination');
        if (!pagination) return;
        
        const totalPages = Math.ceil(totalResults / this.counsellingData.itemsPerPage);
        
        if (totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }
        
        pagination.style.display = 'flex';
        pagination.innerHTML = '';
        
        // Previous button
        if (this.counsellingData.currentPage > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'pagination-btn';
            prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
            prevBtn.addEventListener('click', () => this.goToCounsellingPage(this.counsellingData.currentPage - 1));
            pagination.appendChild(prevBtn);
        }
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.counsellingData.currentPage - 2 && i <= this.counsellingData.currentPage + 2)) {
                const pageBtn = document.createElement('button');
                pageBtn.className = `pagination-btn ${i === this.counsellingData.currentPage ? 'active' : ''}`;
                pageBtn.textContent = i;
                pageBtn.addEventListener('click', () => this.goToCounsellingPage(i));
                pagination.appendChild(pageBtn);
            } else if (i === this.counsellingData.currentPage - 3 || i === this.counsellingData.currentPage + 3) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'pagination-ellipsis';
                ellipsis.textContent = '...';
                pagination.appendChild(ellipsis);
            }
        }
        
        // Next button
        if (this.counsellingData.currentPage < totalPages) {
            const nextBtn = document.createElement('button');
            nextBtn.className = 'pagination-btn';
            nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
            nextBtn.addEventListener('click', () => this.goToCounsellingPage(this.counsellingData.currentPage + 1));
            pagination.appendChild(nextBtn);
        }
    }

    goToCounsellingPage(page) {
        this.counsellingData.currentPage = page;
        this.displayCounsellingResults(this.counsellingData.results);
    }

    clearCounsellingFilters() {
        // Reset all filter selects
        const filterSelects = document.querySelectorAll('.filter-select');
        filterSelects.forEach(select => {
            select.value = '';
        });
        
        // Reset toggles to ALL
        this.selectStream('ALL');
        this.selectPath('ALL');
        
        // Clear results
        this.counsellingData.results = [];
        this.counsellingData.currentPage = 1;
        
        // Update display
        this.updateCounsellingDisplay();
    }

    showCounsellingLoading() {
        // Show loading state
        const resultsGrid = document.getElementById('counsellingResults');
        if (resultsGrid) {
            resultsGrid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading counselling data...</p></div>';
        }
    }

    hideCounsellingLoading() {
        // Loading state is handled by displayCounsellingResults
    }

    showCounsellingError(message) {
        const resultsGrid = document.getElementById('counsellingResults');
        if (resultsGrid) {
            resultsGrid.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Error</h4>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, observerOptions);

        // Observe all sections for animation
        document.querySelectorAll('section').forEach(section => {
            observer.observe(section);
        });
    }

    animateHeroStats() {
        const statNumbers = document.querySelectorAll('.stat-number');
        
        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target'));
            const duration = 2000;
            const increment = target / (duration / 16);
            let current = 0;

            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                stat.textContent = this.formatNumber(Math.floor(current));
            }, 16);
        });
    }

    animateChartBars() {
        const bars = document.querySelectorAll('.bar-fill');
        
        setTimeout(() => {
            bars.forEach(bar => {
                const percentage = bar.getAttribute('data-percentage');
                bar.style.transform = `scaleX(${percentage / 100})`;
            });
        }, 1000);
    }

    loadStates() {
        // Common Indian states for the filter
        const states = [
            'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
            'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
            'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
            'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
            'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
            'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir'
        ];

        const stateFilter = document.getElementById('stateFilter');
        states.forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            stateFilter.appendChild(option);
        });
    }

    async loadCoursesByStream(stream) {
        try {
            if (!stream) {
                // If no stream selected, load all courses
                const response = await fetch('/api/courses');
                const courses = await response.json();
                this.populateCourseFilter(courses);
                return;
            }

            // Load courses filtered by stream
            const response = await fetch(`/api/courses?stream=${stream}`);
            const courses = await response.json();
            this.populateCourseFilter(courses);
        } catch (error) {
            console.error('Error loading courses:', error);
            // Fallback to hardcoded courses if API fails
            this.loadFallbackCourses(stream);
        }
    }

    populateCourseFilter(courses) {
        const courseFilter = document.getElementById('courseFilter');
        if (!courseFilter) return;

        // Clear existing options
        courseFilter.innerHTML = '<option value="">All Courses</option>';

        // Add new course options
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.name;
            option.textContent = course.name;
            courseFilter.appendChild(option);
        });
    }

    loadFallbackCourses(stream) {
        const courseFilter = document.getElementById('courseFilter');
        if (!courseFilter) return;

        // Clear existing options
        courseFilter.innerHTML = '<option value="">All Courses</option>';

        // Hardcoded fallback courses based on stream
        const fallbackCourses = {
            medical: [
                'MBBS', 'MD GENERAL MEDICINE', 'MS GENERAL SURGERY', 'MD ANATOMY', 
                'MD BIOCHEMISTRY', 'MD PHYSIOLOGY', 'MD PATHOLOGY', 'MD MICROBIOLOGY',
                'MD PHARMACOLOGY', 'MD FORENSIC MEDICINE', 'MD COMMUNITY MEDICINE',
                'MD DERMATOLOGY', 'MD PSYCHIATRY', 'MD RADIOLOGY', 'MD ANAESTHESIOLOGY'
            ],
            dental: [
                'BDS', 'MDS ORAL MEDICINE', 'MDS ORAL SURGERY', 'MDS CONSERVATIVE DENTISTRY',
                'MDS PERIODONTICS', 'MDS ORTHODONTICS', 'MDS PROSTHODONTICS',
                'MDS PEDODONTICS', 'MDS ORAL PATHOLOGY', 'MDS PUBLIC HEALTH DENTISTRY'
            ],
            dnb: [
                'DNB GENERAL MEDICINE', 'DNB GENERAL SURGERY', 'DNB ANAESTHESIOLOGY',
                'DNB OBSTETRICS & GYNAECOLOGY', 'DNB PEDIATRICS', 'DNB ORTHOPEDICS',
                'DNB RADIOLOGY', 'DNB PATHOLOGY', 'DNB MICROBIOLOGY', 'DNB PSYCHIATRY'
            ]
        };

        const courses = stream ? fallbackCourses[stream] || [] : 
            [...fallbackCourses.medical, ...fallbackCourses.dental, ...fallbackCourses.dnb];

        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course;
            option.textContent = course;
            courseFilter.appendChild(option);
        });
    }

    async performSearch() {
        const query = document.getElementById('searchInput').value.trim();
        if (!query) return;

        this.showLoading(true);
        
        try {
            // Simulate API call - replace with actual backend call
            const results = await this.searchColleges(query);
            this.displayResults(results);
        } catch (error) {
            console.error('Search failed:', error);
            this.showError('Search failed. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    async searchColleges(query) {
        try {
            console.log('🔍 searchColleges called with query:', query);
            console.log('🔍 Current filters:', this.currentFilters);
            
            // Build query parameters
            const params = new URLSearchParams({
                q: query,
                ...this.currentFilters
            });
            
            console.log('🔍 API URL:', `/api/search?${params}`);
            console.log('🔍 Params object:', Object.fromEntries(params));
            
            // Make real API call
            const response = await fetch(`/api/search?${params}`);
            
            console.log('🔍 Response status:', response.status);
            console.log('🔍 Response ok:', response.ok);
            
            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
            }
            
            const results = await response.json();
            console.log('🔍 API response:', results);
            
            if (results.error) {
                throw new Error(results.error);
            }
            
            console.log('🔍 Returning data:', results.data || []);
            return results.data || [];
            
        } catch (error) {
            console.error('Search API error:', error);
            throw error;
        }
    }

    // 🔍 Auto-complete functionality
    async getAutoCompleteSuggestions(query) {
        try {
            if (query.length < 2) {
                this.hideAutocomplete();
                return;
            }
            
            const params = new URLSearchParams();
            params.append('q', query);
            params.append('limit', '8');
            
            if (this.currentFilters.stream) {
                params.append('stream', this.currentFilters.stream);
            }
            
            const response = await fetch(`/api/autocomplete?${params}`);
            const data = await response.json();
            
            if (data.error) {
                console.error('Auto-complete error:', data.error);
                return;
            }
            
            this.displayAutocompleteSuggestions(data.suggestions);
            
        } catch (error) {
            console.error('Auto-complete error:', error);
        }
    }

    displayAutocompleteSuggestions(suggestions) {
        const dropdown = document.getElementById('autocompleteDropdown');
        const list = document.getElementById('autocompleteList');
        
        if (!dropdown || !list) return;
        
        if (suggestions.length === 0) {
            this.hideAutocomplete();
            return;
        }
        
        list.innerHTML = '';
        
        suggestions.forEach((suggestion, index) => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.dataset.index = index;
            
            const iconClass = this.getSuggestionIconClass(suggestion.type);
            const categoryText = this.getSuggestionCategoryText(suggestion.type);
            
            item.innerHTML = `
                <div class="autocomplete-item-icon ${suggestion.type}">
                    <i class="${iconClass}"></i>
                </div>
                <div class="autocomplete-item-content">
                    <div class="autocomplete-item-title">${suggestion.display}</div>
                    <div class="autocomplete-item-subtitle">
                        ${suggestion.state ? suggestion.state : ''} ${suggestion.stream ? `• ${suggestion.stream}` : ''}
                    </div>
                </div>
                <div class="autocomplete-item-category">${categoryText}</div>
            `;
            
            item.addEventListener('click', () => {
                this.selectSuggestion(suggestion);
            });
            
            list.appendChild(item);
        });
        
        this.showAutocomplete();
    }

    getSuggestionIconClass(type) {
        const iconMap = {
            'college': 'fas fa-university',
            'course': 'fas fa-graduation-cap',
            'city': 'fas fa-map-marker-alt',
            'state': 'fas fa-map'
        };
        return iconMap[type] || 'fas fa-search';
    }

    getSuggestionCategoryText(type) {
        const categoryMap = {
            'college': 'College',
            'course': 'Course',
            'city': 'City',
            'state': 'State'
        };
        return categoryMap[type] || 'Other';
    }

    selectSuggestion(suggestion) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = suggestion.value;
            this.hideAutocomplete();
            this.performSearch();
        }
    }

    showAutocomplete() {
        const dropdown = document.getElementById('autocompleteDropdown');
        const searchInput = document.getElementById('searchInput');
        
        if (dropdown && searchInput) {
            // Get the search input position
            const rect = searchInput.getBoundingClientRect();
            
            // Position the dropdown below the search input using fixed positioning
            dropdown.style.position = 'fixed';
            dropdown.style.top = (rect.bottom + 8) + 'px';
            dropdown.style.left = rect.left + 'px';
            dropdown.style.width = rect.width + 'px';
            dropdown.style.display = 'block';
            
            // Ensure it's above everything
            dropdown.style.zIndex = '99999';
        }
    }

    hideAutocomplete() {
        const dropdown = document.getElementById('autocompleteDropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    }

    // 🔄 Reposition auto-complete dropdown
    repositionAutocomplete() {
        const dropdown = document.getElementById('autocompleteDropdown');
        const searchInput = document.getElementById('searchInput');
        
        if (dropdown && searchInput && dropdown.style.display === 'block') {
            const rect = searchInput.getBoundingClientRect();
            
            dropdown.style.top = (rect.bottom + 8) + 'px';
            dropdown.style.left = rect.left + 'px';
            dropdown.style.width = rect.width + 'px';
        }
    }

    // ⌨️ Handle keyboard navigation for auto-complete
    handleKeyboardNavigation(key) {
        const items = document.querySelectorAll('.autocomplete-item');
        const currentSelected = document.querySelector('.autocomplete-item.selected');
        
        if (items.length === 0) return;
        
        let nextIndex = 0;
        
        if (currentSelected) {
            const currentIndex = parseInt(currentSelected.dataset.index);
            if (key === 'ArrowDown') {
                nextIndex = (currentIndex + 1) % items.length;
            } else if (key === 'ArrowUp') {
                nextIndex = (currentIndex - 1 + items.length) % items.length;
            }
            
            // Remove current selection
            currentSelected.classList.remove('selected');
        }
        
        // Add selection to new item
        const nextItem = items[nextIndex];
        if (nextItem) {
            nextItem.classList.add('selected');
            nextItem.scrollIntoView({ block: 'nearest' });
        }
    }

    async loadRealStatistics() {
        try {
            const response = await fetch('/api/stats');
            if (!response.ok) {
                throw new Error('Failed to load statistics');
            }
            
            const stats = await response.json();
            
            // Update the statistics display
            if (stats.total) {
                document.getElementById('totalColleges').textContent = this.formatNumber(stats.total);
            }
            if (stats.totalCourses) {
                document.getElementById('totalCourses').textContent = this.formatNumber(stats.totalCourses);
            }
            if (stats.totalSeats) {
                document.getElementById('totalSeats').textContent = this.formatNumber(stats.totalSeats);
            }
            
            // Update chart bars with real data
            if (stats.byType && stats.byType.length > 0) {
                stats.byType.forEach(typeData => {
                    const percentage = Math.round((typeData.count / stats.total) * 100);
                    const barElement = document.querySelector(`.bar-fill.${typeData.type}`);
                    if (barElement) {
                        barElement.setAttribute('data-percentage', percentage);
                    }
                });
            }
            
        } catch (error) {
            console.error('Failed to load real statistics:', error);
        }
    }

    filterResults(results) {
        // The API already handles filtering, so we just return the results
        // This method is kept for potential client-side filtering in the future
        return results;
    }

    updateFilters() {
        this.currentFilters = {
            stream: document.getElementById('streamFilter').value,
            course: document.getElementById('courseFilter').value,
            state: document.getElementById('stateFilter').value
        };

        // If we have a current search query, perform a new search with updated filters
        const currentQuery = document.getElementById('searchInput').value.trim();
        if (currentQuery && this.searchResults.length > 0) {
            this.performSearch();
        }
    }

    sortResults() {
        const sortBy = document.getElementById('sortBy').value;
        let sorted = [...this.searchResults];

        switch (sortBy) {
            case 'name':
                sorted.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'seats':
                sorted.sort((a, b) => b.seats - a.seats);
                break;
            case 'state':
                sorted.sort((a, b) => a.state.localeCompare(b.state));
                break;
            default: // relevance - keep original order
                break;
        }

        this.displayResults(sorted);
    }

    displayResults(results) {
        console.log('📊 displayResults called with:', results);
        console.log('📊 Results type:', typeof results);
        console.log('📊 Results length:', results ? results.length : 'undefined');
        if (results && results.length > 0) {
            console.log('📊 First result:', results[0]);
        }
        
        this.searchResults = results;
        
        // Get DOM elements
        const searchResults = document.getElementById('searchResults');
        const resultsGrid = document.getElementById('resultsGrid');
        const resultsCount = document.getElementById('resultsCount');
        const pagination = document.getElementById('pagination');
        
        // Check if all required elements exist
        if (!searchResults || !resultsGrid || !resultsCount || !pagination) {
            console.error('❌ Required DOM elements not found:', {
                searchResults: !!searchResults,
                resultsGrid: !!resultsGrid,
                resultsCount: !!resultsCount,
                pagination: !!pagination
            });
            return;
        }

        if (!results || !Array.isArray(results)) {
            console.error('❌ Results is not an array:', results);
            searchResults.style.display = 'block';
            resultsGrid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Invalid results format</h3>
                    <p>Expected array but got: ${typeof results}</p>
                    <pre>${JSON.stringify(results, null, 2)}</pre>
                </div>
            `;
            pagination.innerHTML = '';
            return;
        }

        // Show the search results section
        searchResults.style.display = 'block';
        searchResults.classList.add('show');
        
        // Update results count
        resultsCount.textContent = results.length;

        if (results.length === 0) {
            resultsGrid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>No results found</h3>
                    <p>Try adjusting your search terms or filters</p>
                </div>
            `;
            pagination.innerHTML = '';
            return;
        }

        // Pagination
        const totalPages = Math.ceil(results.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageResults = results.slice(startIndex, endIndex);

        // Display results
        resultsGrid.innerHTML = pageResults.map((result, index) => `
            <div class="result-card" style="animation-delay: ${index * 0.1}s">
                <div class="card-header">
                    <h3>${result.name}</h3>
                    <span class="result-type ${result.type}">${result.type}</span>
                </div>
                

                
                <div class="result-meta">
                    <span class="meta-item">
                        <i class="fas fa-map-marker-alt"></i>
                        ${result.state}
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-chair"></i>
                        ${result.seats} seats
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-book"></i>
                        ${result.course}
                    </span>
                </div>
                
                ${result.counselling_data ? `
                    <div class="counselling-info">
                        <h4><i class="fas fa-calendar-alt"></i> Counselling Schedule</h4>
                        <div class="counselling-timeline">
                            ${this.renderCounsellingTimeline(result.counselling_data)}
                        </div>
                    </div>
                ` : ''}
                
                ${result.quota_details ? `
                    <div class="quota-info">
                        <h4><i class="fas fa-percentage"></i> Quota Details</h4>
                        <div class="quota-breakdown">
                            ${this.renderQuotaBreakdown(result.quota_details)}
                        </div>
                    </div>
                ` : ''}
                
                <div class="card-actions">
                    <button class="btn btn-primary" onclick="console.log('🎯 VIEW DETAILS clicked! College ID:', ${result.id}, 'Course ID:', ${result.course_id || 'N/A'}); collegeDB.viewCollegeDetails(${result.id}, ${result.course_id || result.id})">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    <button class="btn btn-secondary" onclick="collegeDB.trackCollege(${result.id})">
                        <i class="fas fa-heart"></i> Track
                    </button>
                </div>
            </div>
        `).join('');

        // Display pagination
        this.displayPagination(totalPages);
    }

    displayPagination(totalPages) {
        const pagination = document.getElementById('pagination');
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        console.log('🔍 Creating pagination for', totalPages, 'pages, current page:', this.currentPage);

        let paginationHTML = '';

        // Previous button
        paginationHTML += `
            <button class="pagination-btn prev-btn" ${this.currentPage === 1 ? 'disabled' : ''} data-page="${this.currentPage - 1}">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
                paginationHTML += `
                    <button class="pagination-btn page-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}">
                        ${i}
                    </button>
                `;
            } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
                paginationHTML += '<span class="pagination-ellipsis">...</span>';
            }
        }

        // Next button
        paginationHTML += `
            <button class="pagination-btn next-btn" ${this.currentPage === totalPages ? 'disabled' : ''} data-page="${this.currentPage + 1}">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        pagination.innerHTML = paginationHTML;
        
        console.log('🔍 Pagination HTML generated, setting up event listeners...');
        
        // Add event listeners to pagination buttons
        this.setupPaginationEventListeners();
    }

    goToPage(page) {
        console.log('🔄 goToPage called with page:', page);
        console.log('🔍 Current page before update:', this.currentPage);
        
        this.currentPage = page;
        console.log('🔍 Current page after update:', this.currentPage);
        
        this.displayResults(this.searchResults);
        
        // Smooth scroll to results
        const searchSection = document.getElementById('search');
        if (searchSection) {
            searchSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            console.log('❌ Search section not found for scrolling');
        }
    }

    // 🔄 Setup pagination event listeners
    setupPaginationEventListeners() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        console.log('🔍 Setting up pagination event listeners...');

        // Store reference to 'this' for use in event listeners
        const self = this;

        // Previous button
        const prevBtn = pagination.querySelector('.prev-btn');
        if (prevBtn && !prevBtn.disabled) {
            console.log('✅ Previous button found and enabled');
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔄 Previous button clicked, going to page:', self.currentPage - 1);
                self.goToPage(self.currentPage - 1);
            });
        } else {
            console.log('❌ Previous button not found or disabled');
        }

        // Next button
        const nextBtn = pagination.querySelector('.next-btn');
        if (nextBtn && !nextBtn.disabled) {
            console.log('✅ Next button found and enabled');
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔄 Next button clicked, going to page:', self.currentPage + 1);
                self.goToPage(self.currentPage + 1);
            });
        } else {
            console.log('❌ Next button not found or disabled');
        }

        // Page number buttons
        const pageBtns = pagination.querySelectorAll('.page-btn');
        console.log(`🔍 Found ${pageBtns.length} page number buttons`);
        pageBtns.forEach((btn, index) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(btn.dataset.page);
                console.log(`🔄 Page button ${index + 1} clicked, going to page:`, page);
                if (page && page !== self.currentPage) {
                    self.goToPage(page);
                }
            });
        });
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.add('show');
        } else {
            overlay.classList.remove('show');
        }
    }

    showError(message) {
        // Create and show error notification
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    renderCounsellingTimeline(counsellingData) {
        if (!counsellingData) return '';
        
        const timeline = [];
        if (counsellingData.registration_start) {
            timeline.push(`<div class="timeline-item">
                <span class="date">${new Date(counsellingData.registration_start).toLocaleDateString()}</span>
                <span class="event">Registration Opens</span>
            </div>`);
        }
        if (counsellingData.choice_filling_start) {
            timeline.push(`<div class="timeline-item">
                <span class="date">${new Date(counsellingData.choice_filling_start).toLocaleDateString()}</span>
                <span class="event">Choice Filling</span>
            </div>`);
        }
        if (counsellingData.seat_allotment_date) {
            timeline.push(`<div class="timeline-item">
                <span class="date">${new Date(counsellingData.seat_allotment_date).toLocaleDateString()}</span>
                <span class="event">Seat Allotment</span>
            </div>`);
        }
        if (counsellingData.reporting_start_date) {
            timeline.push(`<div class="timeline-item">
                <span class="date">${new Date(counsellingData.reporting_start_date).toLocaleDateString()}</span>
                <span class="event">Reporting Starts</span>
            </div>`);
        }
        
        return timeline.join('');
    }

    renderQuotaBreakdown(quotaDetails) {
        if (!quotaDetails) return '';
        
        const quotas = [];
        if (quotaDetails.general) {
            quotas.push(`<div class="quota-item general">
                <span class="quota-type">General</span>
                <span class="quota-seats">${quotaDetails.general} seats</span>
            </div>`);
        }
        if (quotaDetails.obc) {
            quotas.push(`<div class="quota-item obc">
                <span class="quota-type">OBC</span>
                <span class="quota-seats">${quotaDetails.obc} seats</span>
            </div>`);
        }
        if (quotaDetails.sc) {
            quotas.push(`<div class="quota-item sc">
                <span class="quota-type">SC</span>
                <span class="quota-seats">${quotaDetails.sc} seats</span>
            </div>`);
        }
        if (quotaDetails.st) {
            quotas.push(`<div class="quota-item st">
                <span class="quota-type">ST</span>
                <span class="quota-seats">${quotaDetails.st} seats</span>
            </div>`);
        }
        if (quotaDetails.ews) {
            quotas.push(`<div class="quota-item ews">
                <span class="quota-type">EWS</span>
                <span class="quota-seats">${quotaDetails.ews} seats</span>
            </div>`);
        }
        
        return quotas.join('');
    }

    async viewCollegeDetails(collegeId, courseId) {
        console.log('🔍 viewCollegeDetails called with College ID:', collegeId, 'Course ID:', courseId);
        console.log('🔍 collegeDB object available:', typeof window.collegeDB !== 'undefined');
        console.log('🔍 this object:', this);
        console.log('🔍 window.collegeDB object:', window.collegeDB);
        
        try {
            this.showLoading(true);
            
            console.log('🔍 Making API request to:', `/api/colleges/${collegeId}/courses/${courseId}`);
            
            // Fetch course-specific detailed information
            const response = await fetch(`/api/colleges/${collegeId}/courses/${courseId}`);
            console.log('🔍 API response status:', response.status);
            console.log('🔍 API response ok:', response.ok);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API response not ok:', errorText);
                throw new Error(`Failed to fetch course details: ${response.status} ${response.statusText}`);
            }
            
            const courseInfo = await response.json();
            console.log('✅ Course-specific details fetched:', courseInfo);
            console.log('🔍 courseInfo.categoryBreakdown in viewCollegeDetails:', courseInfo.categoryBreakdown);
            console.log('🔍 courseInfo.categoryBreakdown length in viewCollegeDetails:', courseInfo.categoryBreakdown?.length);
            console.log('🔍 Full API response structure:', JSON.stringify(courseInfo, null, 2));
            console.log('🔍 courseInfo keys:', Object.keys(courseInfo));
            console.log('🔍 courseInfo.hasOwnProperty("categoryBreakdown"):', courseInfo.hasOwnProperty('categoryBreakdown'));
            
            // Show the course-specific details modal
            this.showCourseDetailsModal(courseInfo);
            
        } catch (error) {
            console.error('❌ Error fetching course details:', error);
            this.showNotification('Failed to load course details', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showCourseDetailsModal(courseInfo) {
        // Store course info for filtering FIRST
        this.currentCourseInfo = courseInfo;
        this.currentQuotaFilter = null;
        this.currentYearFilter = null;
        this.currentRoundFilter = null;
        
        // Debug: Log the course info being passed
        console.log('🎯 showCourseDetailsModal - courseInfo:', courseInfo);
        console.log('🎯 showCourseDetailsModal - categoryBreakdown:', courseInfo.categoryBreakdown);
        console.log('🎯 showCourseDetailsModal - categoryBreakdown length:', courseInfo.categoryBreakdown?.length);
        console.log('🎯 showCourseDetailsModal - this.currentCourseInfo after assignment:', this.currentCourseInfo);
        console.log('🎯 showCourseDetailsModal - this.currentCourseInfo.categoryBreakdown after assignment:', this.currentCourseInfo.categoryBreakdown);
        
        // Additional debugging - check if the data is actually there
        if (courseInfo.categoryBreakdown && courseInfo.categoryBreakdown.length > 0) {
            console.log('✅ Category breakdown data found:', courseInfo.categoryBreakdown);
            courseInfo.categoryBreakdown.forEach((category, index) => {
                console.log(`📊 Category ${index}:`, category);
                if (category.new_cutoff_ranks) {
                    console.log(`📊 Category ${index} new_cutoff_ranks:`, category.new_cutoff_ranks);
                }
            });
        } else {
            console.log('❌ No category breakdown data in courseInfo');
            console.log('🔍 Full courseInfo structure:', JSON.stringify(courseInfo, null, 2));
            console.log('🔍 courseInfo.typeof:', typeof courseInfo);
            console.log('🔍 courseInfo.constructor:', courseInfo.constructor.name);
            console.log('🔍 courseInfo.categoryBreakdown type:', typeof courseInfo.categoryBreakdown);
            console.log('🔍 courseInfo.categoryBreakdown constructor:', courseInfo.categoryBreakdown?.constructor?.name);
        }
        
        // Create modal HTML focused on course-specific details
        const modalHTML = `
            <div class="course-details-modal" id="courseDetailsModal">
                <div class="modal-overlay" onclick="collegeDB.closeCourseDetailsModal()"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${courseInfo.course.name}</h2>
                        <p class="course-subtitle">${courseInfo.college.name}</p>
                        <button class="modal-close" onclick="collegeDB.closeCourseDetailsModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="course-overview">
                            <div class="overview-stats">
                                <div class="stat-item">
                                    <span class="stat-number">${courseInfo.course.seats}</span>
                                    <span class="stat-label">Available Seats</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-number">${courseInfo.college.type}</span>
                                    <span class="stat-label">Institution Type</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-number">${courseInfo.college.state}</span>
                                    <span class="stat-label">State</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="college-info-grid">
                            <div class="info-section">
                                <h3><i class="fas fa-university"></i> Institution Details</h3>
                                <div class="info-item">
                                    <span class="label">College Name:</span>
                                    <span class="value">${courseInfo.college.name}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">Type:</span>
                                    <span class="value ${courseInfo.college.type}">${courseInfo.college.type}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">State:</span>
                                    <span class="value">${courseInfo.college.state}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">Management:</span>
                                    <span class="value">${courseInfo.college.management_type || 'Not specified'}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">University:</span>
                                    <span class="value">${courseInfo.college.university || 'Not specified'}</span>
                                </div>
                                ${courseInfo.college.year_established ? `
                                    <div class="info-item">
                                        <span class="label">Established:</span>
                                        <span class="value">${courseInfo.college.year_established}</span>
                                    </div>
                                ` : ''}
                                ${courseInfo.college.address ? `
                                    <div class="info-item">
                                        <span class="label">Address:</span>
                                        <span class="value">${courseInfo.college.address}</span>
                                    </div>
                                ` : ''}
                            </div>
                            
                            <div class="info-section">
                                <h3><i class="fas fa-book"></i> Course Information</h3>
                                <div class="info-item">
                                    <span class="label">Course Name:</span>
                                    <span class="value">${courseInfo.course.name}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">Available Seats:</span>
                                    <span class="value seats">${courseInfo.course.seats}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="info-section cutoff-section">
                            <h3><i class="fas fa-chart-line"></i> Cutoff Ranks & Quota Information</h3>
                            
                            <!-- Cutoff Data Controls -->
                            <div class="cutoff-controls">
                                <div class="control-group">
                                    <label for="quotaToggle">Focus Quota:</label>
                                    <div class="toggle-buttons">
                                        <button class="toggle-btn" data-quota="AIQ" data-action="setQuotaFilter" data-value="AIQ">AIQ</button>
                                        <button class="toggle-btn" data-quota="STATE" data-action="setQuotaFilter" data-value="STATE">STATE</button>
                                    </div>
                                </div>
                                
                                <div class="control-group">
                                    <label for="yearSelect">Focus Year:</label>
                                    <select id="yearSelect" data-action="setYearFilter">
                                        <option value="">All Years</option>
                                        <option value="2024">2024</option>
                                        <option value="2023">2023</option>
                                    </select>
                                </div>
                                
                                <div class="control-group">
                                    <label for="roundSelect">Focus Round:</label>
                                    <select id="roundSelect" data-action="setRoundFilter">
                                        <option value="">All Rounds</option>
                                        <option value="1">Round 1</option>
                                        <option value="2">Round 2</option>
                                        <option value="3">Round 3</option>
                                        <option value="4">Round 4</option>
                                        <option value="5">Round 5</option>
                                        <option value="6">Round 6</option>
                                    </select>
                                </div>
                                
                                <div class="control-group">
                                    <label>Data Source:</label>
                                    <div class="data-source-indicator">
                                        <span class="source-badge legacy">Legacy DB</span>
                                        <span class="source-badge dedicated">Dedicated DB</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Cutoff Data Display -->
                            <div class="cutoff-data-container">
                                <div class="filter-instructions">
                                    <p><i class="fas fa-info-circle"></i> All cutoff data is shown below. Use the filters above to <strong>highlight</strong> specific combinations.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="collegeDB.trackCollege(${courseInfo.college.id})">
                            <i class="fas fa-heart"></i> Track College
                        </button>
                        <button class="btn btn-primary" onclick="collegeDB.closeCourseDetailsModal()">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Apply modal positioning and sizing
        const modal = document.getElementById('courseDetailsModal');
        const modalContent = modal.querySelector('.modal-content');
        const modalOverlay = modal.querySelector('.modal-overlay');
        
        // Force modal positioning with inline styles as backup
        Object.assign(modal.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            zIndex: '10000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
        });
        
        Object.assign(modalContent.style, {
            width: '85%',
            maxWidth: '700px',
            maxHeight: '80vh',
            margin: '0 auto'
        });
        
        // Force a reflow to ensure styles are applied
        modal.offsetHeight;
        
        // Add event listeners for cutoff controls
        this.setupCutoffEventListeners();
        
        // Debug: Log cutoff data
        console.log('🎯 Cutoff data debug:');
        console.log('Current course info:', this.currentCourseInfo);
        console.log('Category breakdown:', courseInfo.categoryBreakdown);
        console.log('Category breakdown length:', courseInfo.categoryBreakdown?.length);
        
        // Debug: Log the computed styles
        console.log('🔍 Modal positioning debug:');
        const computedModal = window.getComputedStyle(modal);
        const computedContent = window.getComputedStyle(modalContent);
        console.log('Computed modal position:', computedModal.position);
        console.log('Computed modal display:', computedModal.display);
        console.log('Computed modal width:', computedModal.width);
        console.log('Computed modal height:', computedModal.height);
        console.log('Computed content width:', computedContent.width);
        console.log('Computed content maxWidth:', computedContent.maxWidth);
        
        modal.classList.add('show');
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    closeCourseDetailsModal() {
        const modal = document.getElementById('courseDetailsModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
                document.body.style.overflow = '';
            }, 300);
        }
    }

    renderCutoffInfo(cutoffRanks) {
        if (!cutoffRanks) return '<p>No cutoff information available</p>';
        
        const categories = Object.keys(cutoffRanks);
        if (categories.length === 0) return '<p>No cutoff information available</p>';
        
        return categories.map(category => {
            const rank = cutoffRanks[category];
            if (rank === null || rank === undefined) return '';
            
            return `
                <div class="cutoff-item">
                    <span class="category">${category.toUpperCase()}</span>
                    <span class="rank">${rank}</span>
                </div>
            `;
        }).join('');
    }

    renderFeesInfo(feesStructure) {
        if (!feesStructure) return '<p>No fee information available</p>';
        
        const feeTypes = Object.keys(feesStructure);
        if (feeTypes.length === 0) return '<p>No fee information available</p>';
        
        return feeTypes.map(feeType => {
            const amount = feesStructure[feeType];
            if (amount === null || amount === undefined) return '';
            
            return `
                <div class="fee-item">
                    <span class="fee-type">${feeType.replace(/_/g, ' ').toUpperCase()}</span>
                    <span class="amount">₹${amount || 'Not specified'}</span>
                </div>
            `;
        }).join('');
    }

    renderQuotaSummary(quotaDetails) {
        if (!quotaDetails) return 'Not specified';
        
        const categories = Object.keys(quotaDetails);
        if (categories.length === 0) return 'Not specified';
        
        const availableCategories = categories.filter(cat => 
            quotaDetails[cat] !== null && quotaDetails[cat] !== undefined
        );
        
        if (availableCategories.length === 0) return 'Not specified';
        
        return availableCategories.map(cat => cat.toUpperCase()).join(', ');
    }

    renderCutoffSummary(cutoffRanks) {
        if (!cutoffRanks) return 'Not specified';
        
        const categories = Object.keys(cutoffRanks);
        if (categories.length === 0) return 'Not specified';
        
        const availableCategories = categories.filter(cat => 
            cutoffRanks[cat] !== null && cutoffRanks[cat] !== undefined
        );
        
        if (availableCategories.length === 0) return 'Not specified';
        
        return availableCategories.map(cat => 
            `${cat.toUpperCase()}: ${cutoffRanks[cat]}`
        ).join(', ');
    }

    renderFeesSummary(feesStructure) {
        if (!feesStructure) return 'Not specified';
        
        const feeTypes = Object.keys(feesStructure);
        if (feeTypes.length === 0) return 'Not specified';
        
        const availableFees = feeTypes.filter(feeType => 
            feesStructure[feeType] !== null && feesStructure[feeType] !== undefined
        );
        
        if (availableFees.length === 0) return 'Not specified';
        
        return availableFees.map(feeType => 
            `${feeType.replace(/_/g, ' ').toUpperCase()}: ₹${feesStructure[feeType]}`
        ).join(', ');
    }

    trackCollege(collegeId) {
        // Add to user's tracked colleges
        const tracked = JSON.parse(localStorage.getItem('trackedColleges') || '[]');
        if (!tracked.includes(collegeId)) {
            tracked.push(collegeId);
            localStorage.setItem('trackedColleges', JSON.stringify(tracked));
            this.showNotification('College added to tracking list!', 'success');
        } else {
            this.showNotification('College already in tracking list!', 'info');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    isMainPage() {
        const isMain = window.location.pathname === '/' || window.location.pathname === '/index.html';
        console.log('🔍 isMainPage() called, pathname:', window.location.pathname, 'result:', isMain);
        return isMain;
    }

    isCounsellingPage() {
        const isCounselling = window.location.pathname === '/counselling.html';
        console.log('🔍 isCounsellingPage() called, pathname:', window.location.pathname, 'result:', isCounselling);
        return isCounselling;
    }

    // ===== CUTOFF RANKS FILTERING METHODS =====
    
    setupCutoffEventListeners() {
        console.log('🎯 Setting up cutoff event listeners...');
        console.log('🔍 this context in setupCutoffEventListeners:', this);
        console.log('🔍 this.currentCourseInfo in setupCutoffEventListeners:', this.currentCourseInfo);
        
        // Quota toggle buttons
        document.querySelectorAll('.toggle-btn[data-action="setQuotaFilter"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const quotaType = btn.dataset.value;
                console.log('🔍 Quota button clicked:', quotaType);
                console.log('🔍 this context in quota click:', this);
                this.setQuotaFilter(quotaType);
            });
        });
        
        // Year dropdown
        const yearSelect = document.getElementById('yearSelect');
        if (yearSelect) {
            yearSelect.addEventListener('change', (e) => {
                console.log('🔍 Year select changed:', e.target.value);
                console.log('🔍 this context in year change:', this);
                this.setYearFilter(e.target.value);
            });
        }
        
        // Round dropdown
        const roundSelect = document.getElementById('roundSelect');
        if (roundSelect) {
            roundSelect.addEventListener('change', (e) => {
                console.log('🔍 Round select changed:', e.target.value);
                console.log('🔍 this context in round change:', this);
                this.setRoundFilter(e.target.value);
            });
        }
        
        console.log('✅ Cutoff event listeners set up successfully');
    }
    
    setQuotaFilter(quotaType) {
        console.log('🎯 Setting quota filter:', quotaType);
        
        // Update active state of toggle buttons
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.quota === quotaType) {
                btn.classList.add('active');
            }
        });
        
        // Store current filter
        this.currentQuotaFilter = quotaType;
        
        // Re-render cutoff data with new filter
        this.refreshCutoffData();
    }
    
    setRoundFilter(roundNumber) {
        console.log('🎯 Setting round filter:', roundNumber);
        
        // Store current filter
        this.currentRoundFilter = roundNumber;
        
        // Re-render cutoff data with new filter
        this.refreshCutoffData();
    }
    
    setYearFilter(year) {
        console.log('🎯 Setting year filter:', year);
        
        // Store current filter
        this.currentYearFilter = year;
        
        // Re-render cutoff data with new filter
        this.refreshCutoffData();
    }
    
    refreshCutoffData() {
        const container = document.querySelector('.cutoff-data-container');
        console.log('🔄 Refreshing cutoff data...');
        console.log('🔍 Container found:', !!container);
        console.log('🔍 this.currentCourseInfo exists:', !!this.currentCourseInfo);
        console.log('🔍 this.currentCourseInfo:', this.currentCourseInfo);
        
        if (container && this.currentCourseInfo) {
            console.log('🔍 Category breakdown in refresh:', this.currentCourseInfo.categoryBreakdown);
            console.log('🔍 Category breakdown length in refresh:', this.currentCourseInfo.categoryBreakdown?.length);
            
                    // Always show data, filters are for organization
        console.log('🔍 Rendering all available cutoff data');
        const result = this.renderCutoffData(this.currentCourseInfo.categoryBreakdown);
        console.log('🔍 Result from renderCutoffData:', result);
        container.innerHTML = result;
        } else {
            console.log('❌ Cannot refresh: container or courseInfo missing', {
                container: !!container,
                courseInfo: !!this.currentCourseInfo
            });
        }
    }
    
    renderCutoffData(categoryBreakdown) {
        console.log('🎯 renderCutoffData called with:', categoryBreakdown);
        
        if (!categoryBreakdown || categoryBreakdown.length === 0) {
            console.log('❌ No category breakdown data');
            return '<p class="no-data">No cutoff information available for this course.</p>';
        }
        
        // Check if all filters are selected
        if (!this.currentQuotaFilter || !this.currentYearFilter || !this.currentRoundFilter) {
            console.log('🔍 Filters not selected, showing instructions');
            return `
                <div class="filter-instructions">
                    <p><i class="fas fa-info-circle"></i> Please select <strong>Quota Type</strong>, <strong>Year</strong>, and <strong>Round</strong> to view cutoff data.</p>
                </div>
            `;
        }
        
        // Show all data, filters are for organization
        console.log('🔍 Rendering all available data with filter highlights');
        
        const html = `
            <div class="cutoff-data-grid">
                ${categoryBreakdown.map(category => this.renderCategoryCard(category)).join('')}
            </div>
        `;
        
        console.log('✅ Generated HTML:', html);
        return html;
    }
    
    applyCutoffFilters(categoryBreakdown) {
        console.log('🔍 applyCutoffFilters called with:', categoryBreakdown);
        console.log('🔍 Current filters:', {
            quota: this.currentQuotaFilter,
            year: this.currentYearFilter,
            round: this.currentRoundFilter
        });
        
        let filtered = [...categoryBreakdown];
        
        // Require all three filters to be selected
        if (!this.currentQuotaFilter || !this.currentYearFilter || !this.currentRoundFilter) {
            console.log('❌ Not all filters selected, returning empty array');
            return []; // Return empty array if any filter is missing
        }
        
        // Apply quota filter
        console.log('🔍 Filtering by quota type:', this.currentQuotaFilter);
        console.log('🔍 Available counselling types in data:', [...new Set(categoryBreakdown.flatMap(cat => cat.new_cutoff_ranks?.map(r => r.counselling_type) || []))]);
        
        filtered = filtered.filter(category => {
            if (category.new_cutoff_ranks) {
                const hasQuota = category.new_cutoff_ranks.some(record => {
                    console.log(`🔍 Checking record counselling_type: ${record.counselling_type} against filter: ${this.currentQuotaFilter}`);
                    
                    // Map filter values to counselling types
                    let matches = false;
                    if (this.currentQuotaFilter === 'STATE') {
                        // STATE filter should match KEA (Karnataka Examinations Authority)
                        matches = record.counselling_type === 'KEA';
                    } else if (this.currentQuotaFilter === 'AIQ') {
                        // AIQ filter should match AIQ (All India Quota)
                        matches = record.counselling_type === 'AIQ';
                    }
                    
                    console.log(`🔍 Record ${record.counselling_type} matches filter ${this.currentQuotaFilter}:`, matches);
                    return matches;
                });
                console.log(`🔍 Category ${category.category} has quota ${this.currentQuotaFilter}:`, hasQuota);
                return hasQuota;
            }
            return false; // Only show data from cutoff database
        });
        console.log('🔍 After quota filter:', filtered);
        
        // Apply year filter
        console.log('🔍 Filtering by year:', this.currentYearFilter);
        filtered = filtered.filter(category => {
            if (category.new_cutoff_ranks) {
                const hasYear = category.new_cutoff_ranks.some(record => {
                    console.log(`🔍 Checking record counselling_year: ${record.counselling_year} against filter: ${this.currentYearFilter}`);
                    return record.counselling_year.toString() === this.currentYearFilter;
                });
                console.log(`🔍 Category ${category.category} has year ${this.currentYearFilter}:`, hasYear);
                return hasYear;
            }
            return false;
        });
        console.log('🔍 After year filter:', filtered);
        
        // Apply round filter
        console.log('🔍 Filtering by round:', this.currentRoundFilter);
        filtered = filtered.filter(category => {
            if (category.new_cutoff_ranks) {
                const hasRound = category.new_cutoff_ranks.some(record => {
                    console.log(`🔍 Checking record round_number: ${record.round_number} against filter: ${this.currentRoundFilter}`);
                    return record.round_number.toString() === this.currentRoundFilter;
                });
                console.log(`🔍 Category ${category.category} has round ${this.currentRoundFilter}:`, hasRound);
                return hasRound;
            }
            return false;
        });
        console.log('🔍 Final filtered result:', filtered);
        
        return filtered;
    }
    
    isRecordHighlighted(record) {
        // Check if this record matches the current filter combination
        if (!this.currentQuotaFilter || !this.currentYearFilter || !this.currentRoundFilter) {
            return false; // No filters selected, no highlighting
        }
        
        let matchesQuota = false;
        if (this.currentQuotaFilter === 'STATE') {
            matchesQuota = record.counselling_type === 'KEA';
        } else if (this.currentQuotaFilter === 'AIQ') {
            matchesQuota = record.counselling_type === 'AIQ';
        }
        
        const matchesYear = record.counselling_year.toString() === this.currentYearFilter;
        const matchesRound = record.round_number.toString() === this.currentRoundFilter;
        
        return matchesQuota && matchesYear && matchesRound;
    }
    
    renderCategoryCard(category) {
        console.log('🎯 renderCategoryCard called with:', category);
        
        if (!category.new_cutoff_ranks || category.new_cutoff_ranks.length === 0) {
            return `
                <div class="category-card">
                    <div class="category-header">
                        <h4>${category.category}</h4>
                    </div>
                    <div class="category-details">
                        <p class="no-data">No cutoff data available for this category.</p>
                    </div>
                </div>
            `;
        }
        
        // Show all data with filter highlights
        const cutoffDataHtml = category.new_cutoff_ranks.map(record => {
            // Check if this record matches current filters for highlighting
            const isHighlighted = this.isRecordHighlighted(record);
            
            return `
                <div class="data-source dedicated ${isHighlighted ? 'highlighted' : ''}">
                    <span class="source-label">Cutoff Data:</span>
                    <div class="cutoff-details">
                        <span class="counselling-type ${isHighlighted ? 'highlight' : ''}">${record.counselling_type}</span>
                        <span class="year ${isHighlighted ? 'highlight' : ''}">${record.counselling_year}</span>
                        <span class="round ${isHighlighted ? 'highlight' : ''}">${record.round_name}</span>
                        <span class="cutoff-rank ${isHighlighted ? 'highlight' : ''}">Rank: ${record.cutoff_rank}</span>
                        ${record.cutoff_percentile ? `<span class="percentile ${isHighlighted ? 'highlight' : ''}">${record.cutoff_percentile}%</span>` : ''}
                        <span class="seats ${isHighlighted ? 'highlight' : ''}">Seats: ${record.seats_available}</span>
                        ${record.fees_amount ? `<span class="fees ${isHighlighted ? 'highlight' : ''}">₹${record.fees_amount}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        // Get the best cutoff rank for the header (lowest rank = best)
        const bestRecord = category.new_cutoff_ranks.reduce((best, current) => 
            current.cutoff_rank < best.cutoff_rank ? current : best
        );
        
        const html = `
            <div class="category-card">
                <div class="category-header">
                    <h4>${category.category}</h4>
                    <span class="cutoff-value">${bestRecord.cutoff_rank}</span>
                </div>
                <div class="category-details">
                    ${cutoffDataHtml}
                </div>
            </div>
        `;
        
        console.log('✅ Category card HTML:', html);
        return html;
    }
    
    renderNewCutoffData(cutoffRanks) {
        // Apply filters to new cutoff data
        let filteredRanks = [...cutoffRanks];
        
        // Require all three filters to be selected
        if (!this.currentQuotaFilter || !this.currentYearFilter || !this.currentRoundFilter) {
            return '';
        }
        
        filteredRanks = filteredRanks.filter(record => 
            record.counselling_type === this.currentQuotaFilter
        );
        
        filteredRanks = filteredRanks.filter(record => 
            record.counselling_year.toString() === this.currentYearFilter
        );
        
        filteredRanks = filteredRanks.filter(record => 
            record.round_number.toString() === this.currentRoundFilter
        );
        
        if (filteredRanks.length === 0) {
            return '';
        }
        
        return filteredRanks.map(record => `
            <div class="data-source dedicated">
                <span class="source-label">Cutoff Data:</span>
                <div class="cutoff-details">
                    <span class="counselling-type">${record.counselling_type}</span>
                    <span class="year">${record.counselling_year}</span>
                    <span class="round">${record.round_name}</span>
                    <span class="cutoff-rank">Rank: ${record.cutoff_rank}</span>
                    ${record.cutoff_percentile ? `<span class="percentile">${record.cutoff_percentile}%</span>` : ''}
                    <span class="seats">Seats: ${record.seats_available}</span>
                    ${record.fees_amount ? `<span class="fees">₹${record.fees_amount}</span>` : ''}
                </div>
            </div>
        `).join('');
    }
    
    // ===== END CUTOFF RANKS FILTERING METHODS =====
}

// Test function for View Details functionality
window.testViewDetails = async () => {
    console.log('🧪 Testing View Details functionality...');
    
    if (typeof window.collegeDB === 'undefined') {
        console.error('❌ collegeDB object not found!');
        alert('❌ collegeDB object not found! Check console for errors.');
        return;
    }
    
    try {
        console.log('🧪 Testing with course-specific endpoint...');
        // Test with a specific course (M.B.B.S. at A J Institute)
        await window.collegeDB.viewCollegeDetails(267, 2901); // College ID 267, Course ID 2901 (M.B.B.S.)
    } catch (error) {
        console.error('❌ Error in test:', error);
        alert('❌ Error testing view details: ' + error.message);
    }
};

// Test function for Counselling functionality
window.testCounsellingFunctionality = () => {
    console.log('🧪 Testing Counselling functionality...');
    
    if (typeof window.collegeDB === 'undefined') {
        console.error('❌ collegeDB object not found!');
        alert('❌ collegeDB object not found! Check console for errors.');
        return;
    }
    
    try {
        console.log('🧪 Testing counselling toggles and filters...');
        
        // Test stream selection
        const streamToggles = document.querySelectorAll('[data-stream]');
        console.log('📊 Stream toggles found:', streamToggles.length);
        
        // Test path selection
        const pathToggles = document.querySelectorAll('[data-path]');
        console.log('📊 Path toggles found:', pathToggles.length);
        
        // Test filters
        const filters = document.querySelectorAll('.filter-select');
        console.log('📊 Filters found:', filters.length);
        
        // Test if counselling section is initialized
        if (window.collegeDB.counsellingData) {
            console.log('✅ Counselling data object exists:', window.collegeDB.counsellingData);
        } else {
            console.error('❌ Counselling data object not found!');
        }
        
        alert(`✅ Counselling test completed!\n\nFound:\n- ${streamToggles.length} stream toggles\n- ${pathToggles.length} path toggles\n- ${filters.length} filters\n\nCheck console for detailed information.`);
        
    } catch (error) {
        console.error('❌ Error in counselling test:', error);
        alert('❌ Error testing counselling functionality: ' + error.message);
    }
};

// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM Content Loaded - Starting initialization...');
    
    try {
        // Check if CollegeDatabase class exists
        if (typeof CollegeDatabase === 'undefined') {
            console.error('❌ CollegeDatabase class not found!');
            alert('❌ CollegeDatabase class not found! Check console for errors.');
            return;
        }
        
        console.log('✅ CollegeDatabase class found, creating instance...');
        
        // Initialize the application
        window.collegeDB = new CollegeDatabase();
        
        // Ensure the object is accessible globally
        if (typeof window.collegeDB === 'undefined') {
            console.error('❌ collegeDB object not properly initialized!');
            alert('❌ collegeDB object not properly initialized!');
        } else {
            console.log('✅ collegeDB object initialized successfully:', window.collegeDB);
        }
    } catch (error) {
        console.error('❌ Error during initialization:', error);
        alert('❌ Error during initialization: ' + error.message);
        return;
    }

    // Add smooth scrolling to all internal links (only on main page)
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        console.log('📄 On main page, setting up main page features...');
        
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Add scroll effect to navbar
        window.addEventListener('scroll', () => {
            const navbar = document.querySelector('.navbar');
            if (navbar) {
                if (window.scrollY > 100) {
                    navbar.style.background = 'rgba(255, 255, 255, 0.98)';
                    navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
                } else {
                    navbar.style.background = 'rgba(255, 255, 255, 0.95)';
                    navbar.style.boxShadow = 'none';
                }
            }
        });

        // Add parallax effect to hero section
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const hero = document.querySelector('.hero');
            if (hero) {
                const rate = scrolled * -0.5;
                hero.style.transform = `translateY(${rate}px)`;
            }
        });

        // Animate elements on scroll
        const animateOnScroll = () => {
            const elements = document.querySelectorAll('.stat-card, .feature, .result-card');
            
            elements.forEach(element => {
                const elementTop = element.getBoundingClientRect().top;
                const elementVisible = 150;
                
                if (elementTop < window.innerHeight - elementVisible) {
                    element.classList.add('fade-in');
                }
            });
        };

        window.addEventListener('scroll', animateOnScroll);
        animateOnScroll(); // Initial check
    } else if (window.location.pathname === '/counselling.html') {
        console.log('📄 On counselling page, counselling features should be initialized by CollegeDatabase class...');
    }
    
    console.log('✅ Initialization complete!');
});

// Simple test function to verify JavaScript is working
window.testBasicJS = () => {
    console.log('🧪 Basic JavaScript test function called!');
    alert('✅ Basic JavaScript is working! Check console for details.');
    
    // Test basic DOM functionality
    const body = document.body;
    console.log('📄 Body element:', body);
    console.log('📄 Current URL:', window.location.href);
    console.log('📄 Page title:', document.title);
    
    // Test if CollegeDatabase class exists
    if (typeof CollegeDatabase === 'undefined') {
        console.error('❌ CollegeDatabase class not found!');
        alert('❌ CollegeDatabase class not found!');
    } else {
        console.log('✅ CollegeDatabase class found!');
        alert('✅ CollegeDatabase class found!');
    }
    
    // Test if collegeDB object exists
    if (typeof window.collegeDB === 'undefined') {
        console.error('❌ collegeDB object not found!');
        alert('❌ collegeDB object not found!');
    } else {
        console.log('✅ collegeDB object found:', window.collegeDB);
        alert('✅ collegeDB object found!');
    }
};

// Add CSS for error notification
const style = document.createElement('style');
style.textContent = `
    .error-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 3000;
        animation: slideInRight 0.3s ease;
    }

    .error-notification i {
        font-size: 18px;
    }

    .no-results {
        grid-column: 1 / -1;
        text-align: center;
        padding: 60px 20px;
        color: var(--gray-500);
    }

    .no-results i {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.5;
    }

    .no-results h3 {
        margin-bottom: 8px;
        color: var(--gray-600);
    }

    .pagination-ellipsis {
        padding: 8px 16px;
        color: var(--gray-500);
    }

    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
