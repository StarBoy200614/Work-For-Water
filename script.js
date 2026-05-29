function initMain() {
    
    // Register GSAP ScrollTrigger
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        // 1. Buoyancy Physics for "Learn more about me"
        // Elements float up from below with an elastic, water-like wobble
        gsap.set(".about-glass-panel", { y: 120, opacity: 0 }); // Initial submerged state

        ScrollTrigger.create({
            trigger: "#about",
            start: "top 85%", // Triggers when the top of the section hits 85% down the viewport
            onEnter: () => gsap.to(".about-glass-panel", {
                y: 0,
                opacity: 1,
                duration: 1.2,
                ease: "power3.out", // Clean slide-in to match the portfolio grid
                overwrite: true
            }),
            onLeaveBack: () => gsap.to(".about-glass-panel", { y: 50, opacity: 0, duration: 0.6, overwrite: true })
        });

        // 2. Buoyancy Physics for the 9-Grid Portfolio Cards
        // Use batch to stagger them naturally as they enter the screen
        gsap.set(".bento-card", { y: 150, opacity: 0 }); // Initial submerged state

        ScrollTrigger.batch(".bento-card", {
            start: "top 90%",
            interval: 0.25, // Adds a distinct delay between each row appearing
            batchMax: 3, // Groups animations into rows (3 cards at a time)
            onEnter: batch => {
                batch.forEach(el => el.classList.remove('hover-ready'));
                gsap.to(batch, {
                    y: 0,
                    opacity: 1,
                    duration: 1.6, // Slowed down from 1.0s to 1.6s for a majestic glide
                    stagger: 0, // Cards within the same row animate simultaneously
                    ease: "power3.out",
                    overwrite: true,
                    onComplete: () => {
                        gsap.set(batch, { clearProps: "transform,opacity" });
                        batch.forEach(el => el.classList.add('hover-ready'));
                    }
                });
            },
            // Gracefully fade them out if you scroll back up
            onLeaveBack: batch => {
                batch.forEach(el => el.classList.remove('hover-ready'));
                gsap.to(batch, { y: 50, opacity: 0, duration: 0.4, stagger: 0, overwrite: true });
            }
        });
    }

    // Water Bubbles Flow Effect
    const bubblesContainer = document.getElementById('bubblesContainer');
    if (bubblesContainer) {
        for (let i = 0; i < 15; i++) {
            let bubble = document.createElement('div');
            bubble.classList.add('bubble');
            let size = Math.random() * 40 + 10;
            bubble.style.width = size + 'px';
            bubble.style.height = size + 'px';
            bubble.style.left = Math.random() * 100 + 'vw';
            bubble.style.animationDuration = (Math.random() * 15 + 12) + 's';
            bubble.style.animationDelay = (Math.random() * 5) + 's';
            bubblesContainer.appendChild(bubble);
        }

        // Flow up faster on scroll down
        window.addEventListener('scroll', () => {
            let scrolled = window.scrollY;
            bubblesContainer.style.transform = `translateY(-${scrolled * 0.15}px)`;
        });
    }

    // Initialize WebGL Fluid Simulation (Ripples)
    if (typeof $ !== 'undefined' && $.fn.ripples) {
        try {
            $('#webgl-water-bg').ripples({
                resolution: 512,
                dropRadius: 20,
                perturbance: 0.04,
            });

            // Add an automatic drop every 3 seconds to show it's alive
            setInterval(function() {
                if (document.hidden) return; // Prevent ripples accumulating
                var $el = $('#webgl-water-bg');
                var x = Math.random() * $el.outerWidth();
                var y = Math.random() * $el.outerHeight();
                var dropRadius = 20;
                var strength = 0.04 + Math.random() * 0.04;
                $el.ripples('drop', x, y, dropRadius, strength);
            }, 3000);
        } catch (e) {
            console.warn("WebGL Ripples failed to load or are unsupported.", e);
        }
    }
    // Handle Floating Socials Visibility
    const floatingSocials = document.querySelector('.floating-socials');
    if (floatingSocials) {
        const hasHero = document.querySelector('.hero') !== null;
        
        if (!hasHero) {
            // On subpages, show immediately
            floatingSocials.classList.add('visible');
        } else {
            // On homepage, show after scrolling past 50%
            window.addEventListener('scroll', () => {
                if (window.scrollY > window.innerHeight * 0.5) {
                    floatingSocials.classList.add('visible');
                } else {
                    floatingSocials.classList.remove('visible');
                }
            });
            // Check once on load
            if (window.scrollY > window.innerHeight * 0.5) {
                floatingSocials.classList.add('visible');
            }
        }
    }

    // Force GSAP to instantly reveal sections if accessed via Navbar
    document.querySelectorAll('.nav-links a[href*="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            
            if (targetId.includes('#portfolio')) {
                gsap.killTweensOf(".bento-card");
                gsap.set(".bento-card", { y: 0, opacity: 1, clearProps: "transform,opacity" });
                document.querySelectorAll(".bento-card").forEach(el => el.classList.add('hover-ready'));
            } else if (targetId.includes('#about')) {
                gsap.killTweensOf(".about-glass-panel");
                gsap.set(".about-glass-panel", { y: 0, opacity: 1 });
            }
        });
    });

    // Navbar Dropdown Toggle logic for Mobile/Desktop click
    const dropdownToggle = document.querySelector('.nav-dropdown > a');
    const dropdownMenu = document.querySelector('.nav-dropdown');
    const dropdownContent = document.querySelector('.dropdown-content');

    if (dropdownToggle && dropdownMenu && dropdownContent) {
        dropdownToggle.addEventListener('click', function(e) {
            // Check if dropdown is visually visible (either by hover or show class)
            const isVisuallyOpen = window.getComputedStyle(dropdownContent).visibility === 'visible' || dropdownMenu.classList.contains('show');
            
            if (!isVisuallyOpen) {
                // First click: prevent default link behavior and show the dropdown
                e.preventDefault();
                e.stopPropagation();
                dropdownMenu.classList.add('show');
                
                // Add a listener to close dropdown when clicking outside
                document.addEventListener('click', closeDropdownOutside);
            } else {
                // Second click or when already hovered on desktop: allow navigation
                dropdownMenu.classList.remove('show');
            }
        });

        function closeDropdownOutside(event) {
            if (!dropdownMenu.contains(event.target)) {
                dropdownMenu.classList.remove('show');
                document.removeEventListener('click', closeDropdownOutside);
            }
        }
    }

    // Dimensions Navigation Slider Logic
    const dimNav = document.querySelector('.dimensions-nav');
    if (dimNav) {
        const slider = dimNav.querySelector('.nav-slider');
        const links = dimNav.querySelectorAll('.dim-link');
        
        function updateSlider(element) {
            if (!element) return;
            const linkRect = element.getBoundingClientRect();
            const navRect = dimNav.getBoundingClientRect();
            
            // Calculate scroll position of the container if it's overflowing
            const scrollLeft = dimNav.scrollLeft;
            
            slider.style.left = `${linkRect.left - navRect.left + scrollLeft}px`;
            slider.style.width = `${linkRect.width}px`;
        }
        
        // Initial setup
        const activeLink = dimNav.querySelector('.active');
        if (activeLink) {
            setTimeout(() => {
                slider.style.transition = 'none';
                updateSlider(activeLink);
                // Center active item if scrollable
                const linkRect = activeLink.getBoundingClientRect();
                const navRect = dimNav.getBoundingClientRect();
                if (linkRect.right > navRect.right || linkRect.left < navRect.left) {
                    dimNav.scrollLeft = activeLink.offsetLeft - (navRect.width / 2) + (activeLink.offsetWidth / 2);
                }
                
                setTimeout(() => {
                    slider.style.transition = 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
                    // Re-update in case of any layout shifts after fonts loaded
                    updateSlider(activeLink);
                }, 50);
            }, 100);
        }

        // Handle clicks
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                if (this.classList.contains('active')) {
                    e.preventDefault();
                    return;
                }
                e.preventDefault();
                const targetHref = this.getAttribute('href');
                
                links.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                
                updateSlider(this);
                
                setTimeout(() => {
                    window.location.href = targetHref;
                }, 400); // Wait for transition
            });
        });
        
        window.addEventListener('resize', () => {
            const active = dimNav.querySelector('.active');
            if (active) updateSlider(active);
        });
    }

    // Make Connect Cards Entirely Clickable
    document.querySelectorAll('.connect-card').forEach(card => {
        // Skip if it's already an anchor tag (like the academic profiles)
        if (card.tagName.toLowerCase() === 'a') return;
        
        card.addEventListener('click', function(e) {
            // If they clicked on a phone link, don't open the website link
            if (e.target.closest('a[href^="tel"]')) {
                return; 
            }
            
            // Find the main web link inside the card
            const webLink = this.querySelector('a[href^="http"]');
            if (webLink) {
                if (webLink.getAttribute('target') === '_blank') {
                    window.open(webLink.href, '_blank');
                } else {
                    window.location.href = webLink.href;
                }
            }
        });
    });

    // Contact Form Handler
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        const statusMsg = document.getElementById('form-status');
        const submitBtn = contactForm.querySelector('.submit-btn');
        const formLoadTime = Date.now(); // Record page/form load time for bot detection

        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Reset status message
            statusMsg.className = 'form-status-message';
            statusMsg.textContent = '';
            statusMsg.style.display = 'none';

            // Get form values
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const subject = document.getElementById('subject').value.trim();
            const message = document.getElementById('message').value.trim();
            const website = document.getElementById('website').value;

            // Honeypot check for bots (Spam Protection)
            if (website) {
                console.warn('Bot submission intercepted via honeypot.');
                statusMsg.className = 'form-status-message success';
                statusMsg.textContent = 'Thank you! Your message has been sent successfully.';
                contactForm.reset();
                return;
            }

            // Submission speed check (Spam Protection - bots submit instantly)
            const timeElapsed = Date.now() - formLoadTime;
            if (timeElapsed < 3000) {
                console.warn('Bot submission intercepted via fast submission timing:', timeElapsed, 'ms');
                statusMsg.className = 'form-status-message success';
                statusMsg.textContent = 'Thank you! Your message has been sent successfully.';
                contactForm.reset();
                return;
            }

            // Simple validation
            if (!name || !email || !subject || !message) {
                statusMsg.classList.add('error');
                statusMsg.textContent = 'Please fill out all fields.';
                return;
            }

            // Email address regex check (Spam/Error Protection)
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                statusMsg.classList.add('error');
                statusMsg.textContent = 'Please enter a valid email address.';
                return;
            }

            // Disable fields and button
            const inputs = contactForm.querySelectorAll('input, textarea');
            inputs.forEach(input => input.disabled = true);
            submitBtn.disabled = true;
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = 'Sending... <i class="fas fa-spinner fa-spin"></i>';

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name, email, subject, message, website }),
                });

                const data = await response.json();

                if (response.ok) {
                    statusMsg.classList.add('success');
                    statusMsg.textContent = data.message || 'Thank you! Your message has been sent successfully.';
                    contactForm.reset();
                } else {
                    statusMsg.classList.add('error');
                    statusMsg.textContent = data.error || 'Failed to send message. Please try again later.';
                }
            } catch (error) {
                console.error('Error submitting contact form:', error);
                statusMsg.classList.add('error');
                statusMsg.textContent = 'A network error occurred. Please check your connection and try again.';
            } finally {
                // Re-enable inputs and reset button text
                inputs.forEach(input => input.disabled = false);
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }

    // 3D Cylinder Carousel for Teaching Cards
    const teachingCards = document.querySelectorAll('.teaching-card');
    const prevBtn = document.querySelector('.carousel-nav-btn.prev');
    const nextBtn = document.querySelector('.carousel-nav-btn.next');
    const viewport = document.querySelector('.carousel-viewport');

    if (teachingCards.length > 0 && typeof gsap !== 'undefined') {
        let activeIndex = 0;
        const N = teachingCards.length;
        let isAnimating = false;
        const animationDuration = 0.8; // seconds
        const lockDuration = 800; // milliseconds

        // Dynamically inject placeholder images from Assests (cycling 1st.jpg to 9th.jpg)
        const placeholderImages = [
            '1st.jpg', '2nd.jpg', '3rd.jpg', '4th.jpg', '5th.jpg', 
            '6th.jpg', '7th.jpg', '8th.jpg', '9th.jpg'
        ];
        
        teachingCards.forEach((card, i) => {
            const imgFilename = placeholderImages[i % placeholderImages.length];
            const imgWrapper = document.createElement('div');
            imgWrapper.className = 'card-image-wrapper';
            
            const img = document.createElement('img');
            img.src = `Assests/${imgFilename}`;
            img.alt = card.querySelector('h3').textContent;
            img.className = 'card-image';
            
            imgWrapper.appendChild(img);
            
            // Insert it before card-content
            const content = card.querySelector('.card-content');
            if (content) {
                card.insertBefore(imgWrapper, content);
            }
        });

        function updateCarousel(nextIndex) {
            activeIndex = nextIndex;
            const isMobile = window.innerWidth < 768;
            const radius = isMobile ? 200 : 540;
            const angleStep = isMobile ? 38 : 28;

            teachingCards.forEach((card, i) => {
                let diff = i - activeIndex;
                const half = Math.floor(N / 2);
                if (diff > half) diff -= N;
                if (diff < -half) diff += N;

                const absDiff = Math.abs(diff);
                const img = card.querySelector('.card-image');
                const content = card.querySelector('.card-content');

                // Enforce proper 3D stacking order to prevent overlapping outlines
                let zIndex = 0;
                if (diff === 0) zIndex = 10;
                else if (absDiff === 1) zIndex = 5;
                else if (absDiff === 2) zIndex = 2;
                else if (absDiff === 3) zIndex = 1;
                
                card.style.zIndex = zIndex;

                if (absDiff > 3) {
                    // Instantly hide card outside active zone to prevent overlapping in the back
                    gsap.to(card, {
                        opacity: 0,
                        x: diff > 0 ? radius * 1.5 : -radius * 1.5,
                        z: -radius * 1.5,
                        rotateY: diff > 0 ? 90 : -90,
                        scale: 0.4,
                        duration: animationDuration,
                        ease: "power2.out",
                        overwrite: "auto"
                    });
                    card.classList.remove('active-card');
                    card.style.filter = 'blur(8px)';

                    // Reset parallax shifts when hidden
                    if (img) gsap.set(img, { x: 0 });
                    if (content) gsap.set(content, { x: 0 });
                } else {
                    const angle = diff * angleStep;
                    const angleRad = angle * Math.PI / 180;
                    
                    // Curved wheel math
                    const tx = radius * Math.sin(angleRad);
                    const tz = radius * (Math.cos(angleRad) - 1);
                    
                    let opacity = 0;
                    let scale = 1;
                    let blurVal = 0;
                    let zOffset = 0;

                    if (diff === 0) {
                        opacity = 1;
                        scale = 1.0;
                        blurVal = 0;
                        zOffset = 0;
                        card.classList.add('active-card');
                    } else if (absDiff === 1) {
                        opacity = 0.50; // Increased opacity to make borders clearly visible
                        scale = 0.82;
                        blurVal = 1.5;
                        zOffset = -150; // Setback adjacent cards to prevent 3D outline intersection
                        card.classList.remove('active-card');
                    } else if (absDiff === 2) {
                        opacity = 0.25; // Increased opacity to make borders clearly visible
                        scale = 0.68;
                        blurVal = 3.5;
                        zOffset = -300; // Setback secondary cards further
                        card.classList.remove('active-card');
                    } else if (absDiff === 3) {
                        opacity = 0.08; // Increased opacity to make borders clearly visible
                        scale = 0.55;
                        blurVal = 6;
                        zOffset = -450; // Setback tertiary cards further
                        card.classList.remove('active-card');
                    }

                    // Animate position using GSAP
                    gsap.to(card, {
                        opacity: opacity,
                        x: tx,
                        z: tz + zOffset, // Apply Z-depth setback offset
                        rotateY: angle,
                        scale: scale,
                        duration: animationDuration,
                        ease: "power2.out",
                        overwrite: "auto"
                    });

                    // Horizontal Parallax Shifts inside the card
                    if (img) {
                        gsap.to(img, {
                            x: diff * -35, // Image shifts opposite to rotation direction
                            duration: animationDuration,
                            ease: "power2.out",
                            overwrite: "auto"
                        });
                    }

                    if (content) {
                        gsap.to(content, {
                            x: diff * -12, // Text content shifts opposite by a smaller factor
                            duration: animationDuration,
                            ease: "power2.out",
                            overwrite: "auto"
                        });
                    }

                    // Set blur filter (transitions handled smoothly by CSS)
                    card.style.filter = blurVal > 0 ? `blur(${blurVal}px)` : 'none';
                }
            });

            // Update Controls
            const indicator = document.querySelector('.carousel-indicator');
            if (indicator) {
                indicator.textContent = `${activeIndex + 1} / ${N}`;
            }

            const progressFill = document.querySelector('.carousel-progress-fill');
            if (progressFill) {
                const percent = (activeIndex / (N - 1)) * 100;
                progressFill.style.width = `${percent}%`;
            }
        }

        // Action Trigger
        function triggerTransition(targetIndex) {
            if (isAnimating) return;
            isAnimating = true;
            
            updateCarousel(targetIndex);
            
            setTimeout(() => {
                isAnimating = false;
            }, lockDuration);
        }

        // Navigation Clicks
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (activeIndex > 0) {
                    triggerTransition(activeIndex - 1);
                } else {
                    // Wrap around
                    triggerTransition(N - 1);
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (activeIndex < N - 1) {
                    triggerTransition(activeIndex + 1);
                } else {
                    // Wrap around
                    triggerTransition(0);
                }
            });
        }

        // Less Sensitive Scroll direction trigger (Mouse Wheel & Trackpad)
        let scrollAccumulator = 0;
        const scrollThreshold = 120; // Lower sensitivity: requires deliberate scrolling
        let scrollTimeout = null;

        if (viewport) {
            viewport.addEventListener('wheel', (e) => {
                const delta = e.deltaY;
                
                // Accumulate scroll input delta
                scrollAccumulator += delta;
                
                // Reset accumulator after scroll stops (200ms timeout)
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    scrollAccumulator = 0;
                }, 200);

                if (Math.abs(scrollAccumulator) >= scrollThreshold) {
                    const direction = scrollAccumulator > 0 ? 1 : -1;
                    scrollAccumulator = 0; // reset accumulator

                    if (direction > 0) {
                        if (activeIndex < N - 1) {
                            e.preventDefault();
                            triggerTransition(activeIndex + 1);
                        }
                    } else {
                        if (activeIndex > 0) {
                            e.preventDefault();
                            triggerTransition(activeIndex - 1);
                        }
                    }
                } else {
                    // Prevent page scroll while navigating carousel boundaries
                    if ((scrollAccumulator > 0 && activeIndex < N - 1) || 
                        (scrollAccumulator < 0 && activeIndex > 0)) {
                        e.preventDefault();
                    }
                }
            }, { passive: false });
        }

        // Mobile Swipe Triggers
        if (viewport) {
            let touchStartY = 0;
            let touchStartX = 0;

            viewport.addEventListener('touchstart', (e) => {
                touchStartY = e.touches[0].clientY;
                touchStartX = e.touches[0].clientX;
            }, { passive: true });

            viewport.addEventListener('touchmove', (e) => {
                if (isAnimating) {
                    e.preventDefault();
                    return;
                }

                const touchEndY = e.touches[0].clientY;
                const touchEndX = e.touches[0].clientX;
                
                const diffY = touchStartY - touchEndY;
                const diffX = touchStartX - touchEndX;

                // We track both vertical and horizontal swipes since it's a horizontal cylinder
                if (Math.abs(diffY) > 40 || Math.abs(diffX) > 40) {
                    // If vertical swipe dominates
                    if (Math.abs(diffY) > Math.abs(diffX)) {
                        if (diffY > 0) {
                            if (activeIndex < N - 1) {
                                e.preventDefault();
                                triggerTransition(activeIndex + 1);
                            }
                        } else {
                            if (activeIndex > 0) {
                                e.preventDefault();
                                triggerTransition(activeIndex - 1);
                            }
                        }
                    } else { // If horizontal swipe dominates
                        if (diffX > 0) {
                            if (activeIndex < N - 1) {
                                e.preventDefault();
                                triggerTransition(activeIndex + 1);
                            }
                        } else {
                            if (activeIndex > 0) {
                                e.preventDefault();
                                triggerTransition(activeIndex - 1);
                            }
                        }
                    }
                    touchStartY = touchEndY;
                    touchStartX = touchEndX;
                }
            }, { passive: false });
        }

        // Initialize state
        updateCarousel(0);
        
        // Window resize handler for adjusting radius on the fly
        window.addEventListener('resize', () => {
            updateCarousel(activeIndex);
        });
    }

    // Teaching Credentials Tab Switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    if (tabBtns.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const targetTab = this.getAttribute('data-tab');
                
                // Remove active class from all buttons and panes
                tabBtns.forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                
                // Add active class to clicked button and target pane
                this.classList.add('active');
                const targetPane = document.getElementById(targetTab);
                if (targetPane) {
                    targetPane.classList.add('active');
                }
            });
        });
    }

    // Initialize Research Page Logic
    initResearch();

}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMain);
} else {
    initMain();
}

