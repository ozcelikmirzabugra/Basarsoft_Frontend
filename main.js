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
                    alert('Point added successfully!');
                    panel.close();
                })
                .catch((error) => {
                    console.error('Error:', error);
                    alert('Failed to add point: ' + error.message);
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
                    width: () => { return Math.min(500, window.innerWidth * 0.8); },
                    height: () => { return Math.min(400, window.innerHeight * 0.6); }
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
        highlightPointOnMap(point.WKT);
    })
    .catch(error => {
        // console.error('Error fetching point:', error);
        // alert('Failed to fetch point details: ' + error.message);
    });
}

function updatePoint(id) {
    const newName = prompt('Enter a new name for this point:');
    
    if (newName === null) {
        return;
    }

    const trimmedName = newName.trim();
    if (!trimmedName) {
        alert('Name cannot be empty.');
        return;
    }

    fetch(`http://localhost:5275/api/Home/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, Name: trimmedName }),
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(text); });
        }
        return response.json();
    })
    .then(data => {
        console.log('Point updated successfully:', data);
        // alert('Point updated successfully!');
        refreshQueryPanel();
    })
    .catch((error) => {
        console.error('Error updating point:', error);
        // alert('Failed to update point: ' + error.message);
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
            alert('Please select a geometry type before drawing.');
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
}

function highlightPointOnMap(WKT) {
    if (!window.map) {
        alert('Map is not initialized.');
        return;
    }

    const format = new ol.format.WKT();
    const feature = format.readFeature(WKT, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
    });

    const vectorSource = new ol.source.Vector({
        features: [feature],
    });

    const vectorLayer = new ol.layer.Vector({
        source: vectorSource,
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

    window.map.addLayer(vectorLayer);
    window.map.getView().fit(vectorSource.getExtent(), { duration: 1000 });
}

document.addEventListener('DOMContentLoaded', init);
