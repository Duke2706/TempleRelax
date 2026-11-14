# What does a Place definition contain?

Type: grilling
Status: open
Blocked by: 03

## Question

Define the TS contract for a Place so a new one (say, a mountain lake) can be added without touching the engine: scenery renderer (static background + per-frame layer), ambient sound layers and their volumes per Weather, the Ritual applied to a Thought, its copy keys (hint, button label, keep note, counter, release notes), and how Weather interacts with it (e.g. snow warming near the fire is forest-specific today). Decide what stays engine-wide (stars, weather, peer stars) vs per-Place, and how the Ritual is modelled (strategy object, plugin, etc.).
