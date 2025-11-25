const defaultConfig = {
    company_name: "Nexzen Property Solutions INC.",
    tagline: "Professional Property Management in Florida",
    hero_title: "Your Trusted Property Management Partner",
    hero_subtitle: "Licensed in Florida • In-house technicians • 24/7 emergency response",
    services_title: "Our Premium Services",
    contact_title: "Get in Touch",
    footer_text: "© 2024 Nexzen Property Solutions INC. All rights reserved.",
    background_color: "#f9fafb",
    surface_color: "#ffffff",
    text_color: "#111827",
    primary_action_color: "#0ea5e9",
    secondary_action_color: "#14b8a6",
    font_family: "Inter",
    font_size: 16
};

let currentRecordCount = 0;
let allRecords = [];
let baseCustomerCount = 2215;
let currentCustomerCount = baseCustomerCount;

const dataHandler = {
    onDataChanged(data) {
        allRecords = data || [];
        currentRecordCount = allRecords.length;

        const contacts = allRecords.filter(r => r.type === 'contact');
        const customerRecords = allRecords.filter(r => r.type === 'customer_count');

        // Update customer counter - every visit counts
        const newCount = baseCustomerCount + customerRecords.length;
        if (newCount > currentCustomerCount) {
            currentCustomerCount = newCount;
            animateCounter();
        } else {
            currentCustomerCount = newCount;
            updateCounterDisplay();
        }

        renderSubmissions(contacts);
    }
};

// Initialize customer counter tracker
async function initCustomerCounter() {
    if (!window.dataSdk) return;

    const result = await window.dataSdk.init(dataHandler);
    if (!result.isOk) {
        console.error("Failed to initialize Data SDK");
        return;
    }

    // NOTE: visitor record creation moved to visitor_counter.js to avoid double-posting.
}

function animateCounter() {
    const counterElement = document.getElementById('customer-counter');
    if (!counterElement) return;

    const start = Math.max(baseCustomerCount, currentCustomerCount - 1);
    const end = currentCustomerCount;
    const duration = 1500;
    const startTime = performance.now();

    // Add pulsing animation effect
    counterElement.style.transform = 'scale(1.15)';
    counterElement.style.transition = 'transform 0.3s ease';
    counterElement.style.color = '#14B8A6';

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (end - start) * easeProgress);
        counterElement.textContent = current.toLocaleString() + '+';

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            counterElement.textContent = end.toLocaleString() + '+';
            // Reset scale after animation
            setTimeout(() => {
                counterElement.style.transform = 'scale(1)';
                counterElement.style.color = '';
            }, 300);
        }
    }

    requestAnimationFrame(update);
}

function updateCounterDisplay() {
    const counterElement = document.getElementById('customer-counter');
    if (!counterElement) return;
    counterElement.textContent = currentCustomerCount.toLocaleString() + '+';
}

initCustomerCounter();

