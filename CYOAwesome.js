/*

CYOAwesome (2022 update) by @mcfunkypants

TODO - must have
- clicking links during animation ignored - innerHTML is bad
- only run code on same line if prev bool was true
- main menu before playing
- save and dumb load: with no go() at all
- Dialogue (press any key)..
- if first line is ignore due to code, don't render it as a brbr

TODO - nice to have

- flip book js from gamedevwell
- game over and the end and restart- load game button
- AD&D stats rolling 4-1d6
- Text effects (boom) to fix, check iscool on each non tag word
- test full project flow
- real sample game that is actually a fun IF
- >= <=
- !=
- HAS ANY GOLD = HAS GOLD = GOLD? any quantity
- [1d3] [1] [2] [3] shorthand for roll = and roll ==
- insert/embed another scene eg {STATUS}
- more than one parser at the same time: locations and companion chatter
- [GOTO SCENE] immediately run another scene after this one is idle
- [PREV] to previous scene
- game settings (volume etc)
- Timed choices (golf)
- shake HOLD roll onUp golf dice
- game state not saved on edit
- editor window button bar
- credits and props
- coolify fix: shiver shake
- dialog animator
- a nice logo
- fix the twitter account
- wysiwyg editing in place
- while editing, stay on current (re-parsed) scene
- localstorage edit window
- undo
- map view
- inventory view
- quests! parts mcguffins progress
- progress bars
- string entry (what is your name)
- number entry (haggle) slider
- use with (mix objects)
- d&d style combat
- xp and levelups
- allow abstract scumm verb menus
- game settings gui
- game not saved online
- games listing
- game search
- nice debug messages
- live console
- auto-suggest
- beta test login
- optimize: only parse current scene on edit
- obfuscate game data to hassle view-source cheaters
- version numbers
- map with SAW unlocks
- fast travel signposts
- logins
- more fonts
- several templates (font+background+ornaments)
- command-prompt mode: "TAVERN> _"
- keyboard (arrow key / tab) controls
- touch testing
- gamepad controls
- SUBTLE css transitions on many things
- make every word a <span> and add to DOM don't use innerHTML
- decide upon author copyrights (editable scriptkiddie allowed?)
- twitter bot for approved submissions
- player ratings like IFDB etc etc damn portal stuff
- how-to guide
- video tutorials
- a way to get money
- supporters can export html
- supporters can export win, mac, linux, android, ios, xbox, etc
- game jams
- multiplayer collaborative editing
- automap
- room meta xy
- game metas
- dropzone image uploader
- php image cleaner
- php zip
- email verifications
- social media integrations
- all the meta tags in html
- games are static websites CYOAwesome/play/MyGame/

TODONE!
x if we are at a DEAD END automatically give a return path to prev scene. HACKY...
x delete all prev choice buttons on go, not just un <a>
x if first line after scene is blank, don't render it as a brbr
x test all logic
x > <
x ==
x insert inventory quantity
x game is two divs: so_far and dynamic_scene
x save story_so_far as pure text
x remove walkthough on load_game_state
x expositions do not count as a scene change?
x multiple choice buttons
x localstorage game state
x localstorage game walkthrough
x random [25% of the time]
x optimize: only animate current scene
x visual novel mode (cls)

*/

// for no globals, uncomment next line and last line of file
// then edit the html to refer to game.functions()

// var game = new CYOAwesome(); function CYOAwesome() {

"use strict"; // ensure clean clode

var debugmode = true; // no console log if false

var CLEARSCREEN_EACH_SCENE = false; // after the user makes a choice
var CLEARSCREEN_BEFORE_IMAGES = false; // any time we add a new image
// this should probably be false if you only want to use use a menu of choices
var LINKIFY_STORY_TEXT = true; // automagically add <a> to scene names
var DOWNLOAD_STORY_TXT = false; // false: use the value of a textarea, true: ajax downloads story.txt
var fastmode = false; // no text animation if we're editing
var hurry = false; // user wants to fast fwd this scene

// game data: reset in init()
var src = ""; // the entire text full game source code
var firstscene = ""; // string name
var scene = []; // each scene holds an array of string lines
var scenelist = []; // array of scene names for quick access
var code_result = true; // boolean for last code result
var sceneCount = 0; // total in entire game
var last_cls_scene = ""; // used to fix in dead ends
var second_last_cls_scene = ""; // used to fix in dead ends

// game state: reset in init()
var currentscene = ""; // string name
var turn_number = 0; // incremented every click
var visited_scenes = []; // so we know where we've been for SAW,1ST
var inventory = []; // keys/values for HAS,NO,GET,DEL,PUT,>,<,=,+,-,?
var walkthrough = []; // every link linked in order
var story_so_far = ""; // optimization: remember the past html
var ms_per_word = 50; // text animation speed
var prevlink = ""; // name of last clicked word

// html elements
var gamediv = null; // holds entire game
var story_source_textarea = null; // source code embedded inside the html
var gui_TL = null; // in game header
var gui_TR = null; // in game header
var currentscene_div = null; // where dynamic animated text goes
var story_so_far_div = null; // non-interactive past story events
var currentchoices_div = null; // for multiple choices so we can delete

// HUD (gui) elements
var stats_div = null;
var inventory_div = null;
var map_div = null;
var quests_div = null;

// source code for HUD elements
var stats_div_src = null;
var inventory_div_src = null;
var map_div_src = null;
var quests_div_src = null;

// animated word by word
var anim_str = "";
var anim_num = 0;
var anim_has_link = false;

// back up previous text and clear out links
var the_scene_so_far = ""; // html ripped every frame TODO: optimize

function init(story_txt)
{
	if (debugmode) console.log("------------------------------------------------");
	if (debugmode) console.log("CYOAwesome v0.6 by Christer McFunkypants Kaitila");
	if (debugmode) console.log("------------------------------------------------");

	init_browser();

	if (story_txt != undefined)
	{
		src = story_txt;
	}
	else // load story txt from a textarea in the html body
	{
		if (!story_source_textarea)
			console.log("ERROR: no story data found! The html needs a <textarea id='game-source'>")
		else
			src = story_source_textarea.value;
	}

	if (debugmode) console.log(src.length + " bytes of source text.");

	// reset game state
	firstscene = "";
	currentscene = "INTRO"; // so we avoid errors on src that doesn't start with a scene name
	scene = [];
	scenelist = [];
	sceneCount = 0;
	visited_scenes = [];
	inventory = [];
	//inventory["CLUE"] = 1; // works
	turn_number = 0;
	code_result = true;

	// clean up the story source
	src = src.replace(/\r\n/g, "\n"); // change CRLF to LF
	src = src.replace(/\n\n/g, "\n<br><br>\n"); // change double blank lines to breaks
	var line = src.split('\n'); // split each line
	line = line.map(trimStr); // run on each element
	line = line.filter(notBlank); // discard empty ones
	if (debugmode) console.log(line.length + " lines found.");
	
	// put each line into the proper scene
	for (var pnum=0; pnum<line.length; pnum++)
	{
		if (isUpperCase(line[pnum])) // new scene! ENTIRE LINE IS UPPERCASE
		{
			currentscene = line[pnum];
			if (scene[currentscene] != null)
			{
				if (debugmode) console.log("ERROR: duplicate scene name: " + currentscene);
			}
			else
			{
				//if (debugmode) console.log("scene: " + currentscene);
				scene[currentscene] = [];
				sceneCount++;
				scenelist.push(currentscene.toUpperCase());
				if (!firstscene) firstscene = currentscene;
			}
		}
		else
		{
			// first or last line of scene? no need for blank lines
			if ((line[pnum]=='<br><br>') && 
				(
					(line[pnum+1] && isUpperCase(line[pnum+1])) || // is NEXT line a section?
					(line[pnum-1] && isUpperCase(line[pnum-1])) // or prev?
				)) 
			{
				//if (debugmode) console.log("Stripping double blank line " + pnum + " in scene " + currentscene);
			}
			else
			{
				// add this line to the current scene
				if (!scene[currentscene])
				{
					if (debugmode) console.log("WARNING: creating missing scene: " + currentscene);
					scene[currentscene] = [];
				}
				scene[currentscene].push(line[pnum]);
			}
		}
	}
	
	//srcdiv.style.display = 'none';
	if (debugmode) {
        console.log(sceneCount + " scenes created.");
        var all_scene_names_found = Object.keys(scene);
        console.log(all_scene_names_found.join(', '));
    }

}