// River Flow Toggle Logic
function toggleReveal(btn, id) {
    const wrapper = document.getElementById(id);
    const isExpanded = wrapper.classList.contains('expanded');
    
    // Close all other wrappers
    document.querySelectorAll('.reveal-wrapper').forEach(el => {
        el.classList.remove('expanded');
    });
    
    // If we clicked a closed one, open it
    if (!isExpanded) {
        wrapper.classList.add('expanded');
        
        // Smooth scroll to position slightly above the button after animation starts
        setTimeout(() => {
            const y = btn.getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }, 400);
    }
}

// ---------------------------------------------------------
// DYNAMIC MIND-MAP GENERATION FROM CSV (Google Sheets)
// ---------------------------------------------------------

// Change this URL to your Google Sheets Published CSV link later!
const SPREADSHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTz8DEv50SYuwwCTd_vxL7NzsWt0Ir_4y1QWS7qSevFm2N7iiUb5k0pICmCvhvCpS3Jgk8Fc59ovWfz/pub?output=csv";

const CATEGORY_MAP = {
    "Institutional": { num: "01", icon: "fa-university", color: "c-blue", title: "Institutional<br>& Campus" },
    "Heritage": { num: "02", icon: "fa-vihara", color: "c-green", title: "Heritage<br>Conservation" },
    "Residential": { num: "03", icon: "fa-home", color: "c-orange", title: "Residential<br>& Hospitality" },
    "Environmental": { num: "04", icon: "fa-leaf", color: "c-purple", title: "Environmental<br>Rehab" },
    "Urban": { num: "05", icon: "fa-city", color: "c-cyan", title: "Urban Design<br>& Regional" }
};

