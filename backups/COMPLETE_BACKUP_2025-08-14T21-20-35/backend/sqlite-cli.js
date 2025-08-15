#!/usr/bin/env node

const SQLiteSearchEngine = require('./sqlite-search');
const readline = require('readline');

class SQLiteCLI {
  constructor() {
    this.searchEngine = new SQLiteSearchEngine();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async start() {
    try {
      console.log('🏥 College Database SQLite CLI');
      console.log('================================');
      console.log('Type "help" for available commands');
      console.log('Type "exit" to quit\n');

      await this.searchEngine.initialize();
      console.log('✅ Database initialized successfully\n');

      this.showPrompt();
      
    } catch (error) {
      console.error('❌ Failed to initialize:', error.message);
      process.exit(1);
    }
  }

  showPrompt() {
    this.rl.question('college-db> ', async (input) => {
      const command = input.trim().toLowerCase();
      
      if (command === 'exit' || command === 'quit') {
        console.log('👋 Goodbye!');
        this.searchEngine.close();
        this.rl.close();
        process.exit(0);
      }
      
      await this.processCommand(input);
      this.showPrompt();
    });
  }

  async processCommand(input) {
    const parts = input.trim().split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    try {
      switch (command) {
        case 'help':
          this.showHelp();
          break;
          
        case 'search':
          await this.handleSearch(args);
          break;
          
        case 'stats':
          await this.handleStats();
          break;
          
        case 'college':
          await this.handleGetCollege(args);
          break;
          
        case 'type':
          await this.handleGetByType(args);
          break;
          
        case 'state':
          await this.handleGetByState(args);
          break;
          
        case 'course':
          await this.handleGetByCourse(args);
          break;
          
        case 'seats':
          await this.handleGetBySeats(args);
          break;
          
        case 'random':
          await this.handleRandom(args);
          break;
          
        case 'top':
          await this.handleTop(args);
          break;
          
        case 'advanced':
          await this.handleAdvancedSearch(args);
          break;
          
        case 'clear':
          console.clear();
          break;
          
        default:
          if (input.trim()) {
            // Default to search if no command specified
            await this.handleSearch([input.trim()]);
          }
          break;
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }

  showHelp() {
    console.log('\n📚 Available Commands:');
    console.log('======================');
    console.log('search <query> [type] [state] - Search colleges');
    console.log('stats                          - Show database statistics');
    console.log('college <id>                  - Get college by ID');
    console.log('type <type>                   - Get colleges by type (medical/dental/dnb)');
    console.log('state <state>                 - Get colleges by state');
    console.log('course <course>               - Get colleges by course');
    console.log('seats <min> [max]             - Get colleges by seat range');
    console.log('random [count]                - Get random colleges');
    console.log('top [count]                   - Get top colleges by seats');
    console.log('advanced <filters>            - Advanced search with filters');
    console.log('clear                          - Clear screen');
    console.log('help                           - Show this help');
    console.log('exit                           - Exit CLI\n');
  }

  async handleSearch(args) {
    if (args.length === 0) {
      console.log('❌ Please provide a search query');
      return;
    }

    const query = args[0];
    const type = args[1] || null;
    const state = args[2] || null;

    console.log(`🔍 Searching for: "${query}"${type ? ` (Type: ${type})` : ''}${state ? ` (State: ${state})` : ''}`);
    
    const result = await this.searchEngine.search(query, { type, state, limit: 20 });
    
    if (result.error) {
      console.log(`❌ Search failed: ${result.error}`);
      return;
    }

    this.displaySearchResults(result);
  }

  async handleStats() {
    console.log('📊 Getting database statistics...');
    
    const stats = await this.searchEngine.getStats();
    
    if (stats.error) {
      console.log(`❌ Failed to get stats: ${stats.error}`);
      return;
    }

    console.log('\n📈 Database Statistics');
    console.log('=====================');
    console.log(`Total Colleges: ${stats.total.toLocaleString()}`);
    console.log(`Total Seats: ${stats.totalSeats.toLocaleString()}`);
    
    if (stats.byType && stats.byType.length > 0) {
      console.log('\nBy Type:');
      stats.byType.forEach(type => {
        console.log(`  ${type.type}: ${type.count.toLocaleString()}`);
      });
    }
    
    if (stats.byState && stats.byState.length > 0) {
      console.log('\nTop States:');
      stats.byState.slice(0, 5).forEach(state => {
        console.log(`  ${state.state}: ${state.count.toLocaleString()}`);
      });
    }
    
    console.log(`\nTimestamp: ${stats.timestamp}\n`);
  }

  async handleGetCollege(args) {
    if (args.length === 0) {
      console.log('❌ Please provide a college ID');
      return;
    }

    const id = parseInt(args[0]);
    if (isNaN(id)) {
      console.log('❌ Invalid college ID');
      return;
    }

    console.log(`🏫 Getting college with ID: ${id}`);
    
    const college = await this.searchEngine.getCollegeById(id);
    
    if (!college) {
      console.log('❌ College not found');
      return;
    }

    this.displayCollege(college);
  }

  async handleGetByType(args) {
    if (args.length === 0) {
      console.log('❌ Please provide a type (medical/dental/dnb)');
      return;
    }

    const type = args[0];
    const limit = args[1] ? parseInt(args[1]) : 10;

    console.log(`🏥 Getting ${type} colleges (limit: ${limit})`);
    
    const colleges = await this.searchEngine.getCollegesByType(type, limit);
    
    if (colleges.length === 0) {
      console.log('❌ No colleges found for this type');
      return;
    }

    this.displayCollegesList(colleges, `Colleges (${type})`);
  }

  async handleGetByState(args) {
    if (args.length === 0) {
      console.log('❌ Please provide a state name');
      return;
    }

    const state = args.join(' ');
    const limit = 10;

    console.log(`🗺️  Getting colleges in ${state} (limit: ${limit})`);
    
    const colleges = await this.searchEngine.getCollegesByState(state, limit);
    
    if (colleges.length === 0) {
      console.log('❌ No colleges found in this state');
      return;
    }

    this.displayCollegesList(colleges, `Colleges in ${state}`);
  }

  async handleGetByCourse(args) {
    if (args.length === 0) {
      console.log('❌ Please provide a course name');
      return;
    }

    const course = args.join(' ');
    const limit = 10;

    console.log(`📚 Getting colleges offering ${course} (limit: ${limit})`);
    
    const colleges = await this.searchEngine.getCollegesByCourse(course, limit);
    
    if (colleges.length === 0) {
      console.log('❌ No colleges found for this course');
      return;
    }

    this.displayCollegesList(colleges, `Colleges offering ${course}`);
  }

  async handleGetBySeats(args) {
    if (args.length === 0) {
      console.log('❌ Please provide minimum seats');
      return;
    }

    const minSeats = parseInt(args[0]);
    const maxSeats = args[1] ? parseInt(args[1]) : null;
    const limit = 10;

    if (isNaN(minSeats)) {
      console.log('❌ Invalid seat number');
      return;
    }

    const range = maxSeats ? `${minSeats}-${maxSeats}` : `${minSeats}+`;
    console.log(`💺 Getting colleges with ${range} seats (limit: ${limit})`);
    
    const colleges = await this.searchEngine.getCollegesBySeats(minSeats, maxSeats, limit);
    
    if (colleges.length === 0) {
      console.log('❌ No colleges found for this seat range');
      return;
    }

    this.displayCollegesList(colleges, `Colleges with ${range} seats`);
  }

  async handleRandom(args) {
    const limit = args[0] ? parseInt(args[0]) : 5;

    if (isNaN(limit)) {
      console.log('❌ Invalid count');
      return;
    }

    console.log(`🎲 Getting ${limit} random colleges`);
    
    const colleges = await this.searchEngine.getRandomColleges(limit);
    
    if (colleges.length === 0) {
      console.log('❌ No colleges found');
      return;
    }

    this.displayCollegesList(colleges, `Random Colleges (${limit})`);
  }

  async handleTop(args) {
    const limit = args[0] ? parseInt(args[0]) : 10;

    if (isNaN(limit)) {
      console.log('❌ Invalid count');
      return;
    }

    console.log(`🏆 Getting top ${limit} colleges by seats`);
    
    const colleges = await this.searchEngine.getTopColleges(limit);
    
    if (colleges.length === 0) {
      console.log('❌ No colleges found');
      return;
    }

    this.displayCollegesList(colleges, `Top Colleges by Seats (${limit})`);
  }

  async handleAdvancedSearch(args) {
    if (args.length === 0) {
      console.log('❌ Please provide search criteria');
      console.log('Example: advanced query="AIIMS" type=medical state="Delhi"');
      return;
    }

    const filters = {};
    for (const arg of args) {
      const [key, value] = arg.split('=');
      if (key && value) {
        filters[key] = value.replace(/"/g, '');
      }
    }

    console.log('🔍 Advanced search with filters:', filters);
    
    const result = await this.searchEngine.searchAdvanced(filters);
    
    if (result.error) {
      console.log(`❌ Advanced search failed: ${result.error}`);
      return;
    }

    this.displaySearchResults(result);
  }

  displaySearchResults(result) {
    console.log(`\n🔍 Search Results for "${result.query}"`);
    console.log('=====================================');
    console.log(`Found: ${result.total} colleges`);
    
    if (result.filters.type || result.filters.state) {
      const filters = [];
      if (result.filters.type) filters.push(`Type: ${result.filters.type}`);
      if (result.filters.state) filters.push(`State: ${result.filters.state}`);
      console.log(`Filters: ${filters.join(', ')}`);
    }
    
    if (result.data.length === 0) {
      console.log('❌ No results found');
      return;
    }

    result.data.slice(0, 10).forEach((college, index) => {
      console.log(`\n${index + 1}. ${college.name}`);
      console.log(`   Course: ${college.course}`);
      console.log(`   State: ${college.state} | Type: ${college.type} | Seats: ${college.seats}`);
      if (college.address) {
        console.log(`   Address: ${college.address}`);
      }
    });

    if (result.data.length > 10) {
      console.log(`\n... and ${result.data.length - 10} more results`);
    }
    
    console.log(`\nTimestamp: ${result.timestamp}\n`);
  }

  displayCollegesList(colleges, title) {
    console.log(`\n${title}`);
    console.log('='.repeat(title.length));
    
    colleges.forEach((college, index) => {
      console.log(`\n${index + 1}. ${college.name}`);
      console.log(`   Course: ${college.course}`);
      console.log(`   State: ${college.state} | Type: ${college.type} | Seats: ${college.seats}`);
      if (college.address) {
        console.log(`   Address: ${college.address}`);
      }
    });
    
    console.log(`\nTotal: ${colleges.length} colleges\n`);
  }

  displayCollege(college) {
    console.log('\n🏫 College Details');
    console.log('==================');
    console.log(`ID: ${college.id}`);
    console.log(`Name: ${college.name}`);
    console.log(`Course: ${college.course}`);
    console.log(`State: ${college.state}`);
    console.log(`Type: ${college.type}`);
    console.log(`Seats: ${college.seats}`);
    
    if (college.address) console.log(`Address: ${college.address}`);
    if (college.year_established) console.log(`Established: ${college.year_established}`);
    if (college.management_type) console.log(`Management: ${college.management_type}`);
    if (college.university) console.log(`University: ${college.university}`);
    
    console.log(`Created: ${college.created_at}`);
    console.log(`Updated: ${college.updated_at}\n`);
  }
}

// Run CLI if called directly
if (require.main === module) {
  const cli = new SQLiteCLI();
  cli.start().catch(error => {
    console.error('❌ CLI failed to start:', error);
    process.exit(1);
  });
}

module.exports = SQLiteCLI;