// grab references to a few key html elements
function init_browser()
{
	if (debugmode) console.log('init_browser');
	
	// grab html elements
	gamediv = document.getElementById("game");
	currentscene_div = document.getElementById("current_scene");
	currentchoices_div = document.getElementById("current_choices");
	story_so_far_div = document.getElementById("story_so_far");
	gui_TL = document.getElementById('gui_TL');
	gui_TR = document.getElementById('gui_TR');
	story_source_textarea = document.getElementById("game_source");

	// HUD (gui) elements
	stats_div = document.getElementById("stats_div");
	inventory_div = document.getElementById("inventory_div");
	map_div = document.getElementById("map_div");
	quests_div = document.getElementById("quests_div");

	// source code for HUD elements
	if (stats_div) stats_div_src = stats_div.innerHTML;
	if (inventory_div) inventory_div_src = inventory_div.innerHTML;
	if (map_div) map_div_src = map_div.innerHTML;
	if (quests_div) quests_div_src = quests_div.innerHTML;

	// Enable the tab character when editing
	enableTab('game_source');
	
	// block the BACK BUTTON
	// FIXME this is UX hack but people keep
	// pressing the back button or reload by accident
	/*
	window.onbeforeunload = function(e) 
	{
		var dialogText = 'Quit game?';
		e.returnValue = dialogText;
		return dialogText;
	};
	*/
}

function trimStr(str) {
	return str.trim();
}

function isUpperCase(str) {
	return str === str.toUpperCase();
}

function notBlank(str) {
	return str != "";
}

// make any string useable in a regex (we need to escape certain characters)
function preg_quote( str ) {
	return (str+'').replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:])/g, "\\$1");
}

// words that could get fun css styles
var onomatopoeia = ['argh','achoo','ahem','bang','bash','bam','bark','bawl','beep',
'belch','blab','blare','blurt','boing','boink','bonk','bong','boo','boo-hoo','boom',
'bow-wow','brring','bubble','bump','burp','buzz','cackle','chatter','cheep','chirp',
'chomp','choo-choo','chortle','clang','clash','clank','clap','clack','clatter','click',
'clink','clip clop','cluck','clunk','cock a doodle doo','cough','crack','crackle',
'crash','creak','croak','crunch','cuckoo','ding','ding dong','drip','fizz','flick',
'flip','flip-flop','flop','flutter','giggle','glug','glup','groan','growl','grunt',
'guffaw','gurgle','hack','haha','hack','hiccup','hiss','hohoho','honk','hoot','howl',
'huh','hum','jangle','jingle','ker-ching','kerplunk','knock','la','meow','moan','moo',
'mumble','munch','murmur','mutter','neigh','oink','ouch','ooze','phew','ping',
'ping pong','pitter patter','plink','plop','pluck','plunk','poof','pong','pop','pow',
'purr','quack','rattle','ribbit','ring','rip','roar','rumble','rush','rustle','screech',
'shuffle','shush','sizzle','slap','slash','slish','slither','slosh','slurp','smack',
'snap','snarl','sniff','snip','snore','snort','spit','splash','splat','splatter','splish',
'splosh','squawk','squeak','squelch','squish','sway','swish','swoosh','thud','thump',
'thwack','tic-toc','tinkle','trickle','twang','tweet','ugh','vroom','waffle','whack',
'whallop','wham','whimper','whip','whirr','whish','whisper','whizz','whoop','whoosh',
'woof','yelp','yikes','zap','zing','zip','zoom','hot','heat','burn','burning','blazing',
'fire','cold','frozen','freeze','ice','chilly','frosty','frost','iced','molten','melt',
'melted','melting','bashed','bash','smashed','smash','broke',
'shattered','beat','punched','hit','slapped','shot','fired','shook','shake','jump',
'tilt','wave','shudder','shake','vibrate','wiggle','wobble','loose','broken','glithy',
'unsteady','drunk','wobbly','shaky','bounced','bounce','rolled','roll','break','broken',
'destroyed','exploded','destruction','death','strong','stronger','weak',
'weaker','angry','sad','mad','hurt','scared','frightened','tired'];
var onomatopoeia_regex = new RegExp('(\\b)(' + onomatopoeia.join('|') + ')(\\b)', 'ig'); // word boundaries	// (^|\s) and ($|\s) for entire words

function coolify(str)
{
	return str.replace(onomatopoeia_regex, "$1<b class='$2'>$2</b>$3"); // classname gets found
}

// wrap case insensitively matching words in <b> tags
/*
function boldify(haystack, needle) // 
{
	var prefix = "<b>";// class='$1'>";
	var suffix = "</b>";
	return (haystack+'').replace( new RegExp( "(" + preg_quote( needle ) + ")" , 'gi' ), prefix + "$1" + suffix );
}
*/

function megalinkify(text) // look for all scenes and add links
{
	if (!LINKIFY_STORY_TEXT) return text;
	for (var lookfor in scenelist) {
		//if (debugmode) console.log("Looking for " + scenelist[lookfor] + " in " + currentscene);
		if (scenelist[lookfor] != currentscene) // no self links
		{
			text = linkify(text,scenelist[lookfor]);
		}
	}
	return text;
}

// wrap case insensitively matching words in <a> tags
function linkify(haystack, needle) // look for ONE scene
{
	if (!LINKIFY_STORY_TEXT) return haystack;
	var prefix = "<a onclick=\"go('$1',this)\">";
	var suffix = "</a>";
	return (haystack+'').replace( new RegExp( "(" + preg_quote( needle ) + ")" , 'gi' ), prefix + "$1" + suffix );
}