function initMindMap() {
    const container = document.getElementById("dynamic-mindmap");
    if (!container) return; // Only run on practice.html

    if (typeof Papa !== 'undefined') {
        const cacheBuster = `&t=${new Date().getTime()}`;
        Papa.parse(SPREADSHEET_CSV_URL + cacheBuster, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                renderMindMap(results.data);
                // Draw connections after DOM has rendered
                setTimeout(drawConnections, 100);
            },
            error: function(err) {
                console.error("Error fetching CSV:", err);
                container.innerHTML = "<p style='color:white; text-align:center;'>Error loading projects. Please check the CSV link.</p>";
            }
        });
    }

    window.addEventListener('resize', () => {
        requestAnimationFrame(drawConnections);
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMindMap);
} else {
    initMindMap();
}

function renderMindMap(projects) {
    const container = document.getElementById("dynamic-mindmap");
    container.innerHTML = ""; // Clear existing

    // Group projects by category
    const grouped = {};
    Object.keys(CATEGORY_MAP).forEach(cat => grouped[cat] = []);

    projects.forEach(p => {
        let cat = p.Category ? p.Category.trim() : "";
        if (grouped[cat]) {
            grouped[cat].push(p);
        }
    });

    const categoryKeys = Object.keys(grouped);

    categoryKeys.forEach((catKey, index) => {
        const catProjects = grouped[catKey];
        if (catProjects.length === 0) return; // Skip empty categories

        const meta = CATEGORY_MAP[catKey];
        const isLast = index === categoryKeys.length - 1;

        // Split projects into left and right columns
        const leftProjects = [];
        const rightProjects = [];
        catProjects.forEach((p, i) => {
            if (i % 2 === 0) leftProjects.push(p);
            else rightProjects.push(p);
        });

        // Build HTML string
        let html = `<div class="flow-row ${meta.color}">`;

        // LEFT COLUMN
        html += `<div class="projects-column left-projects">`;
        leftProjects.forEach(p => {
            html += `
                <div class="floating-project">
                    <img src="${p.ImageName && p.ImageName.startsWith('http') ? p.ImageName : 'Assests/' + (p.ImageName || 'default.jpg')}" class="proj-thumb" alt="${p.Title}">
                    <div class="proj-text">
                        <h4>${p.Title}</h4>
                        <p>${p.Description} ${p.Link ? `<br><a href="${p.Link}" target="_blank" class="external-link" style="margin-top:5px; display:inline-block; color:var(--accent);">Visit Link ➔</a>` : ''}</p>
                        <a href="#" class="toggle-details">View Details ➔</a>
                    </div>
                </div>
            `;
        });
        html += `</div>`;

        // LEFT CONNECTION SVG
        html += `
            <div class="connection-area">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="conn-svg left-svg"></svg>
            </div>
        `;

        // CENTER COLUMN
        html += `
            <div class="center-column">
                <div class="vertical-line top-line" style="${index === 0 ? 'background: transparent; border: none;' : ''}"></div>
                <div class="node-circle">
                    <span class="node-num">${meta.num}</span>
                    <i class="fas ${meta.icon}"></i>
                    <span class="node-title">${meta.title}</span>
                </div>
                ${!isLast ? '<div class="vertical-line bottom-arrow"></div>' : '<div class="vertical-line" style="background: transparent; border: none;"></div>'}
            </div>
        `;

        // RIGHT CONNECTION SVG
        html += `
            <div class="connection-area">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="conn-svg right-svg"></svg>
            </div>
        `;

        // RIGHT COLUMN
        html += `<div class="projects-column right-projects">`;
        rightProjects.forEach(p => {
            html += `
                <div class="floating-project">
                    <img src="${p.ImageName && p.ImageName.startsWith('http') ? p.ImageName : 'Assests/' + (p.ImageName || 'default.jpg')}" class="proj-thumb" alt="${p.Title}">
                    <div class="proj-text">
                        <h4>${p.Title}</h4>
                        <p>${p.Description} ${p.Link ? `<br><a href="${p.Link}" target="_blank" class="external-link" style="margin-top:5px; display:inline-block; color:var(--accent);">Visit Link ➔</a>` : ''}</p>
                        <a href="#" class="toggle-details">View Details ➔</a>
                    </div>
                </div>
            `;
        });
        html += `</div>`;

        html += `</div>`; // End flow-row
        container.insertAdjacentHTML('beforeend', html);
    });
}

