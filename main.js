document.addEventListener('DOMContentLoaded', function() {
  // 'Add Point' butonuna tıklama olay dinleyicisi ekle
  document.querySelector('.add-point').addEventListener('click', function() {
    openAddPointPanel();  // 'Add Point' tıklandığında paneli aç
  });

  // 'Query' butonuna tıklama olay dinleyicisi ekle
  document.querySelector('.query').addEventListener('click', function() {
    openQueryPanel();  // 'Query' tıklandığında paneli aç
  });
});

// 'Add Point' panelini oluşturma ve açma fonksiyonu
function openAddPointPanel() {
  jsPanel.create({
    theme: 'dark',  // Panel teması
    headerTitle: 'Add Point',  // Panel başlığı
    panelSize: {
      width: () => { return Math.min(400, window.innerWidth * 0.8);},  // Panel genişliği
      height: () => { return Math.min(300, window.innerHeight * 0.5);}  // Panel yüksekliği
    },
    animateIn: 'jsPanelFadeIn',  // Panel giriş animasyonu
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
    `,  // Panel içeriği, 3 input alanı içeriyor
    onwindowresize: true,  // Pencere yeniden boyutlandırıldığında panel boyutunu güncelle
  });

  // Form gönderimini işle
  document.getElementById('point-form').addEventListener('submit', function(event) {
    event.preventDefault();  // Formun varsayılan gönderimini durdur

    const XCoordinate = parseFloat(document.getElementById('x-input').value);
    const YCoordinate = parseFloat(document.getElementById('y-input').value);
    const Name = document.getElementById('name-input').value;
    
    // ID'yi buradan dinamik olarak belirlemelisiniz
    // const Id = 6 // Örnek olarak dinamik bir ID oluşturuluyor

    console.log('Gönderilen veriler:', {XCoordinate, YCoordinate, Name });  // Girdi değerlerini kontrol et

    // Veriyi sunucuya gönder
    fetch('http://localhost:5275/api/Home', {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({XCoordinate, YCoordinate, Name }),  // Veriyi JSON olarak gönder
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

// // 'Query' panelini oluşturma ve açma fonksiyonu
// function openQueryPanel() {
//   fetch('http://localhost:5275/api/Home')
//     .then(response => response.json())
//     .then(points => {
//       let tableRows = '';
      
//       points.forEach(point => {
//         tableRows += `
//           <tr>
//             <td>${point.xCoordinate}</td>
//             <td>${point.yCoordinate}</td>
//             <td>${point.name}</td>
//             <td>
//               <button onclick="showPoint(${point.id})">Show</button>
//               <button onclick="updatePoint(${point.id})">Update</button>
//               <button onclick="deletePoint(${point.id})">Delete</button>
//             </td>
//           </tr>
//         `;
//       });

//       jsPanel.create({
//         theme: 'dark',
//         headerTitle: 'Query Points',
//         panelSize: {
//           width: () => { return Math.min(500, window.innerWidth * 0.8);},
//           height: () => { return Math.min(400, window.innerHeight * 0.6);}
//         },
//         animateIn: 'jsPanelFadeIn',
//         content: `
//           <div class="panel-content">
//             <h3>Saved Points</h3>
//             <table>
//               <thead>
//                 <tr>
//                   <th>X</th>
//                   <th>Y</th>
//                   <th>Name</th>
//                   <th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 ${tableRows}
//               </tbody>
//             </table>
//           </div>
//         `,
//         onwindowresize: true,
//       });
//     })
//     .catch((error) => {
//       console.error('Hata:', error);
//     });
// }

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
