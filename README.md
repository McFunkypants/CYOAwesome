# WRITE A STORY, MAKE A GAME

CYOAwesome is a game engine that runs on text. It's perfect for interactive fiction, visual novels, and gamebooks where you choose your own ending.

No coding required: just type a story in plain text. Great for writers!

You can write a story and it will auto-magically create a multiple-choice adventure game for you. You can optionally sprinkle in a bit of logic inside square brackets to handle keys, stats, quests, sound, and images.

All you need to do is type a story, sprinkle it with logic, and then share the game with your friends.

## GETTING STARTED

Games all have scenes and items. Between scenes, the game waits for the player to make a choice. Once you change secenes, all past options become unavailable, except if a scene has no choices in it and is used to add to events taking place in the current scene.

## HOW TO WRITE A SCENE

To start a new scene, just type a line that in ALL CAPS. To link to it in your story, type that same string of character with any capitalization. This makes story creation fast; you can stay in the creative flow.

TIP: Don't use common words or you may get links you don't intend.

## HOW TO ADD GAME LOGIC

To set or check a variable, all you need is to put your logic inside square brackets. The code gets run at the moment the text rendering gets to it. Here are some examples:

[get gold]

[gold + 1]

[has 5 gold?]

[drop 2 gold]

[no gold?]

[saw scenename?]

[imagefile.jpg]

[soundfile.mp3]

[1st]

[else]

## QUICK LOGIC TIPS

TIP: items (gold, key, kisses) have to be only one word.

TIP: the SAW command checks our scene visit count.

TIP: to allow backtracking, set things only once with [1st]

TIP: else is run if the previous ? condition was false

## MORE EXAMPLES

I tried to make it pretty permissive of coding style, so you 
can also type stuff like this!

[if you have the key]

[if the player has a key]

[do we have the key?]

[got a key?]

[pick up 250 silver!]

[grab an apple]

[lose 5 hp]

[hp++]

## CONDITIONAL LOGIC

With the else command, you can react to booleans (yes/no):

[1st time?]

[else]

[has key?]

[else]

[if saw monster]

[else]

## ITEM QUANTITIES AND PLURALS

You can write quantities in the story like this:

You are holding [gold] gold coin[s].