var { ActionButton  } = require('sdk/ui/button/action');
var { Cc, Ci } = require('chrome');
var data = require('sdk/self').data;
var tabs = require('sdk/tabs');

// uses an undocumented API found via
// stackoverflow.com/questions/6536206/get-a-list-of-fonts-in-a-firefox-extension
// forums.mozillazine.org/viewtopic.php?f=39&t=2731121&p=12993431

var fontEnumerator = Cc['@mozilla.org/gfx/fontenumerator;1'].getService(Ci.nsIFontEnumerator);
var allFonts = fontEnumerator.EnumerateAllFonts({});

// use port since Cc/Ci not accessible via content script
// developer.mozilla.org/en-US/Add-ons/SDK/Guides/Content_Scripts/using_port
var alertContentScript = "self.port.on('allFonts', function(data) {" +
                         "  localStorage.setItem('allFonts',data);" +
                         "})";

var button = ActionButton({
  id: "fontfiddler",
  label: "Font Fiddler",
  icon: {
    "16": data.url('icon-16.png'),
    "32": data.url('icon-32.png'),
    "48": data.url('icon-48.png')
  },
  onClick: function(state) {
    tabs.open({
      url: data.url('index.html'),
      onReady: function(tab) {
        worker = tab.attach({
          contentScript: alertContentScript
        });
        worker.port.emit('allFonts', JSON.stringify(allFonts));
      }
    });
  }
});
