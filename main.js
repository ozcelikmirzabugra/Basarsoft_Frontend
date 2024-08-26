document.addEventListener('DOMContentLoaded', function() {
document.querySelector('.add-point').addEventListener('click', function() {
    openAddPointPanel(); 
});

document.querySelector('.query').addEventListener('click', function() {
    openQueryPanel(); 
});
});

function openAddPointPanel() {
jsPanel.create({
    theme: 'dark', 
    headerTitle: 'Add Point',
    panelSize: {
        width: () => { return Math.min(400, window.innerWidth * 0.8);},  
        height: () => { return Math.min(300, window.innerHeight * 0.5);} 
    },
    animateIn: 'jsPanelFadeIn', 
    content: `
        <div class="panel-content">
            <h3>Enter Point Details</h3>
            <form id="point-form">
                <div class="input-group">
                    <label for="wkt-input">WKT:</label>
                    <input type="text" id="wkt-input" name="x" required>
                </div>
                <div class="input-group">
                    <label for="name-input">Name:</label>
                    <input type="text" id="name-input" name="name" required>
                </div>
                <div class="input-group">
                    <button type="submit">Save</button>
                </div>
            </form>
        </div>
    `, 
    onwindowresize: true,
});

document.getElementById('point-form').addEventListener('submit', function(event) {
event.preventDefault();  // Prevent the default form submission behavior

const WKT = document.getElementById('wkt-input').value;  // Make sure this input exists in your form
const Name = document.getElementById('name-input').value;

// Check the structure of the data being sent
console.log('Gönderilen veriler:', { WKT, Name });

// Send the data to the server
fetch('http://localhost:5275/api/Home', {
    method: 'POST',
    headers: {
    'Accept': '*/*',
    'Content-Type': 'application/json',
    },
    body: JSON.stringify({ WKT, Name }),  // Ensure that the property names match your model
})
.then(response => {
    if (!response.ok) {
    return response.text().then(text => { throw new Error(text); });
    }
    return response.json();
})
.then(data => {
    console.log('Başarılı:', data);
})
.catch((error) => {
    console.error('Hata:', error);
});
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
.then(points => {
    if (!Array.isArray(points)) {
        points = [points];
    }

    let tableRows = '';
    points.forEach(point => {
        console.log('Point ID:', point.id);
        tableRows += `
            <tr>
                <td>${point.WKT}</td>
                <td>${point.Name}</td>
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
                <table>
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
        onwindowresize: true,
    });
})
.catch((error) => {
    console.error('Hata:', error);
});
}

function showPoint(id) {
fetch('http://localhost:5275/api/Home')
.then(response => response.json())
.then(points => {
    console.log('Points:', points);
})
.catch(error => {
    console.error('Error fetching points:', error);
});
}

function updatePoint(id) {
const newName = prompt('Enter a new name for this point:');

if (newName) {
    fetch(`http://localhost:5275/api/Home/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, Name: newName }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Point updated successfully:', data);
    })
    .catch((error) => {
        console.error('Error updating point:', error);
    });
}
}

function deletePoint(id) {
if (confirm('Are you sure you want to delete this point?')) {
    fetch(`http://localhost:5275/api/Home/${id}`, {
        method: 'DELETE',
    })
    .then(response => response.json())
    .then(data => {
        console.log('Point deleted successfully:', data);
    })
    .catch((error) => {
        console.error('Error deleting point:', error);
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
    title: 'Opening Screen',
    visible: true,
    source: new ol.source.OSM()
});
}

function init() {
var mapView = createMapView([35.3597, 39.6334], 7);
var map = createMap('map', mapView);

map.addLayer(createOSMLayer());

const source = new ol.source.Vector();
const vector = new ol.layer.Vector({
    source: source,
    style: {
        'fill-color': 'rgba(255, 255, 255, 0.2)',
        'stroke-color': '#ffcc33',
        'stroke-width': 2,
        'circle-radius': 7,
        'circle-fill-color': '#ffcc33',
    },
});

map.addLayer(vector);

const modify = new ol.interaction.Modify({source: source});
map.addInteraction(modify);

let draw, snap; // global so we can remove them later
const typeSelect = document.getElementById('type');

function addInteractions() {
    draw = new ol.interaction.Draw({
        source: source,
        type: typeSelect.value,
    });
    map.addInteraction(draw);
    snap = new ol.interaction.Snap({ source: source });
    map.addInteraction(snap);

    draw.on('drawend', function (event) {
        const geometry = event.feature.getGeometry();
        const format = new ol.format.WKT();
        const wkt = format.writeGeometry(geometry);
        console.log('WKT:', wkt);  // Log the WKT string to the console

        // Automatically save to the database with an empty name
        fetch('http://localhost:5275/api/Home', {
            method: 'POST',
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ WKT: wkt, Name: '' }),  // Send WKT with an empty name
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { throw new Error(text); });
            }
            return response.json();
        })
        .then(data => {
            console.log('Geometry saved successfully:', data);
        })
        .catch(error => {
            console.error('Error saving geometry:', error);
        });
    });
}



typeSelect.onchange = function () {
    map.removeInteraction(draw);
    map.removeInteraction(snap);
    addInteractions();
};

addInteractions();
}

window.onload = init;
