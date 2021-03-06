import _ from 'lodash';
import dom from '@nymag/dom';
import { getLayoutInstance, getLayoutName, getComponentName as utilGetComponentName } from 'clayutils';

/**
 * wraps clayutils.getComponentName, swallowing the error if an invalid uri is passed
 *
 * @param {String} uri
 * @returns {String}
 */
export function getComponentName(uri) {
  try {
    return utilGetComponentName(uri);
  } catch (e) {
    return false;
  }
}

/**
 * Grab an element in the DOM when you know the name of the
 * component and the instance of the component.
 *
 * @param  {object} store
 * @param  {String} name
 * @param  {String} instance
 * @return {Object|Null}
 */
export function getComponentByNameAndInstance(store, name, instance) {
  var sitePrefix = _.get(store, 'state.site.prefix', null),
    uri;

  if (name && instance && sitePrefix) {
    uri = `${sitePrefix}/_components/${name}/instances/${instance}`;

    return {
      uri,
      el: dom.find(`[${refAttr}="${uri}"]`)
    };
  }

  return null;
}

/**
 * get name and instance of the layout, as well as the warning message to display when editing the layout
 * note: the message will use the custom layout name if it has been set
 * @param  {object} store
 * @return {object}
 */
export function getLayoutNameAndInstance(store) {
  const layoutURI = _.get(store, 'state.layout.uri'),
    layoutName = _.startCase(getLayoutName(layoutURI)),
    layoutInstance = _.startCase(getLayoutInstance(layoutURI)),
    layoutTitle = _.get(store, 'state.layout.state.title'),
    layoutLabel = layoutTitle ? layoutTitle : `${layoutInstance} (${layoutName})`;

  return {
    name: layoutName,
    instance: layoutInstance,
    message: `You are currently editing "${layoutLabel}". Changes you make will be reflected on all pages that use this layout.`
  };
}

// it's easier to export and declare these in single lines
/* eslint-disable one-var */
// attributes
export const refAttr = 'data-uri'; // indicated root el of a component. value is the _ref or _self of the component
export const editAttr = 'data-editable'; // indicates el is editable when clicked. value is path to data
export const placeholderAttr = 'data-placeholder'; // indicates el should have placeholder, but is NOT editable when clicked
export const layoutAttr = 'data-layout-uri'; // set on <html> element, points to the layout when data-uri points to the page
export const hiddenAttr = 'data-kiln-hidden';
export const reorderAttr = 'data-reorderable';
export const reorderItemAttr = 'data-reorderable-item';
// properties
export const refProp = '_ref';
export const fieldProp = '_has'; // used to determine if a node (in the schema) is a field
export const bookmarkProp = '_allowBookmarks'; // used to determine if bookmarked instances may be created
export const componentListProp = '_componentList';
export const componentProp = '_component';
export const displayProp = '_display'; // note: deprecated in kiln 5.x, should be removed in kiln 6.x
export const placeholderProp = '_placeholder';
export const labelProp = '_label';
export const groupsProp = '_groups';
export const descProp = '_description';
export const devDescProp = '_devDescription';
export const versionProp = '_version';
export const removeProp = '_confirmRemoval';
export const variationProp = 'componentVariation';
export const pubProp = '_publish';
export const subProp = '_subscribe';
export const revealProp = '_reveal';
export const behaviorKey = 'fn'; // note: deprecated in kiln 5.x, should be removed in kiln 6.x
export const inputProp = 'input'; // used to determine input name
// api routes, extensions, and headers
export const componentRoute = '/_components/';
export const pagesRoute = '/_pages/';
export const urisRoute = '/_uris/';
export const usersRoute = '/_users/';
export const usersBareRoute = '/_users';
export const listsRoute = '/_lists/';
export const scheduleRoute = '/_schedule'; // no ending slash
export const loginRoute = '/_auth/login';
export const logoutRoute = '/_auth/logout';
export const schemaRoute = '/schema'; // no ending slash
export const instancesRoute = '/instances'; // no ending slash
export const searchRoute = '/_search';
export const htmlExt = '.html';
export const editExt = '?edit=true';
export const editComponentExt = `${editExt}&sitecss=false&js=false`; // ask for edit mode html from the server, sans js or site css
export const hooksExt = '?hooks=false'; // flag to disable running component save()/render() hooks on the server
export const userHeader = 'X-Clay-User';
export const contentHeader = 'Content-Type';
export const contentJSON = 'application/json; charset=UTF-8';
export const contentText = 'text/plain; charset=UTF-8';
// reused classes
export const componentPropClass = 'component-prop-wrapper';
export const pageAreaClass = 'kiln-page-area';
export const overlayClass = 'iframe-overlay';
export const selectorClass = 'mini-selector';
export const wrappedClass = 'hidden-wrapped';
export const inlineFormClass = 'editor-inline';
export const fieldClass = 'kiln-field';
export const firstFieldClass = 'first-field';
export const placeholderClass = 'kiln-placeholder';
export const permanentPlaceholderClass = 'kiln-permanent-placeholder';
export const dropAreaClass = 'dragula-drop-area';
export const dragItemClass = 'dragula-item';
export const dragItemUnsavedClass = 'dragula-not-saved';
export const collapsibleListClass = 'collapsible-component-list';
// animations
// standard curve - "ease in out", used for growing and shrinking material,
// and other property changes inside the viewport
export const standardCurve = [0.4, 0.0, 0.2, 1];
// deceleration curve - "ease out", used for elements entering the viewport
export const decelerationCurve = [0, 0, 0.2, 1];
// acceleration curve - "ease in", used for elements leaving the viewport permanently
export const accelerationCurve = [0.4, 0, 1, 1];
// sharp curve - "ease in out", used for elements leaving the viewport temporarily
export const sharpCurve = [0.4, 0, 0.6, 1];
/* eslint-enable one-var */
