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
            <label for="x-input">X:</label>
            <input type="text" id="x-input" name="x" required>
          </div>
          <div class="input-group">
            <label for="y-input">Y:</label>
            <input type="text" id="y-input" name="y" required>
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
    event.preventDefault(); 

    const XCoordinate = parseFloat(document.getElementById('x-input').value);
    const YCoordinate = parseFloat(document.getElementById('y-input').value);
    const Name = document.getElementById('name-input').value;

    console.log('Gönderilen veriler:', {XCoordinate, YCoordinate, Name });

    fetch('http://localhost:5275/api/Home', {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({XCoordinate, YCoordinate, Name }),  
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
          <td>${point.XCoordinate}</td>
          <td>${point.YCoordinate}</td>
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
                <th>X</th>
                <th>Y</th>
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


// Harita görünümünü oluşturma fonksiyonu
function createMapView(centerCoords, zoomLevel) {
  return new ol.View({
    center: ol.proj.fromLonLat(centerCoords),
    zoom: zoomLevel
  });
}

// Haritayı oluşturma fonksiyonu
function createMap(targetId, view) {
  return new ol.Map({
    target: targetId,
    view: view
  });
}

// OSM katmanını oluşturma fonksiyonu
function createOSMLayer() {
  return new ol.layer.Tile({
    title: 'Opening Screen',
    visible: true,
    source: new ol.source.OSM()
  });
}

// Haritayı başlatmak için ana fonksiyon
function init() {
  var mapView = createMapView([35.3597, 39.6334], 7);
  var map = createMap('map', mapView);

  map.addLayer(createOSMLayer());
}

window.onload = init;
