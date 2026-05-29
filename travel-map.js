// Travel Map Dashboard Logic
// Powered by Leaflet.js, CartoDB Dark Matter, and PapaParse CSV loader

class TravelMapController {
    constructor() {
        this.map = null;
        this.markers = [];
        this.travelRegistry = [];
        this.filteredData = [];
        this.activeCity = null;

        // Cache elements
        this.searchEl = document.getElementById("travel-search");
        this.suggestionsEl = document.getElementById("search-suggestions");
        this.detailsPanelEl = document.getElementById("details-panel");
        this.detailsContentEl = document.getElementById("details-content");
        this.detailsCloseBtnEl = document.getElementById("details-close");

        this.tableContainerEl = document.getElementById("travel-table-container");
        this.toggleTableBtnEl = document.getElementById("toggle-table-btn");
        this.toggleIconEl = document.getElementById("toggle-icon");
        
        // Custom Location Dropdown cache
        this.locationWrapperEl = document.getElementById("travel-location-wrapper");
        this.locationTriggerEl = document.getElementById("travel-location-trigger");
        this.locationOptionsEl = document.getElementById("travel-location-options");

        // Custom Category Dropdown cache
        this.categoryWrapperEl = document.getElementById("travel-category-wrapper");
        this.categoryTriggerEl = document.getElementById("travel-category-trigger");
        this.categoryOptionsEl = document.getElementById("travel-category-options");

        this.mapResetBtnEl = document.getElementById("map-reset-btn");

        this.init();
    }