function drawConnections() {
    document.querySelectorAll('.flow-row').forEach(row => {
        const leftArea = row.querySelector('.left-svg');
        const rightArea = row.querySelector('.right-svg');
        const centerNode = row.querySelector('.node-circle');
        
        if (!centerNode) return;
        const centerRect = centerNode.getBoundingClientRect();

        // Draw Left Connections
        if (leftArea) {
            const leftProjects = row.querySelectorAll('.left-projects .floating-project');
            const svgRect = leftArea.getBoundingClientRect();
            let leftPaths = '';
            
            leftProjects.forEach(proj => {
                const projRect = proj.getBoundingClientRect();
                
                // Map screen coordinates to SVG viewBox (0-100)
                const projCenterY = (projRect.top + projRect.height/2) - svgRect.top;
                const svgY = (projCenterY / svgRect.height) * 100;
                
                const centerCenterY = (centerRect.top + centerRect.height/2) - svgRect.top;
                const svgCenterY = (centerCenterY / svgRect.height) * 100;
                
                leftPaths += `<path d="M100,${svgCenterY} C50,${svgCenterY} 50,${svgY} 0,${svgY}" class="conn-line" />`;
            });
            leftArea.innerHTML = leftPaths;
        }

        // Draw Right Connections
        if (rightArea) {
            const rightProjects = row.querySelectorAll('.right-projects .floating-project');
            const svgRect = rightArea.getBoundingClientRect();
            let rightPaths = '';
            
            rightProjects.forEach(proj => {
                const projRect = proj.getBoundingClientRect();
                
                // Map screen coordinates to SVG viewBox (0-100)
                const projCenterY = (projRect.top + projRect.height/2) - svgRect.top;
                const svgY = (projCenterY / svgRect.height) * 100;
                
                const centerCenterY = (centerRect.top + centerRect.height/2) - svgRect.top;
                const svgCenterY = (centerCenterY / svgRect.height) * 100;
                
                rightPaths += `<path d="M0,${svgCenterY} C50,${svgCenterY} 50,${svgY} 100,${svgY}" class="conn-line" />`;
            });
            rightArea.innerHTML = rightPaths;
        }
    });
}

