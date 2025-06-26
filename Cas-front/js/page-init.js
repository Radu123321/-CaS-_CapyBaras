// Global variables for page managers
let bookingWizard = null;
let calendar = null;
let ordersManager = null;
let equipmentManager = null;
let locationsManager = null;
let dashboard = null;
let appointments = null;

// Get the global auth manager instance
function getAuthManager() {
    return window.authManager;
}

// Utility function to show loading state
function showPageLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('visible');
    }
}

// Utility function to hide loading state
function hidePageLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('visible');
    }
}

// Book Service Page Initialization
async function initBookServicePage() {
    console.log('🚀 Initializing Book Service page');
    showPageLoading();

    try {
        // Get auth manager instance
        const authManager = getAuthManager();
        
        // Check authentication
        if (!authManager.requireAuth()) {
            console.log('❌ Authentication required');
            return;
        }

        // Initialize booking wizard
        if (!bookingWizard) {
            bookingWizard = new BookingWizard();
            await bookingWizard.init();
        }

        console.log('✅ Book Service page initialized');
    } catch (error) {
        console.error('❌ Error initializing Book Service page:', error);
    } finally {
        hidePageLoading();
    }
}

// Login Page Initialization
function initLoginPage() {
    console.log('🚀 Initializing Login page');
    
    try {
        // Get auth manager instance
        const authManager = getAuthManager();
        
        // If already authenticated, redirect to dashboard
        if (authManager.isAuthenticated()) {
            window.location.href = 'dashboard.html';
            return;
        }

        console.log('✅ Login page initialized');
    } catch (error) {
        console.error('❌ Error initializing Login page:', error);
    }
}

// Register Page Initialization
function initRegisterPage() {
    console.log('🚀 Initializing Register page');
    
    try {
        // Get auth manager instance
        const authManager = getAuthManager();
        
        // If already authenticated, redirect to dashboard
        if (authManager.isAuthenticated()) {
            window.location.href = 'dashboard.html';
            return;
        }

        console.log('✅ Register page initialized');
    } catch (error) {
        console.error('❌ Error initializing Register page:', error);
    }
}

// Calendar Page Initialization
async function initCalendarPage() {
    console.log('🚀 Initializing Calendar page');
    showPageLoading();

    try {
        // Get auth manager instance
        const authManager = getAuthManager();
        
        // Check authentication
        if (!authManager.requireAuth()) {
            console.log('❌ Authentication required');
            return;
        }

        // Initialize calendar
        if (!calendar) {
            calendar = new Calendar();
            await calendar.init();
        }

        console.log('✅ Calendar page initialized');
    } catch (error) {
        console.error('❌ Error initializing Calendar page:', error);
    } finally {
        hidePageLoading();
    }
}

// Index Page Initialization
function initIndexPage() {
    console.log('🚀 Initializing Index page');
    
    try {
        // Get auth manager instance
        const authManager = getAuthManager();
        
        // Redirect based on auth status
        if (authManager.isAuthenticated()) {
            window.location.href = 'dashboard.html';
        } else {
            window.location.href = 'login.html';
        }

        console.log('✅ Index page initialized');
    } catch (error) {
        console.error('❌ Error initializing Index page:', error);
    }
}

// Orders Page Initialization
async function initOrdersPage() {
    console.log('🚀 Initializing Orders page');
    showPageLoading();

    try {
        // Get auth manager instance
        const authManager = getAuthManager();
        
        // Check authentication
        if (!authManager.requireAuth()) {
            console.log('❌ Authentication required');
            return;
        }

        // Initialize orders manager
        if (!ordersManager) {
            ordersManager = new OrdersManager();
            await ordersManager.init();
        }

        console.log('✅ Orders page initialized');
    } catch (error) {
        console.error('❌ Error initializing Orders page:', error);
    } finally {
        hidePageLoading();
    }
}