function endsWith(str, suffix) {
	return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function lastWord(str)
{
	return str.split(" ").splice(-1)[0];
}

function nodoublespaces(str)
{
	return str.replace(/ +(?= )/g,'');
}

function random_int_range_inclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function IsNumeric(val) {
    return Number(parseFloat(val))==val;
}

// turn a string into a number
// it might be a dice roll or a stat
function quantify(str) 
{
	var int = 0;

	if (debugmode) console.log("quantify " + str);
	
	if (inventory[str] != undefined)
	{
		if (debugmode) console.log("quantify got an item name");
		str = ''+inventory[str];
	}
	
	if (((str.includes("D")) && 
		((IsNumeric(str[0])) || // "3d6"
		(IsNumeric(str[1]))))) // "d20"
	{
		var num = 1;
		var die = 6;
		if (debugmode) console.log("quantify rolling: " + str);
		var chunk = str.split('D');
		num = chunk[0];
		die = chunk[1];
		if (!num) num = 1; // eg d6 gets us a null and a 6
		//if (debugmode) console.log('Rolling ' + num + ' d' + die);
		var result = 0;
		var nextroll = 0;
		for (var roll = 0; roll < num; roll++)
		{
			nextroll = random_int_range_inclusive(1,die);
			result += nextroll;
			// we could use unicode
			//Die face-1	⚀	U+2680	&#9856;	
			//Die face-2	⚁	U+2681	&#9857;	
			//Die face-3	⚂	U+2682	&#9858;	
			//Die face-4	⚃	U+2683	&#9859;	
			//Die face-5	⚄	U+2684	&#9860;	
			//Die face-6	⚅	U+2685	&#9861;	
			// great images
			//if (die==6)	text += "<div class='dice"+nextroll+"'></div>";
			//if (die==6) text += "&#" + (9855 + nextroll) + "; ";
		}
		if (debugmode) console.log('quantify rolled a ' + result);
		int = result;
	}
	else // just a number
	{
		if (debugmode) console.log('quantify probably got a number.');
		int = parseInt(str);
		if (isNaN(int)) int = 0;
		if (int==undefined) int = 0;
		if (int==null) int = 0;
		if (int=='') int = 0;
	}

	return int;
}

var S_PLURAL = "s"; // suffix from last inserted inventory quantity
var left_right = 'right'; // toggled odd and even class names for isdialog lines
////////////////////////////////////////////////////////
function parse_line(str) // main workhorse of the engine
{
	// for each character
	var incode = false;
	var text = "";
	var code = "";
	var codeUP = "";
	var skip = false;
	var verb = "HAS";
	var quantity = 1;
	var item = "GOLD";
	var isdialog = false;
	var isbutton = false;
	var run_code_now = true;
	var pendingDialogFaceIMG = ''; // NPC face images

	var do_not_linkify = false; // only true on images so we don't linkify the html/url

	if (str.startsWith('//'))
	{
		if (debugmode) console.log('// SKIPPING A COMMENT');
		return "";
	}

	if (str == undefined)
	{
		if (debugmode) console.log('WARNING: parsed a blank line. Ignoring.');
		return "";
	}

	if (str[0] == "\"") // starts with a quotation mark?
	{
		if (debugmode) console.log('Dialog mode!');
		isdialog = true;
	}

	if (str[0] == "-") // multiple choice list?
	{
		//if (debugmode) console.log('Button:');
		str = str.slice(1).trim(); // strip off the dash
		isbutton = true;
	}

	// look at each character, executing [code] in square brackets
	for (var i = 0, len = str.length; i < len; i++)
	{
	
		if (str[i]=='[')
		{
			incode = true;
			code = "";
		}
		else if (str[i]==']') // end of a code block! process if required
		{
			incode = false;
			codeUP = code.toUpperCase();
			//if (debugmode) console.log('['+codeUP+']');
			if (!isbutton)
			{

				//if (debugmode) console.log('GOT CODE: ' + codeUP); // TODO actually parse!
				var code_clean = codeUP.replace('?',' ?');
				code_clean = code_clean.replace('>',' > ');
				code_clean = code_clean.replace('<',' < ');
				code_clean = code_clean.replace('++',' + 1');
				code_clean = code_clean.replace('--',' - 1');
				code_clean = code_clean.replace('+',' + ');
				code_clean = code_clean.replace('-',' - ');
				code_clean = code_clean.replace('PICK UP',' GET ');
				code_clean = code_clean.replace('!=',' NOT ');
				code_clean = code_clean.replace('==',' EQUALS ');
				code_clean = code_clean.replace('=',' = ');
				code_clean = code_clean.replace('THE PLAYER','');
				code_clean = code_clean.replace('DO ',''); // spaces inserted to avoid false matches eg "flower" contains "we"
				code_clean = code_clean.replace('WE ','');
				code_clean = code_clean.replace('YOU ','');
				code_clean = code_clean.replace('WAS ','');
				code_clean = code_clean.replace('IS ','');
				code_clean = code_clean.replace('USER ','');
				code_clean = code_clean.replace('PLAYER ','');
				code_clean = code_clean.replace('IF ','');
				code_clean = code_clean.replace('WHEN ','');
				code_clean = code_clean.replace('DOES ','');
				code_clean = code_clean.replace('ONLY ','');
				code_clean = code_clean.replace(' TIMES','');
				code_clean = code_clean.replace('!','');
				code_clean = nodoublespaces(code_clean);
				code_clean = code_clean.trim();
				
				var code_split = code_clean.split(' ');
				var code_token_count = code_split.length;
				
				// debug the command after string cleaning
				if (debugmode && code_split.length>1) console.log('['+code_split[0]+','+code_split[1]+','+code_split[2]+','+code_split[3]+']');

				// THREE WORDS OR MORE
				if (code_token_count > 2) // "GET 10 GOLD", "has > 5 gold", "has 5 gold ?", "has a gold"
				{
					// if (debugmode) console.log('code_token_count '+code_token_count);
					verb = code_split[0];
				
					quantity = quantify(code_split[1]);
					if (code_split[1]=='A') quantity = 1; 
					if (code_split[1]=='AN') quantity = 1;
					if (code_split[1]=='THE') quantity = 1;
					if (code_split[1]=='ONE') quantity = 1;
					if (code_split[1]=='NO') quantity = 0;

					item = code_split[2];

					// [HP EQUALS 5 ?]
					if (code_split[1] == 'EQUALS')
					{
						if (debugmode) console.log('eq');
						verb = 'HAS';
						item = code_split[0];
						quantity = quantify(code_split[2]);
					}

					// [HP 100 ?]
					if (code_split[2] == '?')
					{
						if (debugmode) console.log('?');
						verb = 'HAS';
						item = code_split[0];
						quantity = quantify(code_split[1]);
					}

					// handle [key + 1]
					if (code_split[1] == '+')
					{
						if (debugmode) console.log('+');
						verb = 'GET';
						quantity = quantify(code_split[2]);
						item = code_split[0];
					}
					if (code_split[1] == '-')
					{
						if (debugmode) console.log('-');
						verb = 'DROP';
						quantity = quantify(code_split[2]);
						item = code_split[0];
					}
					// set is different from adding
					if (code_split[1] == '=')
					{
						if (debugmode) console.log('=');
						verb = 'SET';
						quantity = quantify(code_split[2]);
						item = code_split[0];
					}
					if (code_split[1] == 'NOT')
					{
						if (debugmode) console.log('not');
						verb = 'NOT';
						quantity = quantify(code_split[2]);
						item = code_split[0];
					}
					
					if (code_split[1] == '>')
					{
						if (debugmode) console.log('>');
						verb = 'HASMORETHAN';
						quantity = quantify(code_split[2]);
						item = code_split[0];
					}
					else if (code_split[1] == '<')
					{
						if (debugmode) console.log('<');
						verb = 'HASLESSTHAN';
						quantity = quantify(code_split[2]);
						item = code_split[0];
					}
					else if (code_split[3] == '?') // eg [gold = 5 ?]
					{
						if (debugmode) console.log('? pos 3');
						verb = 'HAS';
						item = code_split[0];
						quantity = quantify(code_split[2]);
					}

					if (item == 'HAS') // [has > 5 gold]
					{
						item = code_split[3];
					}
				}
				// TWO WORDS
				else if (code_token_count == 2) // "get gold?", "has key", "saw boat", "is angry", 'no key'
				{
					if (debugmode) console.log('code_token_count '+code_token_count);
					
					verb = code_split[0];
					quantity = 1;
					item = code_split[1];

					if (code_split[0] == 'NO')
					{
						verb = 'HAS';
						quantity = 0;
						item = code_split[1];
					}

					if (code_split[1] == '?') // eg [gold ?]
					{
						if (debugmode) console.log('?');
						verb = 'HAS';
						item = code_split[0];
						quantity = 1;
					}
					
				}
				// ONE WORD
				else if (code_token_count == 1) // "1st" "else" "KEY" or "GOLD+1" or "FUN++" or "KEY?" or "key>5"
				{
					if (debugmode) console.log('code_token_count '+code_token_count);

					if (codeUP.endsWith("?"))
					{
						if (debugmode) console.log("Question mark means verb is HAS");
						verb = "HAS";
					}
					else
					{	
						verb = code_split[0]; // 1st
					}
					quantity = 1;
					item = code_split[0]; 
				}

				if (code_token_count==1)
				{
					if (verb == '1ST')
					{
						if (debugmode) console.log('1st');
						code_result = (visited_scenes[currentscene] <= 1);
						if (debugmode) console.log(currentscene + " visits: " + visited_scenes[currentscene] + " so code_result=" + code_result);
						skip = !code_result;
					}
					/*
					else if (!skip && (
						(verb.includes("D")) && 
						((IsNumeric(verb[0])) || // "3d6"
						(IsNumeric(verb[1]))))) // "d20"
					{
						var num = 1;
						var die = 6;
						if (debugmode) console.log("Dice roll: " + verb);
						var chunk = verb.split('D');
						num = chunk[0];
						die = chunk[1];
						if (!num) num = 1; // eg d6 gets us a null and a 6
						if (debugmode) console.log('Rolling ' + num + ' d' + die);
						var result = 0;
						var nextroll = 0;
						for (var roll = 0; roll < num; roll++)
						{
							nextroll = random_int_range_inclusive(1,die);
							result += nextroll;
							// we could use unicode
							//Die face-1	⚀	U+2680	&#9856;	
							//Die face-2	⚁	U+2681	&#9857;	
							//Die face-3	⚂	U+2682	&#9858;	
							//Die face-4	⚃	U+2683	&#9859;	
							//Die face-5	⚄	U+2684	&#9860;	
							//Die face-6	⚅	U+2685	&#9861;	
							// great images
							//if (die==6)	text += "<div class='dice"+nextroll+"'></div>";
							if (die==6) text += "&#" + (9855 + nextroll) + "; ";
						}
						text += " = " +result;
					}
					*/
					else if (!skip && (
						endsWith(codeUP,".PNG") ||
						endsWith(codeUP,".JPG") ||
						endsWith(codeUP,".GIF")
						))
					{
						if (debugmode) console.log("Adding image: " + code + " cls=" + CLEARSCREEN_BEFORE_IMAGES);
						if (CLEARSCREEN_BEFORE_IMAGES) clearscreen(); // fixme does this bug stuff?
						
						// special case: inside dialog means a VN style NPC face
						if (isdialog)
						{
							pendingDialogFaceIMG = "<img class='dialog_image' src='img/" + code + "'>";
						}
						else // normal in-text image full size
						{
							text = text + "<img class='scene_image' src='img/" + code + "'>";
						}
						do_not_linkify = true;
						verb = "";
						item = "";
						quantity = "";
					}
					else if (codeUP == 'S') // quantity suffix from previous inventory insert
					{
						text += S_PLURAL; // a global that is either "" or "s" // TODO: sometimes should be "es"?
						verb = "";
					}
					else if (codeUP == 'ELSE')
					{
						if (debugmode) console.log('else');
						// do nothing in this state
					}
					else // regular single word is assume an INVENTORY quantity...
					{
						if (debugmode) console.log("quantity="+inventory[item]);
						if (inventory[item]!=undefined) // insert quantity
						{
							text += int_to_words(inventory[item]);
							if (inventory[item] == 1)
								S_PLURAL = "";
							else
								S_PLURAL = "s";
							verb = "";
						}
						else
						{
							text += "no";
							S_PLURAL = "s";
							verb = "";
						}
					}

				} // is 1 token long

				if (isNaN(quantity)) quantity = 1;

				run_code_now = !isbutton; // just remember the scene name to goto when we click

				if (run_code_now)
				{
					if (verb!="" && debugmode) console.log('verb:'+verb+' quantity:'+quantity+' item:'+item);

					if (!skip && (verb == 'SET'))
					{
						if (debugmode) console.log('setting');
						inventory[item] = quantity;
						if (debugmode) console.log('(we have exactly '+inventory[item]+' '+item+')');
					}

					if (!skip && (verb == 'GET' || verb == 'GETS' || verb == 'TAKE' || verb == 'TAKES' || verb == 'GRAB' || verb == 'OBTAIN'))
					{
						if (debugmode) console.log('getting');
						if (!inventory[item]) inventory[item] = 0; // avoid undefined
						inventory[item] += quantity;
						if (debugmode) console.log('(we now have '+inventory[item]+' '+item+')');
					}

					if (!skip && (verb == 'PUT' || verb == 'DROP' || verb == 'LOSE' || verb == 'GIVE' || verb == 'DESTROY' || verb == 'DELETE' || verb == 'SUBTRACT'))
					{
						if (debugmode) console.log('dropping');
						if (!inventory[item]) inventory[item] = 0; // avoid undefined
						inventory[item] -= quantity;
						if (debugmode) console.log('(we now have '+inventory[item]+' '+item+')');
					}

					if (!skip && (verb == 'NOT'))
					{
						if (debugmode) console.log('not');
						if (inventory[item] != quantity)
						{
							if (debugmode) console.log('(Yes, we do not have '+quantity+' '+item+', we have '+inventory[item]+')');
							code_result = true;
						}
						else
						{
							if (debugmode) console.log('(No, we do have '+quantity+' '+item+', we have '+inventory[item]+')');
							code_result = false;
						}
						skip = !code_result;
					}

					if (!skip && (verb == 'HASLESSTHAN'))
					{
						if (inventory[item] < quantity)
						{
							if (debugmode) console.log('(Yes, we have less than '+quantity+' '+item+', we have '+inventory[item]+')');
							code_result = true;
						}
						else
						{
							if (debugmode) console.log('(No, we do not have less than '+quantity+' '+item+', we have '+inventory[item]+')');
							code_result = false;
						}
						skip = !code_result;
					}

					if (!skip && (verb == 'HASMORETHAN'))
					{
						if (inventory[item] > quantity)
						{
							if (debugmode) console.log('(Yes, we have more than '+quantity+' '+item+', we have '+inventory[item]+')');
							code_result = true;
						}
						else
						{
							if (debugmode) console.log('(No, we do not have more than '+quantity+' '+item+', we have '+inventory[item]+')');
							code_result = false;
						}
						skip = !code_result;
					}

					if (!skip && (verb == 'HAS' || verb == 'IS' || verb == 'GOT' || verb == 'WAS' || verb == 'FOUND' || verb == 'HOLDING' || verb == 'HAVE'))
					{
						if (debugmode) console.log('has');
						if (inventory[item] == quantity) // FIXME: what about has gold? we need ANYAMOUNT quantity
						{
							if (debugmode) console.log('(Yes, we have '+quantity+' '+item+')');
							code_result = true;
						}
						else
						{
							if (debugmode) console.log('(No, we do not have '+quantity+' '+item+', we have '+inventory[item]+')');
							code_result = false;
						}
						skip = !code_result;
					}

					if (!skip && (verb == 'NO')) // do we NOT have this in our inventory?
					{
						if (debugmode) console.log('no');
						if (inventory[item] != 0) //quantity)
						{
							if (debugmode) console.log('(No, we DO have some '+item+', we have '+inventory[item]+')');
							code_result = false;
						}
						else
						{
							if (debugmode) console.log('(Yes, we do NOT have some '+item+')');
							code_result = true;
						}
						skip = !code_result;
					}

					if (codeUP == 'ELSE')
					{
						if (debugmode) console.log('else');
						skip = code_result;
						if (debugmode) console.log('skip='+skip);
					}
									
					// if (debugmode) console.log('code_result='+code_result);
				} // if run_code_now
			} // if !isbutton
		} // end if this char was ]
		else if (incode) // more code incoming
		{
			code = code + str[i];
		}
		else // regular text, keep going
		{
			text += str[i];
		}
	}
	
	if (!skip) // conditional logic may be in effect
	{
		// search for any scenes to link automagically
		// unless we are in a choice button
		if (!(isbutton && code_clean != undefined) && (do_not_linkify==false) && LINKIFY_STORY_TEXT)
		{
			text = megalinkify(text);
		}
		else
		{
			//if (debugmode) console.log('Not linkifying this line: '+text);
		}
		
		// make onomatopoeias like "shake" animate
		//text = coolify(text); // FIXME: what if inside an url? // BUGGY TODO
	
		if (isdialog) // handle character dialog with alternating left/right word bubbles
		{
			if (left_right == 'left') left_right = 'right'; else left_right = 'left';
			text = "<span class='dialog"+ left_right + "'>" + text + "</span>";

			// special case: an img inside a dialog means a VN style "face"
			// FIXME: I don't like doing it this way: maybe define pos of an img in code?
			// eg at front or at end of a line? [IMG] "quote" [IMG]
			if (pendingDialogFaceIMG)
			{
				if (debugmode) console.log('Changing dialog face on the '+left_right+' to ' + pendingDialogFaceIMG);
				document.getElementById('face_'+left_right).innerHTML = pendingDialogFaceIMG;
				pendingDialogFaceIMG = '';
			}
		}
		
		if (isbutton) // links to the scene with name [code]
		{
			if (codeUP != undefined)
			{
				if (debugmode) console.log('Button: ['+codeUP+']:' + text);
				text = "<a class='choice' onclick=\"go('" + codeUP + "',this)\">" + text + "</a>";
			}
			else // - Text with no [link]
			{
				if (debugmode) console.log('ERROR: Button ['+text+'] does nothing (no scene name in square brackets)');
				text = "<a class='choice' onclick=\"go('" + "" + "',this)\">" + text + "</a>";
			}
			currentchoices_div.innerHTML += text;

			//if (debugmode) console.log('choice html is ' + currentchoices_div.innerHTML);
			
			return "";
		}
		else // not a button
		{
			return text + " "; // \n might be nicer?
		}
	}
	else
	{
		if (debugmode) console.log("SKIPPED line");
		return "";
	}
}

function parse_text(manylines) // but don't update scene: used by GUI HUD
{
	if (debugmode) console.log("parse_text: " + manylines);
	var output = "";
	var eachline = manylines.split("\n");
	// parse each line individually
	for (var linenum in eachline)
	{
		//if (debugmode) console.log(ascene + ' line ' + linenum + ': ' + scene[ascene][linenum]);
		output = output + parse_line(eachline[linenum]);
	}
	return output;
}

// switch scenes and parse new story+logic line by line
function parse_scene(ascene)
{
	
	var output = "";
	ascene = ascene.toUpperCase();
	currentscene = ascene;

	//if (debugmode) console.log(visited_scenes);
	
	if (!visited_scenes[currentscene])
		visited_scenes[currentscene] = 1; 
	else
		visited_scenes[currentscene]++;
	
	//if (debugmode) console.log('Parsing scene:' + currentscene);
	if (!scene[currentscene])
	{
		if (debugmode) console.log('ERROR: missing scene ' + currentscene);
	}
	
	// parse each line individually
	for (var linenum in scene[currentscene])
	{
		//if (debugmode) console.log(ascene + ' line ' + linenum + ': ' + scene[ascene][linenum]);
		output = output + parse_line(scene[currentscene][linenum]);
	}
	
	update_GUI();

	output = '<p>'+output+'</p>';
	//if (debugmode) console.log(currentscene+' html =' + output);
	render(output,fastmode,CLEARSCREEN_EACH_SCENE);
	
}

function strip_tags (input, allowed) // eg "<b>cool</b>","<b>"
{ 
	allowed = (((allowed || '') + '').toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join('')
	var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi
	var commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi
	return input.replace(commentsAndPhpTags, '').replace(tags, function ($0, $1) {
	return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : ''	})
}

function clearscreen()
{
	if (debugmode) console.log("CLS");
	// gamediv.innerHTML = '';
	story_so_far = ''; // FIXME: hmmm....
	currentscene_div.innerHTML = '';
	story_so_far_div.innerHTML = '';
	//currentchoices_div.innerHTML = '';
	// remember for dead end fixing
	second_last_cls_scene = last_cls_scene;
	last_cls_scene = currentscene;
}

// the last item in an object or associative array isn't [length-1]
function last_item(arr,offset)
{
	var allkeys = Object.keys(arr);
	if (allkeys.length >= offset+1)
		return arr[allkeys[allkeys.length - 1 - offset]];
	else
		return "";
}

// update game text with a new scene
function render(html,instant,cls)
{
	var scene_has_links = html.includes("<a");
	var deadend = false;

	if (cls)
	{
		clearscreen();
	}
	else
	{
		// remove old links (but not images) since they are now in the past
		// unless current scene has no links
		if (scene_has_links)
		{
			//if (debugmode) console.log("New scene has links: removing all previous.");
			//gamediv.innerHTML = strip_tags(gamediv.innerHTML,'<img><p><b><i><br>');
			story_so_far += strip_tags(currentscene_div.innerHTML,'<img><p><b><i><br>');
			story_so_far_div.innerHTML = story_so_far;
			currentscene_div.innerHTML = "";
			currentchoices_div.innerHTML = ""; // this is written to as we render
		}
		else
		{
			// leave them as is - EXCEPT how we got here
			// FIXME: assumed link is lowercase but could be anything: BUGGY TODO
			var last_link = "<a onclick=\"go('" + prevlink + "',this)\">" + prevlink + "</a>";
			if (debugmode) console.log("Removing previous link only: " + last_link);
			//gamediv.innerHTML = gamediv.innerHTML.replace(last_link,currentscene.toLowerCase());
			currentscene_div.innerHTML = currentscene_div.innerHTML.replace(last_link,currentscene.toLowerCase());
		}
	}
	

	// we could detect dead ends, but in CYOA isbutton mode or !LINKIFY_STORY_TEXT the scene html may have no links
	/*
	if (!scene_has_links && !currentscene_div.innerHTML.includes("<a")) // FIXME: wonky: x2 adds links to links!
	{
		if (debugmode) console.log("STORY ERROR: DEAD END DETECTED!");

		// "works" but 2 problems: this could cause wierd loopable sections, and CLS can make nothing to link
		currentscene_div.innerHTML = megalinkify(currentscene_div.innerHTML);
		if (!story_so_far_div.innerHTML.includes("<a")) story_so_far_div.innerHTML = megalinkify(story_so_far_div.innerHTML);
		html = megalinkify(html);
		deadend = true;

		// still no links? manually add links the previous "CLS" scene
		// fixme what if this is the first scene?
		if (currentscene == last_cls_scene)
			html += "<p><a onclick=\"go('" + second_last_cls_scene + "',this)\">Continue...</a></p>"
		else
			html += "<p><a onclick=\"go('" + last_cls_scene + "',this)\">Continue...</a></p>"

		// idea: automatically link nearby scenes... buggy
		//html += "<p>Nearby locations: ";
		//html += linkify(last_item(visited_scenes)) + ", ";
		//html += linkify(last_item(visited_scenes,1)) + ", ";
		//html += linkify(last_item(visited_scenes,2)) + ", ";
		//html += linkify(last_item(visited_scenes,3)) + ".";
		//html += "</p>";

	}
	*/
	update_hud();

	if (instant) 
	{
		remember_story((html.includes("<a")) && !deadend); // if curent has a link, remove links
		//gamediv.innerHTML = the_story_so_far + html;
		currentscene_div.innerHTML = html;

		autoscroll();
		return;
	}
	
	// animate word by word unless wrapped in tags
	//tagbuffer = splitTags(html); // chunks of html
	//wordbuffer = html.split(' ');
	animate_words(html);
}

function update_hud()
{
	if (debugmode) console.log('update_hud');
	if (stats_div) stats_div.innerHTML = parse_text(stats_div_src);
	if (inventory_div) inventory_div.innerHTML = parse_text(inventory_div_src);
	if (map_div) map_div.innerHTML = parse_text(map_div_src);
	if (quests_div) quests_div.innerHTML = parse_text(quests_div_src);
}
// make sure most recent text is above the fold
function autoscroll()
{
	gamediv.scrollTop = gamediv.scrollHeight - gamediv.clientHeight;
}

/*
function splitTags(str) // wonky - breaks on nested tags etc
{
	var htmlTagRegex =/\s*(<[^>]*>)/g     
	//str = '<div class="tab0">CSS code formatter</div><div class="tab2">CSS code compressor</div>';
	//outputs ["", "<div class="tab0">", "CSS code formatter", "</div>", "", "<div class="tab2">", "CSS code compressor", "</div>", ""]	
	return str.split(htmlTagRegex);
}
*/

function remember_story(removelinks) 
{
	if (removelinks)
		the_scene_so_far = strip_tags(currentscene_div.innerHTML,'<img><p><b><i><br>');
	else
		the_scene_so_far = currentscene_div.innerHTML; 
}

function animate_words(str)
{
	if (str)
	{
		//console.log("STARTING NEW ANIMATION")
		anim_str = str;
		anim_num = 0;
		anim_has_link = str.includes("<a");
		// kill the <a> unless no new ones added - done elsewhere
		if (anim_has_link)
		{
			//if (debugmode) console.log('anim has a link: stripping old ones.');
			remember_story(true);
		}
		else
		{
			//if (debugmode) console.log('anim has no links: leaving old ones.');
			remember_story(false);
		}
	}

	var anim_done = false;
	var chunkready = false;
	var inatag = false;
	var txt = anim_str.slice(0,anim_num); // txt so far
	var chr = "";

	while (!chunkready && !anim_done)
	{
		chr = anim_str[anim_num]; // get next letter
		if (chr=='<') inatag = true;
		if (chr=='>') inatag = false;
		chunkready = (!inatag && (chr==" " || chr=="\n" || chr=='.'));
		txt = txt + chr;
		anim_num++;
		anim_done = (anim_num >= anim_str.length-1);
	}

	//if (debugmode) console.log('ANIM: ['+txt+']');
	//gamediv.innerHTML = the_scene_so_far + txt; // one chunk at a time otherwise the browser closes open tags
	currentscene_div.innerHTML = the_scene_so_far + txt; // one chunk at a time otherwise the browser closes open tags

	autoscroll();

	if (anim_done)
	{
		if (debugmode) console.log('ANIM DONE!');
		// finally we should show the current choices (if any)
		if (currentchoices_div) currentchoices_div.style.display = 'block'; // show
	}
	else
	{
		setTimeout(animate_words,hurry?0:ms_per_word);
	}
}

function go(scene,tag) // user made a choice
{
	if (debugmode) console.log('GO '+scene);
	if (!scene) return;

	currentchoices_div.innerHTML = ''; // cleared here, not in clearscreen() since it get written to just prior
	currentchoices_div.style.display = 'none'; // hide;

	scene = scene.toUpperCase();
	if (tag) prevlink = tag.innerHTML; // HACK for removing links FIXME
	hurry = false; // reset previous "fast forward scene" request
	turn_number++;
	// for embedding:
	inventory['TURN_COUNT'] = turn_number;
	walkthrough.push(scene); // remember how we got here for undo
	parse_scene(scene);
	//save_game_state();
}

function update_GUI()
{
	if (gui_TL) gui_TL.innerHTML = currentscene + " - Turn " + turn_number;
	if (gui_TR) gui_TR.innerHTML = "<a href='javascript:go(\"MAP\")'>MAP</a>, <a href='javascript:go(\"INVENTORY\")'>INVENTORY</a>"; // stringify_inventory();
}

function plural(what,howmany)
{
	if (howmany==1) 
		return what; // "MAP"
	else
		return howmany+' '+what+'S'; // "15 MAPS""
}

function int_to_words(int) {
  
  if (debugmode) console.log('int_to_words ' + int);
  if (int === 0) return 'zero';
  if (int === '0') return 'zero';
  if (!int) return 'no';

  var ONES  = ['','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
  var TENS  = ['','','twenty','thirty','fourty','fifty','sixty','seventy','eighty','ninety'];
  var SCALE = ['','thousand','million','billion','trillion','quadrillion','quintillion','sextillion','septillion','octillion','nonillion'];

  // Return string of first three digits, padded with zeros if needed
  function get_first(str) {
    return ('000' + str).substr(-3);
  }

  // Return string of digits with first three digits chopped off
  function get_rest(str) {
    return str.substr(0, str.length - 3);
  }

  // Return string of triplet convereted to words
  function triplet_to_words(_3rd, _2nd, _1st) {
    return (_3rd == '0' ? '' : ONES[_3rd] + ' hundred ') + (_1st == '0' ? TENS[_2nd] : TENS[_2nd] && TENS[_2nd] + '-' || '') + (ONES[_2nd + _1st] || ONES[_1st]);
  }

  // Add to words, triplet words with scale word
  function add_to_words(words, triplet_words, scale_word) {
    return triplet_words ? triplet_words + (scale_word && ' ' + scale_word || '') + ' ' + words : words;
  }

  function iter(words, i, first, rest) {
    if (first == '000' && rest.length === 0) return words;
    return iter(add_to_words(words, triplet_to_words(first[0], first[1], first[2]), SCALE[i]), ++i, get_first(rest), get_rest(rest));
  }

  return (int<0?'negative ':'') + iter('', 0, get_first(String(int)), get_rest(String(int)));
}

function stringify_inventory()
{
	//if (debugmode) console.log('stringify_inventory '+inventory.toString()); // null
	var str = "";
	for (var item in inventory)
	{
		if (str != "") str = str + ',';
		str = str + ' ' + plural(item,inventory[item]);
	}
	if (str=="") str = "CARRYING NOTHING";
	return str;
}

function src_changed() // we updated the source code!
{
	if (debugmode) console.log('source_code_changed');
	// recompile everything - this may go too slow...
	//gamediv.innerHTML = "";
	currentscene_div.innerHTML = "";
	fastmode = true;
	init();
	go(firstscene);
}

//} // end CYOAwesome constructor

function enableTab(id) {
    var el = document.getElementById(id);
	if (!el) return;
    el.onkeydown = function(e) {
        if (e.keyCode === 9) { // tab was pressed

            // get caret position/selection
            var val = this.value,
                start = this.selectionStart,
                end = this.selectionEnd;

            // set textarea value to: text before caret + tab + text after caret
            this.value = val.substring(0, start) + '\t' + val.substring(end);

            // put caret at right position again
            this.selectionStart = this.selectionEnd = start + 1;

            // prevent the focus lose
            return false;

        }
    };
}

function hurryup() // from onclick
{
	// hurry = true; // user wants to skip animate_words FIXME: stays true due to race w event and go?
	if (debugmode) console.log("hurryup");
}

function save_game_state()
{
	
	if (debugmode) console.log("save_game_state");

	if (!window.localStorage)
	{
		if (debugmode) console.log("ERROR: no localstorage! Unable to save data.");
		return;
	}
	
	localStorage["currentscene"] = currentscene;
	localStorage["turn_number"] = turn_number;
	localStorage["walkthrough"] = JSON.stringify(walkthrough);
	localStorage["visited_scenes"] = JSON.stringify(visited_scenes)
	localStorage["inventory"] = JSON.stringify(inventory);
	localStorage["story_so_far"] = story_so_far; // FIXME 

}

function load_game_state() // FIXME don't playback at all: just remember entire story_so_far
{
	if (debugmode) console.log("load_game_state");
	
	if (!window.localStorage)
	{
		if (debugmode) console.log("ERROR: no localstorage! Unable to load data.");
		return;
	}

	clearscreen();

	currentscene = localStorage["currentscene"];
	if (currentscene==undefined) currentscene = firstscene;

	turn_number = localStorage["turn_number"];
	if (turn_number==undefined) turn_number = 0;

	inventory = localStorage["inventory"];
	if (inventory == undefined) inventory = [];
	else inventory = JSON.parse(inventory);
	
	visited_scenes = localStorage["visited_scenes"];
	if (visited_scenes==undefined) visited_scenes = [];
	else visited_scenes = JSON.parse(visited_scenes);

	walkthrough = localStorage["walkthrough"];
	if (walkthrough == undefined) walkthrough = [];
	else walkthrough = JSON.parse(walkthrough);

	story_so_far = localStorage["story_so_far"];
	if (story_so_far==undefined) story_so_far = "";

	story_so_far_div.innerHTML = story_so_far;
	
	// very slow and buggy to replay entire game
	// should we play though up to the current scene?
	/*
	if (walkthrough.length)
	{
		for (var ascene in walkthrough)
		{
			if (debugmode) console.log("WALKTHROUGH: " + walkthrough[ascene]);
			fastmode = true;
			go(walkthrough[ascene]); // we will pick up stuff and set visits
			fastmode = false;
		}
		// BUG: inventory etc might be different after walkthough playback ---^
	}
	*/

	if (turn_number > 0)
	{
		if (debugmode) console.log("LOADED PREVIOUS GAME: Turn " + turn_number + " Scene " + currentscene);
		go(currentscene);
	}
	else
	{
		if (debugmode) console.log("NO SAVE DATA: starting a new game!");
		turn_number = 0;
		inventory = [];
		visited_scenes = [];
		walkthrough = [];
		go(firstscene);
	}

}


function toggle(id)
{
	var element = null;
	element = document.getElementById(id);
	if (element)
	{
		if (element.style.display=='block')
		{
			element.style.display='none';
		}
		else
		{
			element.style.display='block';
		}
	}
}

// swing meter and battle code
//////////////////////////////////////////////////////////////// BATTLE BEGINS
var g = {};  // legacy code, used to stand for game - TODO FIXME
var swingdiv = null;
var swingpowerdiv = null;
var swingtextdiv = null;
var swingframecount = 0;
var swinging = false;
var in_battle = false;
// using the Cold Fuzion 3d6 rpg combat system


function d6(numberofsixsideddice)
{
	var roll = 0;
	if (!numberofsixsideddice) numberofsixsideddice = 3;
	for (var loopa=0; loopa<numberofsixsideddice; loopa++)
	{
		roll += Math.round(((Math.random()*50000)+10000)/10000); // 1 to 6
	}
	return roll;
}

/*
Throwing 3 6-faced dice and adding the results yields a number
range from 3 (1,1,1) to 18 (6,6,6). The gaussian distribution of
3d6 is much more representative of the bell-shape of the curve:


                     *  *
                     *  *
                  *  *  *  *
                  *  *  *  *
                  *  *  *  *
                  *  *  *  *
               *  *  *  *  *  *
               *  *  *  *  *  *
               *  *  *  *  *  *
               *  *  *  *  *  *
               *  *  *  *  *  *
               *  *  *  *  *  *
            *  *  *  *  *  *  *  *
            *  *  *  *  *  *  *  *
            *  *  *  *  *  *  *  *
            *  *  *  *  *  *  *  *
            *  *  *  *  *  *  *  *
         *  *  *  *  *  *  *  *  *  *
         *  *  *  *  *  *  *  *  *  *
         *  *  *  *  *  *  *  *  *  *
         *  *  *  *  *  *  *  *  *  *
      *  *  *  *  *  *  *  *  *  *  *  *
      *  *  *  *  *  *  *  *  *  *  *  *
      *  *  *  *  *  *  *  *  *  *  *  *
   *  *  *  *  *  *  *  *  *  *  *  *  *  *
   *  *  *  *  *  *  *  *  *  *  *  *  *  *
*  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *
----------------------------------------------
3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18
Number of dice roll combinations: 
1, 3, 6,10,15,21,25,27,27,25,21,15,10, 6, 3, 1

The average of a dice throw might be important to
decision-making. For instance, the average of a 3d6 throw is
10.5. This is displayed on the chart above, being the highest
point on the curve. The average for any dice throw can also be
calculated by adding the lowest possible score to the higest
possible score and dividing by 2. In the 3d6 example, this is
(3+18)/2=10.5, It can also be reached by taking the average of
each die's result ((1+6)/2=3.5, for a d6) and multiplying by the
number of dice thrown ((3.5)*3=10.5).
*/

var roll_likelihood_string = [
	/* 00 */ 'completely impossible',
	/* 01 */ 'almost impossible',
	/* 02 */ 'improbable',
	/* 03 */ 'quite unlikely',
	/* 04 */ 'unlikely',
	/* 05 */ 'quite rare',
	/* 06 */ 'rare',
	/* 07 */ 'uncommon',
	/* 08 */ 'not uncommon',
	/* 09 */ 'quite common',
	/* 10 */ 'everyday',
	/* 11 */ 'somewhat likely',
	/* 12 */ 'likely',
	/* 13 */ 'possibly',
	/* 14 */ 'probably',
	/* 15 */ 'quite probably',
	/* 16 */ 'most likely',
	/* 17 */ 'very likely',
	/* 18 */ 'inevitable',
	/* 19 */ 'unavoidable',
	/* 20 */ 'going to happen'];
	
var roll_ability_string = [
	/* 00 */ 'completely ignorant',
	/* 01 */ 'virtually ignorant',
	/* 02 */ 'complete newbie',
	/* 03 */ 'newbie',
	/* 04 */ 'total beginner',
	/* 05 */ 'beginner',
	/* 06 */ 'familiar',
	/* 07 */ 'mediocre',
	/* 08 */ 'acceptable',
	/* 09 */ 'practiced',
	/* 10 */ 'competent',
	/* 11 */ 'very competent',
	/* 12 */ 'impressive',
	/* 13 */ 'very impressive',
	/* 14 */ 'great',
	/* 15 */ 'heroic',
	/* 16 */ 'fantastic',
	/* 17 */ 'incredible',
	/* 18 */ 'amazing',
	/* 19 */ 'legendary',
	/* 20 */ 'godlike'];

var roll_difficulty_string = [
	/* 00 */ 'simple',
	/* 01 */ 'simple',
	/* 02 */ 'simple',
	/* 03 */ 'newbie',
	/* 04 */ 'beginner',
	/* 05 */ 'beginner',
	/* 06 */ 'everyday',
	/* 07 */ 'everyday',
	/* 08 */ 'practiced',
	/* 09 */ 'practiced',
	/* 10 */ 'competent',
	/* 11 */ 'competent',
	/* 12 */ 'impressive',
	/* 13 */ 'impressive',
	/* 14 */ 'great',
	/* 15 */ 'heroic',
	/* 16 */ 'fantastic',
	/* 17 */ 'incredible',
	/* 18 */ 'amazing',
	/* 19 */ 'legendary',
	/* 20 */ 'godlike'];

function roll_likelihood(roll)
{
	roll=parseInt(roll);
	if (roll < 0) return  'impossibly low';
	if (roll > 20) return 'impossibly high';
	return roll_likelihood_string[roll];
} 

function roll_ability(roll)
{
	roll=parseInt(roll);
	if (roll < 0) return  'impossibly low';
	if (roll > 20) return 'impossibly high';
	return roll_ability_string[roll];
} 

function roll_difficulty(roll)
{
	roll=parseInt(roll);
	if (roll < 0) return  'impossibly low';
	if (roll > 20) return 'impossibly high';
	return roll_difficulty_string[roll];
} 

function plusminus(anumber) // eg "+5" or "-1" or "" for zero
{
	if (anumber>0) return '+'+anumber;
	if (anumber<0) return ''+anumber; // already has the minus
	return "+0";
}

function roll3d6(bonus)
{
	if (!bonus) bonus = 0;
	g.roll1=d6(1);
	g.roll2=d6(1);
	g.roll3=d6(1);
	g.rolltotalunmodified = g.roll1+g.roll2+g.roll3;
	var total=g.roll1+g.roll2+g.roll3+bonus;
	var bonus_str = '';
	bonus_str = plusminus(bonus);
	g.lastrollhtml = 'rolled a '+'('+g.roll1+','+g.roll2+','+g.roll3+')'+bonus_str+'=<b>'+total+'</b>';
	g.lastrollterse = g.rolltotalunmodified+bonus_str+'=<b>'+total+'</b>';
	g.lastroll = total;
	return g.lastroll;
}






// How to resolve Combat
// Compare the totals of the Attacker and the Defender. 
// Attacker AV = REF + H2H Skill + 3d6
// vs.
// Defender DV = DEX + Evade Skill + 3d6
// If the Attacker has a higher total, the hit succeeds and Damage (1d6 times the weapon's DC) is taken.
function resolve_combat(attacker_attribute,attacker_skill,attack_bonus,attacker_damage,damage_bonus,defender_attribute,defender_skill,defender_bonus)
{
	attacker_attribute = parseInt(attacker_attribute);
	attacker_skill = parseInt(attacker_skill);
	attack_bonus = parseInt(attack_bonus);
	attacker_damage = parseInt(attacker_damage);
	damage_bonus = parseInt(damage_bonus);
	defender_attribute = parseInt(defender_attribute);
	defender_skill = parseInt(defender_skill);
	defender_bonus = parseInt(defender_bonus);

	g.av = attacker_attribute + attacker_skill + roll3d6(attack_bonus);
	g.lastcombatattackroll = g.lastrollhtml;
	
	// show the player's roll on the gui before it gets overwritten
	if (g.roll_on_gui)
	{
		if (g.die1div) { g.die1div.style.backgroundPosition = '0px -' + ((g.roll1*32)-32) + 'px'; }
		if (g.die2div) { g.die2div.style.backgroundPosition = '0px -' + ((g.roll2*32)-32) + 'px'; }
		if (g.die3div) { g.die3div.style.backgroundPosition = '0px -' + ((g.roll3*32)-32) + 'px'; }
		if (g.rollnumberdiv) g.rollnumberdiv.innerHTML = g.lastrollterse;
	}

	g.dv = defender_attribute + defender_skill + roll3d6(defender_bonus);
	g.lastcombatdefenceroll = g.lastrollhtml;

	if (g.av > g.dv) // hit!
	{
		g.lastcombatdamage = d6(attacker_damage) + damage_bonus;
		g.lastcombatresulthtml = 'hit for ' + g.lastcombatdamage + ' damage';
		return g.lastcombatdamage;
	}
	// miss:
	g.lastcombatresulthtml = 'missed';
	g.lastcombatdamage = 0;
	return g.lastcombatdamage;
}

// How to resolve Skill Rolls:
// Action Value (AV) = ATTRIBUTE + SKILL + 3d6
// Attribute/Skill Levels: (0-1:challenged, 1-2:everyday, 3-4:competent, 5-6:impressive, 7-8:incredible, 9-10:legendary)
// 0-1: challenged ability - don't know how to perform this task. 1-2: everyday ability - learned the basics, a beginner. 3-4: competent ability - well trained and practiced, a professional. 5-6: impressive ability - a master craftsman of the skill. 7-8: incredible ability - one of the best at this skill, an Olympian. 9-?: legendary ability - a genius, a prodigy at this skill.
// vs.
// Skill Difficulty Value (DV)
// Skill Difficulty Values: (Simple=10, Easy=12, Everyday=14, Practiced=16, Competent=18, Impressive=20, Heroic=22, Incredible=26, Legendary=30)
// If you roll higher, you succeed
function resolve_skill(attribute,skill,bonus,difficulty)
{
	attribute = parseInt(attribute);
	skill = parseInt(skill);
	bonus = parseInt(bonus);
	difficulty = parseInt(difficulty);
	
	g.av = attribute + skill + bonus + roll3d6();
	g.dv = difficulty;
	if (g.av > g.dv) // success!
	{
		g.lastskillsuccess = true;
		g.lastskillresulthtml = 'succeded';
		return g.lastskillsuccess;
	}
	// fail:
	g.lastskillsuccess = false;
	g.lastskillresulthtml = 'failed';
	return g.lastskillsuccess;
}

function swingmetertimer()
{
	var rand6 = 24; // pixels

	if (!swinging) return;
	swingframecount++;
	
	// jumble the dice around occasionally
	if (swingframecount % 12 == 0)
	{
		if (g.die1div) { rand6 = d6(); g.die1div.style.backgroundPosition = '0px -' + ((rand6*32)-32) + 'px'; }
		if (g.die2div) { rand6 = d6(); g.die2div.style.backgroundPosition = '0px -' + ((rand6*32)-32) + 'px'; }
		if (g.die3div) { rand6 = d6(); g.die3div.style.backgroundPosition = '0px -' + ((rand6*32)-32) + 'px'; }
	}
	
	if (swingframecount>100) 
	{
		swingframecount = 100;
		swing_stop();
	}
	else
	{
		if (swingpowerdiv) swingpowerdiv.style.width = (swingframecount) + '%'; // fixme resize poop
		setTimeout(swingmetertimer,16); // most browsers except chrome force 15ms or 16ms minimum
	}
}
function swing_start()
{
	if (battlediv) battlediv.innerHTML += 'You swing your sword...';
	swinging = true;
	if (!swingpowerdiv) swingpowerdiv = document.getElementById('swingpower');
	if (!swingtextdiv) swingtextdiv = document.getElementById('swingtext');
	if (!g.die1div) g.die1div = document.getElementById('die1');
	if (!g.die2div) g.die2div = document.getElementById('die2');
	if (!g.die3div) g.die3div = document.getElementById('die3');
	if (!g.rollnumberdiv) g.rollnumberdiv = document.getElementById('rollnumber');
	if (g.rollnumberdiv) g.rollnumberdiv.innerHTML = '';
	if (swingtextdiv) swingtextdiv.innerHTML = "SWINGING...";
	swingframecount = 0;
	swingmetertimer();
}
var swing_sweet_spot = 75;
function swing_stop()
{
	swinging = false;
	if (!Math.abs) alert('Missing Math.abs function...');
	var swingpower = 100 - (Math.abs(swing_sweet_spot-swingframecount)); 
	if (swingpower < 0) swingpower = 0;
	if (swingpower > 100) swingpower = 100;
	var swingbonus = 0;
	var swingquality = 'average';
	if (swingpower < 76) { swingbonus = -1; swingquality = ((swingframecount > swing_sweet_spot) ? 'too late!' : 'too early!'); }
	if (swingpower > 94) { swingbonus = 1; swingquality = 'good'; }
	if (swingpower > 96) { swingbonus = 2; swingquality = 'great'; }
	if (swingpower > 98) { swingbonus = 3; swingquality = 'excellent'; }
	if (swingpower > 99) { swingbonus = 4; swingquality = 'perfect!'; }

	if (battlediv) battlediv.innerHTML += ' with ' + plusminus(swingbonus) + ' power.<br>';
	//if (swingtextdiv) swingtextdiv.innerHTML = "SWING POWER: " + swingpower + '% ('+plusminus(swingbonus)+') '+swingquality;//swingframecount;
	if (swingtextdiv) swingtextdiv.innerHTML = 'SWING POWER: ('+plusminus(swingbonus)+') '+swingquality;
	// cls
	if (battlediv) battlediv.innerHTML = '';
	var damagedice = 1; //d6
	var damagebonus = 0;
	var defencebonus = 0;
	g.roll_on_gui = true;
	var dam = resolve_combat(player[1].str,player[1].h2h,swingbonus,damagedice,damagebonus,enemy[1].dex,enemy[1].h2h,defencebonus); //(attacker_attribute,attacker_skill,attack_bonus,attacker_damage,damage_bonus,defender_attribute,defender_skill,defender_bonus)
	if (battlediv) battlediv.innerHTML += player[1].name + ' ' +g.lastcombatattackroll + '.  ';
	if (battlediv) battlediv.innerHTML += enemy[1].name + ' ' +g.lastcombatdefenceroll + '.  ';
	if (battlediv) battlediv.innerHTML += player[1].name + ' ' + g.lastcombatresulthtml + '.<br>';
	enemy[1].hp -= dam;
	if (enemy[1].hp < 1) 
	{
		if (battlediv) battlediv.innerHTML += '<br><b>'+enemy[1].name + ' was defeated.</b><br>';
		battle_end();
		return;
	}
	damagedice = 1; //d6
	damagebonus = 0;
	defencebonus = 0;
	swingbonus = 0; // enemies get no bonus
	g.roll_on_gui = false;
	dam = resolve_combat(enemy[1].str,enemy[1].h2h,swingbonus,damagedice,damagebonus,player[1].dex,player[1].h2h,defencebonus); //(attacker_attribute,attacker_skill,attack_bonus,attacker_damage,damage_bonus,defender_attribute,defender_skill,defender_bonus)
	if (battlediv) battlediv.innerHTML += enemy[1].name + ' ' +g.lastcombatattackroll + '.  ';
	if (battlediv) battlediv.innerHTML += player[1].name + ' ' +g.lastcombatdefenceroll + '.  ';
	if (battlediv) battlediv.innerHTML += enemy[1].name + ' ' + g.lastcombatresulthtml + '.<br>';
	player[1].hp -= dam;
	if (player[1].hp < 1) 
	{
		if (battlediv) battlediv.innerHTML += '<br><b>'+player[1].name + ' was defeated.</b><br>';
		battle_end();
		return;
	}
	// show current hp
	if (battlediv) battlediv.innerHTML += player[1].name + ' hp=' + player[1].hp + ' ' + enemy[1].name + ' hp=' + enemy[1].hp + '<br><br>';
}
function swingclick()
{
	if (!in_battle) battle_start();
	if (swinging) 
		swing_stop();
	else
		swing_start();
}
// 3d6 battle simulator test bed
var battlediv = null; 
var player = []; player[1] = { name:'Tynter', str:12, dex:12, h2h:12, hp:12 };
var enemy = []; enemy[1] = { name:'Orc', str:12, dex:12, h2h:12, hp:6 };
function battle_start()
{
	//document.onmousedown = swingclick;
	if (!battlediv) battlediv = document.getElementById('battle');
	if (!battlediv) return;
	if (!swingdiv) swingdiv = document.getElementById('swingmeter');
	if (!swingdiv) return;
	if (!player || !player[1] || !player[1].name) return;
	if (!enemy || !enemy[1] || !enemy[1].name) return;
	//alert('BATTLE START');
	in_battle = true;
	// for debug purposes, re-roll!
	player[1].str = roll3d6();
	player[1].dex = roll3d6();
	player[1].h2h = roll3d6();
	player[1].hp = roll3d6(+6);
	enemy[1].str = roll3d6();
	enemy[1].dex = roll3d6();
	enemy[1].h2h = roll3d6();
	enemy[1].hp = roll3d6();
	battlediv.innerHTML = '<b>Battle begins: ' + player[1].name + ' vs ' + enemy[1].name + '</b><br><br>';
	battlediv.innerHTML += player[1].name + ' STR:'+player[1].str + ' DEX:'+player[1].dex + ' HP:'+player[1].hp + '<br>';
	battlediv.innerHTML += enemy[1].name + ' STR:'+enemy[1].str + ' DEX:'+enemy[1].dex + ' HP:'+enemy[1].hp + '<br><br>';
	battlediv.style.display='block';
	swingdiv.style.display='block';
}
function battle_end()
{
	//alert('BATTLE END');
	// document.onmousedown = null;
	in_battle = false;
	if (battlediv) battlediv.style.display='none';
	if (swingdiv) swingdiv.style.display='none';
}

var swingmeter_div = null;
function swing_meter_init()
{
	// init - FIXME
	swingmeter_div = document.getElementById('swingmeter');
	swingmeter_div.onmousedown = swingclick;
}
//////////////////////////////////////////////////////////////// BATTLE ENDS























// run after ajax finishes downloading story.txt
function handle_story_download(data)
{
	init(data);
	go(firstscene);
}

function download_story_txt() {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      console.log("story.txt loaded " + this.responseText.length + " bytes successfully.")
	  handle_story_download(this.responseText);
    }
  };
  console.log("CYOAwesome is downloading story.txt...");
  xhttp.open("GET", "story.txt", true);
  xhttp.send();
}


////////////////////////////////////////////////
// Runs Immediately!
////////////////////////////////////////////////
if (DOWNLOAD_STORY_TXT)
{ 
	 // this only works on a real web server 
	 download_story_txt(); 
}
else
{
	// grab data from a hidden textarea in html
	init();
	go(firstscene);
}


// } // end class constructor (if used on first line)