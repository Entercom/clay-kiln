import { basename, extname } from 'path';
import _ from 'lodash';
import Vue from 'vue';
import NProgress from 'vue-nprogress';
import keycode from 'keycode';
import velocity from 'velocity-animate/velocity.min.js';
import store from './lib/core-data/store';
import { addSelectorButton } from './lib/utils/custom-buttons'; // eslint-disable-line
import { add as addInput } from './lib/forms/inputs';
import { init as initValidators } from './lib/validators';
import conditionalFocus from './directives/conditional-focus';
import utilsAPI from './lib/utils/api';
import { init as initTransformers } from './inputs/magic-button-transformers';
import { hasClickedFocusableEl } from './lib/decorators/focus';
import { hasClickedSelectableEl } from './lib/decorators/select';
import { META_PRESS, META_UNPRESS } from './lib/preloader/mutationTypes';
import { getEventPath } from './lib/utils/events';
import { standardCurve } from './lib/utils/references';
import { getLastEditUser } from './lib/utils/history';
import 'keen-ui/src/bootstrap'; // import this once, for KeenUI components
import 'velocity-animate/velocity.ui.min.js'; // import this once, for velocity ui stuff
import VueObserveVisibility from 'vue-observe-visibility';
import VueClickOutside from 'vue-click-outside';

// set animation defaults
velocity.defaults.easing = standardCurve;
velocity.defaults.queue = false;

const inputReq = require.context('./inputs', false, /\.vue$/),
  // todo: in the future, we should queue up the saves
  connectionLostMessage = 'Connection Lost. Changes will <strong>NOT</strong> be saved.',
  progressOptions = {
    parent: '.nprogress-container',
    template: '<div class="bar" role="bar"></div>',
    showSpinner: false,
    easing: 'linear',
    speed: 500,
    trickle: false,
    minimum: 0.001
  },
  nprogress = new NProgress(progressOptions),
  // shortKey is a Quill convention to test for cmd on mac and ctrl on windows
  SHORTKEY = (/Mac/i).test(navigator.platform) ? 'metaKey' : 'ctrlKey';

// Require all scss/css files needed
require.context('./styleguide', true, /^.*\.(scss|css)$/);

// Add inputs
inputReq.keys().forEach(function (key) {
  addInput(basename(key, extname(key)), inputReq(key));
});

// init validators
initValidators();
// init transformers
initTransformers();

// add progress bar
Vue.use(NProgress, {
  router: false,
  http: false
});

// add visibility observer directive
Vue.use(VueObserveVisibility);

// Register keys to make key events easy to call
Vue.config.keyCodes.comma = 188;

// register directives
Vue.directive('conditional-focus', conditionalFocus());
Vue.directive('click-outside', VueClickOutside);

// export api for plugins, validators, inputs, buttons, etc
window.kiln = window.kiln || {};
// .plugins, .inputs, .validators, and .panes objects should already exist
window.kiln.utils = utilsAPI;

/**
 * determine if forms, or modals are open
 * @param  {object}  store
 * @return {Boolean}
 */
function isStuffOpen(store) {
  return _.get(store, 'state.ui.currentFocus')
    || _.get(store, 'state.ui.currentModal')
    || _.get(store, 'state.ui.currentAddComponentModal')
    || _.get(store, 'state.ui.currentConfirm')
    || _.get(store, 'state.ui.currentDrawer');
}