    init() {
        const isMobile = window.innerWidth < 768;

        // Load cached stats or defaults and trigger initial animation from 0
        const hasCache = this.loadCachedStats();
        if (!hasCache) {
            const defaults = {
                countries: 18,
                cities: 46,
                talks: 42,
                regions: 5
            };
            Object.keys(defaults).forEach(key => {
                const el = document.getElementById(`stat-${key}`);
                if (el) {
                    this.animateCount(el, 0, defaults[key], 1000);
                }
            });
        }

        // Initialize Leaflet Map centered globally
        // scrollWheelZoom: false disables standard mouse scroll wheel zoom to avoid page scroll traps
        // touchZoom: true enables pinch-to-zoom touch gestures on mobile devices
        // worldCopyJump: false prevents coordinate resets/jumps when panning past boundaries
        this.map = L.map("travel-map", {
            center: isMobile ? [20, 10] : [25, 10],
            zoom: isMobile ? 1.5 : 2.5,
            minZoom: 1.5,
            maxZoom: 12,
            zoomControl: false,
            scrollWheelZoom: false,
            touchZoom: true,
            worldCopyJump: false,
            attributionControl: true
        });

        // Add custom Zoom Control
        L.control.zoom({ position: "topleft" }).addTo(this.map);

        // Add CartoDB Dark Matter tile layer (noWrap: true shows only one copy of the world, leaving a dark background beyond boundaries)
        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: "abcd",
            maxZoom: 20,
            noWrap: true
        }).addTo(this.map);

        this.bindEvents();

        // Load CSV Data
        this.loadCSVData();
    }

    bindEvents() {
        if (this.searchEl) {
            this.searchEl.addEventListener("input", () => this.handleSearchInput());
            this.searchEl.addEventListener("focus", () => this.handleSearchInput());
            
            document.addEventListener("click", (e) => {
                if (this.searchEl && !this.searchEl.contains(e.target) && this.suggestionsEl && !this.suggestionsEl.contains(e.target)) {
                    this.suggestionsEl.style.display = "none";
                }
            });
        }

        if (this.detailsCloseBtnEl) {
            this.detailsCloseBtnEl.addEventListener("click", () => this.hideDetails());
        }

        if (this.toggleTableBtnEl) {
            this.toggleTableBtnEl.addEventListener("click", () => this.toggleTable());
        }

        // Custom Location Dropdown trigger click handler
        if (this.locationTriggerEl && this.locationWrapperEl) {
            this.locationTriggerEl.addEventListener("click", (e) => {
                e.stopPropagation();
                this.locationWrapperEl.classList.toggle("open");
                if (this.categoryWrapperEl) this.categoryWrapperEl.classList.remove("open");
            });
        }

        // Custom Category Dropdown trigger click handler
        if (this.categoryTriggerEl && this.categoryWrapperEl) {
            this.categoryTriggerEl.addEventListener("click", (e) => {
                e.stopPropagation();
                this.categoryWrapperEl.classList.toggle("open");
                if (this.locationWrapperEl) this.locationWrapperEl.classList.remove("open");
            });
        }

        // Close Custom Dropdowns when clicking outside
        document.addEventListener("click", (e) => {
            if (this.locationWrapperEl && !this.locationWrapperEl.contains(e.target)) {
                this.locationWrapperEl.classList.remove("open");
            }
            if (this.categoryWrapperEl && !this.categoryWrapperEl.contains(e.target)) {
                this.categoryWrapperEl.classList.remove("open");
            }
        });

        // Bind Custom Category Dropdown selection click handlers
        if (this.categoryOptionsEl) {
            const options = this.categoryOptionsEl.querySelectorAll(".custom-option");
            options.forEach(opt => {
                opt.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const filterVal = opt.getAttribute("data-value");

                    // Highlight selected option
                    options.forEach(o => o.classList.remove("selected"));
                    opt.classList.add("selected");

                    // Update trigger text
                    if (this.categoryTriggerEl) {
                        const triggerText = opt.querySelector("span").textContent;
                        const span = this.categoryTriggerEl.querySelector("span");
                        if (span) span.textContent = triggerText;
                    }

                    // Close dropdown
                    if (this.categoryWrapperEl) {
                        this.categoryWrapperEl.classList.remove("open");
                    }

                    // Trigger filter change
                    this.handleFilterChange(filterVal);
                });
            });
        }

        // Map Reset button click handler
        if (this.mapResetBtnEl) {
            this.mapResetBtnEl.addEventListener("click", () => this.resetMap());
        }

        // Handle trackpad pinch-to-zoom centered on the cursor while ignoring standard mouse scroll wheel scrolling
        const mapContainer = document.getElementById("travel-map");
        if (mapContainer) {
            mapContainer.addEventListener("wheel", (e) => {
                if (e.ctrlKey) {
                    e.preventDefault(); // Stop browser webpage zoom
                    
                    // Zoom centered on cursor
                    const zoomFactor = 0.015; // Speed multiplier for trackpad pinch sensitivity
                    const zoomDelta = -e.deltaY * zoomFactor;
                    
                    const currentZoom = this.map.getZoom();
                    const targetZoom = Math.min(Math.max(currentZoom + zoomDelta, 1.5), 12);
                    
                    const latlng = this.map.mouseEventToLatLng(e);
                    this.map.setZoomAround(latlng, targetZoom, { animate: false });
                }
            }, { passive: false });
        }

        // Handle webpage size/zoom changes causing Leaflet gray tiles
        window.addEventListener("resize", () => {
            if (this.map) {
                this.map.invalidateSize();
            }
        });
    }

    loadCSVData() {
        const csvPath = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRe_Apew1QOi1mLUa91ZO8G0NpKX7S2c1puCQRI4IXe4Qdp01tGzM82e0DKTbDneNQpJydAwmZzGJuJ/pub?gid=0&single=true&output=csv';
        const separator = csvPath.includes('?') ? '&' : '?';
        const cacheBuster = `${separator}t=${new Date().getTime()}`;

        if (typeof Papa === 'undefined') {
            console.error("PapaParse is missing!");
            return;
        }

        Papa.parse(csvPath + cacheBuster, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                this.travelRegistry = results.data.map(row => ({
                    type: row.Type ? row.Type.trim() : "Lecture",
                    city: row.City ? row.City.trim() : "",
                    country: row.Country ? row.Country.trim() : "",
                    year: row.Year ? row.Year.trim() : "",
                    institution: row.Institution ? row.Institution.trim() : "",
                    title: row.Title ? row.Title.trim() : "",
                    description: row.Description ? row.Description.trim() : "",
                    link: row.Link ? row.Link.trim() : "",
                    lat: parseFloat(row.Latitude),
                    lng: parseFloat(row.Longitude)
                })).filter(item => !isNaN(item.lat) && !isNaN(item.lng));

                this.filteredData = [...this.travelRegistry];

                this.renderMarkers();
                this.updateStats(true);
                this.renderTable();
                this.populateLocationDropdown();
            },
            error: (err) => {
                console.error("Error loading travels CSV file:", err);
            }
        });
    }

    // ---------------------------------------------------------
    // STATS UPDATER & COUNT ANIMATOR
    // ---------------------------------------------------------
    updateStats(isInitial = false) {
        const uniqueCountries = new Set();
        const uniqueCities = new Set();
        let lecturesCount = 0;
        let researchCount = 0;

        this.filteredData.forEach(item => {
            if (item.country) uniqueCountries.add(item.country);
            if (item.city) uniqueCities.add(item.city);
            if (item.type === "Keynote" || item.type === "Lecture" || item.type === "Conference") {
                lecturesCount++;
            }
            if (item.type === "Research") {
                researchCount++;
            }
        });

        const stats = {
            countries: uniqueCountries.size,
            cities: uniqueCities.size,
            talks: lecturesCount,
            regions: researchCount
        };

        // Cache stats for offline access
        try {
            localStorage.setItem("mbb_travel_stats", JSON.stringify(stats));
        } catch (e) {
            console.warn("Unable to cache travel stats:", e);
        }

        // Numbers climbing animation from currently displayed value to target
        Object.keys(stats).forEach(key => {
            const el = document.getElementById(`stat-${key}`);
            if (el) {
                const targetVal = stats[key];
                // If we are already animating towards this target value, don't interrupt it!
                if (el._targetVal === targetVal) {
                    return;
                }
                const currentVal = parseInt(el.textContent) || 0;
                if (currentVal !== targetVal) {
                    this.animateCount(el, currentVal, targetVal, isInitial ? 1000 : 600);
                }
            }
        });
    }

    loadCachedStats() {
        try {
            const cached = localStorage.getItem("mbb_travel_stats");
            if (cached) {
                const stats = JSON.parse(cached);
                Object.keys(stats).forEach(key => {
                    const el = document.getElementById(`stat-${key}`);
                    if (el) {
                        this.animateCount(el, 0, stats[key], 1000);
                    }
                });
                return true;
            }
        } catch (e) {
            console.warn("Unable to load cached travel stats:", e);
        }
        return false;
    }

    animateCount(element, start, end, duration) {
        // Clear any existing timer on this element to prevent concurrent animation conflicts
        if (element._countTimer) {
            clearInterval(element._countTimer);
        }
        element._targetVal = end;

        if (start === end) {
            element.textContent = end;
            delete element._targetVal;
            return;
        }
        const range = end - start;
        let current = start;
        const increment = end > start ? 1 : -1;
        const stepTime = Math.max(Math.abs(Math.floor(duration / range)), 15);
        
        element._countTimer = setInterval(() => {
            current += increment;
            element.textContent = current;
            if (current === end) {
                clearInterval(element._countTimer);
                delete element._countTimer;
                delete element._targetVal;
            }
        }, stepTime);
    }

    // ---------------------------------------------------------
    // RENDER CITY MARKERS
    // ---------------------------------------------------------
    renderMarkers() {
        // Clear existing markers
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];

        // Group active data by city
        const cityGroups = {};
        this.filteredData.forEach(item => {
            const key = `${item.city}, ${item.country}`;
            if (!cityGroups[key]) {
                cityGroups[key] = {
                    city: item.city,
                    country: item.country,
                    lat: item.lat,
                    lng: item.lng,
                    events: []
                };
            }
            cityGroups[key].events.push(item);
        });

        // Create marker for each city group
        Object.values(cityGroups).forEach(group => {
            const pulsingIcon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="pulsing-marker"><div class="pulsing-marker-inner"></div></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });

            const marker = L.marker([group.lat, group.lng], { icon: pulsingIcon })
                .bindTooltip(`<strong>${group.city}</strong>, ${group.country === 'USA' ? 'United States' : group.country}`, {
                    direction: 'top',
                    offset: [0, -10],
                    className: 'map-tooltip'
                })
                .on('click', () => {
                    this.centerMapOnLocation(group.lat, group.lng, 6);
                    this.showCityDetails(group);
                });

            marker.addTo(this.map);
            this.markers.push(marker);
        });
    }

    centerMapOnLocation(lat, lng, zoom = 6) {
        // Set view to target LatLng and zoom level (no-animate to prevent projection glitches)
        this.map.setView([lat, lng], zoom, { animate: false });

        let offsetX = 0;
        let offsetY = 0;
        const isMobile = window.innerWidth < 768;

        if (isMobile) {
            // Mobile: details drawer sits at bottom (height 250px).
            // Shift camera down by 100px so marker moves up into top visible area.
            offsetY = 100;
        } else {
            // Desktop/Tablet: details panel sits on right.
            // Shift camera right by panelWidth / 2 so marker moves left into remaining area.
            const panelWidth = this.detailsPanelEl ? this.detailsPanelEl.offsetWidth : 380;
            offsetX = panelWidth / 2;
        }

        // Convert coordinates to screen pixel points, apply offset, and convert back to LatLng
        const targetPoint = this.map.latLngToContainerPoint([lat, lng]);
        const offsetPoint = L.point(targetPoint.x + offsetX, targetPoint.y + offsetY);
        const offsetLatLng = this.map.containerPointToLatLng(offsetPoint);

        // Smoothly pan to the offset coordinates
        this.map.panTo(offsetLatLng, { animate: true });
    }

    // ---------------------------------------------------------
    // CITY DETAIL DRAWER
    // ---------------------------------------------------------
    showCityDetails(group) {
        this.activeCity = group.city;

        let countryLabel = group.country;
        if (group.country === 'USA') countryLabel = 'United States';
        else if (group.country === 'UAE') countryLabel = 'United Arab Emirates';

        // Render Sidebar HTML Content
        let html = `
            <div class="details-header">
                <h3>${group.city}</h3>
                <div class="country-tag">
                    <i class="fas fa-globe-americas"></i> ${countryLabel}
                </div>
            </div>
            <div class="events-list">
        `;

        // Sort by year descending
        const sortedEvents = [...group.events].sort((a, b) => b.year.localeCompare(a.year));
        
        sortedEvents.forEach(ev => {
            const typeClass = `type-${ev.type.toLowerCase()}`;
            html += `
                <div class="event-item ${typeClass}" style="margin-top: 0.8rem;">
                    <div class="event-meta">
                        <span class="event-date">${ev.year}</span>
                        <span class="event-type-badge">${ev.type}</span>
                    </div>
                    <div class="event-title">${ev.title}</div>
                    <div class="event-institution">${ev.institution}</div>
                    <div class="event-desc">${ev.description}</div>
                    ${ev.link && ev.link !== "#" ? `<a href="${ev.link}" target="_blank" rel="noopener noreferrer" class="event-link">Explore Reference <i class="fas fa-external-link-alt" style="font-size: 0.8rem;"></i></a>` : ""}
                </div>
            `;
        });

        html += `</div>`;
        this.detailsContentEl.innerHTML = html;
        this.detailsPanelEl.classList.remove("details-panel-hidden");
    }

    hideDetails() {
        this.activeCity = null;
        this.detailsPanelEl.classList.add("details-panel-hidden");
        
        setTimeout(() => {
            this.detailsContentEl.innerHTML = `
                <div class="details-placeholder">
                    <i class="fas fa-map-marker-alt placeholder-icon"></i>
                    <h3>Select a city on the map</h3>
                    <p>Click on any pulsing yellow marker to explore the travel details, institutions visited, and talks delivered.</p>
                </div>
            `;
        }, 500);
    }

    // ---------------------------------------------------------
    // RENDER GLASSMORPHIC TRAVEL LOG TABLE
    // ---------------------------------------------------------
    renderTable() {
        const tableBody = document.getElementById("travel-table-body");
        if (!tableBody) return;

        if (this.filteredData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-secondary);">
                        <i class="fas fa-exclamation-circle" style="margin-right: 8px;"></i> No records match the current category.
                    </td>
                </tr>
            `;
            return;
        }

        // Sort chronological descending (newest first)
        const sortedData = [...this.filteredData].sort((a, b) => b.year.localeCompare(a.year));

        let html = "";
        sortedData.forEach(row => {
            const countryLabel = row.country === 'USA' ? 'United States' : (row.country === 'UAE' ? 'United Arab Emirates' : row.country);
            const location = `${row.city}, ${countryLabel}`;
            const typeClass = `badge-${row.type.toLowerCase()}`;
            
            const referenceLink = row.link && row.link !== "#" 
                ? `<a href="${row.link}" target="_blank" rel="noopener noreferrer" class="table-link">Explore Reference <i class="fas fa-external-link-alt" style="font-size: 0.75rem;"></i></a>`
                : `<span style="color: rgba(255,255,255,0.25); font-size: 0.85rem;">N/A</span>`;

            html += `
                <tr>
                    <td style="font-weight: 600; color: #ffcc00;">${row.year}</td>
                    <td style="font-weight: 600; color: #fff;">${location}</td>
                    <td style="font-style: italic; color: rgba(255, 255, 255, 0.75);">${row.institution || "Self-Initiated Travel"}</td>
                    <td><span class="table-badge ${typeClass}">${row.type}</span></td>
                    <td style="color: rgba(255,255,255,0.8);">${row.description}</td>
                    <td style="text-align: center;">${referenceLink}</td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
    }

    toggleTable() {
        if (!this.tableContainerEl) return;

        const isVisible = this.tableContainerEl.classList.toggle("table-container-visible");
        
        if (isVisible) {
            if (this.toggleIconEl) this.toggleIconEl.style.transform = "rotate(180deg)";
            // Scroll down smoothly to show table
            setTimeout(() => {
                this.tableContainerEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        } else {
            if (this.toggleIconEl) this.toggleIconEl.style.transform = "rotate(0deg)";
        }
    }

    // ---------------------------------------------------------
    // LOCATION SELECT DROPDOWN POPULATION & INTERACTION
    // ---------------------------------------------------------
    populateLocationDropdown() {
        const optionsContainer = this.locationOptionsEl;
        if (!optionsContainer) return;

        // Group unique locations and sort alphabetically by City
        const locationsMap = {};
        this.travelRegistry.forEach(item => {
            const key = `${item.city}, ${item.country}`;
            if (!locationsMap[key]) {
                let countryLabel = item.country;
                if (item.country === 'USA') countryLabel = 'United States';
                else if (item.country === 'UAE') countryLabel = 'United Arab Emirates';

                locationsMap[key] = {
                    city: item.city,
                    country: countryLabel,
                    lat: item.lat,
                    lng: item.lng
                };
            }
        });

        const sortedLocations = Object.values(locationsMap).sort((a, b) => a.city.localeCompare(b.city));

        let html = "";
        sortedLocations.forEach(loc => {
            html += `
                <div class="custom-option" data-city="${loc.city}" data-lat="${loc.lat}" data-lng="${loc.lng}" data-country="${loc.country}">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${loc.city}, ${loc.country}</span>
                </div>
            `;
        });

        optionsContainer.innerHTML = html;

        const options = optionsContainer.querySelectorAll(".custom-option");
        options.forEach(opt => {
            opt.addEventListener("click", (e) => {
                e.stopPropagation();
                const city = opt.getAttribute("data-city");
                const lat = parseFloat(opt.getAttribute("data-lat"));
                const lng = parseFloat(opt.getAttribute("data-lng"));
                const country = opt.getAttribute("data-country");

                // Highlight selected option
                options.forEach(o => o.classList.remove("selected"));
                opt.classList.add("selected");

                // Update trigger text
                if (this.locationTriggerEl) {
                    const span = this.locationTriggerEl.querySelector("span");
                    if (span) span.textContent = `${city}, ${country}`;
                }

                // Reset category filter & stats to "All Journeys" so the user can inspect all events for that city
                if (this.categoryTriggerEl) {
                    const span = this.categoryTriggerEl.querySelector("span");
                    if (span) span.textContent = "All Journeys";
                }
                if (this.categoryOptionsEl) {
                    const options = this.categoryOptionsEl.querySelectorAll(".custom-option");
                    options.forEach(opt => {
                        if (opt.getAttribute("data-value") === "all") {
                            opt.classList.add("selected");
                        } else {
                            opt.classList.remove("selected");
                        }
                    });
                }
                this.filteredData = [...this.travelRegistry];
                this.renderMarkers();
                this.updateStats();
                this.renderTable();

                // Reset autocomplete search input
                if (this.searchEl) this.searchEl.value = city;

                // Pan and zoom map to targeted coordinates with offset
                this.centerMapOnLocation(lat, lng, 6);

                // Find corresponding marker events and display details
                const matches = this.travelRegistry.filter(item => item.city === city);
                const cityGroup = {
                    city: city,
                    country: country,
                    events: matches
                };
                this.showCityDetails(cityGroup);

                // Close dropdown
                if (this.locationWrapperEl) {
                    this.locationWrapperEl.classList.remove("open");
                }
            });
        });
    }

    resetMap() {
        const isMobile = window.innerWidth < 768;
        this.map.setView(isMobile ? [20, 10] : [25, 10], isMobile ? 1.5 : 2.5);

        if (this.categoryTriggerEl) {
            const span = this.categoryTriggerEl.querySelector("span");
            if (span) span.textContent = "All Journeys";
        }
        if (this.categoryOptionsEl) {
            const options = this.categoryOptionsEl.querySelectorAll(".custom-option");
            options.forEach(opt => {
                if (opt.getAttribute("data-value") === "all") {
                    opt.classList.add("selected");
                } else {
                    opt.classList.remove("selected");
                }
            });
        }
        if (this.searchEl) this.searchEl.value = "";

        if (this.locationTriggerEl) {
            const span = this.locationTriggerEl.querySelector("span");
            if (span) span.textContent = "Jump to Location...";
        }

        if (this.locationOptionsEl) {
            const options = this.locationOptionsEl.querySelectorAll(".custom-option");
            options.forEach(opt => opt.classList.remove("selected"));
        }

        this.filteredData = [...this.travelRegistry];
        this.hideDetails();

        this.renderMarkers();
        this.updateStats();
        this.renderTable();
    }

    // ---------------------------------------------------------
    // SEARCH & AUTOCOMPLETE CONTROLLERS
    // ---------------------------------------------------------
    handleSearchInput() {
        const query = this.searchEl.value.trim().toLowerCase();
        
        if (!query) {
            this.suggestionsEl.style.display = "none";
            return;
        }

        // Group matched cities to avoid duplicate suggestions
        const matchedCities = {};
        this.filteredData.forEach(item => {
            const matchesQuery = 
                item.city.toLowerCase().includes(query) ||
                item.country.toLowerCase().includes(query) ||
                item.institution.toLowerCase().includes(query) ||
                item.title.toLowerCase().includes(query);

            if (matchesQuery) {
                const key = `${item.city}, ${item.country}`;
                if (!matchedCities[key]) {
                    let countryLabel = item.country;
                    if (item.country === 'USA') countryLabel = 'United States';
                    else if (item.country === 'UAE') countryLabel = 'United Arab Emirates';

                    matchedCities[key] = {
                        city: item.city,
                        country: countryLabel,
                        lat: item.lat,
                        lng: item.lng,
                        count: 0
                    };
                }
                matchedCities[key].count++;
            }
        });

        const citiesList = Object.values(matchedCities);

        if (citiesList.length === 0) {
            this.suggestionsEl.innerHTML = `
                <div class="suggestion-item" style="cursor: default; pointer-events: none;">
                    <i class="fas fa-exclamation-circle"></i> No locations found
                </div>
            `;
            this.suggestionsEl.style.display = "block";
            return;
        }

        let html = "";
        citiesList.forEach(cObj => {
            html += `
                <div class="suggestion-item" data-city="${cObj.city}" data-lat="${cObj.lat}" data-lng="${cObj.lng}">
                    <i class="fas fa-map-marker-alt"></i>
                    <div>
                        <strong>${cObj.city}</strong>, <span style="font-size:0.85rem; color:var(--text-secondary);">${cObj.country}</span>
                        <div style="font-size:0.75rem; color:rgba(255,255,255,0.4); margin-top:2px;">
                            ${cObj.count} ${cObj.count === 1 ? 'record' : 'records'} found
                        </div>
                    </div>
                </div>
            `;
        });

        this.suggestionsEl.innerHTML = html;
        this.suggestionsEl.style.display = "block";

        const items = this.suggestionsEl.querySelectorAll(".suggestion-item");
        items.forEach(el => {
            el.addEventListener("click", () => {
                const city = el.getAttribute("data-city");
                const lat = parseFloat(el.getAttribute("data-lat"));
                const lng = parseFloat(el.getAttribute("data-lng"));
                
                // Set view and select with offset
                this.centerMapOnLocation(lat, lng, 6);

                // Find corresponding marker event group to show details
                const countryLabel = el.querySelector('span').textContent;
                const matches = this.filteredData.filter(item => {
                    const normCountry = item.country === 'USA' ? 'United States' : (item.country === 'UAE' ? 'United Arab Emirates' : item.country);
                    return item.city === city && normCountry === countryLabel;
                });
                
                const cityGroup = {
                    city: city,
                    country: countryLabel,
                    events: matches
                };
                this.showCityDetails(cityGroup);

                // Reset suggestions
                this.searchEl.value = city;
                this.suggestionsEl.style.display = "none";
            });
        });
    }

    // ---------------------------------------------------------
    // CATEGORY FILTER LOGIC
    // ---------------------------------------------------------
    handleFilterChange(filterVal) {

        // Close details panel
        this.hideDetails();

        // Apply filters
        if (filterVal === "all") {
            this.filteredData = [...this.travelRegistry];
        } else {
            this.filteredData = this.travelRegistry.filter(item => item.type === filterVal);
        }

        // Re-render markers and stats and table
        this.renderMarkers();
        this.updateStats();
        this.renderTable();

        // Clear search and location dropdown selection
        if (this.searchEl) this.searchEl.value = "";
        if (this.locationTriggerEl) {
            const span = this.locationTriggerEl.querySelector("span");
            if (span) span.textContent = "Jump to Location...";
        }
        if (this.locationOptionsEl) {
            const options = this.locationOptionsEl.querySelectorAll(".custom-option");
            options.forEach(opt => opt.classList.remove("selected"));
        }

        // Auto-fit bounds of remaining markers (or reset to default centered view for "all")
        if (filterVal === "all") {
            const isMobile = window.innerWidth < 768;
            this.map.setView(isMobile ? [20, 10] : [25, 10], isMobile ? 1.5 : 2.5);
        } else if (this.markers.length > 0) {
            const group = new L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds().pad(0.15), {
                maxZoom: 4,
                animate: true
            });
        }
    }
}

// Bootstrap
document.addEventListener("DOMContentLoaded", () => {
    window.travelMap = new TravelMapController();
});
