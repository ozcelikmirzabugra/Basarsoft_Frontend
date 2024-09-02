document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('.add-point').addEventListener('click', function() {
        openAddPointPanel(); 
    });

    document.querySelector('.query').addEventListener('click', function() {
        openQueryPanel(); 
    });
});

function openAddPointPanel(WKT = '', Name = '') {
    jsPanel.create({
        theme: 'dark', 
        headerTitle: 'Add Point',
        panelSize: {
            width: () => { return Math.min(400, window.innerWidth * 0.8); },  
            height: () => { return Math.min(300, window.innerHeight * 0.5); } 
        },
        animateIn: 'jsPanelFadeIn', 
        content: `
            <div class="panel-content">
                <h3>Enter Point Details</h3>
                <form id="point-form">
                    <div class="input-group">
                        <label for="wkt-input">WKT:</label>
                        <input type="text" id="wkt-input" name="wkt" required value="${WKT}">
                    </div>
                    <div class="input-group">
                        <label for="name-input">Name:</label>
                        <input type="text" id="name-input" name="name" required value="${Name}">
                    </div>
                    <div class="input-group">
                        <button type="submit">Save</button>
                    </div>
                </form>
            </div>
        `, 
        callback: function(panel) {
            document.getElementById('point-form').addEventListener('submit', function(event) {
                event.preventDefault();

                const WKT = document.getElementById('wkt-input').value.trim();
                const Name = document.getElementById('name-input').value.trim();

                if (!WKT || !Name) {
                    alert('Please fill in both WKT and Name fields.');
                    return;
                }

                console.log('Submitted data:', { WKT, Name });

                fetch('http://localhost:5275/api/Home', {
                    method: 'POST',
                    headers: {
                        'Accept': '*/*',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ WKT, Name }),  
                })
                .then(response => {
                    if (!response.ok) {
                        return response.text().then(text => { throw new Error(text); });
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Success:', data);
                    // alert('Point added successfully!'); // TODO
                    panel.close();
                })
                .catch((error) => {
                    console.error('Error:', error);
                    // alert('Failed to add point: ' + error.message);
                });
            });
        },
        onwindowresize: true,
    });
}


function openQueryPanel() {
    fetch('http://localhost:5275/api/Home')
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(text); });
        }
        return response.json();
    })
    .then(result => {
        console.log('Full API response:', result); 

        if (result.data) {
            let points = result.data;
            if (!Array.isArray(points)) {
                points = [points];
            }

            // console.log('Parsed points:', points);

            let tableRows = '';
            points.forEach(point => {
                tableRows += `
                    <tr>
                        <td>${point.wkt}</td>
                        <td>${point.name}</td>
                        <td>
                            <button onclick="showPoint(${point.id})">Show</button>
                            <button onclick="updatePoint(${point.id})">Update</button>
                            <button onclick="deletePoint(${point.id})">Delete</button>
                        </td>
                    </tr>
                `;
            });

            jsPanel.create({
                theme: 'dark',
                headerTitle: 'Query Points',
                panelSize: {
                    width: () => { return Math.min(800, window.innerWidth * 0.8); },
                    height: () => { return Math.min(800, window.innerHeight * 0.6); }
                },
                animateIn: 'jsPanelFadeIn',
                content: `
                    <div class="panel-content">
                        <h3>Saved Points</h3>
                        <table id="points-table" class="display">
                            <thead>
                                <tr>
                                    <th>WKT</th>
                                    <th>Name</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRows}
                            </tbody>
                        </table>
                    </div>
                `,
                callback: function(panel) {
                    $('#points-table').DataTable();  
                },
                onwindowresize: true,
            });
        } else {
            console.error('Unexpected response format:', result);
            // alert('Failed to fetch points: Unexpected response format');
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        // alert('Failed to fetch points: ' + error.message);
    });
}



function showPoint(id) {
    fetch(`http://localhost:5275/api/Home/${id}`)
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(text); });
        }
        return response.json();
    })
    .then(point => {
        console.log('Point details:', point);

        const wkt = point.data.wkt;
        console.log('WKT data:', wkt);

        try {
            const format = new ol.format.WKT();
            const feature = format.readFeature(wkt);

            const geometry = feature.getGeometry();
            highlightGeometryOnMap(geometry);

            // Close the Query Points Panel
            const queryPanel = document.querySelector('.jsPanel-content');
            if (queryPanel) {
                queryPanel.parentElement.close(); // Assuming .jsPanel-content is the class for your panel
            }
        } catch (error) {
            console.error('Error parsing WKT:', error);
        }
    })
    .catch(error => {
        console.error('Error fetching point:', error);
    });
}




