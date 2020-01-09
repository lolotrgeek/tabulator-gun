const moment = require('moment');
const m = require('mithril');
const storage = require('../lib/storage');

const tabs = {} // to-be module

let opts = {
  deleteTabOnOpen: 'no',
  closePinnedTabs: 'no',
}


const testJson = (string) => {
  console.log('testing: ', string)
  try { let parsed = JSON.parse(string); return parsed }
  catch (err) { console.error(err); return false }
}

storage.get('options').then(options => { if (options) opts = options })
storage.get('tabGroups').then(results => {
  let tabGroups = [] // tab groups
  if (typeof results === 'object') {
    for (result in results) {
      // if (typeof results[result] === 'string') {
      //   let tabGroup = testJson(results[result])
      //   if (tabGroup) {
      //     
      //   }
      // }
      // get the tabs
      let tabGroup = results[result]
      storage.get(result).then(tabs => {
        console.log('Gotten Tabs ', tabs)
        tabGroup.tabs = tabs.value
        tabGroups.push(tabGroup)
      })
    }
  }

  return tabGroups
}).then(tabGroups => {
  console.log('tabGroups : ', tabGroups)

  async function removeTabGroups(json) {
    try { await storage.remove('tabGroups') }
    catch (err) { console.error(err) }
  }

  async function removeTab(json) {
    try { await storage.set('tabGroup_' + Date.now().toString(), JSON.stringify(json), 'tabGroups') }
    catch (err) { console.error(err) }
  }

  // model entity
  // 'data' is meant to be a tab group object from localStorage
  tabs.TabGroup = function (data) {
    this.date = m.prop(data.date);
    this.id = m.prop(data.id);
    this.tabs = m.prop(data.tabs);
  };

  // alias for Array
  tabs.TabGroupsList = Array;

  // view-model
  tabs.vm = new function () {
    const vm = {};
    vm.init = function () {
      // list of tab groups
      vm.list = new tabs.TabGroupsList();

      vm.rmGroup = function (i) {
        // remove view from array
        vm.list.splice(i, 1);
        // remove from localStorage
        tabGroups.splice(i, 1);
        // save
        saveTabGroups(tabGroups);
      };

      vm.rmTab = function (i, ii) {
        // remove from localStorage
        tabGroups[i].tabs.splice(ii, 1);
        // Remove the group if empty.
        if (tabGroups[i].tabs.length === 0) {
          vm.rmGroup(i);
          // We fall-through here even if rmGroup
          // already saves the tab groups.
        }
        // save
        saveTabGroups(tabGroups);
      };
    };
    return vm;
  }();

  tabs.controller = function () {
    let i;
    tabs.vm.init();
    for (i = 0; i < tabGroups.length; i += 1) {
      tabs.vm.list.push(new tabs.TabGroup(tabGroups[i]));
    }
  };

  tabs.view = function () {
    if (tabs.vm.list.length === 0) {
      return m('p', 'No tabs');
    }

    // foreach tab group
    return tabs.vm.list.map(function (group, i) {
      // group
      return m('div.group', [
        m('div.group-title', [
          m('span.delete-link', {
            onclick: function () {
              tabs.vm.rmGroup(i);
            },
          }),
          m(
            'span.group-date',
            { title: moment(group.date()).format('MMMM Do YYYY, H:mm') },
            moment(group.date()).fromNow()
          ),
          ' ',
          m(
            'span.group-amount',
            group.tabs().length +
            ' tab' +
            (group.tabs().length === 1 ? '' : 's')
          ),
          ' ',
          m(
            'span.restore-all.button.button-small',
            {
              onclick: function () {
                let i;

                // reason this goes before opening the tabs and not
                // after is because it doesn't work otherwise
                // I imagine it's because you changed tab and so
                // that messes with the focus of the JS somehow...
                if (opts.deleteTabOnOpen === 'yes') {
                  tabs.vm.rmGroup(i);
                }

                for (i = 0; i < group.tabs().length; i += 1) {
                  chrome.tabs.create({
                    url: group.tabs()[i].url,
                    pinned: group.tabs()[i].pinned,
                  });
                }
              },
            },
            'Restore all'
          ),
        ]),

        // foreach tab
        m(
          'ul.tab-groups',
          group.tabs().map(function (tab, ii) {
            return m('li', [
              m('span.delete-link', {
                onclick: function () {
                  tabs.vm.rmTab(i, ii);
                },
              }),
              m('img', {
                src: 'chrome://favicon/' + tab.url,
                height: '16',
                width: '16',
              }),
              ' ',
              m(
                'span.link',
                {
                  onclick: function () {
                    if (opts.deleteTabOnOpen === 'yes') {
                      tabs.vm.rmTab(i, ii);
                    }

                    chrome.tabs.create({
                      url: tab.url,
                      pinned: tab.pinned,
                    });
                  },
                  title: tab.url,
                },
                tab.title
              ),
            ]);
          })
        ),
      ]);
    });
  };

  // init the app
  m.module(document.getElementById('groups'), {
    controller: tabs.controller,
    view: tabs.view,
  });
})