function renderSubmissions(submissions) {
    const container = document.getElementById('submissions-list');
    const emptyState = document.getElementById('submissions-empty');
    if (!container || !emptyState) return;

    if (!submissions || submissions.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    const sorted = [...submissions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    container.innerHTML = sorted.map(sub => `
      <div class="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover-lift">
        <div class="flex justify-between items-start mb-4">
          <div>
            <div class="font-bold text-xl text-gray-900">${sub.name || 'No name'}</div>
            <div class="text-sm text-gray-500">${new Date(sub.createdAt).toLocaleString()}</div>
          </div>
          <button onclick="deleteRecord(event, '${sub.__backendId}')" class="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition font-semibold">Delete</button>
        </div>
        <div class="grid md:grid-cols-2 gap-4 text-sm">
          <div><span class="font-semibold text-gray-700">Email:</span> <span class="text-gray-600">${sub.email || '-'}</span></div>
          <div><span class="font-semibold text-gray-700">Phone:</span> <span class="text-gray-600">${sub.phone || '-'}</span></div>
          <div class="md:col-span-2"><span class="font-semibold text-gray-700">Service:</span> <span class="text-gray-600">${sub.service || '-'}</span></div>
          <div class="md:col-span-2"><span class="font-semibold text-gray-700">Message:</span> <span class="text-gray-600">${sub.message || '-'}</span></div>
        </div>
      </div>
    `).join('');
}

async function deleteRecord(evt, backendId) {
    evt = evt || window.event;
    const record = allRecords.find(r => r.__backendId === backendId);
    if (!record) return;

    const btn = (evt && (evt.currentTarget || evt.target)) || null;
    const originalText = btn ? btn.textContent : 'Delete';
    if (btn) {
        btn.textContent = 'Deleting...';
        btn.disabled = true;
    }

    try {
        const result = await window.dataSdk.delete(record);

        if (!result || !result.isOk) {
            if (btn) {
                btn.textContent = originalText;
                btn.disabled = false;
            }
            showStatus('form-status', 'Failed to delete record', 'error');
            return;
        }

        // remove record locally and re-render
        allRecords = allRecords.filter(r => r.__backendId !== backendId);
        dataHandler.onDataChanged(allRecords);
        showStatus('form-status', 'Record deleted', 'success');
    } catch (err) {
        if (btn) {
            btn.textContent = originalText;
            btn.disabled = false;
        }
        showStatus('form-status', 'Failed to delete record', 'error');
    }
}

// Safe event listener attachments
const contactFormEl = document.getElementById('contact-form');
if (contactFormEl) {
    contactFormEl.addEventListener('submit', async function (e) {
        e.preventDefault();

        if (currentRecordCount >= 999) {
            showStatus('form-status', 'Maximum limit reached. Please contact administrator.', 'error');
            return;
        }

        const submitBtn = document.getElementById('submit-btn');
        const originalText = submitBtn ? submitBtn.textContent : 'Sending...';
        if (submitBtn) {
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
        }

        const formData = {
            type: 'contact',
            id: Date.now().toString(),
            name: (document.getElementById('form-name') && document.getElementById('form-name').value) || '',
            email: (document.getElementById('form-email') && document.getElementById('form-email').value) || '',
            phone: (document.getElementById('form-phone') && document.getElementById('form-phone').value) || '',
            service: (document.getElementById('form-service') && document.getElementById('form-service').value) || '',
            message: (document.getElementById('form-message') && document.getElementById('form-message').value) || '',
            createdAt: new Date().toISOString()
        };

        const result = await window.dataSdk.create(formData);

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }

        if (result && result.isOk) {
            showStatus('form-status', 'Message sent! We\'ll respond within 24 hours.', 'success');
            document.getElementById('contact-form').reset();
        } else {
            showStatus('form-status', 'Failed to send message. Please try again.', 'error');
        }
    });
}

function showStatus(elementId, message, type) {
    const statusEl = document.getElementById(elementId);
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = `text-center font-semibold ${type === 'success' ? 'text-green-600' : 'text-red-600'}`;
    setTimeout(() => {
        statusEl.textContent = '';
    }, 5000);
}

const checkZipBtn = document.getElementById('check-zip-btn');
if (checkZipBtn) {
    checkZipBtn.addEventListener('click', function (e) {
        e.preventDefault();
        const zip = document.getElementById('zip-input') ? document.getElementById('zip-input').value.trim() : '';
        const resultEl = document.getElementById('zip-result');
        if (!resultEl) return;

        if (zip.length !== 5 || isNaN(zip)) {
            resultEl.innerHTML = '<div class="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg"><strong>Invalid ZIP code.</strong> Please enter a valid 5-digit ZIP code.</div>';
            return;
        }

        const zipNum = parseInt(zip);
        const inRange = (zipNum >= 32000 && zipNum <= 34999);

        if (inRange) {
            resultEl.innerHTML = '<div class="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg"><strong>✓ Great news!</strong> We serve your area. Contact us to get started today.</div>';
        } else {
            resultEl.innerHTML = '<div class="p-4 bg-gray-50 border-l-4 border-gray-400 text-gray-700 rounded-lg">This ZIP code may be outside our current service area. Contact us to confirm availability.</div>';
        }
    });
}

const mobileMenuBtn = document.getElementById('mobile-menu-btn');
if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', function () {
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) mobileMenu.classList.toggle('hidden');
    });
}

