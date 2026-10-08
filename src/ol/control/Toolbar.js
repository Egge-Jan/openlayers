/**
 * @module ol/control/Toolbar
 */
import Control from './Control.js';

/**
 * @typedef {'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'} Position
 * Position of the toolbar.
 */

/**
 * @typedef {'horizontal' | 'vertical'} Orientation
 * Orientation of the toolbar.
 */

/**
 * @typedef {Object} Options
 * @property {string} [className='ol-toolbar'] CSS class name.
 * @property {Position} [position='bottom-left'] Position of the toolbar in the
 * map's viewport. Ignored when a `target` is set.
 * @property {Orientation} [orientation='vertical'] Orientation.
 * @property {HTMLElement|string} [target] Specify a target if you want the control
 * to be rendered outside of the map's viewport. The toolbar is then laid out as
 * part of the target element, instead of being positioned on top of the map.
 */

/**
 * @classdesc
 * Control to add one or more toolbars to the map. In a toolbar you can group
 * button controls. It is even possible to remove default controls, like Zoom
 * and Rotate, from the map, to add them to a toolbar. By default the toolbar
 * will show in the bottom left corner of the map, but this can be changed with
 * the `position` option, or by using a css selector for .ol-toolbar. With the
 * `target` option, the toolbar can also be placed outside the map.
 *
 * @api
 */
class Toolbar extends Control {
  /**
   * @param {Options} [options] Toolbar options.
   */
  constructor(options) {
    options = options ? options : {};

    const className =
      options.className !== undefined ? options.className : 'ol-toolbar';
    const position =
      options.position !== undefined ? options.position : 'bottom-left';
    const orientation =
      options.orientation !== undefined ? options.orientation : 'vertical';

    // A toolbar outside the map is part of its target's layout, so it does not
    // get a position on the map.
    const placement = options.target !== undefined ? 'external' : position;

    const element = document.createElement('div');
    element.className = `${className} ol-unselectable ol-control ol-toolbar--${placement} ol-toolbar--${orientation}`;

    super({
      element: element,
      target: options.target,
    });

    /**
     * @type {Array<Control>}
     * @private
     */
    this.controls_ = [];
  }

  /**
   * Add a control to the toolbar. The control is rendered inside the toolbar,
   * whether it is added before or after the toolbar is added to a map.
   * @param {Control} control Control.
   * @api
   */
  addControl(control) {
    this.controls_.push(control);
    control.setTarget(/** @type {HTMLElement} */ (this.element));
    const map = this.getMap();
    if (map) {
      control.setMap(map);
    }
  }

  /**
   * Remove the control from its current map and attach it to the new map.
   * Pass `null` to just remove the control from the current map. The
   * controls in the toolbar are attached to the same map.
   * @param {import("../Map.js").default|null} map Map.
   * @api
   * @override
   */
  setMap(map) {
    super.setMap(map);
    this.controls_.forEach((control) => control.setMap(map));
  }
}

export default Toolbar;
