const $ = require('jquery');

const storage = require('../lib/storage');

let opts = {};

document.addEventListener('DOMContentLoaded', function() {

  storage.get('options').then(result => {

    let opts = result || {};

    if (opts.deleteTabOnOpen === undefined) {
      $('input[name="deleteTabOnOpen"][value="no"]').prop('checked', 'checked');
    } else {
      $(
        'input[name="deleteTabOnOpen"][value="' + opts.deleteTabOnOpen + '"]'
      ).prop('checked', 'checked');
    }

    if (opts.closePinnedTabs === undefined) {
      $('input[name="closePinnedTabs"][value="no"]').prop('checked', 'checked');
    } else {
      $(
        'input[name="closePinnedTabs"][value="' + opts.closePinnedTabs + '"]'
      ).prop('checked', 'checked');
    }
  });
});

document.getElementById('import').addEventListener('click', () => {
  const newGroups = document
    .getElementById('import-text')
    .value.split('\n\n')
    .map((block, i) => ({
      tabs: block.split('\n').map(item => {
        const [url, ...rest] = item.split('|');
        return {
          url: url.trim(),
          title: rest.join('|').trim(),
          pinned: false,
        };
      }),
      id: Date.now() - i,
      date: Date.now(),
    }));

  storage.get('tabGroups').then(result => {
    const groups = JSON.parse(result.tabGroups) || [];
    return storage.set('tabGroup_'+Date.now().toString(), newGroups.concat(groups), 'tabGroups' ).then(() => {
      // show "Import successful" notice thing
      document.getElementById('imported').style.display = 'block';
      window.setTimeout(function() {
        document.getElementById('imported').style.display = 'none';
      }, 2000);
    });
  });
});

document.getElementsByName('save')[0].addEventListener('click', function() {
  const deleteTabOnOpen = document.querySelector(
    'input[name="deleteTabOnOpen"]:checked'
  ).value;
  const closePinnedTabs = document.querySelector(
    'input[name="closePinnedTabs"]:checked'
  ).value;

  storage.set( 'options', {
        deleteTabOnOpen: deleteTabOnOpen,
        closePinnedTabs: closePinnedTabs
      },
    )
    .then(() => {
      // show "settings saved" notice thing
      document.getElementById('saved').style.display = 'block';
      window.setTimeout(function() {
        document.getElementById('saved').style.display = 'none';
      }, 2000);
    });
});