// Equipment Page Initialization
async function initEquipmentPage() {
    console.log('🚀 Initializing Equipment page');
    showPageLoading();

    try {
        // Get auth manager instance
        const authManager = getAuthManager();
        
        // Check authentication
        if (!authManager.requireAuth()) {
            console.log('❌ Authentication required');
            return;
        }

        // Initialize equipment manager
        if (!equipmentManager) {
            equipmentManager = new EquipmentManager();
            await equipmentManager.init();
        }

        console.log('✅ Equipment page initialized');
    } catch (error) {
        console.error('❌ Error initializing Equipment page:', error);
    } finally {
        hidePageLoading();
    }
}

// Locations Page Initialization
async function initLocationsPage() {
    console.log('🚀 Initializing Locations page');
    showPageLoading();

    try {
        // Get auth manager instance
        const authManager = getAuthManager();
        
        // Check authentication
        if (!authManager.requireAuth()) {
            console.log('❌ Authentication required');
            return;
        }

        // Initialize locations manager
        if (!locationsManager) {
            locationsManager = new LocationsManager();
            await locationsManager.init();
        }

        console.log('✅ Locations page initialized');
    } catch (error) {
        console.error('❌ Error initializing Locations page:', error);
    } finally {
        hidePageLoading();
    }
}

// MultiWash Page Initialization
function initMultiWashPage() {
    console.log('🚀 Initializing MultiWash page');
    
    try {
        // Get auth manager instance
        const authManager = getAuthManager();
        
        // No authentication required for this page
        console.log('✅ MultiWash page initialized');
    } catch (error) {
        console.error('❌ Error initializing MultiWash page:', error);
    }
}

// Dashboard Page Initialization
async function initDashboardPage() {
    console.log('🚀 Initializing Dashboard page');
    showPageLoading();

    try {
        // Get auth manager instance
        const authManager = getAuthManager();
        
        // Check authentication
        if (!authManager.requireAuth()) {
            console.log('❌ Authentication required');
            return;
        }

        // Initialize dashboard
        if (!dashboard) {
            dashboard = new Dashboard();
            await dashboard.init();
        }

        console.log('✅ Dashboard page initialized');
    } catch (error) {
        console.error('❌ Error initializing Dashboard page:', error);
    } finally {
        hidePageLoading();
    }
}

// Appointments Page Initialization
async function initAppointmentsPage() {
    console.log('🚀 Initializing Appointments page');
    showPageLoading();

    try {
        // Get auth manager instance
        const authManager = getAuthManager();
        
        // Check authentication
        if (!authManager.requireAuth()) {
            console.log('❌ Authentication required');
            return;
        }

        // Initialize appointments
        if (!appointments) {
            appointments = new Appointments();
            await appointments.init();
        }

        console.log('✅ Appointments page initialized');
    } catch (error) {
        console.error('❌ Error initializing Appointments page:', error);
    } finally {
        hidePageLoading();
    }
}

// Initialize based on current page
document.addEventListener('DOMContentLoaded', async function() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    try {
        switch(currentPage) {
            case 'book-service.html':
                await initBookServicePage();
                break;
            case 'login.html':
                initLoginPage();
                break;
            case 'register.html':
                initRegisterPage();
                break;
            case 'calendar.html':
                await initCalendarPage();
                break;
            case 'index.html':
            case '':
                initIndexPage();
                break;
            case 'orders.html':
                await initOrdersPage();
                break;
            case 'equipment.html':
                await initEquipmentPage();
                break;
            case 'locations.html':
                await initLocationsPage();
                break;
            case 'multiwash.html':
                initMultiWashPage();
                break;
            case 'dashboard.html':
                await initDashboardPage();
                break;
            case 'appointments.html':
                await initAppointmentsPage();
                break;
            default:
                console.warn('❓ Unknown page:', currentPage);
        }
    } catch (error) {
        console.error('❌ Error during page initialization:', error);
        hidePageLoading();
    }
}); 