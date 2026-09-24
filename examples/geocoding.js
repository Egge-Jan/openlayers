import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import Overlay from '../src/ol/Overlay.js';
import View from '../src/ol/View.js';
import Control from '../src/ol/control/Control.js';
import {defaults as defaultControls} from '../src/ol/control/defaults.js';
import Point from '../src/ol/geom/Point.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import {fromLonLat, transformExtent} from '../src/ol/proj.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';
import {Circle, Fill, Stroke, Style} from '../src/ol/style.js';

const nominatim =
  'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=10&q=';

const searchIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ' +
  'stroke="currentColor" stroke-width="2.5" stroke-linecap="round">' +
  '<circle cx="10" cy="10" r="6"/><path d="M14.5 14.5 21 21"/></svg>';

const markerStyle = new Style({
  image: new Circle({
    radius: 7,
    fill: new Fill({color: '#00aaff'}),
    stroke: new Stroke({color: 'white', width: 2}),
  }),
});

//
// Define the search control. It adds a marker layer and a popup overlay
// to the map it is attached to.
//

class SearchControl extends Control {
  constructor() {
    const element = document.createElement('div');
    element.className = 'ol-search ol-control';
    element.innerHTML =
      '<input type="search" placeholder="Search a place">' +
      '<button type="button" title="Search">' +
      searchIcon +
      '</button>' +
      '<ul></ul>';
    super({element: element});

    this.input_ = element.querySelector('input');
    this.list_ = element.querySelector('ul');
    this.results_ = [];
    this.index_ = -1;

    this.source_ = new VectorSource();
    this.layer_ = new VectorLayer({source: this.source_, style: markerStyle});

    const popup = document.createElement('div');
    popup.className = 'ol-popup';
    popup.innerHTML = '<a href="#" class="ol-popup-closer">✖</a><div></div>';
    this.content_ = popup.lastElementChild;
    this.popup_ = new Overlay({
      element: popup,
      positioning: 'bottom-center',
      offset: [0, -12],
    });

    element.querySelector('button').addEventListener('click', () => {
      element.classList.toggle('ol-search-expanded');
      this.input_.focus();
    });
    popup.firstElementChild.addEventListener('click', (event) => {
      event.preventDefault();
      this.clear();
    });
    this.input_.addEventListener('input', () => {
      this.hideResults_();
      if (!this.input_.value) {
        this.clear();
      }
    });
    this.input_.addEventListener('keydown', this.handleKey_.bind(this));
    this.list_.addEventListener('click', (event) => {
      const item = event.target.closest('li');
      this.select_(Array.from(this.list_.children).indexOf(item));
    });
  }

  /**
   * @param {import("../src/ol/Map.js").default|null} map Map.
   * @override
   */
  setMap(map) {
    const oldMap = this.getMap();
    if (oldMap) {
      oldMap.removeLayer(this.layer_);
      oldMap.removeOverlay(this.popup_);
    }
    super.setMap(map);
    if (map) {
      map.addLayer(this.layer_);
      map.addOverlay(this.popup_);
    }
  }

  /**
   * @param {KeyboardEvent} event Keyboard event.
   * @private
   */
  handleKey_(event) {
    const count = this.results_.length;
    if (event.key === 'ArrowDown' && count) {
      this.highlight_(Math.min(this.index_ + 1, count - 1));
    } else if (event.key === 'ArrowUp' && count) {
      this.highlight_(Math.max(this.index_ - 1, 0));
    } else if (event.key === 'Enter' && count) {
      this.select_(Math.max(this.index_, 0));
    } else if (event.key === 'Enter') {
      this.search_();
    } else {
      return;
    }
    event.preventDefault();
  }

  /**
   * Send the search request to Nominatim and show the results.
   * @private
   */
  search_() {
    const query = this.input_.value.trim();
    if (!query) {
      return;
    }
    fetch(nominatim + encodeURIComponent(query))
      .then((response) => response.json())
      .then((results) => {
        this.showResults_(results);
        if (results.length === 1) {
          this.select_(0);
        }
      })
      .catch(() => this.showResults_([]));
  }

  /**
   * @param {Array<Object>} results Nominatim results.
   * @private
   */
  showResults_(results) {
    this.results_ = results;
    this.index_ = -1;
    this.list_.replaceChildren(
      ...results.map((result) => {
        const item = document.createElement('li');
        item.textContent = result.display_name;
        return item;
      }),
    );
    if (!results.length) {
      this.list_.innerHTML = '<li>No results</li>';
    }
  }

  /**
   * @private
   */
  hideResults_() {
    this.results_ = [];
    this.index_ = -1;
    this.list_.replaceChildren();
  }

  /**
   * @param {number} index Index of the result to highlight.
   * @private
   */
  highlight_(index) {
    this.index_ = index;
    Array.from(this.list_.children).forEach((item, i) =>
      item.classList.toggle('ol-search-active', i === index),
    );
  }

  /**
   * Mark the selected result on the map and zoom to it.
   * @param {number} index Index of the selected result.
   * @private
   */
  select_(index) {
    const result = this.results_[index];
    if (!result) {
      return;
    }
    const coordinate = fromLonLat([Number(result.lon), Number(result.lat)]);
    const [south, north, west, east] = result.boundingbox.map(Number);
    const view = this.getMap().getView();
    this.input_.value = result.display_name;
    this.hideResults_();
    this.source_.clear();
    this.source_.addFeature(new Feature(new Point(coordinate)));
    this.content_.textContent = result.display_name;
    this.popup_.setPosition(coordinate);
    view.fit(
      transformExtent(
        [west, south, east, north],
        'EPSG:4326',
        view.getProjection(),
      ),
      {maxZoom: 16, duration: 500},
    );
  }

  /**
   * Remove the marker and the popup, and empty the search field.
   */
  clear() {
    this.input_.value = '';
    this.hideResults_();
    this.source_.clear();
    this.popup_.setPosition(undefined);
  }
}

//
// Create the map with the search control instead of the rotate control.
//

const map = new Map({
  controls: defaultControls({rotate: false}).extend([new SearchControl()]),
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
    enableRotation: false,
  }),
});