function extractCoordsFromWKT(wkt) {
    // Example function to extract coordinates from WKT string
    const match = wkt.match(/\(([^)]+)\)/);
    return match ? match[1].split(' ').map(Number) : [0, 0];
}


let isUpdating = false; // Güncelleme modunu kontrol etmek için değişken
let updateFeature = null; // Güncellenen özelliği saklamak için değişken
let clickCount = 0; // Tıklama sayısını takip etmek için değişken
let lastCoordinate = null; // Son tıklanan koordinat

function updatePoint(id) {
    isUpdating = true;
    clickCount = 0; // Reset click count
    lastCoordinate = null; // Reset last coordinate

    fetch(`http://localhost:5275/api/Home/${id}`)
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(text); });
        }
        return response.json();
    })
    .then(point => {
        const wkt = point.data.wkt;
        console.log('WKT data:', wkt);

        // Close the Query Points Panel
        const queryPanel = document.querySelector('.jsPanel-content');
        if (queryPanel) {
            queryPanel.parentElement.close(); // Assuming .jsPanel-content is the class for your panel
        }

        const format = new ol.format.WKT();
        const feature = format.readFeature(wkt);
        const geometry = feature.getGeometry();

        // Remove previous vector layers before adding updated ones
        const layers = window.map.getLayers().getArray();
        layers.forEach(layer => {
            if (layer instanceof ol.layer.Vector) {
                window.map.removeLayer(layer);
            }
        });

        // Create new vector layer with updated feature
        const vectorSource = new ol.source.Vector({
            features: [feature]
        });

        const vectorLayer = new ol.layer.Vector({
            source: vectorSource,
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                }),
                stroke: new ol.style.Stroke({
                    color: '#ffcc33',
                    width: 2
                }),
                image: new ol.style.Circle({
                    radius: 7,
                    fill: new ol.style.Fill({
                        color: '#ffcc33'
                    })
                })
            })
        });

        window.map.addLayer(vectorLayer);

        // Enable drag-and-drop for the feature
        const modifyInteraction = new ol.interaction.Modify({
            features: new ol.Collection([feature]),
        });
        window.map.addInteraction(modifyInteraction);

        let updatedWKT = '';

        modifyInteraction.on('modifyend', function(event) {
            const modifiedGeometry = event.features.item(0).getGeometry();
            updatedWKT = format.writeGeometry(modifiedGeometry);
            console.log('Updated WKT:', updatedWKT);

            fetch(`http://localhost:5275/api/Home/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id, WKT: updatedWKT }),
            })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => { throw new Error(text); });
                }
                return response.json();
            })
            .then(data => {
                console.log('Point updated successfully:', data);
                window.map.removeInteraction(modifyInteraction);  // Disable editing after updating
                isUpdating = false; // End updating mode

                // When you click twice to the same point, show updated WKT
                window.map.on('click', function(event) {
                    if (isUpdating) {
                        const coordinate = event.coordinate;
                        if (lastCoordinate && clickCount > 0) {
                            const distance = ol.sphere.getDistance(lastCoordinate, coordinate);
                            if (distance < 10) { // Set distance tolerance (e.g., 10 meters)
                                clickCount++;
                            } else {
                                clickCount = 1;
                            }
                        } else {
                            clickCount = 1;
                        }
                        lastCoordinate = coordinate;

                        if (clickCount === 2) { // End update on 2nd click
                            clickCount = 0; // Reset click count

                            // Show panel with updated WKT
                            openCoordinatesPanel(coordinate, updatedWKT);
                        }
                    }
                });
            })
            .catch((error) => {
                console.error('Error updating point:', error);
            });
        });
    })
    .catch(error => {
        console.error('Error fetching point:', error);
    });
}


function loadExistingPolygons() {
    // Remove previous vector layers if any
    const layers = window.map.getLayers().getArray();
    layers.forEach(layer => {
        if (layer instanceof ol.layer.Vector) {
            window.map.removeLayer(layer);
        }
    });

    fetch('http://localhost:5275/api/Home')
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(text); });
        }
        return response.json();
    })
    .then(result => {
        if (result.data) {
            let points = result.data;
            if (!Array.isArray(points)) {
                points = [points];
            }

            const format = new ol.format.WKT();
            const features = points.map(point => {
                const feature = format.readFeature(point.wkt);
                return feature;
            });

            const vectorSource = new ol.source.Vector({
                features: features
            });

            const vectorLayer = new ol.layer.Vector({
                source: vectorSource,
                style: new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#ffcc33',
                        width: 2
                    }),
                    image: new ol.style.Circle({
                        radius: 7,
                        fill: new ol.style.Fill({
                            color: '#ffcc33'
                        })
                    })
                })
            });

            window.map.addLayer(vectorLayer);
        } else {
            console.error('Unexpected response format:', result);
        }
    })
    .catch((error) => {
        console.error('Error loading polygons:', error);
    });
}



function openCoordinatesPanel(coordinate, updatedWKT) {
    jsPanel.create({
        theme: 'dark',
        headerTitle: 'Updated Coordinates',
        panelSize: {
            width: () => { return Math.min(400, window.innerWidth * 0.8); },
            height: () => { return Math.min(300, window.innerHeight * 0.5); }
        },
        animateIn: 'jsPanelFadeIn',
        content: `
            <div class="panel-content">
                <h3>Updated Feature Details</h3>
                <p>Coordinates: ${coordinate.join(', ')}</p>
                <p>Updated WKT: ${updatedWKT}</p>
                <button onclick="this.parentElement.parentElement.close()">Close</button>
            </div>
        `,
        onwindowresize: true,
    });
}



function finishUpdate() {
    // Güncellemeyi bitir ve panel aç
    isUpdating = false;
    window.map.removeInteraction(window.map.getInteractions().getArray().find(interaction => interaction instanceof ol.interaction.Modify));
    // alert('Update finished!');
    openUpdatePanel(); // Güncelleme panelini aç
}

function openUpdatePanel(WKT = '', Name = '') {
    jsPanel.create({
        theme: 'dark',
        headerTitle: 'Update Point Details',
        panelSize: {
            width: () => { return Math.min(400, window.innerWidth * 0.8); },
            height: () => { return Math.min(300, window.innerHeight * 0.5); }
        },
        animateIn: 'jsPanelFadeIn',
        content: `
            <div class="panel-content">
                <h3>Update Point Details</h3>
                <form id="update-form">
                    <div class="input-group">
                        <label for="wkt-input">WKT:</label>
                        <input type="text" id="wkt-input" name="wkt" required value="${WKT}">
                    </div>
                    <div class="input-group">
                        <label for="name-input">Name:</label>
                        <input type="text" id="name-input" name="name" value="${Name}">
                    </div>
                    <div class="input-group">
                        <button type="submit">Save</button>
                    </div>
                </form>
            </div>
        `,
        callback: function(panel) {
            document.getElementById('update-form').addEventListener('submit', function(event) {
                event.preventDefault();

                const updatedWKT = document.getElementById('wkt-input').value.trim();
                const updatedName = document.getElementById('name-input').value.trim();

                if (!updatedWKT) {
                    alert('WKT field is required.');
                    return;
                }

                console.log('Updated data:', { updatedWKT, updatedName });

                fetch(`http://localhost:5275/api/Home/${pointId}`, {
                    method: 'PUT',
                    headers: {
                        'Accept': '*/*',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ WKT: updatedWKT, Name: updatedName }),
                })
                .then(response => {
                    if (!response.ok) {
                        return response.text().then(text => { throw new Error(text); });
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Update successful:', data);
                    panel.close(); // Paneli kapat
                })
                .catch((error) => {
                    console.error('Error updating point:', error);
                });
            });
        },
        onwindowresize: true,
    });
}