// Function to enable edit mode
function enableEditMode() {
  console.log('Edit mode detected');
  document.body.classList.add('kiln-edit-mode');

  // Load necessary edit mode scripts and styles
  const toolbar = require('./lib/toolbar/edit-toolbar.vue');

  Vue.component('edit-toolbar', toolbar);

  new Vue({
    debug: process.env.NODE_ENV !== 'production',
    strict: true,
    el: '#kiln-app',
    render(h) {
      return h('edit-toolbar');
    },
    store,
    nprogress
  });

  store.dispatch('preload')
    .then(() => require('./lib/decorators').decorateAll())
    .then(() => store.dispatch('parseURLHash'))
    .then(() => store.dispatch('getList', 'new-pages'))
    .then(() => store.dispatch('getList', 'bookmarks'))
    .then(() => {
      const pageTemplateIds = _.get(store, 'state.lists[new-pages].items', [])
          .reduce((acc, { id, title, children }) => {
            acc.concat({ id, title }); // for non-nested lists

            return acc.concat(...children);
          }, []),
        currentPageURI = _.get(store, 'state.page.uri'),
        currentPageID = currentPageURI.match(/pages\/([A-Za-z0-9\-]+)/)[1],
        currentPageTemplate = pageTemplateIds.find(({ id }) => id === currentPageID),
        lastEditUser = getLastEditUser(_.get(store, 'state.page.state'), _.get(store, 'state.user'));

      if (!navigator.onLine) {
        store.dispatch('addAlert', { type: 'error', text: connectionLostMessage, permanent: true });
      } else if (lastEditUser) {
        store.dispatch('addAlert', { type: 'info', text: `Edited less than 5 minutes ago${lastEditUser.name ? ` by ${lastEditUser.name}` : ''}` });
      }

      if (currentPageTemplate) {
        store.dispatch('addAlert', { type: 'warning', text: `You are currently editing the "${currentPageTemplate.title}" template. Changes you make will be reflected on new pages that use this template.` });
      }
    });
}

// kick off loading when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  // Check for edit mode query parameter
  if (window.location.search.includes('edit=true')) {
    enableEditMode();
  }

  // when clicks bubble up to the document, close the current form or pane / unselect components
  document.body.addEventListener('click', (e) => {
    const ePath = getEventPath(e);

    if (_.find(ePath, el => el.classList && (el.classList.contains('ui-calendar') || el.classList.contains('kiln-overlay-form')))) {
      return;
    }

    if (_.get(store, 'state.ui.currentFocus') && !hasClickedFocusableEl(e) && !window.kiln.isInvalidDrag) {
      store.dispatch('unfocus').catch(_.noop);
    } else if (_.get(store, 'state.ui.currentAddComponentModal')) {
      store.dispatch('closeAddComponent');
    } else if (_.get(store, 'state.ui.currentSelection') && !hasClickedSelectableEl(e) && !window.kiln.isInvalidDrag) {
      store.dispatch('unselect');
    }

    window.kiln.isInvalidDrag = false;
  });

  // when ESC bubbles up to the document, close the current form or pane / unselect components
  document.body.addEventListener('keydown', (e) => {
    const key = keycode(e),
      isShortKeyPressed = _.get(e, SHORTKEY, false);

    if (key === 'up' && !isStuffOpen(store)) {
      store.dispatch('navigateComponents', 'prev');
    } else if (key === 'down' && !isStuffOpen(store)) {
      store.dispatch('navigateComponents', 'next');
    } else if (key === 'z' && isShortKeyPressed && e.shiftKey && !isStuffOpen(store)) {
      store.dispatch('redo');
    } else if (key === 'z' && isShortKeyPressed && !isStuffOpen(store)) {
      store.dispatch('undo');
    } else if (key === '/' && e.shiftKey === true && !isStuffOpen(store)) {
      store.dispatch('openModal', {
        title: 'Keyboard Shortcuts',
        type: 'keyboard'
      });
    } else if (key === 'esc') {
      if (_.get(store, 'state.ui.currentFocus')) {
        store.dispatch('unfocus').catch(_.noop);
      } else if (_.get(store, 'state.ui.currentAddComponentModal')) {
        store.dispatch('closeAddComponent');
      } else if (_.get(store, 'state.ui.currentSelection')) {
        store.dispatch('unselect');
      }
    } else if (isShortKeyPressed) {
      store.commit(META_PRESS);
    }
  });

  document.body.addEventListener('mousemove', _.debounce((e) => {
    if (_.get(store, 'state.ui.metaKey') && !e.ctrlKey && !e.metaKey) {
      store.commit(META_UNPRESS);
    }
  }), 100);

  document.body.addEventListener('keyup', (e) => {
    if (_.get(e, SHORTKEY, false)) {
      store.commit(META_UNPRESS);
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      store.commit(META_UNPRESS);
    }
  });

  window.addEventListener('online', function () {
    store.dispatch('removeAlert', { type: 'error', text: connectionLostMessage, permanent: true });
  });

  window.addEventListener('offline', function () {
    store.dispatch('addAlert', { type: 'error', text: connectionLostMessage, permanent: true });
  });
});
