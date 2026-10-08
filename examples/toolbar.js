import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Control from '../src/ol/control/Control.js';
import FullScreen from '../src/ol/control/FullScreen.js';
import Rotate from '../src/ol/control/Rotate.js';
import Toolbar from '../src/ol/control/Toolbar.js';
import Zoom from '../src/ol/control/Zoom.js';
import ZoomToExtent from '../src/ol/control/ZoomToExtent.js';
import {defaults as defaultControls} from '../src/ol/control/defaults.js';
import TileLayer from '../src/ol/layer/Tile.js';
import {fromLonLat} from '../src/ol/proj.js';
import OSM from '../src/ol/source/OSM.js';

const view = new View({
  center: [0, 0],
  zoom: 2,
});

//
// A vertical toolbar in the upper left corner, with the zoom controls.
//

const navigation = new Toolbar({position: 'top-left'});
navigation.addControl(new Zoom());
navigation.addControl(
  new ZoomToExtent({extent: view.getProjection().getExtent()}),
);

//
// A horizontal toolbar in the upper right corner, with the rotate and full
// screen controls.
//

const display = new Toolbar({position: 'top-right', orientation: 'horizontal'});
display.addControl(new Rotate({autoHide: false}));
display.addControl(new FullScreen());

//
// Custom controls with a button to fly to a place.
//

/**
 * @param {Toolbar} toolbar Toolbar to add the controls to.
 * @param {Array} places Label, name and longitude/latitude of each place.
 */
function addPlaces(toolbar, places) {
  places.forEach(([label, name, lonLat]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.title = 'Fly to ' + name;
    button.textContent = label;
    button.addEventListener('click', () =>
      view.animate({center: fromLonLat(lonLat), zoom: 11, duration: 1000}),
    );
    const element = document.createElement('div');
    element.className = 'place ol-unselectable ol-control';
    element.appendChild(button);
    toolbar.addControl(new Control({element: element}));
  });
}

//
// A horizontal toolbar at the bottom of the map.
//

const places = new Toolbar({
  position: 'bottom-center',
  orientation: 'horizontal',
});
addPlaces(places, [
  ['AMS', 'Amsterdam', [4.9, 52.37]],
  ['CMB', 'Colombo', [79.86, 6.93]],
  ['NYC', 'New York', [-74.0, 40.71]],
]);

//
// A horizontal toolbar outside the map, in the element with id 'toolbar'.
//

const external = new Toolbar({
  orientation: 'vertical',
  target: 'external-toolbar',
});
addPlaces(external, [
  ['BUE', 'Buenos Aires', [-58.38, -34.6]],
  ['LOS', 'Lagos', [3.38, 6.52]],
  ['TYO', 'Tokyo', [139.69, 35.69]],
]);

//
// Create the map. The default zoom and rotate controls are replaced by the
// toolbars, only the attribution control is kept. The external toolbar is
// added to the map like any other control.
//

const map = new Map({
  controls: defaultControls({zoom: false, rotate: false}).extend([
    navigation,
    display,
    places,
    external,
  ]),
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  target: 'map',
  view: view,
});