function deletePoint(id) {
    if (confirm('Are you sure you want to delete this point?')) {
        fetch(`http://localhost:5275/api/Home/${id}`, {
            method: 'DELETE',
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { throw new Error(text); });
            }
            return response.json();
        })
        .then(data => {
            console.log('Point deleted successfully:', data);
            // alert('Point deleted successfully!');
            refreshQueryPanel();
        })
        .catch((error) => {
            console.error('Error deleting point:', error);
            // alert('Failed to delete point: ' + error.message);
        });
    }
    // refreshQueryPanel(); 
}

function createMapView(centerCoords, zoomLevel) {
    return new ol.View({
        center: ol.proj.fromLonLat(centerCoords),
        zoom: zoomLevel
    });
}

function createMap(targetId, view) {
    return new ol.Map({
        target: targetId,
        view: view
    });
}

function createOSMLayer() {
    return new ol.layer.Tile({
        title: 'OpenStreetMap',
        visible: true,
        source: new ol.source.OSM()
    });
}

function init() {
    var mapView = createMapView([35.3597, 39.6334], 7);
    window.map = createMap('map', mapView);

    map.addLayer(createOSMLayer());

    const source = new ol.source.Vector();
    const vector = new ol.layer.Vector({
        source: source,
        style: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.2)',
            }),
            stroke: new ol.style.Stroke({
                color: '#ffcc33',
                width: 2,
            }),
            image: new ol.style.Circle({
                radius: 7,
                fill: new ol.style.Fill({
                    color: '#ffcc33',
                }),
            }),
        }),
    });

    map.addLayer(vector);

    const modify = new ol.interaction.Modify({source: source});
    map.addInteraction(modify);

    let draw, snap;
    const typeSelect = document.getElementById('type');

    function addInteractions() {
        const geometryType = typeSelect.value;
        if (!geometryType) {
            // alert('Please select a geometry type before drawing.');
            return;
        }
    
        draw = new ol.interaction.Draw({
            source: source,
            type: geometryType,
        });
        map.addInteraction(draw);
        snap = new ol.interaction.Snap({ source: source });
        map.addInteraction(snap);
    
        draw.on('drawend', function (event) {
            const geometry = event.feature.getGeometry();
            const format = new ol.format.WKT();
            const WKT = format.writeGeometry(geometry);
            console.log('WKT:', WKT);
    
            // Open the "Add Point" panel with WKT and empty Name
            openAddPointPanel(WKT);
        });
    }
    

    typeSelect.addEventListener('change', function () {
        map.removeInteraction(draw);
        map.removeInteraction(snap);
        addInteractions();
    });

    addInteractions();

    // Load existing polygons on map initialization
    loadExistingPolygons();
}


