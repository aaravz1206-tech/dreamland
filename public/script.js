document.addEventListener('DOMContentLoaded', () => {
    // Door Animation
    const doorAnimation = document.getElementById('door-animation');
    const doorLeft = document.querySelector('.door-left');
    const doorRight = document.querySelector('.door-right');

    if (doorAnimation && doorLeft && doorRight) {
        // Prevent scrolling while doors are closed
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            doorLeft.style.transform = 'translateX(-100%)';
            doorRight.style.transform = 'translateX(100%)';
            
            setTimeout(() => {
                doorAnimation.style.display = 'none';
                document.body.style.overflow = '';
                
                // Trigger discount offer dropdowns
                const discountOffers = document.querySelectorAll('.discount-offer-container');
                if (discountOffers.length > 0) {
                    setTimeout(() => {
                        discountOffers.forEach(offer => {
                            offer.classList.remove('-translate-y-full');
                            offer.classList.add('translate-y-0');
                        });
                    }, 300); // Small delay for better effect
                }
            }, 1500); // Wait for CSS transition to finish
        }, 800); // Delay before opening
    }

    // Auth State Check
    const authContainer = document.getElementById('authContainer');
    if (authContainer) {
        const userJson = localStorage.getItem('dreamland_user');
        if (userJson) {
            const user = JSON.parse(userJson);
            authContainer.innerHTML = `
                <span class="text-sm text-gray-300">Hi, ${user.name.split(' ')[0]}</span>
                <button id="logoutBtn" class="text-sm uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors ml-4">Logout</button>
            `;
            
            document.getElementById('logoutBtn').addEventListener('click', () => {
                localStorage.removeItem('dreamland_token');
                localStorage.removeItem('dreamland_user');
                window.location.reload();
            });
        }
    }

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Intersection Observer for scroll animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all elements with fade-up or fade-in classes
    const animatedElements = document.querySelectorAll('.fade-up, .fade-in');
    animatedElements.forEach(el => observer.observe(el));
    
    // Trigger hero animations immediately on load
    setTimeout(() => {
        const heroElements = document.querySelectorAll('.hero .fade-up');
        heroElements.forEach(el => el.classList.add('visible'));
    }, 100);

    // Form submission logic
    const bookingForm = document.getElementById('bookingForm');
    const formMessage = document.getElementById('formMessage');

    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
            formMessage.textContent = '';
            formMessage.className = 'form-message';

            const formData = {
                name: document.getElementById('name').value,
                phone: document.getElementById('phone').value,
                date: document.getElementById('date').value,
                details: document.getElementById('details').value
            };

            try {
                const response = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    formMessage.textContent = 'Booking requested successfully! We will contact you soon.';
                    formMessage.classList.add('success');
                    bookingForm.reset();
                } else {
                    const errorText = result.errors ? result.errors.map(err => err.msg).join(', ') : result.message;
                    formMessage.textContent = errorText || 'Failed to submit booking. Please try again.';
                    formMessage.classList.add('error');
                }
            } catch (error) {
                formMessage.textContent = 'Network error. Please try again later.';
                formMessage.classList.add('error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Request';
            }
        });
    }

    // AI Scanner Logic
    const btnAiScan = document.getElementById('btn-ai-scan');
    const aiScannerModal = document.getElementById('ai-scanner-modal');
    const closeScannerBtn = document.getElementById('close-scanner-btn');
    const startScanBtn = document.getElementById('start-scan-btn');
    const photoUpload = document.getElementById('photo-upload');
    const uploadStatus = document.getElementById('upload-status');
    const scanOptions = document.getElementById('scan-options');
    const saveScanBtn = document.getElementById('save-scan-btn');
    const scanLine = document.getElementById('scan-line');
    const scanResults = document.getElementById('scan-results');

    if (btnAiScan && aiScannerModal) {
        btnAiScan.addEventListener('click', (e) => {
            e.preventDefault();
            aiScannerModal.classList.remove('hidden');
            aiScannerModal.classList.add('flex');
            document.body.style.overflow = 'hidden';
            
            // Reset state
            scanLine.classList.add('hidden');
            scanResults.classList.add('hidden');
            scanResults.classList.remove('flex');
            scanOptions.classList.remove('hidden');
            scanOptions.classList.add('flex');
            saveScanBtn.classList.add('hidden');
            if(photoUpload) photoUpload.value = '';
            if(uploadStatus) {
                uploadStatus.classList.add('hidden');
                uploadStatus.textContent = '';
            }
        });

        closeScannerBtn.addEventListener('click', () => {
            aiScannerModal.classList.add('hidden');
            aiScannerModal.classList.remove('flex');
            document.body.style.overflow = '';
        });

        const performScan = () => {
            scanOptions.classList.add('hidden');
            scanOptions.classList.remove('flex');
            scanLine.classList.remove('hidden');
            scanLine.classList.add('animate-scan');
            
            // Simulate scanning duration (4 seconds)
            setTimeout(() => {
                scanLine.classList.add('hidden');
                scanLine.classList.remove('animate-scan');
                
                // Show results
                scanResults.classList.remove('hidden');
                scanResults.classList.add('flex');
                
                // Show save button
                saveScanBtn.classList.remove('hidden');
            }, 4000);
        };

        startScanBtn.addEventListener('click', performScan);

        if (photoUpload) {
            photoUpload.addEventListener('change', (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    const count = e.target.files.length;
                    uploadStatus.textContent = `${count} photo(s) selected. Initializing AI analysis...`;
                    uploadStatus.classList.remove('hidden');
                    
                    // Small delay to let user read the status, then start scanning
                    setTimeout(performScan, 1000);
                }
            });
        }
        
        saveScanBtn.addEventListener('click', () => {
            alert('Measurements saved to your profile!');
            aiScannerModal.classList.add('hidden');
            aiScannerModal.classList.remove('flex');
            document.body.style.overflow = '';
        });
    }
});