// Event Delegation for Accordion Toggle
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('toggle-details')) {
        e.preventDefault();
        const project = e.target.closest('.floating-project');
        project.classList.toggle('expanded');
        if (project.classList.contains('expanded')) {
            e.target.innerText = 'Close Details ➔';
        } else {
            e.target.innerText = 'View Details ➔';
        }
        // Redraw connections immediately and also after transition completes
        drawConnections();
        setTimeout(drawConnections, 400);
    }
});

// ---------------------------------------------------------
// DYNAMIC RESEARCH PAGE 3D SEPTAGON TUNNEL & REAL-TIME SEARCH
// ---------------------------------------------------------

const RESEARCH_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQysLY9yKZ4NEaFbuDBDosAPlth1YzoKEH1Wj7O-VGLarH5_QRz93Onu7QH88vUnLJow8DX0eOVuj7T/pub?output=csv";
const RESEARCH_CACHE_KEY = "mbb_publications_data";

// Map category names from CSV to sidebar navigation buttons and details panels
const RESEARCH_CATEGORIES = [
    { name: "Books", icon: "fa-book" },
    { name: "Articles", icon: "fa-newspaper" },
    { name: "Book Chapters", icon: "fa-bookmark" },
    { name: "Published Essays and Reports", icon: "fa-file-alt" },
    { name: "Thesis", icon: "fa-graduation-cap" },
    { name: "Professional Reports (Team Member)", icon: "fa-users-cog" },
    { name: "Papers, Presentations & Participations in Conferences, Seminars, Workshops, Symposia", icon: "fa-comments" }
];

