oi it's a work in progress web demo/vanilla javascript port of my work in progress phase distortion synthesizer  
gplv3 licence, basically do whatever you want but don't change the licence  
  
now featuring!!  
a catalan and japanese version  
envelopes/lfos for morph (sine+distorted wave interpolation amount, and resonant wave frequency), amplitude and frequency  

the envelopes/lfos have curve controls although imo only the "logarithmic"-type shapes, which are actually inverse exponential, sound good: try the 0.5-0.8 range  
  
you can freely define your 5-segment transfer function (no double sine source readout table yet though and i'm not sure whether i'll implement it because for a web app it probably doesn't matter but having several readout tables can cause massive cache thrashing, although if its just reading the source twice with twice the increment it would work i think?)  
  
the end goal (which i've sort of already implemented in the original c# version) is having 5 transfer functions per oscillator, so that you can have the song morph kind of like those wavetable synths with crossfading interpolation between tables  

ideally this javascript port will become a full blown synth eventually and the c# version will be a vst, but it's not easy at all to hook up a c# program to a web UI within a VST plugin  
  
note that if you want to run this synth locally you'll have to either enable file:// fetching if your browser supports it, serve the project locally (go to the project folder and run something like npx serve . or python -m http-server then open localhost:8000 or whatever port you've set up), or hack into audio.js and paste in the contents of worklet-processor.js as a string literal to turn into a Blob and then pass to the AudioWorklet  
  
dependencies so far: chart.js for the graphs  
