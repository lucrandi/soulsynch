// Initialize Supabase
const supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

let currentUser = null;

// Page management
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

function showError(elementId, message) {
    const el = document.getElementById(elementId);
    el.innerHTML = `<div class="error">${message}</div>`;
    setTimeout(() => el.innerHTML = '', 5000);
}

function showSuccess(elementId, message) {
    const el = document.getElementById(elementId);
    el.innerHTML = `<div class="success">${message}</div>`;
}

// Check authentication status
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        currentUser = session.user;
        await checkProfile();
    } else {
        showPage('loginPage');
    }
}

// Check if user has a profile
async function checkProfile() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

    if (error || !data) {
        showPage('profilePage');
    } else {
        document.getElementById('userEmail').textContent = currentUser.email;
        document.getElementById('creditsDisplay').textContent = data.credits_balance || 5;
        showPage('dashboardPage');
    }
}

// Google Sign In
async function signInWithGoogle() {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: CONFIG.APP_URL
            }
        });

        if (error) throw error;
    } catch (error) {
        console.error('Google sign in error:', error);
        showError('errorMessage', 'Failed to sign in with Google. Please try again.');
    }
}

// Facebook Sign In
async function signInWithFacebook() {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'facebook',
            options: {
                redirectTo: CONFIG.APP_URL
            }
        });

        if (error) throw error;
    } catch (error) {
        console.error('Facebook sign in error:', error);
        showError('errorMessage', 'Failed to sign in with Facebook. Please try again.');
    }
}

// Save user profile
async function saveProfile() {
    const displayName = document.getElementById('displayName').value;
    const ageRange = document.getElementById('ageRange').value;
    const city = document.getElementById('city').value;
    const bio = document.getElementById('bio').value;

    if (!displayName || !city) {
        showError('profileError', 'Please fill in all required fields');
        return;
    }

    try {
        const { error } = await supabase
            .from('profiles')
            .insert({
                id: currentUser.id,
                display_name: displayName,
                age_range: ageRange,
                city: city,
                bio: bio,
                login_method: currentUser.app_metadata.provider,
                credits_balance: 5
            });

        if (error) throw error;

        showSuccess('profileError', '✓ Profile created!');
        setTimeout(() => checkProfile(), 1000);
    } catch (error) {
        console.error('Profile save error:', error);
        showError('profileError', 'Failed to save profile. Please try again.');
    }
}

// Sign out
async function signOut() {
    await supabase.auth.signOut();
    currentUser = null;
    showPage('loginPage');
}

// Auth state listener
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        currentUser = session.user;
        checkProfile();
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        showPage('loginPage');
    }
});

// Initialize on load
window.addEventListener('load', () => {
    checkAuth();
});