let allPublications = [];
let currentCategoryIndex = 0;

function initResearch() {
    const gridSection = document.getElementById("publications-grid-section");
    if (!gridSection) return; // Only run on research.html
    
    const searchInput = document.getElementById("grid-search-input");
    const resultsCount = document.getElementById("grid-results-count");
    const clearBtn = document.getElementById("grid-search-clear");
    const navButtons = document.querySelectorAll(".category-card");
    const loadingWrapper = document.getElementById("research-loading-wrapper");
    
    // Set up navigation menu click handlers
    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const index = parseInt(btn.getAttribute("data-index"));
            setActiveCategory(index);
        });
    });

    // Lightbox Modal Interaction Setup
    const lightboxModal = document.getElementById("premium-lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    const lightboxCaption = document.getElementById("lightbox-caption");
    const lightboxCloseBtn = document.querySelector(".lightbox-close");
    const marqueeCards = document.querySelectorAll(".marquee-img-card");

    if (lightboxModal && lightboxImg && lightboxCaption) {
        // Open lightbox when clicking on marquee image cards
        marqueeCards.forEach(card => {
            card.addEventListener("click", () => {
                const fullSrc = card.getAttribute("data-full");
                const captionText = card.getAttribute("data-caption");
                
                lightboxImg.src = fullSrc;
                lightboxCaption.textContent = captionText || "";
                
                // Show modal display flex
                lightboxModal.style.display = "flex";
                
                // Trigger transition in the next animation frame
                requestAnimationFrame(() => {
                    lightboxModal.classList.add("active");
                });
                
                // Disable background body scrolling
                document.body.style.overflow = "hidden";
            });
        });

        // Function to close lightbox with fade-out animation
        const closeLightbox = () => {
            lightboxModal.classList.remove("active");
            
            // Wait for transition to complete before setting display to none
            setTimeout(() => {
                lightboxModal.style.display = "none";
                lightboxImg.src = "";
                lightboxCaption.textContent = "";
            }, 400); // Matches CSS transition duration (0.4s)
            
            // Restore background body scrolling
            document.body.style.overflow = "";
        };

        // Close on clicking the X button
        if (lightboxCloseBtn) {
            lightboxCloseBtn.addEventListener("click", closeLightbox);
        }

        // Close on clicking outside the image container (the dark overlay backdrop)
        lightboxModal.addEventListener("click", (e) => {
            if (e.target === lightboxModal) {
                closeLightbox();
            }
        });

        // Close on pressing Escape key
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && lightboxModal.classList.contains("active")) {
                closeLightbox();
            }
        });
    }

    // Load from cache first for instant load in memory
    const cachedData = localStorage.getItem(RESEARCH_CACHE_KEY);
    if (cachedData) {
        try {
            allPublications = JSON.parse(cachedData);
            renderShowcase(allPublications, currentCategoryIndex);
        } catch (e) {
            console.warn("Failed to parse cached publications data", e);
        }
    }

    // Always show loading spinner on initial load to avoid layout flashes or stale content flashes
    if (loadingWrapper) loadingWrapper.style.display = "flex";
    if (gridSection) gridSection.style.display = "none";
    
    // Fetch fresh data from CSV
    if (typeof Papa !== 'undefined') {
        const cacheBuster = `&t=${new Date().getTime()}`;
        Papa.parse(RESEARCH_CSV_URL + cacheBuster, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                const freshData = results.data;
                
                if (freshData && freshData.length > 0) {
                    const serializedFresh = JSON.stringify(freshData);
                    if (serializedFresh !== cachedData) {
                        localStorage.setItem(RESEARCH_CACHE_KEY, serializedFresh);
                    }
                    allPublications = freshData;
                    renderShowcase(allPublications, currentCategoryIndex);
                }

                // Hide loader and show content now that everything is loaded correctly
                const latestLoadingWrapper = document.getElementById("research-loading-wrapper");
                const latestGridSection = document.getElementById("publications-grid-section");
                if (latestLoadingWrapper) latestLoadingWrapper.style.display = "none";
                if (latestGridSection) latestGridSection.style.display = "block";

                // Re-trigger search filter if there is active search term
                if (searchInput && searchInput.value.trim()) {
                    handleSearch(searchInput.value, allPublications, resultsCount, clearBtn);
                } else {
                    if (resultsCount) {
                        const items = allPublications.filter(p => p.Category === RESEARCH_CATEGORIES[currentCategoryIndex].name);
                        resultsCount.textContent = `${items.length} entries`;
                    }
                }
            },
            error: function(err) {
                console.error("Error fetching publications CSV:", err);
                
                // Fallback to cache if we have cached data parsed in memory
                if (allPublications && allPublications.length > 0) {
                    const latestLoadingWrapper = document.getElementById("research-loading-wrapper");
                    const latestGridSection = document.getElementById("publications-grid-section");
                    if (latestLoadingWrapper) latestLoadingWrapper.style.display = "none";
                    if (latestGridSection) latestGridSection.style.display = "block";
                    return;
                }

                const latestLoadingWrapper = document.getElementById("research-loading-wrapper");
                if (latestLoadingWrapper) {
                    latestLoadingWrapper.innerHTML = `
                        <i class="fas fa-exclamation-triangle" style="font-size: 2.5rem; color: #ff5a5f; margin-bottom: 1rem;"></i>
                        <p style="color: rgba(255,255,255,0.6); font-family: var(--font-heading);">Failed to load publications database.</p>
                    `;
                }
                if (!allPublications.length && resultsCount) {
                    resultsCount.textContent = "Error loading publications.";
                }
            }
        });
    }

    // Set up search event listeners
    if (searchInput) {
        searchInput.addEventListener("input", function() {
            handleSearch(this.value, allPublications, resultsCount, clearBtn);
        });
    }
    
    if (clearBtn) {
        clearBtn.addEventListener("click", function() {
            if (searchInput) searchInput.value = "";
            handleSearch("", allPublications, resultsCount, clearBtn);
            if (searchInput) searchInput.focus();
        });
    }

    // Initialize category
    setActiveCategory(0, true);
}

