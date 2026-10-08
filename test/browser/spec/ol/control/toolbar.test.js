import {assert} from 'chai';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import Control from '../../../../../src/ol/control/Control.js';
import Rotate from '../../../../../src/ol/control/Rotate.js';
import Toolbar from '../../../../../src/ol/control/Toolbar.js';
import Zoom from '../../../../../src/ol/control/Zoom.js';
import '../../../../../src/ol/ol.css';

describe('ol/control/Toolbar', function () {
  let map, target;

  beforeEach(function () {
    target = createMapDiv(400, 300);
    target.style.left = '0';
    target.style.top = '0';
    map = new Map({
      target: target,
      controls: [],
      view: new View({center: [0, 0], zoom: 2}),
    });
  });

  afterEach(function () {
    disposeMap(map);
    map = null;
    target = null;
  });

  describe('constructor', function () {
    it('can be constructed without arguments', function () {
      const toolbar = new Toolbar();
      assert.instanceOf(toolbar, Toolbar);
      assert.instanceOf(toolbar, Control);
    });

    it('uses bottom-left and vertical by default', function () {
      const classList = new Toolbar().element.classList;
      assert.isTrue(classList.contains('ol-toolbar'));
      assert.isTrue(classList.contains('ol-control'));
      assert.isTrue(classList.contains('ol-unselectable'));
      assert.isTrue(classList.contains('ol-toolbar--bottom-left'));
      assert.isTrue(classList.contains('ol-toolbar--vertical'));
    });

    it('applies the position and orientation options', function () {
      const classList = new Toolbar({
        position: 'top-right',
        orientation: 'horizontal',
      }).element.classList;
      assert.isTrue(classList.contains('ol-toolbar--top-right'));
      assert.isTrue(classList.contains('ol-toolbar--horizontal'));
      assert.isFalse(classList.contains('ol-toolbar--bottom-left'));
      assert.isFalse(classList.contains('ol-toolbar--vertical'));
    });

    it('applies the className option', function () {
      const classList = new Toolbar({className: 'my-toolbar'}).element
        .classList;
      assert.isTrue(classList.contains('my-toolbar'));
    });
  });

  describe('#addControl()', function () {
    it('renders a control added before the toolbar is on the map', function () {
      const toolbar = new Toolbar();
      const zoom = new Zoom();
      toolbar.addControl(zoom);
      map.addControl(toolbar);
      assert.strictEqual(zoom.element.parentElement, toolbar.element);
      assert.strictEqual(zoom.getMap(), map);
    });

    it('renders a control added after the toolbar is on the map', function () {
      const toolbar = new Toolbar();
      map.addControl(toolbar);
      const zoom = new Zoom();
      toolbar.addControl(zoom);
      assert.strictEqual(zoom.element.parentElement, toolbar.element);
      assert.strictEqual(zoom.getMap(), map);
    });

    it('keeps the order in which controls are added', function () {
      const toolbar = new Toolbar();
      const zoom = new Zoom();
      const rotate = new Rotate({autoHide: false});
      toolbar.addControl(zoom);
      map.addControl(toolbar);
      toolbar.addControl(rotate);
      assert.deepEqual(Array.from(toolbar.element.children), [
        zoom.element,
        rotate.element,
      ]);
    });

    it('treats controls the same, whenever they are added', function () {
      const toolbar = new Toolbar();
      const before = new Zoom();
      const after = new Zoom();
      toolbar.addControl(before);
      map.addControl(toolbar);
      toolbar.addControl(after);
      const controls = map.getControls().getArray();
      assert.strictEqual(
        controls.includes(before),
        controls.includes(after),
        'both or neither control should be in the map control collection',
      );
    });

    it('keeps child controls working', function () {
      const toolbar = new Toolbar();
      const zoom = new Zoom({duration: 0});
      toolbar.addControl(zoom);
      map.addControl(toolbar);
      zoom.element.querySelector('.ol-zoom-in').click();
      assert.strictEqual(map.getView().getZoom(), 3);
    });

    it('renders child controls on map render', function () {
      const toolbar = new Toolbar();
      const rotate = new Rotate({autoHide: false});
      toolbar.addControl(rotate);
      map.addControl(toolbar);
      map.getView().setRotation(1);
      map.renderSync();
      const label = rotate.element.querySelector('.ol-compass');
      assert.include(label.style.transform, 'rotate(1rad)');
    });
  });

  describe('removing the toolbar', function () {
    it('removes child controls added before the toolbar', function () {
      const toolbar = new Toolbar();
      const zoom = new Zoom();
      toolbar.addControl(zoom);
      map.addControl(toolbar);
      map.removeControl(toolbar);
      assert.isNull(toolbar.element.parentElement);
      assert.isNull(zoom.getMap());
      assert.notInclude(map.getControls().getArray(), zoom);
    });

    it('removes child controls added after the toolbar', function () {
      const toolbar = new Toolbar();
      map.addControl(toolbar);
      const zoom = new Zoom();
      toolbar.addControl(zoom);
      map.removeControl(toolbar);
      assert.isNull(toolbar.element.parentElement);
      assert.isNull(zoom.getMap());
      assert.notInclude(map.getControls().getArray(), zoom);
    });

    it('can be added again after removal', function () {
      const toolbar = new Toolbar();
      const zoom = new Zoom();
      toolbar.addControl(zoom);
      map.addControl(toolbar);
      map.removeControl(toolbar);
      map.addControl(toolbar);
      assert.strictEqual(zoom.element.parentElement, toolbar.element);
      assert.strictEqual(zoom.getMap(), map);
    });
  });

  describe('outside the map', function () {
    let holder;

    beforeEach(function () {
      holder = document.createElement('div');
      holder.id = 'toolbar-holder';
      document.body.insertBefore(holder, target);
    });

    afterEach(function () {
      holder.remove();
      holder = null;
    });

    it('gets the external class instead of a position class', function () {
      const toolbar = new Toolbar({
        position: 'top-right',
        orientation: 'horizontal',
        target: holder,
      });
      const classList = toolbar.element.classList;
      assert.isTrue(classList.contains('ol-toolbar--external'));
      assert.isTrue(classList.contains('ol-toolbar--horizontal'));
      assert.isFalse(classList.contains('ol-toolbar--top-right'));
      assert.isFalse(classList.contains('ol-toolbar--bottom-left'));
    });

    it('accepts the id of the target element', function () {
      const toolbar = new Toolbar({target: 'toolbar-holder'});
      toolbar.addControl(new Zoom());
      map.addControl(toolbar);
      assert.strictEqual(toolbar.element.parentElement, holder);
    });

    it('is laid out in the flow of its target element', function () {
      const toolbar = new Toolbar({
        orientation: 'horizontal',
        target: holder,
      });
      toolbar.addControl(new Zoom());
      map.addControl(toolbar);
      assert.strictEqual(getComputedStyle(toolbar.element).position, 'static');
      const holderBox = holder.getBoundingClientRect();
      const toolbarBox = toolbar.element.getBoundingClientRect();
      assert.isAbove(holderBox.height, 0, 'the holder wraps the toolbar');
      assert.closeTo(toolbarBox.top, holderBox.top, 1);
      assert.closeTo(toolbarBox.left, holderBox.left, 1);
    });

    it('keeps child controls working', function () {
      const toolbar = new Toolbar({target: holder});
      const zoom = new Zoom({duration: 0});
      toolbar.addControl(zoom);
      map.addControl(toolbar);
      assert.strictEqual(zoom.element.parentElement, toolbar.element);
      zoom.element.querySelector('.ol-zoom-in').click();
      assert.strictEqual(map.getView().getZoom(), 3);
    });

    it('is removed from its target with the map', function () {
      const toolbar = new Toolbar({target: holder});
      toolbar.addControl(new Zoom());
      map.addControl(toolbar);
      map.removeControl(toolbar);
      assert.strictEqual(holder.children.length, 0);
    });
  });

  describe('styling', function () {
    /**
     * @param {Toolbar} toolbar Toolbar.
     * @return {Object} Position of the toolbar relative to the map viewport.
     */
    function offsets(toolbar) {
      const viewport = map.getViewport().getBoundingClientRect();
      const box = toolbar.element.getBoundingClientRect();
      return {
        left: box.left - viewport.left,
        right: viewport.right - box.right,
        top: box.top - viewport.top,
        bottom: viewport.bottom - box.bottom,
        centerOffset:
          box.left + box.width / 2 - (viewport.left + viewport.width / 2),
      };
    }

    it('stacks controls vertically by default', function () {
      const toolbar = new Toolbar();
      const zoom = new Zoom();
      const rotate = new Rotate({autoHide: false});
      toolbar.addControl(zoom);
      toolbar.addControl(rotate);
      map.addControl(toolbar);
      const style = getComputedStyle(toolbar.element);
      assert.strictEqual(style.display, 'flex');
      assert.strictEqual(style.flexDirection, 'column');
      const a = zoom.element.getBoundingClientRect();
      const b = rotate.element.getBoundingClientRect();
      assert.isAbove(b.top, a.bottom - 1, 'second control is below the first');
    });

    it('lines up controls horizontally', function () {
      const toolbar = new Toolbar({orientation: 'horizontal'});
      const zoom = new Zoom();
      const rotate = new Rotate({autoHide: false});
      toolbar.addControl(zoom);
      toolbar.addControl(rotate);
      map.addControl(toolbar);
      const a = zoom.element.getBoundingClientRect();
      const b = rotate.element.getBoundingClientRect();
      assert.isAbove(b.left, a.right - 1, 'second control is right of first');
    });

    it('does not stretch lower controls in a horizontal toolbar', function () {
      const toolbar = new Toolbar({orientation: 'horizontal'});
      const zoom = new Zoom();
      const rotate = new Rotate({autoHide: false});
      toolbar.addControl(zoom);
      toolbar.addControl(rotate);
      map.addControl(toolbar);
      const zoomHeight = zoom.element.getBoundingClientRect().height;
      const rotateHeight = rotate.element.getBoundingClientRect().height;
      const buttonHeight = rotate.element
        .querySelector('button')
        .getBoundingClientRect().height;
      assert.isBelow(rotateHeight, zoomHeight, 'rotate is lower than zoom');
      assert.closeTo(rotateHeight, buttonHeight, 4, 'rotate fits its button');
    });

    ['bottom-left', 'bottom-center', 'bottom-right'].forEach((position) => {
      it(`aligns controls at the bottom in a horizontal ${position} toolbar`, function () {
        const toolbar = new Toolbar({
          position: position,
          orientation: 'horizontal',
        });
        const zoom = new Zoom();
        const rotate = new Rotate({autoHide: false});
        toolbar.addControl(zoom);
        toolbar.addControl(rotate);
        map.addControl(toolbar);
        const zoomBox = zoom.element.getBoundingClientRect();
        const rotateBox = rotate.element.getBoundingClientRect();
        assert.isBelow(rotateBox.height, zoomBox.height);
        assert.closeTo(rotateBox.bottom, zoomBox.bottom, 1);
      });
    });

    it('aligns controls at the top in a horizontal top toolbar', function () {
      const toolbar = new Toolbar({
        position: 'top-left',
        orientation: 'horizontal',
      });
      const zoom = new Zoom();
      const rotate = new Rotate({autoHide: false});
      toolbar.addControl(zoom);
      toolbar.addControl(rotate);
      map.addControl(toolbar);
      const zoomBox = zoom.element.getBoundingClientRect();
      const rotateBox = rotate.element.getBoundingClientRect();
      assert.closeTo(rotateBox.top, zoomBox.top, 1);
    });

    it('keeps controls left aligned in a vertical bottom toolbar', function () {
      const toolbar = new Toolbar({position: 'bottom-left'});
      const wide = document.createElement('div');
      wide.className = 'ol-control';
      wide.style.width = '100px';
      wide.style.height = '20px';
      const rotate = new Rotate({autoHide: false});
      toolbar.addControl(new Control({element: wide}));
      toolbar.addControl(rotate);
      map.addControl(toolbar);
      const wideBox = wide.getBoundingClientRect();
      const rotateBox = rotate.element.getBoundingClientRect();
      assert.closeTo(rotateBox.left, wideBox.left, 1);
    });

    it('does not stretch narrower controls in a vertical toolbar', function () {
      const toolbar = new Toolbar();
      const wide = document.createElement('div');
      wide.className = 'ol-control';
      wide.style.width = '100px';
      wide.style.height = '20px';
      const rotate = new Rotate({autoHide: false});
      toolbar.addControl(new Control({element: wide}));
      toolbar.addControl(rotate);
      map.addControl(toolbar);
      const rotateWidth = rotate.element.getBoundingClientRect().width;
      assert.isBelow(rotateWidth, 50, 'rotate is narrower than the wide one');
    });

    it('lays out child controls in the flow, not absolutely', function () {
      const toolbar = new Toolbar();
      const zoom = new Zoom();
      toolbar.addControl(zoom);
      map.addControl(toolbar);
      assert.strictEqual(getComputedStyle(zoom.element).position, 'relative');
    });

    const positions = [
      ['top-left', 'top', 'left'],
      ['top-right', 'top', 'right'],
      ['bottom-left', 'bottom', 'left'],
      ['bottom-right', 'bottom', 'right'],
      ['top-center', 'top', 'center'],
      ['bottom-center', 'bottom', 'center'],
    ];
    positions.forEach(([position, vertical, horizontal]) => {
      it(`places the toolbar at ${position}`, function () {
        const toolbar = new Toolbar({position: position});
        toolbar.addControl(new Zoom());
        map.addControl(toolbar);
        const o = offsets(toolbar);
        assert.isBelow(o[vertical], 50, `${vertical} edge`);
        if (horizontal === 'center') {
          assert.closeTo(o.centerOffset, 0, 1, 'centered');
        } else {
          assert.isBelow(o[horizontal], 20, `${horizontal} edge`);
        }
      });
    });
  });
});