// Portal modal controls
const loginNavBtn = document.getElementById('login-nav-btn');
if (loginNavBtn) loginNavBtn.addEventListener('click', openLoginModal);

const loginMobileBtn = document.getElementById('login-mobile-btn');
if (loginMobileBtn) loginMobileBtn.addEventListener('click', function () {
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) mobileMenu.classList.add('hidden');
    openLoginModal();
});

function openLoginModal() {
    const modal = document.getElementById('login-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    showClientLogin(); // default to client tab
}

function closeLoginModal() {
    const modal = document.getElementById('login-modal');
    if (!modal) return;
    modal.classList.add('hidden');
}

function showClientLogin() {
    document.getElementById('client-login-container')?.classList.remove('hidden');
    document.getElementById('technician-login-container')?.classList.add('hidden');
    document.getElementById('client-signup-container')?.classList.add('hidden');
    document.getElementById('technician-signup-container')?.classList.add('hidden');
    
    document.getElementById('client-tab')?.classList.add('text-sky-600', 'border-sky-600');
    document.getElementById('client-tab')?.classList.remove('text-gray-400');
    document.getElementById('technician-tab')?.classList.remove('text-sky-600', 'border-sky-600');
    document.getElementById('technician-tab')?.classList.add('text-gray-400');
}

function showTechnicianLogin() {
    document.getElementById('client-login-container')?.classList.add('hidden');
    document.getElementById('technician-login-container')?.classList.remove('hidden');
    document.getElementById('client-signup-container')?.classList.add('hidden');
    document.getElementById('technician-signup-container')?.classList.add('hidden');
    
    document.getElementById('technician-tab')?.classList.add('text-sky-600', 'border-sky-600');
    document.getElementById('technician-tab')?.classList.remove('text-gray-400');
    document.getElementById('client-tab')?.classList.remove('text-sky-600', 'border-sky-600');
    document.getElementById('client-tab')?.classList.add('text-gray-400');
}

function showClientSignup() {
    document.getElementById('client-login-container')?.classList.add('hidden');
    document.getElementById('client-signup-container')?.classList.remove('hidden');
}

function showTechnicianSignup() {
    document.getElementById('technician-login-container')?.classList.add('hidden');
    document.getElementById('technician-signup-container')?.classList.remove('hidden');
}

// Client login handler
const clientLoginForm = document.getElementById('client-login-form');
if (clientLoginForm) {
    clientLoginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const email = document.getElementById('client-email')?.value || '';
        const password = document.getElementById('client-password')?.value || '';
        const btn = document.getElementById('client-submit-btn');
        const originalText = btn?.textContent || 'Logging in...';

        if (btn) {
            btn.textContent = 'Logging in...';
            btn.disabled = true;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        const user = allRecords.find(r => r.type === 'client' && r.email === email && r.password === password);

        if (btn) {
            btn.disabled = false;
            btn.textContent = originalText;
        }

        if (user) {
            showStatus('client-status', 'Login successful! Welcome back, ' + (user.firstName || '') + '!', 'success');
            setTimeout(() => {
                closeLoginModal();
                clientLoginForm.reset();
            }, 1500);
        } else {
            showStatus('client-status', 'Invalid email or password.', 'error');
        }
    });
}

