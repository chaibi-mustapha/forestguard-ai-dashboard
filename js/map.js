/* ============================================
   Map Module — Leaflet.js Map with Cell Grid
   ============================================ */
window.MapManager = {
    map: null,
    stationMarkers: {},
    gridLayer: null,
    fireCircle: null,
    selectionCircle: null,
    alertPopup: null,

    // Forest center coordinates (example: Mediterranean forest area)
    center: [43.25, 2.85],
    zoom: 12,

    // Station definitions with GPS coordinates
    stations: [
        { id: 'A1', lat: 43.30, lng: 2.78, name: 'Station A1' },
        { id: 'A2', lat: 43.30, lng: 2.83, name: 'Station A2' },
        { id: 'A3', lat: 43.30, lng: 2.88, name: 'Station A3' },
        { id: 'A4', lat: 43.30, lng: 2.93, name: 'Station A4' },
        { id: 'B1', lat: 43.26, lng: 2.78, name: 'Station B1' },
        { id: 'B2', lat: 43.26, lng: 2.83, name: 'Station B2' },
        { id: 'B3', lat: 43.26, lng: 2.88, name: 'Station B3' },
        { id: 'B4', lat: 43.26, lng: 2.93, name: 'Station B4' },
        { id: 'C1', lat: 43.22, lng: 2.78, name: 'Station C1' },
        { id: 'C2', lat: 43.22, lng: 2.83, name: 'Station C2' },
        { id: 'C3', lat: 43.22, lng: 2.88, name: 'Station C3' },
        { id: 'C4', lat: 43.22, lng: 2.93, name: 'Station C4' },
    ],

    /**
     * Initialize the Leaflet map
     */
    init() {
        this.map = L.map('map', {
            center: this.center,
            zoom: this.zoom,
            zoomControl: false,
            attributionControl: false
        });

        // Dark satellite tile layer
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 18,
        }).addTo(this.map);

        // Add zoom control to bottom-right
        L.control.zoom({ position: 'bottomright' }).addTo(this.map);

        // Add station markers
        this.addStationMarkers();

        // Add cell grid
        this.addCellGrid();

        // Fit map bounds to show all stations and grid beautifully
        const bounds = L.latLngBounds(this.stations.map(s => [s.lat, s.lng]));
        this.map.fitBounds(bounds, { padding: [40, 40] });

        // Fix map rendering
        setTimeout(() => {
            this.map.invalidateSize();
            this.map.fitBounds(bounds, { padding: [40, 40] });
        }, 200);
    },

    /**
     * Create custom tower icon
     */
    createStationIcon(status = 'online') {
        const colors = {
            online: '#10B981',
            alert: '#EF4444',
            offline: '#64748b'
        };

        return L.divIcon({
            className: 'station-marker',
            html: `
                <div style="
                    width: 28px; height: 28px;
                    background: ${colors[status]}22;
                    border: 2px solid ${colors[status]};
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    position: relative;
                    ${status === 'alert' ? 'animation: markerPulse 1.5s infinite;' : ''}
                ">
                    <div style="
                        width: 10px; height: 10px;
                        background: ${colors[status]};
                        border-radius: 50%;
                    "></div>
                    ${status === 'alert' ? `<div style="
                        position: absolute;
                        width: 40px; height: 40px;
                        border: 2px solid ${colors[status]}80;
                        border-radius: 50%;
                        animation: markerRipple 2s infinite;
                        top: -8px; left: -8px;
                    "></div>` : ''}
                </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        });
    },

    /**
     * Add station markers to the map
     */
    addStationMarkers() {
        // Add CSS animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes markerPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.15); }
            }
            @keyframes markerRipple {
                0% { transform: scale(1); opacity: 0.6; }
                100% { transform: scale(2); opacity: 0; }
            }
            .station-marker { background: transparent !important; border: none !important; }
        `;
        document.head.appendChild(style);

        this.stations.forEach(s => {
            const marker = L.marker([s.lat, s.lng], {
                icon: this.createStationIcon('online')
            }).addTo(this.map);

            let tooltipContent = `<strong>${s.id}</strong><br>${s.name}`;
            if (s.id === 'A3') tooltipContent += `<br><span style="color:#ef4444;font-weight:700;">🔥 Active Forest Fire</span>`;
            else if (s.id === 'C2') tooltipContent += `<br><span style="color:#f59e0b;font-weight:700;">💨 Cabin Smoke / Ecobuage</span>`;
            else if (s.id === 'B1') tooltipContent += `<br><span style="color:#60a5fa;font-weight:700;">🌫️ Dense Forest Fog (Safe)</span>`;
            else if (s.id === 'B2' || s.id === 'B3') tooltipContent += `<br><span style="color:#a78bfa;font-weight:700;">🌫️ Foggy Forest Town (Safe)</span>`;
            else tooltipContent += `<br><span style="color:#10b981;font-weight:700;">✅ Clear Conditions (Safe)</span>`;

            marker.bindTooltip(tooltipContent, {
                className: 'station-tooltip',
                direction: 'top',
                offset: [0, -16]
            });

            // Click handler to select the station
            marker.on('click', () => {
                if (typeof window.handleStationClick === 'function') {
                    window.handleStationClick(s.id);
                }
            });

            // Add a label
            const label = L.marker([s.lat, s.lng], {
                icon: L.divIcon({
                    className: 'station-label-icon',
                    html: `<span style="
                        font-size:10px;
                        font-weight:700;
                        color:rgba(255,255,255,0.7);
                        font-family:'JetBrains Mono',monospace;
                        text-shadow: 0 1px 4px rgba(0,0,0,0.8);
                        pointer-events:none;
                    ">${s.id}</span>`,
                    iconSize: [30, 14],
                    iconAnchor: [15, -12]
                }),
                interactive: false
            }).addTo(this.map);

            this.stationMarkers[s.id] = { marker, label };
        });

        // Tooltip style
        const tooltipStyle = document.createElement('style');
        tooltipStyle.textContent = `
            .station-tooltip {
                background: rgba(17, 24, 39, 0.95) !important;
                border: 1px solid rgba(255,255,255,0.1) !important;
                color: #f1f5f9 !important;
                font-family: 'Inter', sans-serif !important;
                font-size: 11px !important;
                border-radius: 6px !important;
                padding: 6px 10px !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
            }
            .station-tooltip::before {
                border-top-color: rgba(17, 24, 39, 0.95) !important;
            }
            .station-label-icon { background: transparent !important; border: none !important; }
        `;
        document.head.appendChild(tooltipStyle);
    },

    /**
     * Add cell grid overlay
     */
    addCellGrid() {
        const gridStyle = {
            color: '#10B981', // Vibrant emerald green to match active antennas
            weight: 2,        // Clearly visible thickness
            dashArray: '8,6', // Tech dashed border look
            fillColor: 'rgba(16, 185, 129, 0.04)', // Subtle tactical green background fill for the cells
            fillOpacity: 0.1,
            interactive: false
        };

        const cells = [];
        const latStep = 0.04;
        const lngStep = 0.05;
        const startLat = 43.32;
        const startLng = 2.755;

        const cellIds = [
            ['A1', 'A2', 'A3', 'A4'],
            ['B1', 'B2', 'B3', 'B4'],
            ['C1', 'C2', 'C3', 'C4']
        ];

        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 4; c++) {
                const lat1 = startLat - r * latStep;
                const lat2 = lat1 - latStep;
                const lng1 = startLng + c * lngStep;
                const lng2 = lng1 + lngStep;

                const id = cellIds[r][c];
                let currentStyle = { ...gridStyle };

                if (id === 'A3') {
                    // Active major forest fire sector (Red)
                    currentStyle.color = '#EF4444';
                    currentStyle.fillColor = 'rgba(239, 68, 68, 0.15)';
                } else if (id === 'C2') {
                    // Small cabin fire / agricultural ecobuage sector (Orange)
                    currentStyle.color = '#F59E0B';
                    currentStyle.fillColor = 'rgba(245, 158, 11, 0.15)';
                } else if (id === 'B1') {
                    // Low visibility forest fog (Blue)
                    currentStyle.color = '#60A5FA';
                    currentStyle.fillColor = 'rgba(96, 165, 250, 0.15)';
                } else if (id === 'B2' || id === 'B3') {
                    // Valley town fog and low brume (Purple)
                    currentStyle.color = '#A78BFA';
                    currentStyle.fillColor = 'rgba(167, 139, 250, 0.15)';
                }

                cells.push(L.rectangle([[lat1, lng1], [lat2, lng2]], currentStyle));
            }
        }

        this.gridLayer = L.layerGroup(cells).addTo(this.map);
    },

    /**
     * Toggle grid visibility
     */
    toggleGrid() {
        if (this.map.hasLayer(this.gridLayer)) {
            this.map.removeLayer(this.gridLayer);
        } else {
            this.gridLayer.addTo(this.map);
        }
    },

    /**
     * Show fire alert on map at a specific station
     */
    showFireAlert(stationId, radius = 800) {
        const station = this.stations.find(s => s.id === stationId);
        if (!station) return;

        // Update marker icon to alert
        if (this.stationMarkers[stationId]) {
            this.stationMarkers[stationId].marker.setIcon(this.createStationIcon('alert'));
        }

        // Remove old fire circle
        if (this.fireCircle) {
            this.map.removeLayer(this.fireCircle);
        }

        // Add fire danger zone
        this.fireCircle = L.circle([station.lat, station.lng], {
            radius: radius,
            color: '#EF4444',
            fillColor: '#EF4444',
            fillOpacity: 0.15,
            weight: 2,
            dashArray: '8,4',
            className: 'fire-zone'
        }).addTo(this.map);

        // Show alert popup
        const popup = L.popup({
            className: 'fire-popup',
            closeButton: false,
            autoClose: false,
            closeOnClick: false,
            offset: [0, -10]
        })
        .setLatLng([station.lat, station.lng])
        .setContent(`
            <div style="
                background:rgba(185,28,28,0.95);
                color:#FEF2F2;
                padding:10px 14px;
                border-radius:8px;
                font-family:'Inter',sans-serif;
                min-width:180px;
            ">
                <div style="font-weight:800;font-size:12px;margin-bottom:6px">⚠️ FIRE DETECTED</div>
                <div style="font-size:11px">📍 ${station.id} — Lat ${station.lat.toFixed(3)}, Lng ${station.lng.toFixed(3)}</div>
                <div style="font-size:11px">🔥 Estimated zone: ~${(radius * radius * Math.PI / 10000).toFixed(1)} ha</div>
            </div>
        `)
        .openOn(this.map);

        this.alertPopup = popup;

        // Fire popup style
        const fireStyle = document.createElement('style');
        fireStyle.textContent = `
            .fire-popup .leaflet-popup-content-wrapper { background: transparent !important; box-shadow: none !important; border: none !important; }
            .fire-popup .leaflet-popup-content { margin: 0 !important; }
            .fire-popup .leaflet-popup-tip { display: none !important; }
        `;
        document.head.appendChild(fireStyle);

        // Fly to fire location
        this.map.flyTo([station.lat, station.lng], 13, { duration: 1.5 });

        // Show map overlay
        const overlay = document.getElementById('map-overlay');
        const overlayLoc = document.getElementById('overlay-location');
        const overlayArea = document.getElementById('overlay-area');
        if (overlay) {
            overlay.style.display = 'block';
            overlayLoc.textContent = `Lat ${station.lat.toFixed(3)}, Lon ${station.lng.toFixed(3)}`;
            overlayArea.textContent = `${(radius * radius * Math.PI / 10000).toFixed(1)} ha`;
        }
    },

    /**
     * Clear fire alert from map
     */
    clearFireAlert() {
        if (this.fireCircle) {
            this.map.removeLayer(this.fireCircle);
            this.fireCircle = null;
        }
        if (this.alertPopup) {
            this.map.closePopup(this.alertPopup);
            this.alertPopup = null;
        }

        // Reset all markers
        this.stations.forEach(s => {
            if (this.stationMarkers[s.id]) {
                this.stationMarkers[s.id].marker.setIcon(this.createStationIcon('online'));
            }
        });

        // Hide map overlay
        const overlay = document.getElementById('map-overlay');
        if (overlay) overlay.style.display = 'none';
    },

    /**
     * Focus the map on a specific station
     */
    focusStation(stationId) {
        const station = this.stations.find(s => s.id === stationId);
        if (station && this.map) {
            this.map.flyTo([station.lat, station.lng], 13, { duration: 1.2 });
            
            // Handle Selection Circle
            if (this.selectionCircle) {
                this.map.removeLayer(this.selectionCircle);
            }

            this.selectionCircle = L.circle([station.lat, station.lng], {
                radius: 400,
                color: '#3B82F6',
                fillColor: '#3B82F6',
                fillOpacity: 0.1,
                weight: 2,
                dashArray: '5,5',
                className: 'selection-circle'
            }).addTo(this.map);

            // Open tooltip briefly
            if (this.stationMarkers[stationId]) {
                this.stationMarkers[stationId].marker.openTooltip();
                setTimeout(() => this.stationMarkers[stationId].marker.closeTooltip(), 3000);
            }
        }
    },

    /**
     * Center map
     */
    centerMap() {
        if (this.selectionCircle) {
            this.map.removeLayer(this.selectionCircle);
            this.selectionCircle = null;
        }
        const bounds = L.latLngBounds(this.stations.map(s => [s.lat, s.lng]));
        this.map.flyToBounds(bounds, { padding: [40, 40], duration: 1 });
    }
};
