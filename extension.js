const Mainloop = imports.mainloop;
const PanelMenu=imports.ui.panelMenu;
const St=imports.gi.St;
const Main=imports.ui.main;
const Shell=imports.gi.Shell;
const Lang=imports.lang;
const PopupMenu=imports.ui.popupMenu;
const GLib = imports.gi.GLib;

const Soup = imports.gi.Soup;
const _httpSession = new Soup.SessionAsync();
Soup.Session.prototype.add_feature.call(_httpSession, new Soup.ProxyResolverDefault());

let _uptime_indicator_object=null;

function _getIndiaMatch(unxml_rss){
		unxml_rss=unxml_rss.replace(/^<\?xml\s+version\s*=\s*(["'])[^\1]+\1[^?]*\?>/, "");
		try{
        	var rss = new XML(unxml_rss);
			global.log("Length: " +rss.channel.item.length());
        	for (var i = 0; i < rss.channel.item.length(); i++) {
				var c_match=rss.channel.item[i].title.toString();
				global.log("Match:"+c_match);
				if(c_match.match(/India\s+[0-9]+\/[0-9]+/)) {
					c_match = c_match.replace(/<[^>]*>/,"").replace(/<[^>]*>/,"");
 					return c_match;	
				}
        	}
			return "No India Match";
		}
		catch(err){
			global.log('ERROR:' +err);
		}
}


const CricketUpdator=new Lang.Class({
	Name: 'CricketUpdator',
	_init: function() {
		event = GLib.timeout_add_seconds(0, 5, Lang.bind(this, function () {
			this._display();
		}));
   	},

	_display: function(){
		this._getRSS('placeholder', function(response_rss){
			display_text=_getIndiaMatch(response_rss);
			this.actor = new St.Button();
        	this._label = new St.Label({ text: display_text });
        	this.actor.set_child(this._label);
        	Main.panel._centerBox.add(this.actor, { y_fill: true });
		});
	},

 	_getRSS: function(url, callback) {
    	var request = Soup.Message.new('GET', 'http://rss.cricinfo.com/rss/livescores.xml');
        _httpSession.queue_message(request, function(_httpSession, message) {
        	if (message.status_code !== 200) {
        		callback(message.status_code, null);
        		return;
        	}
        	full_rss = request.response_body.data;
        	callback.call(null, full_rss);
		});
	}
});

function enable(){
   try {
      new CricketUpdator;
   }
   catch(err) {
      global.log("Error enabling Uptime Indicator extension: "+err.message);
   }
}
function disable(){}
function init(){}

