const St = imports.gi.St;
const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;
const GLib = imports.gi.GLib;
const Util = imports.misc.util;
const Mainloop = imports.mainloop;

const Soup = imports.gi.Soup;
const _httpSession = new Soup.SessionAsync();
Soup.Session.prototype.add_feature.call(_httpSession, new Soup.ProxyResolverDefault());

let	url='http://www.espncricinfo.com/india-v-england-2012/engine/current/match/565812.html';

function CpuFreq() {
    this._init.apply(this, arguments);
}

CpuFreq.prototype = {
	__proto__: PanelMenu.SystemStatusButton.prototype,

	_init: function(){	
		PanelMenu.SystemStatusButton.prototype._init.call(this, 'cric');
		this.statusLabel = new St.Label({text: '--'});
		this._build_ui();
		event = GLib.timeout_add_seconds(0, 5, Lang.bind(this, function () {
			//this._get_price();
			this._update_gui();
//			this._build_ui();
			return true;	
		}));
	},


	_update_gui: function(){
		this._wget(url,function(data){
			this.data=data;
			try{
				cric_data=data.split('</title>')[0].split('<title>')[1].split('|')[0];
				score=cric_data.split('(')[0];
                this.actor.get_children().forEach(function(c) {  c.destroy() });
				this.statusLabel = new St.Label({text: '--'});
				this.statusLabel.set_text(score);
				this.actor.add_actor(this.statusLabel);
				this.menu.removeAll();
        		perdetails=cric_data.split('(')[1].split(')')[0].split(',')
        		overs=perdetails[0];
        		Batsman=perdetails[1];
        		Runner=perdetails[2];
        		Bowler=perdetails[3];
				//this.menu.box.get_children().forEach(function(c) { c.destroy() });
				let detailed_scores = new PopupMenu.PopupMenuSection("Cricket");
				detailed_scores.addMenuItem(this._createMenuItem("Overs: " +overs));
				detailed_scores.addMenuItem(this._createMenuItem("Batting: " +Batsman + ' & ' + Runner));
				detailed_scores.addMenuItem(this._createMenuItem("Bowler: " + Bowler));
				this.menu.addMenuItem(detailed_scores);
			}
			catch(err){
				global.log("Error: cant update" +err);
			}
		});
	},

    _createMenuItem: function(data){
        menu_item = new PopupMenu.PopupMenuItem("");
        menu_item.addActor(new St.Label({ text: data}));
		// item.connect('activate',function() {  Util.spawn(command);   });	 //TODO
        return menu_item;		
	},

    _wget: function(url, callback) {
                here = this;
                let session = new Soup.SessionAsync();
                let message = Soup.Message.new('GET', url);
                session.queue_message(message, function(session, message) {
                    response = message.response_body.data;
                    callback.call(here, response);
                });
        },
	
	_build_ui: function() {
		this.actor.get_children().forEach(function(c) {
			 c.destroy()
		});
		this._update_gui();
	}
}

function init() {
}

let indicator;
let event=null;

function enable() {
    indicator = new CpuFreq();
    Main.panel.addToStatusArea('cric', indicator);
}

function disable() {
    indicator.destroy();
    Mainloop.source_remove(event);
    indicator = null;
}
