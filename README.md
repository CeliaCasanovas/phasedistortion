## oi it's a web demo/vanilla javascript port  
of my work in progress c# phase distortion synth  
  
GPLv3 licence, basically do whatever you want but don't change the licence  
  
## now featuring!!!!!!!!  
Catalan and Japanese versions, check i18n.js out if you want to write your own translations  
Envelopes/LFOs for morph (sine+distorted wave interpolation amount/resonant wave frequency), amplitude and frequency  
Pressing the spacebar to trigger the gate (surprisingly convoluted to do)  
  
The envelopes/LFOs have curve controls, although imo only the "logarithmic"-type shapes (actually inverse exponential) actually sound good. Try the 0.5-0.8 range.  
  
You can freely define your 5-segment transfer function. You can only read from a one-shot sine table. Maybe I'll try and implement running through the table twice at double the increment, but I don't think there'll ever be other readout tables because that'd cause massive cache thrashing. For a monophonic web port it probably doesn't matter but I want to make the C# version multitimbral and I'm kinda striving to make the DSP fast.  
  
## the end goal  
is having 5 transfer functions per oscillator, so that you can have the sound morph kind of like those wavetable synths with crossfading interpolation between tables. That's already kind of implemented in the C# version but there's lots to do still. For starters it doesn't have actual audio stream output code yet, mostly because audio output is very annoyingly platform-dependent and low-level, so I thought it's better to have the synthesis ready before diving into p/invoke hell.  
  
Another thing I really want to implement is 4-part multitimbrality where you can make one part be the transient, another one be the body of the patch, another the release, and so on. I've always thought this works mint with FM synths, whether it's actual multitimbrality or two-operator stacks.  
  
Ideally this JavaScript port will become a full blown web synth whilst the C# version will be an NPlug VST, but it's not easy at all to hook up a C# program to a web UI within a VST plugin, and C# is utter garbage for GUIs, so we'll see  
A Cardinal plugin is another possibility but I've got no idea about the tech so dunno. There's some async/await in this port but I'm making the C# DSP fully single-threaded so if it has to be ported to C++ or whatever it shouldn't be that difficult to fit Cardinal's requirements? Maybe? I don't really know lmao  

## running locally!! warning!!!!
Note that if you want to run this synth locally you'll have to either  
enable file:// fetching if your browser supports it (hacky af, opens you to attacks, don't recommend)  
serve the project locally (go to the project folder and run something like npx serve . or python -m http-server then open localhost:8000 or whatever port you've set up)  
or hack into audio.js and paste the contents of worklet-processor.js into a string literal, then turn that into a Blob and pass it to the AudioWorklet  
  
## dependencies so far  
chart.js for the graphs  
  
## shoutoutsssss
special thanks to p-model and ymo for the inspiration  
special thanks to casio and roland for the inspiration  
special thanks to someone called GroovyDSP on youtube who posted 2 videos that taught me how phase distortion is calculated: [here](https://www.youtube.com/watch?v=EW12RYc7QRA) and [here](https://www.youtube.com/watch?v=94vSgZXg1nQ)  
special thanks to someone called acreil who has some super cool posts from years ago in random music gear forums about digital synthesis techniques  