// Technician login handler
const technicianLoginForm = document.getElementById('technician-login-form');
if (technicianLoginForm) {
    technicianLoginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const email = document.getElementById('technician-email')?.value || '';
        const password = document.getElementById('technician-password')?.value || '';
        const btn = document.getElementById('technician-submit-btn');
        const originalText = btn?.textContent || 'Logging in...';

        if (btn) {
            btn.textContent = 'Logging in...';
            btn.disabled = true;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        const technician = allRecords.find(r => r.type === 'technician' && r.email === email && r.password === password);

        if (btn) {
            btn.disabled = false;
            btn.textContent = originalText;
        }

        if (technician) {
            showStatus('technician-status', 'Login successful! Welcome, ' + (technician.company || '') + '!', 'success');
            setTimeout(() => {
                closeLoginModal();
                technicianLoginForm.reset();
            }, 1500);
        } else {
            showStatus('technician-status', 'Invalid technician credentials.', 'error');
        }
    });
}

// Client signup handler
const clientSignupForm = document.getElementById('client-signup-form');
if (clientSignupForm) {
    clientSignupForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        if (currentRecordCount >= 999) {
            showStatus('signup-status', 'Maximum accounts reached.', 'error');
            return;
        }

        const email = document.getElementById('signup-email')?.value || '';
        const existing = allRecords.find(r => r.type === 'client' && r.email === email);
        if (existing) {
            showStatus('signup-status', 'Email already registered.', 'error');
            return;
        }

        const btn = document.getElementById('signup-submit-btn');
        const originalText = btn?.textContent || 'Creating...';

        if (btn) {
            btn.textContent = 'Creating...';
            btn.disabled = true;
        }

        const userData = {
            type: 'client',
            id: Date.now().toString(),
            firstName: document.getElementById('signup-firstname')?.value || '',
            lastName: document.getElementById('signup-lastname')?.value || '',
            email: email,
            phone: document.getElementById('signup-phone')?.value || '',
            propertyAddress: document.getElementById('signup-address')?.value || '',
            password: document.getElementById('signup-password')?.value || '',
            createdAt: new Date().toISOString()
        };

        const result = await window.dataSdk.create(userData);

        if (btn) {
            btn.disabled = false;
            btn.textContent = originalText;
        }

        if (result && result.isOk) {
            showStatus('signup-status', 'Account created! You can now login.', 'success');
            clientSignupForm.reset();
            setTimeout(() => showClientLogin(), 2000);
        } else {
            showStatus('signup-status', 'Failed to create account.', 'error');
        }
    });
}

// Technician signup handler
const technicianSignupForm = document.getElementById('technician-signup-form');
if (technicianSignupForm) {
    technicianSignupForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const btn = document.getElementById('technician-signup-btn');
        const originalText = btn?.textContent || 'Submitting...';

        if (btn) {
            btn.textContent = 'Submitting...';
            btn.disabled = true;
        }

        const technicianData = {
            type: 'technician',
            id: Date.now().toString(),
            company: document.getElementById('technician-company')?.value || '',
            email: document.getElementById('technician-signup-email')?.value || '',
            phone: document.getElementById('technician-phone')?.value || '',
            services: document.getElementById('technician-services')?.value || '',
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        const result = await window.dataSdk.create(technicianData);

        if (btn) {
            btn.disabled = false;
            btn.textContent = originalText;
        }

        if (result && result.isOk) {
            showStatus('technician-signup-status', 'Request submitted! We\'ll review and contact you.', 'success');
            technicianSignupForm.reset();
            setTimeout(() => showTechnicianLogin(), 2500);
        } else {
            showStatus('technician-signup-status', 'Failed to submit request.', 'error');
        }
    });
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-8 right-8 bg-gray-900 text-white px-6 py-4 rounded-xl shadow-2xl z-50 max-w-sm';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