function highlightPointOnMap(coords) {
    if (!window.map) {
        alert('Map is not initialized.');
        return;
    }

    try {
        // Ensure coords is an array with two elements (longitude and latitude)
        if (!Array.isArray(coords) || coords.length !== 2) {
            throw new Error('Invalid coordinates format.');
        }

        // Convert coordinates to OpenLayers format
        const [x, y] = coords;

        // Assuming coords are in EPSG:4326 (longitude, latitude), you might not need conversion
        const feature = new ol.Feature({
            geometry: new ol.geom.Point(ol.proj.fromLonLat([x, y])),
            name: 'Highlighted Point'
        });

        // Create a vector source and layer to display the feature
        const vectorSource = new ol.source.Vector({
            features: [feature]
        });

        const vectorLayer = new ol.layer.Vector({
            source: vectorSource,
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                }),
                stroke: new ol.style.Stroke({
                    color: '#ffcc33',
                    width: 2
                }),
                image: new ol.style.Circle({
                    radius: 7,
                    fill: new ol.style.Fill({
                        color: '#ffcc33'
                    })
                })
            })
        });

        // Remove any previous vector layers to avoid clutter
        const layers = window.map.getLayers().getArray();
        layers.forEach(layer => {
            if (layer instanceof ol.layer.Vector) {
                window.map.removeLayer(layer);
            }
        });

        // Add the new vector layer to the map
        window.map.addLayer(vectorLayer);

        // Fit the map view to the extent of the feature
        window.map.getView().fit(vectorSource.getExtent(), { duration: 1000, padding: [50, 50, 50, 50] });
    } catch (error) {
        console.error('Error highlighting point on map:', error);
    }
}

function highlightGeometryOnMap(geometry) {
    if (!window.map) {
        alert('Map is not initialized.');
        return;
    }

    try {
        const feature = new ol.Feature({
            geometry: geometry,
            name: 'Highlighted Feature'
        });

        const vectorSource = new ol.source.Vector({
            features: [feature]
        });

        const vectorLayer = new ol.layer.Vector({
            source: vectorSource,
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                }),
                stroke: new ol.style.Stroke({
                    color: '#ffcc33',
                    width: 2
                }),
                image: new ol.style.Circle({
                    radius: 7,
                    fill: new ol.style.Fill({
                        color: '#ffcc33'
                    })
                })
            })
        });

        const layers = window.map.getLayers().getArray();
        layers.forEach(layer => {
            if (layer instanceof ol.layer.Vector) {
                window.map.removeLayer(layer);
            }
        });

        window.map.addLayer(vectorLayer);
        window.map.getView().fit(vectorSource.getExtent(), { duration: 1000, padding: [50, 50, 50, 50] });
    } catch (error) {
        console.error('Error highlighting geometry on map:', error);
    }
}






document.addEventListener('DOMContentLoaded', init);

