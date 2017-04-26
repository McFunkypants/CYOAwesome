// SOUND SYSTEM MODULE v1.0
// made by Christer "McFunkypants" Kaitila for http://gamkedo.com
// Requires https://github.com/goldfire/howler.js

// how to use in-game:
// pass strings which are the sfx base filename with no extension or path

// soundSystem.play("soundname");
// will optionally download or play a cached version of "audio/soundname.mp3" or ogg or webm

// soundSystem.mute(true);
// set global sound mute on or off

"use strict"; // no sloppy code allowed

var soundSystem = new soundSystemClass(); // a single instance used by the game

// class constructor for our sound engine
function soundSystemClass() {

	// private variables - no need to access from game code
	var sounds = []; // an array of Howl() objects
	var isMuted = false; // boolean state
	var debug_sound = false; // write to console?

	// play a sound (downloads a sound file the 1st time)
	this.play = function(samplename,looping,vol) {
		
		if (debug_sound) console.log("soundSystem.play "+samplename);
	
		if (looping==null) looping = false;
		if (vol==null) vol = 1;

		if (!sounds[samplename]) // downloads on demand once only
		{
			if (debug_sound) console.log("soundSystem needs to download...");
			// src array is filenames to try in what order
			// every new browser supports .webm, 
			// older ones like mp3 or ogg but not both
			// for 2017 and later, .webm is recommendation
			// TODO: we may want to try .webm first not last?
			sounds[samplename] = new Howl({
				src: [
					'audio/'+samplename+'.mp3',
					'audio/'+samplename+'.ogg',
					'audio/'+samplename+'.webm'],
				loop: looping,
				volume: vol				
			});
		}
		
		sounds[samplename].play(); // delayed if downloading
	}
	
	// stops a sample from playing if it exists
	this.stop = function(samplename) {
		if (debug_sound) console.log("soundSystem.stop "+samplename);
		if (sounds[samplename]) 
			sounds[samplename].stop();
	}

	this.stopAll = function() {
		for(var snd in sounds){
			sounds[snd].stop();
		}
	}
	
	// fades in or out a sample - vol is 0 to 1, duration is seconds
	this.fade = function(samplename,fromvol,tovol,duration)	{
		if (debug_sound) console.log("soundSystem.fade "+samplename);
		if (sounds[samplename])
			sounds[samplename].fade(fromvol,tovol,duration);
	}

	// fades a sound from max to silence in half a second
	this.fadeout = function(samplename) {
		this.fade(samplename,1.0,0.0,0.5); // assumes prev vol is max FIXME
	}

	// turns off ALL SOUND
	this.mute = function(on_or_off) {
		if (debug_sound) console.log("soundSystem.mute "+on_or_off);
		Howler.mute(on_or_off);
		isMuted = on_or_off;
	}
	
	// switches mute on/off
	this.toggleMute = function() {
		if (debug_sound) console.log("toggleMute");
		this.mute(!isMuted);
	}
	
	// returns true if a sample is currently playing
	this.isPlaying = function(samplename) {
		var result = false;

		if (sounds[samplename])
			result = sounds[samplename].playing()

		if (debug_sound) console.log("soundSystem.isPlaying " + samplename + " = " + result);
		return result;
	}

}