async function onConfigChange(config) {
    const customFont = config.font_family || defaultConfig.font_family;
    const baseFontStack = 'Inter, system-ui, -apple-system, sans-serif';
    const baseSize = config.font_size || defaultConfig.font_size;

    document.body.style.fontFamily = `${customFont}, ${baseFontStack}`;

    document.querySelectorAll('h1').forEach(el => el.style.fontSize = `${baseSize * 3}px`);
    document.querySelectorAll('h2').forEach(el => el.style.fontSize = `${baseSize * 2.5}px`);
    document.querySelectorAll('h3').forEach(el => el.style.fontSize = `${baseSize * 1.5}px`);

    const bgColor = config.background_color || defaultConfig.background_color;
    const surfaceColor = config.surface_color || defaultConfig.surface_color;
    const textColor = config.text_color || defaultConfig.text_color;

    document.body.style.backgroundColor = bgColor;
    document.querySelectorAll('.bg-white').forEach(el => el.style.backgroundColor = surfaceColor);
    document.querySelectorAll('.text-gray-900').forEach(el => el.style.color = textColor);

    document.getElementById('nav-company-name').textContent = config.company_name || defaultConfig.company_name;
    document.getElementById('nav-tagline').textContent = config.tagline || defaultConfig.tagline;
    document.getElementById('hero-title').textContent = config.hero_title || defaultConfig.hero_title;
    document.getElementById('hero-subtitle').textContent = config.hero_subtitle || defaultConfig.hero_subtitle;
    document.getElementById('services-title').textContent = config.services_title || defaultConfig.services_title;
    document.getElementById('contact-title').textContent = config.contact_title || defaultConfig.contact_title;
    document.getElementById('footer-text').textContent = config.footer_text || defaultConfig.footer_text;
}

if (window.elementSdk) {
    window.elementSdk.init({
        defaultConfig,
        onConfigChange,
        mapToCapabilities: (config) => ({
            recolorables: [
                {
                    get: () => config.background_color || defaultConfig.background_color,
                    set: (value) => {
                        window.elementSdk.config.background_color = value;
                        window.elementSdk.setConfig({ background_color: value });
                    }
                },
                {
                    get: () => config.surface_color || defaultConfig.surface_color,
                    set: (value) => {
                        window.elementSdk.config.surface_color = value;
                        window.elementSdk.setConfig({ surface_color: value });
                    }
                },
                {
                    get: () => config.text_color || defaultConfig.text_color,
                    set: (value) => {
                        window.elementSdk.config.text_color = value;
                        window.elementSdk.setConfig({ text_color: value });
                    }
                },
                {
                    get: () => config.primary_action_color || defaultConfig.primary_action_color,
                    set: (value) => {
                        window.elementSdk.config.primary_action_color = value;
                        window.elementSdk.setConfig({ primary_action_color: value });
                    }
                },
                {
                    get: () => config.secondary_action_color || defaultConfig.secondary_action_color,
                    set: (value) => {
                        window.elementSdk.config.secondary_action_color = value;
                        window.elementSdk.setConfig({ secondary_action_color: value });
                    }
                }
            ],
            borderables: [],
            fontEditable: {
                get: () => config.font_family || defaultConfig.font_family,
                set: (value) => {
                    window.elementSdk.config.font_family = value;
                    window.elementSdk.setConfig({ font_family: value });
                }
            },
            fontSizeable: {
                get: () => config.font_size || defaultConfig.font_size,
                set: (value) => {
                    window.elementSdk.config.font_size = value;
                    window.elementSdk.setConfig({ font_size: value });
                }
            }
        }),
        mapToEditPanelValues: (config) => new Map([
            ["company_name", config.company_name || defaultConfig.company_name],
            ["tagline", config.tagline || defaultConfig.tagline],
            ["hero_title", config.hero_title || defaultConfig.hero_title],
            ["hero_subtitle", config.hero_subtitle || defaultConfig.hero_subtitle],
            ["services_title", config.services_title || defaultConfig.services_title],
            ["contact_title", config.contact_title || defaultConfig.contact_title],
            ["footer_text", config.footer_text || defaultConfig.footer_text]
        ])
    });
}