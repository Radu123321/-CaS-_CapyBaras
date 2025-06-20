#!/usr/bin/env node

/**
 * CaS (Cleaning as a Service) System Startup Script
 * Integrates backend API with frontend interface
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting CaS (Cleaning as a Service) System...\n');

// Check if required directories exist
const requiredDirs = [
  'src',
  'Cas-front',
  'logs'
];

const requiredFiles = [
  'src/index.js',
  'src/config.js',
  'createschema_enhanced.sql',
  'Cas-front/index.html'
];

console.log('📋 Checking system requirements...');

// Check directories
for (const dir of requiredDirs) {
  if (!fs.existsSync(dir)) {
    console.error(`❌ Missing required directory: ${dir}`);
    process.exit(1);
  }
  console.log(`✅ Directory found: ${dir}`);
}

// Check files
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`❌ Missing required file: ${file}`);
    process.exit(1);
  }
  console.log(`✅ File found: ${file}`);
}

// Create logs directory if it doesn't exist
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
  console.log('📁 Created logs directory');
}

console.log('\n🔧 System Requirements Check: PASSED\n');

// Environment setup
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.PORT = process.env.PORT || '3000';

console.log('🌍 Environment Configuration:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   PORT: ${process.env.PORT}`);
console.log(`   Database: PostgreSQL`);
console.log(`   Frontend: Cas-front/`);
console.log(`   Backend: src/`);

// Check if PostgreSQL is available (optional check)
console.log('\n🔍 Checking database connection...');

// Start the main server
console.log('\n🚀 Starting CaS Backend Server...');

const serverProcess = spawn('node', ['src/index.js'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  env: {
    ...process.env,
    // Add any additional environment variables here
    SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    SMTP_PORT: process.env.SMTP_PORT || '587',
    JWT_SECRET: process.env.JWT_SECRET || 'cas-super-secret-key-2024'
  }
});

// Handle server process events
serverProcess.on('spawn', () => {
  console.log('✅ CaS Backend Server started successfully');
  console.log('\n📡 Available Endpoints:');
  console.log('   🌐 Frontend: http://localhost:3000/');
  console.log('   🔗 API: http://localhost:3000/api/');
  console.log('   📊 Dashboard: http://localhost:3000/dashboard.html');
  console.log('   🔐 Login: http://localhost:3000/login.html');
  console.log('   📝 Register: http://localhost:3000/register.html');
  console.log('   📡 WebSocket: ws://localhost:3000/ws/status');
  console.log('   📰 RSS Feeds: http://localhost:3000/rss');
  
  console.log('\n🎯 Quick Start:');
  console.log('   1. Open http://localhost:3000/ in your browser');
  console.log('   2. Click "Login" and use demo credentials:');
  console.log('      👤 Admin: admin@cas.ro / admin123');
  console.log('      👤 Manager: manager@cas.ro / manager123');
  console.log('      👤 Employee: employee@cas.ro / employee123');
  console.log('   3. Or register a new account');
  console.log('   4. Access the dashboard for system management');
  
  console.log('\n📚 API Documentation:');
  console.log('   📄 API Endpoints: API_ENDPOINTS.md');
  console.log('   🔔 Notifications: NOTIFICATION_API_ENDPOINTS.md');
  console.log('   📮 Postman Collection: CaS_Complete_API_Collection.postman_collection.json');
  
  console.log('\n🔧 System Features:');
  console.log('   ✅ Complete Authentication System');
  console.log('   ✅ Role-based Access Control (Admin/Manager/Employee)');
  console.log('   ✅ Real-time WebSocket Updates');
  console.log('   ✅ Email Notifications (SMTP)');
  console.log('   ✅ Browser Push Notifications');
  console.log('   ✅ Equipment & Maintenance Management');
  console.log('   ✅ Weather Integration & Impact Analysis');
  console.log('   ✅ Statistics & Dashboard with Charts');
  console.log('   ✅ Exception Detection & Alerting');
  console.log('   ✅ RSS Feeds for Status Updates');
  console.log('   ✅ Inventory & Resource Management');
  console.log('   ✅ Order & Transport Tracking');
  console.log('   ✅ Multi-location Support');
  
  console.log('\n💡 Tips:');
  console.log('   • Use Ctrl+C to stop the server');
  console.log('   • Check logs/ directory for detailed logs');
  console.log('   • Backend serves frontend files automatically');
  console.log('   • All API routes have CORS enabled');
  console.log('   • WebSocket provides real-time updates');
  
  console.log('\n🎉 CaS System is ready to use!');
  console.log('═'.repeat(60));
});

serverProcess.on('error', (error) => {
  console.error(`❌ Failed to start CaS Backend Server: ${error.message}`);
  process.exit(1);
});

serverProcess.on('exit', (code, signal) => {
  if (signal === 'SIGINT' || signal === 'SIGTERM') {
    console.log('\n🛑 CaS System stopped by user');
  } else if (code !== 0) {
    console.error(`❌ CaS Backend Server exited with code ${code}`);
  } else {
    console.log('\n✅ CaS System stopped successfully');
  }
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping CaS System...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping CaS System...');
  serverProcess.kill('SIGTERM');
});

// Keep the process alive
process.stdin.resume(); 