function setActiveCategory(index, isInit = false) {
    if (index < 0 || index >= RESEARCH_CATEGORIES.length) return;
    currentCategoryIndex = index;
    
    const navButtons = document.querySelectorAll(".category-card");
    
    // Update active nav button
    navButtons.forEach(btn => {
        const btnIndex = parseInt(btn.getAttribute("data-index"));
        if (btnIndex === index) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    // Clear search input when switching categories
    const searchInput = document.getElementById("grid-search-input");
    const clearBtn = document.getElementById("grid-search-clear");
    if (searchInput) searchInput.value = "";
    if (clearBtn) clearBtn.style.display = "none";
    
    // Load category publications in grid
    if (allPublications.length > 0) {
        loadCategoryPublications(allPublications, index);
    }
}

function loadCategoryPublications(publications, catIndex, searchQuery = "") {
    const categoryMeta = RESEARCH_CATEGORIES[catIndex];
    const gridContainer = document.getElementById("publications-grid");
    const resultsCount = document.getElementById("grid-results-count");
    
    if (!gridContainer) return;
    
    // Filter publications by active category name
    let items = publications.filter(p => p.Category === categoryMeta.name);
    
    // Apply search filter if searchQuery exists
    const query = searchQuery.trim().toLowerCase();
    const keywords = query.split(/\s+/).filter(k => k.length > 0);
    
    if (keywords.length > 0) {
        items = items.filter(item => {
            const titleText = (item.Title || "").toLowerCase();
            const descText = (item.Description || "").toLowerCase();
            const typeText = (item.Type || "").toLowerCase();
            const combinedText = `${titleText} ${descText} ${typeText}`;
            return keywords.every(kw => combinedText.includes(kw));
        });
    }
    
    // Update results count
    if (resultsCount) {
        resultsCount.textContent = `${items.length} entry${items.length === 1 ? '' : 'ies'}`;
    }

    if (items.length === 0) {
        if (keywords.length > 0) {
            gridContainer.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 4rem 1rem; text-align: center; color: rgba(255,255,255,0.4);">
                    <i class="fas fa-search-minus" style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--accent); opacity: 0.6;"></i>
                    <p style="font-size: 1.1rem; margin: 0;">No matching entries found in this category.</p>
                </div>`;
        } else {
            gridContainer.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 4rem 1rem; text-align: center; color: rgba(255,255,255,0.4);">
                    No publications found in this category.
                </div>`;
        }
        return;
    }

    let html = "";
    items.forEach((item) => {
        const tags = getTags(item);
        
        // Extract first tag (Type) and remaining tags
        const typeTag = tags[0] || item.Type || "Publication";
        const otherTags = tags.slice(1);
        
        // Highlight search keywords if active
        let titleHTML = item.Title || "";
        let descHTML = item.Description || "";
        
        if (keywords.length > 0) {
            titleHTML = highlightText(titleHTML, keywords);
            descHTML = highlightText(descHTML, keywords);
        } else {
            titleHTML = escapeHtml(titleHTML);
            descHTML = escapeHtml(descHTML);
        }

        const titleTag = item.Link ? 
            `<a href="${item.Link}" target="_blank" rel="noopener noreferrer" class="pub-card-title-link">${titleHTML} <i class="fas fa-external-link-alt"></i></a>` :
            titleHTML;

        // Custom category colors for borders/text matching our CSS vars
        const catColor = getCategoryColor(catIndex);

        html += `
            <div class="pub-card" style="--cat-color: ${catColor};">
                <span class="pub-card-cat">${escapeHtml(categoryMeta.name.split(' in ')[0])}</span>
                <h4 class="pub-card-title">${titleTag}</h4>
                ${item.Description ? `<p class="pub-card-desc">${descHTML}</p>` : ''}
                <div class="pub-card-tags">
                    <span class="pub-card-tag tag-type">${escapeHtml(typeTag)}</span>
                    ${otherTags.map(tag => `<span class="pub-card-tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
            </div>
        `;
    });
    gridContainer.innerHTML = html;
}

function renderShowcase(publications, activeIndex) {
    // Dynamically calculate category counts for category cards
    RESEARCH_CATEGORIES.forEach((catMeta, idx) => {
        const items = publications.filter(p => p.Category === catMeta.name);
        const card = document.querySelector(`.category-card[data-index="${idx}"]`);
        if (card) {
            const countEl = card.querySelector('.cat-count');
            if (countEl) {
                countEl.textContent = items.length;
            }
        }
    });

    loadCategoryPublications(publications, activeIndex);
}

function handleSearch(query, publications, countEl, clearBtn) {
    const trimmed = query.trim();
    const gridContainer = document.getElementById("publications-grid");
    
    if (trimmed) {
        if (clearBtn) clearBtn.style.display = "flex";
    } else {
        if (clearBtn) clearBtn.style.display = "none";
        
        loadCategoryPublications(publications, currentCategoryIndex);
        return;
    }

    const keywords = trimmed.toLowerCase().split(/\s+/).filter(k => k.length > 0);
    let totalMatches = 0;
    let html = "";

    publications.forEach((item) => {
        const titleText = item.Title || "";
        const descText = item.Description || "";
        const typeText = item.Type || "";
        
        const searchContent = `${titleText} ${descText} ${typeText} ${item.Category}`.toLowerCase();
        const matchesAll = keywords.every(kw => searchContent.includes(kw));

        if (matchesAll) {
            totalMatches++;
            const highlightedTitleText = highlightText(titleText, keywords);
            const highlightedDescText = highlightText(descText, keywords);
            
            const titleHTML = item.Link ? 
                `<a href="${item.Link}" target="_blank" rel="noopener noreferrer" class="pub-card-title-link">${highlightedTitleText} <i class="fas fa-external-link-alt"></i></a>` :
                highlightedTitleText;

            const catIdx = RESEARCH_CATEGORIES.findIndex(c => c.name === item.Category);
            const catColor = getCategoryColor(catIdx !== -1 ? catIdx : 0);
            const catName = item.Category.split(' in ')[0];

            const tags = getTags(item);
            const typeTag = tags[0] || item.Type || "Publication";
            const otherTags = tags.slice(1);

            html += `
                <div class="pub-card" style="--cat-color: ${catColor};">
                    <span class="pub-card-cat">${escapeHtml(catName)}</span>
                    <h4 class="pub-card-title">${titleHTML}</h4>
                    ${item.Description ? `<p class="pub-card-desc">${highlightedDescText}</p>` : ''}
                    <div class="pub-card-tags">
                        <span class="pub-card-tag tag-type">${escapeHtml(typeTag)}</span>
                        ${otherTags.map(tag => `<span class="pub-card-tag">${escapeHtml(tag)}</span>`).join('')}
                    </div>
                </div>
            `;
        }
    });

    if (gridContainer) {
        if (totalMatches > 0) {
            gridContainer.innerHTML = html;
        } else {
            gridContainer.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 4rem 1rem; text-align: center; color: rgba(255,255,255,0.4);">
                    <i class="fas fa-search-minus" style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--accent); opacity: 0.6;"></i>
                    <p style="font-size: 1.1rem; margin: 0;">No results found matching your search.</p>
                    <p style="font-size: 0.9rem; color: rgba(255,255,255,0.35); margin-top: 0.25rem;">Try checking your spelling or searching for different keywords.</p>
                </div>
            `;
        }
    }

    if (countEl) {
        countEl.textContent = `Found ${totalMatches} matching entry${totalMatches === 1 ? '' : 'ies'}`;
    }
}

function getCategoryColor(index) {
    const colors = [
        "#9d4edd", // Books: Purple
        "#00b4d8", // Articles: Teal
        "#2ec4b6", // Chapters: Emerald Green
        "#ff9f1c", // Essays: Amber Orange
        "#ffd166", // Thesis: Gold Yellow
        "#ff5a5f", // Prof. Reports: Coral Red
        "#ff007f"  // Presentations: Pink
    ];
    return colors[index % colors.length];
}

function getTags(item) {
    const tags = [];
    
    // 1. Add Type as a tag
    if (item.Type && item.Type.trim()) {
        tags.push(item.Type.trim());
    }
    
    // 2. Extract Year
    const descText = item.Description || "";
    const titleText = item.Title || "";
    const combinedText = `${titleText} ${descText}`.toLowerCase();
    
    const yearMatch = combinedText.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch) {
        tags.push(yearMatch[0]);
    }
    
    // 3. Add thematic tags based on keywords
    if (combinedText.includes("lake") || combinedText.includes("water") || combinedText.includes("river") || combinedText.includes("drain") || combinedText.includes("wetland") || combinedText.includes("common")) {
        tags.push("Water Commons");
    }
    if (combinedText.includes("governance") || combinedText.includes("policy") || combinedText.includes("institution") || combinedText.includes("framework") || combinedText.includes("ostrom")) {
        tags.push("Governance");
    }
    if (combinedText.includes("urban") || combinedText.includes("city") || combinedText.includes("metropolitan") || combinedText.includes("planning") || combinedText.includes("space") || combinedText.includes("street")) {
        tags.push("Urban Design");
    }
    if (combinedText.includes("sustain") || combinedText.includes("resilien") || combinedText.includes("environment") || combinedText.includes("climate") || combinedText.includes("ecological")) {
        tags.push("Sustainability");
    }
    if (combinedText.includes("heritage") || combinedText.includes("culture") || combinedText.includes("traditional") || combinedText.includes("history")) {
        tags.push("Heritage");
    }
    if (combinedText.includes("gender") || combinedText.includes("women")) {
        tags.push("Gender");
    }
    
    // Return unique tags, max 4 tags
    return [...new Set(tags)].slice(0, 4);
}

function highlightText(text, keywords) {
    if (!text || !keywords || keywords.length === 0) return escapeHtml(text);
    
    let safeText = escapeHtml(text);
    let tempText = safeText;
    const sorted = [...keywords].sort((a, b) => b.length - a.length);
    
    sorted.forEach((kw, index) => {
        if (!kw) return;
        const escaped = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'gi');
        tempText = tempText.replace(regex, (match) => `\x00${index}\x01${match}\x02`);
    });
    
    tempText = tempText.replace(/\x00\d+\x01/g, '<span class="match-highlight">');
    tempText = tempText.replace(/\x02/g, '</span>');
    
    return tempText;
}

function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

