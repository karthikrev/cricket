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

let country='India';
let url="";
let rss_url='http://rss.cricinfo.com/rss/livescores.xml';


function CpuFreq() {
    this._init.apply(this, arguments);
}

CpuFreq.prototype = {
	__proto__: PanelMenu.SystemStatusButton.prototype,

	_init: function(){	
		PanelMenu.SystemStatusButton.prototype._init.call(this, 'cric');
		event = GLib.timeout_add_seconds(0, 5, Lang.bind(this, function () {
			if(url=="")
				this._getMatchURL();
			else
				this._update_gui();
			return true;	
		}));
	},

	_update_gui: function(){

		this.actor.get_children().forEach(function(c) {  c.destroy() });
		if(url==""){
                this.statusLabel = new St.Label({text: "No Match" });
				this.actor.add_actor(this.statusLabel);
		}
		else{
			this._wget(url,function(data){
				cric_data=data;
				try{
					if(cric_data.match(/<title>.*<\/title>/)) {
						//Match exists
						cric_data=data.split('</title>')[0].split('<title>')[1].split('|')[0];
						if(cric_data.match(/\(.*\)/)){
							//Match Started
							score=cric_data.split('(')[0];
							perdetails=cric_data.split('(')[1].split(')')[0].split(',');
		                    overs=perdetails[0];
		                    Batsman=perdetails[1];
		                    Runner=perdetails[2];
    		                Bowler=perdetails[3];
			
    		                this.actor.add_actor(new St.Label({ text: score}));
        		            this.menu.removeAll();
            		        global.log("displaying score" +score);

		                    let detailed_scores = new PopupMenu.PopupMenuSection("Cricket");
    		                detailed_scores.addMenuItem(this._createMenuItem("Overs: " +overs));
        		            detailed_scores.addMenuItem(this._createMenuItem("Batting: " +Batsman + ' & ' + Runner));
        			        detailed_scores.addMenuItem(this._createMenuItem("Bowler: " + Bowler));
            		        this.menu.addMenuItem(detailed_scores);
						}
						else{
							//Match not yet started 
                                this.statusLabel = new St.Label({text: cric_data });
                                this.actor.add_actor(this.statusLabel);
						}
					}
					else{
						// NO INDIA MATCH
                        this.statusLabel = new St.Label({text: "No Match" });
             			this.actor.add_actor(this.statusLabel);
					}
				}
				catch(err){
					global.log("Error: cant update" +err);
				}
			});
		}
	},

	_getMatchURL: function(){
		this._wget(rss_url,function(unxml_rss){
			unxml_rss=unxml_rss.replace(/^<\?xml\s+version\s*=\s*(["'])[^\1]+\1[^?]*\?>/, "");
			try{
				var rss = new XML(unxml_rss);
				for (var i = 0; i < rss.channel.item.length(); i++) {
					var c_match=rss.channel.item[i].title.toString();
					if(c_match.match(/[Ii][Nn][dD][iI][aA]/)) {							// TODO: Variable
							match_url = rss.channel.item[i].link.toString();
							match_url = match_url.replace(/<[^>]*>/,"").replace(/<[^>]*>/,"");
							global.log("SA match url is " +match_url);
							url=match_url;						
							this._update_gui();
					}
				}
			}
			catch(err){
				global.log("Error while getting URL " +err);
			}
		});
	},

    _createMenuItem: function(data){
        menu_item = new PopupMenu.PopupMenuItem("");
        menu_item.addActor(new St.Label({ text: data}));
		// item.connect('activate',function() {  Util.spawn(command);   });	 //TODO
        return menu_item;		
	},

    _wget: function(local_url, callback) {
     	here = this;
     	let session = new Soup.SessionAsync();
     	let message = Soup.Message.new('GET', local_url);
     	session.queue_message(message, function(session, message) {
     		response = message.response_body.data;
     		callback.call(here, response);
     	});
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
