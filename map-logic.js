// 1. Initialize Map
var map = L.map('map').setView([1.3521, 103.8198], 12);
let taggedData = {}; 
let markerList = []; // Array to store markers for filtering and searching

// 2. Load clean CartoDB Voyager tiles
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

// 3. Mapping Dictionary for category colors and text
const typeMap = {
    'B&L': { text: 'Boring and Lifeless', cssClass: 'pin-bl' },
    'C&T': { text: 'Calm and Tranquil', cssClass: 'pin-ct' },
    'F&E': { text: 'Full of Life and Exciting', cssClass: 'pin-fe' },
    'C&R': { text: 'Chaotic and Restless', cssClass: 'pin-cr' },
    '-':   { text: 'Unspecified', cssClass: 'pin-dash' }
};

// 4. Modal close logic
function closeModal() {
    const modal = document.getElementById('video-modal');
    modal.classList.remove('active');
    modal.style.display = 'none';
    document.getElementById('video-player-container').innerHTML = '';
    document.getElementById('type-display').innerHTML = 'Select a location on the map to view its soundscape type.';
}
document.getElementById('close-modal').onclick = closeModal;

// 5. Load Tagged_30s.csv first
Papa.parse("Tagged_30s.csv", {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
        results.data.forEach(row => {
            const id = row.Title ? row.Title.trim() : null;
            if (id) {
                if (!taggedData[id]) taggedData[id] = [];
                taggedData[id].push(row);
            }
        });
        // Load map markers only after tags are ready
        loadLocations();
    }
});

// 6. Load locations.csv and build markers
function loadLocations() {
    Papa.parse("locations.csv", {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            results.data.forEach(function(row) {
                if (row.Latitude && row.Longitude) {
                    const title = row.Title ? row.Title.trim() : ""; 
                    const typeKey = row.Type ? row.Type.trim() : "-";
                    const category = typeMap[typeKey] || typeMap['-'];

                    var customIcon = L.divIcon({
                        className: 'custom-pin ' + category.cssClass,
                        iconSize: [16, 16],
                        iconAnchor: [8, 8]
                    });

                    var marker = L.marker([parseFloat(row.Latitude), parseFloat(row.Longitude)], { icon: customIcon }).addTo(map);
                    
                    // Assign category AND title to the marker, then store it
                    marker.category = typeKey; 
                    marker.title = title;
                    markerList.push(marker);

                    marker.on('click', function() {
                        updateDisplay(row, title);
                        openVideoModal(row);
                    });
                }
            });
            
            // Initialize filter checkbox listeners and search bar once pins are loaded
            initFilters();
            initSearch();
        }
    });
}

// 7. Filter Logic
function initFilters() {
    const checkboxes = document.querySelectorAll('.type-filter');
    
    checkboxes.forEach(box => {
        box.addEventListener('change', function() {
            // Identify which categories are currently checked
            const activeCategories = Array.from(checkboxes)
                .filter(c => c.checked)
                .map(c => c.value);

            // Toggle marker visibility based on the checked categories
            markerList.forEach(marker => {
                if (activeCategories.includes(marker.category)) {
                    map.addLayer(marker);
                } else {
                    map.removeLayer(marker);
                }
            });
        });
    });
}

// 8. Dynamic UI Update
function updateDisplay(row, title) {
    const displayEl = document.getElementById('type-display');
    const timeEntries = taggedData[title] || [];

    if (timeEntries.length === 0) {
        displayEl.innerHTML = `Location: <strong>${title}</strong> | No tagged data found.`;
        return;
    }

    let html = `Location: <strong>${title}</strong> | <label style="margin-right: 5px;">Select Time: </label>`;
    html += `<select id="time-selector">`;
    timeEntries.forEach((entry, index) => {
        html += `<option value="${index}">${entry.time_lapsed_min} mins</option>`;
    });
    html += `</select>`;
    html += `<span id="dynamic-badge"></span>`;
    
    displayEl.innerHTML = html;

    const selector = document.getElementById('time-selector');
    const badge = document.getElementById('dynamic-badge');

    const refreshBadge = () => {
        const entry = timeEntries[selector.value];
        if (entry && entry.Type) {
            const cat = typeMap[entry.Type.trim()] || typeMap['-'];
            badge.className = 'type-badge ' + cat.cssClass;
            badge.innerText = cat.text;
            
            // Re-trigger the pulse animation (optional extra flair)
            badge.classList.remove('pulse');
            void badge.offsetWidth;
            badge.classList.add('pulse');
        }
    };

    selector.addEventListener('change', refreshBadge);
    refreshBadge();
}

// 9. Video Modal display
function openVideoModal(row) {
    const modal = document.getElementById('video-modal');
    const container = document.getElementById('video-player-container');
    modal.style.display = 'flex';
    modal.classList.add('active');
    container.innerHTML = `<h3>${row.Title}</h3><iframe src="${row.vidEmbed}" frameborder="0" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
}

// 10. Search Bar Autocomplete Logic
function initSearch() {
    const searchInput = document.getElementById('location-search');
    const suggestionsBox = document.getElementById('search-suggestions');

    // Make sure the elements exist in HTML before adding event listeners
    if(!searchInput || !suggestionsBox) return;

    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        suggestionsBox.innerHTML = ''; 
        
        if (!query) {
            suggestionsBox.style.display = 'none';
            return;
        }

        // Filter stored markers based on the title
        const matches = markerList.filter(marker => marker.title.toLowerCase().includes(query));

        if (matches.length > 0) {
            suggestionsBox.style.display = 'block';
            
            matches.forEach(match => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                
                // Highlight the searched text within the result
                const regex = new RegExp(`(${query})`, "gi");
                div.innerHTML = match.title.replace(regex, "<strong>$1</strong>");
                
                div.onclick = () => {
                    searchInput.value = match.title; // Fill the input
                    suggestionsBox.style.display = 'none'; // Close suggestions
                    
                    // Center the map on the marker and trigger the marker click
                    map.flyTo(match.getLatLng(), 15, { animate: true, duration: 1.5 });
                    match.fire('click'); 
                };
                suggestionsBox.appendChild(div);
            });
        } else {
            suggestionsBox.style.display = 'block';
            suggestionsBox.innerHTML = '<div class="suggestion-item" style="color:#999; cursor:default;">No locations found</div>';
        }
    });

    // Close the dropdown if clicking anywhere else
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
            suggestionsBox.style.display = 'none';
        }
    });
}