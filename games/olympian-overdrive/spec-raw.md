# **Game Design Document: Olympian Overdrive**

## **1. Core Concept & Narrative**

**Working Titles:** *Olympian Overdrive* or *Shattered Trophies*

**Genre:** 2D Action-Platformer / Micro-game Collection

**Visual Style:** Bright, neon 16-bit retro pixel art mixing Greek mythology with modern 2D physics and particle effects.

**The Premise:**

The protagonist is on the verge of winning the "Mega-Decathlon." This enrages **Athleticus**, the petty God of Peak Performance, who shatters the protagonist's "Athletic Soul" into 8-bit fragments and scatters them across the Chaos Leagues. The player must conquer bizarre, physics-based sports micro-games to reclaim their soul.

## **2. Character Roster**

**The Protagonists (Choose Your Challenger):**

  - **Stella Swift:** Track star. Narrower hurtbox, higher base movement velocity, slightly floaty jump physics.
  - **Jack "Turbo" Savage:** Adrenaline junkie. Standard hurtbox, faster acceleration, heavy gravity multiplier on falls.

**The Antagonist & Guide:**

  - **Athleticus:** A glowing, ethereal god. Appears as a massive 2D background sprite to taunt the player.
  - **Coach Hermes:** An NPC with winged sneakers who runs the Hub World and acts as the tutorial trigger.

## **3. 2D Engine Foundation & Unified Controls**

To make mash-ups work seamlessly later, all micro-games must utilize the same rigid-body physics engine and unified input map.

  - **D-Pad / Left Stick:** X/Y axis movement and aiming.
  - **A Button (South):** Jump / Dodge / Defensive Action.
  - **X Button (West):** Strike / Throw / Offensive Action.
  - **Colliders:** Standard 2D box colliders for environment; capsule colliders for characters.
  - **Time Dilation:** Engine supports "hit-stop" (momentary freezing of frames on impact) to make strikes feel heavy and arcade-like.

## **4. Detailed Sport Mechanics Spec (Stage 1)**

This section details how the arcade concepts translate into actual 2D platforming code and physics interactions.

### **Stadium & Court Classics**

**Pickleball**

  - **Viewpoint:** 2D Side-profile.
  - **Engine Mechanic:** The ball is a physics object with a high bounce multiplier. The player's paddle has a dynamic hitbox; pressing 'X' spawns an active collider for 5 frames. The "kitchen" is a floor trigger-zone; overlapping this zone while the paddle collider is active triggers a fail state.
  - **Win State:** Successfully collide the paddle hitbox with the ball object three times without triggering the kitchen floor zone.

**Basketball**

  - **Viewpoint:** 2D Side-profile.
  - **Engine Mechanic:** Player uses standard platforming movement. Pressing and holding 'X' while grounded or mid-air halts X-axis momentum and spawns a UI power meter above the sprite. Releasing 'X' applies a parabolic trajectory (force vector) to the ball object.
  - **Win State:** The ball object must pass downward through the hoop's trigger collider before the global level timer reaches zero.

**American Football**

  - **Viewpoint:** 2D Auto-scrolling (moving left to right).
  - **Engine Mechanic:** Player moves on the Y-axis to dodge incoming enemy colliders (tacklers). An aiming raycast sweeps up and down automatically. Pressing 'X' locks the raycast and fires the ball object as a high-velocity projectile along that vector.
  - **Win State:** The ball's collider must intersect with the wide receiver's catch hitbox.

**Soccer**

  - **Viewpoint:** 2D Side-profile.
  - **Engine Mechanic:** The ball is a heavy rigid body on the ground. Pressing 'X' initiates a dash-strike animation. The point of contact between the player's strike collider and the ball determines the launch angle, while a UI slider determines the force multiplier.
  - **Win State:** The ball must trigger the goal-line collider while avoiding the goalie's moving block hitbox.

**Track & Field**

  - **Viewpoint:** 2D Side-scrolling.
  - **Engine Mechanic:** Player must rapidly alternate D-pad Left/Right to increase their X-axis velocity variable. Pressing 'A' applies an upward Y-axis impulse (jump). Hurdles are static solid colliders that instantly reduce X-axis velocity to zero upon impact.
  - **Win State:** Player capsule collider must intersect the finish line trigger before the timer expires.

**Baseball**

  - **Viewpoint:** 2D Static frame (Batter's box view).
  - **Engine Mechanic:** The strike zone is an invisible 2D box collider. The ball is an incoming projectile with altering Z-axis scaling to simulate depth. Pressing 'X' triggers a swing animation with a very tight (3-frame) active hitbox.
  - **Win State:** Overlap the swing hitbox with the ball collider at the exact moment the ball intersects the strike zone collider.

**Boxing**

  - **Viewpoint:** 2D Side-profile (Close-up).
  - **Engine Mechanic:** Enemy AI telegraphs attacks by shifting their sprite Y-position (high/low). Player presses 'A' + Up/Down to shift their hurtbox and gain brief invincibility frames (iframes). Pressing 'X' fires a strike raycast forward.
  - **Win State:** Successfully trigger a dodge (iframes absorb the enemy attack collider), then land a strike raycast on the enemy's exposed hurtbox.

**Bowling**

  - **Viewpoint:** 2D Top-down angled (3/4 perspective).
  - **Engine Mechanic:** A UI cursor oscillates horizontally across the lane. Player presses 'X' to lock X-axis position, then 'X' again on a rapidly filling power bar. The ball becomes a forward-moving physics object.
  - **Win State:** The ball's collision must create a physics chain-reaction that knocks all 10 pin rigid bodies past a specific rotation threshold (falling over).

### **Extreme & Outdoors**

**Rock Climbing**

  - **Viewpoint:** 2D Vertical-scrolling.
  - **Engine Mechanic:** Wall-jumping mechanics are disabled. The wall features specific "grip" nodes (point effectors). Pressing and holding 'A' attaches the player to a node. Using the D-pad aims a dashed trajectory line to the next node; releasing 'A' launches the player. A stamina float variable constantly drains while attached.
  - **Win State:** Navigate the player sprite to the top summit trigger before the stamina variable reaches zero.

**Alpine Skiing**

  - **Viewpoint:** 2D Side-scrolling (steep downward slope).
  - **Engine Mechanic:** High gravity, low friction physics. Player auto-moves down the slope. Left/Right on D-pad applies braking force to control speed. 'A' triggers a short hop to avoid ground hazards.
  - **Win State:** Player collider must pass through 5 consecutive vertical trigger gates without impacting tree rigid bodies.

**Paddleboarding**

  - **Viewpoint:** 2D Side-scrolling (water physics).
  - **Engine Mechanic:** Player stands on a floating platform driven by sinusoidal wave physics. A UI balance meter constantly shifts left/right based on the wave angle. Player must input counter-directional D-pad presses to keep the UI needle centered.
  - **Win State:** Keep the balance needle inside the safe zone for 10 seconds; exiting the safe zone applies a ragdoll state to the player.

**Trail Hiking**

  - **Viewpoint:** 2D Side-scrolling platformer.
  - **Engine Mechanic:** Standard platforming with steep terrain. Moving on an upward incline rapidly fills a "Heart Rate" UI meter. If the meter maxes out, movement speed is cut by 80%. Player must stop moving to drain the meter.
  - **Win State:** Manage the stamina economy and use platforming jumps to reach the peak collider.

**Weightlifting**

  - **Viewpoint:** 2D Static side-profile.
  - **Engine Mechanic:** Rapid 'X' presses apply upward force to the barbell (a heavy physics object attached to the player's IK hands). Once the barbell reaches the top Y-coordinate, it acts as an inverted pendulum. Player uses Left/Right D-pad to apply counter-torque and keep the barbell upright.
  - **Win State:** Keep the barbell's rotation angle within 15 degrees of vertical for exactly 3 seconds.

**Surfing**

  - **Viewpoint:** 2D Side-scrolling (chase sequence).
  - **Engine Mechanic:** The wave is a massive, slowly advancing kill-wall behind the player. Moving down the wave's slope (D-pad Down) increases X-axis velocity; moving up (D-pad Up) decreases velocity but allows the player to dodge floating obstacles.
  - **Win State:** Balance speed and positioning to avoid the kill-wall and reach the end-of-level trigger.

### **Leisure, Racing, & Performance**

**Dodgeball**

  - **Viewpoint:** 2D Single-screen arena.
  - **Engine Mechanic:** Enemies throw physics projectiles with red trajectory warning lines. 'A' initiates a dash (movement burst). 'X' initiates a "Catch" state, creating a front-facing hitbox for exactly 4 frames.
  - **Win State:** Intersect the catch hitbox with an incoming projectile, then press 'X' to fire it back and collide with the enemy hurtbox.

**Volleyball**

  - **Viewpoint:** 2D Side-profile.
  - **Engine Mechanic:** A shadow decal tracks the ball's X-axis position on the floor. Player must move their collider onto the shadow to auto-bump the ball upward. While the ball is airborne, the player presses 'A' to jump, and 'X' at the apex of the jump to spawn a massive spike hitbox.
  - **Win State:** Land the spike hitbox on the ball to apply a massive downward force vector, ensuring it hits the floor collider on the enemy's side.

**Table Tennis**

  - **Viewpoint:** 2D Static side-profile.
  - **Engine Mechanic:** The ball travels at extreme velocities. The ball sprite randomly swaps between Red and Blue states. The player has two hitboxes: 'A' spawns a Red (Top-spin) hitbox, 'X' spawns a Blue (Back-spin) hitbox.
  - **Win State:** Successfully overlap the correct color hitbox with the ball 5 times in a row. A color mismatch causes the ball to ricochet out of bounds.

**Kart Racing**

  - **Viewpoint:** 2D Top-down.
  - **Engine Mechanic:** Player has constant forward velocity. Steering changes the sprite's rotation. Pressing 'A' while turning reduces traction, allowing the rotation to turn sharper than the actual velocity vector (drifting). Holding a drift charges a float variable; releasing 'A' applies the variable as a forward speed impulse.
  - **Win State:** Cross the finish line trigger before the AI opponent.

**Archery**

  - **Viewpoint:** 2D Static side-profile.
  - **Engine Mechanic:** A UI crosshair slowly drifts based on a random "Wind" 2D vector force. Holding 'X' applies a counter-force to steady the crosshair but drains a stamina bar. Releasing 'X' spawns an arrow projectile.
  - **Win State:** The arrow projectile's tip collider must intersect the bullseye region of the target collider.

**Cornhole**

  - **Viewpoint:** 2D Side-profile.
  - **Engine Mechanic:** Similar to Basketball, but with a visual arc line that predicts the trajectory. The player uses D-pad Up/Down to adjust the launch angle, and holds 'X' to fill the power meter. The bag is a physics object with low bounce and high friction.
  - **Win State:** The bag must fall through the hole collider on the angled board object without knocking the enemy bag (pre-placed rigid body) into the hole.

**Dancing**

  - **Viewpoint:** 2D UI Overlay.
  - **Engine Mechanic:** Directional arrow sprites spawn and move vertically across the screen. The player must press the corresponding D-pad direction when the moving sprite overlaps a static target zone collider.
  - **Win State:** Achieve an 80% accuracy rate on input overlaps to fill the "Hype" float variable to maximum.

**Pro Wrestling**

  - **Viewpoint:** 2D Side-profile.
  - **Engine Mechanic:** Player and enemy move toward each other. When their colliders overlap, a UI ring shrinks toward a target circle. Pressing 'X' when the ring matches the circle initiates a grapple state, freezing movement and spawning a 4-button Simon-says QTE prompt.
  - **Win State:** Successfully complete the QTE prompt within the time limit to trigger a cinematic finisher animation.

  

Here is the expanded, deep-dive specification format for a core selection of the base sports. This level of detail establishes the gold standard for the engine build, outlining exactly how the physics, environments, and player inputs interact frame-by-frame.

### **1. Pickleball**

  - **Setting & Visuals:** A glowing, neon-lit outdoor park court at dusk. The protagonist wields an ultra-premium, elongated paddle (dubbed the "Project Boomstik" in the game's lore) that leaves a heavy, pixelated motion trail when swung.
  - **Engine & Physics Mechanics:**
      
      - The ball is a rigid body with a 0.8 bounciness physics material and low mass.
      - The player has a base movement speed variable controlled by the D-pad.
      - Pressing 'X' triggers a swing animation. The "Boomstik" paddle's elongated nature gives it a uniquely tall, rectangular hitbox, but a slightly longer active recovery frame rate (acting as a balance mechanism).
  - **Player & Environment Interactions:**
      
      - **The Kitchen (Non-Volley Zone):** The area directly adjacent to the net contains a 2D floor trigger. If the player's capsule collider overlaps this trigger *while* the paddle hitbox is active and strikes the ball in the air, a fault is triggered.
      - If the ball bounces in the kitchen first, the player is free to enter the trigger zone and strike.
  - **Win/Fail States:**
      
      - **Win:** Successfully return three rapid-fire volleys (ball velocity increases by 15% with each return) without committing a kitchen fault.
      - **Fail:** The ball's collider hits the floor trigger behind the player, or the player faults in the kitchen.
  - **UI & VFX:** Screen-shake and a heavy bass sound effect trigger on every successful paddle connection. A bright red "FAULT" UI graphic flashes if the kitchen rule is broken.

### **2. Soccer**

  - **Setting & Visuals:** A chaotic, multi-field community youth soccer complex on a busy Saturday morning. The background features overlapping matches, while the foreground level is littered with errant practice cones and scattered orange slices that act as physical debris.
  - **Engine & Physics Mechanics:**
      
      - The soccer ball is a heavy physics object with high friction to prevent endless rolling.
      - The player is locked in a static X-axis position but controls a dual-UI aiming system. A dashed trajectory line sweeps horizontally (angle), while a vertical bar fills and empties (power).
  - **Player & Environment Interactions:**
      
      - The errant practice cones in the foreground have their own colliders. If the kicked ball intersects a cone, its trajectory vector is altered by 10 degrees, adding an element of environmental hazard.
      - The Goalie AI moves back and forth on the Y-axis. Their movement speed scales inversely with the size of the goal (smaller youth-sized nets mean less area to cover, making the AI feel faster).
  - **Win/Fail States:**
      
      - **Win:** The ball collider enters the net trigger zone without intersecting the goalie's block hitbox.
      - **Fail:** The goalie hitbox overlaps the ball, or the ball is deflected out of bounds by a practice cone.
  - **UI & VFX:** A satisfying "thwack" audio cue plays upon kicking. A successful goal triggers an eruption of confetti particles and an over-the-top stadium horn, contrasting humorously with the local community setting.

### **3. Pro Wrestling**

  - **Setting & Visuals:** A massive, televised indoor event inside a stadium modeled with a subtle historical motif (the "Colonial Arena"). The action has spilled out of the ring entirely; the level takes place directly in the stadium seating, with the characters brawling over folding chairs specifically in Section 225, Row 3.
  - **Engine & Physics Mechanics:**
      
      - Movement is constrained to a tight, invisible 2D arena bounded by the stadium stairs.
      - The core mechanic relies on a visual overlapping trigger. A large UI circle appears around the enemy and begins shrinking rapidly. The player has a static circle around their sprite.
  - **Player & Environment Interactions:**
      
      - The player must press 'X' when the shrinking circle exactly overlaps their static circle to initiate a "Grapple State."
      - Once locked, both player and enemy movement inputs are disabled. A Simon-says QTE (Quick Time Event) sequence appears (e.g., Up, A, X, Left).
      - Folding chairs scattered in Row 3 are dynamic rigid bodies. If the player is thrown, hitting a chair multiplies the bounce effect.
  - **Win/Fail States:**
      
      - **Win:** Input the exact 4-button QTE combo before the 2-second timer expires. This triggers an automated, screen-clearing top-rope style finisher off the stadium seating.
      - **Fail:** Pressing the wrong button or running out of time during the QTE causes the enemy AI to reverse the grapple and drain the player's health.
  - **UI & VFX:** The QTE buttons are bright, neon arcade prompts. The final impact features a massive screen freeze (hit-stop) for 0.5 seconds and a white flash to emphasize the damage.

### **4. Paddleboarding**

  - **Setting & Visuals:** A serene, pixel-art mountain lake at sunrise that becomes progressively more turbulent. The water is rendered using 2D mesh distortion to simulate actual wave physics beneath the board.
  - **Engine & Physics Mechanics:**
      
      - The player sprite is parented to the paddleboard rigid body.
      - The water's surface operates on a sine wave function. As the level progresses, the amplitude and frequency of the sine wave increase.
      - The core mechanic is driven by a semi-circular balance UI located beneath the character. A needle swings left and right based on the angle of the paddleboard physics object.
  - **Player & Environment Interactions:**
      
      - The player must input counter-rotational forces using D-pad Left/Right. If the board tilts right (due to a wave), the player holds Left to apply counter-torque and center the needle.
      - Pressing 'A' executes a paddle stroke, which moves the board forward on the X-axis to escape an incoming storm cloud, but paddling temporarily reduces the effectiveness of the player's balance inputs by 50%.
  - **Win/Fail States:**
      
      - **Win:** Survive the timer (15 seconds) by keeping the balance needle inside the green central zone while paddling forward.
      - **Fail:** The balance needle hits the red extremities of the UI, causing the player sprite to detach from the board and trigger a splash particle effect in the lake.
  - **UI & VFX:** The balance meter changes color from green to yellow to red as the needle moves off-center. Ambient audio transitions from peaceful morning birds to rushing wind and crashing water as the waves intensify.

### **5. Trail Hiking**

  - **Setting & Visuals:** A steep, ascending path cutting through the misty foothills of a dense mountain range (visually inspired by the Blue Ridge). The terrain is uneven, requiring constant vertical adjustment.
  - **Engine & Physics Mechanics:**
      
      - The player utilizes standard 2D platforming logic (X-axis movement, Y-axis jumping), but gravity is slightly heavier than a standard platformer.
      - The defining mechanic is the "Heart Rate" float variable. Moving continuously on an upward slope adds values to this float.
  - **Player & Environment Interactions:**
      
      - The environment features rolling boulder rigid bodies that spawn from the top of the incline. The player must press 'A' to jump over them.
      - Jumping spikes the Heart Rate variable significantly.
      - If the Heart Rate variable reaches 100, the player enters an "Exhausted State." The movement speed multiplier drops to 0.2, and jump height is reduced by 75%.
      - Standing completely still rapidly drains the Heart Rate variable back to zero.
  - **Win/Fail States:**
      
      - **Win:** Reach the summit trigger zone (the peak of the mountain) before a global timer expires, balancing bursts of speed with necessary rest stops.
      - **Fail:** The global timer expires before reaching the summit, or getting knocked off the screen by a rolling boulder due to an inability to jump high enough in the Exhausted State.
  - **UI & VFX:** A literal anatomical heart UI element beats faster and flashes red as the float variable approaches 100. Heavy, pixelated panting audio plays when the character enters the Exhausted State.

  

This is a great addition. Skateboarding naturally fits the fast-paced, reflex-heavy arcade style.

Here is the deep-dive specification for Skateboarding, outlining how it translates to the 2D engine:

### **6. Skateboarding**

  - **Setting & Visuals:** A vibrant, neon-drenched concrete skatepark with a California retro aesthetic (think Venice Beach mixed with 8-bit arcade backdrops). The level is designed as a continuous side-scrolling halfpipe or "vert ramp" section.
  - **Engine & Physics Mechanics:**
      
      - The player sprite is a dynamic rigid body with high momentum. X-axis movement is auto-scrolling, but the player controls vertical momentum on the ramp.
      - Pressing and holding 'A' initiates a "pump" mechanic. Releasing 'A' exactly at the lip of the ramp launches the player into the air, multiplying their Y-axis velocity.
      - While airborne, D-pad inputs rotate the character, and pressing 'X' executes specific trick animations (kickflip, grab).
  - **Player & Environment Interactions:**
      
      - The core challenge is the landing. The player must use the D-pad to align the board's rotation parallel to the angle of the ramp upon re-entry.
      - Floating rings or collectible items are placed high in the air, requiring the player to successfully "pump" multiple times to gain enough vertical height to reach them.
  - **Win/Fail States:**
      
      - **Win:** Chain three successful vert-ramp airs (pump, trick, clean landing) to reach a specific vertical height threshold and grab a floating objective before the timer ends.
      - **Fail:** Landing horizontally or upside down (misaligned rotation) causes a physics ragdoll "bail," halting all momentum and draining the timer.
  - **UI & VFX:** A "Combo Multiplier" UI flashes when tricks are linked. A perfect landing triggers a satisfying "clack" sound effect and a small speed-burst particle trail from the wheels. Bailing triggers a record-scratch audio cue.

  

Here is the completely reworked, technically focused Game Design Document. This version is structured specifically to be fed into an AI coding assistant (like Cursor, Claude, or GitHub Copilot). It shifts from narrative concepts to rigid systems, variables, and modular architecture.

# **Technical Game Design Document: Olympian Overdrive**

## **1. Project Overview & Narrative Context**

  - **Genre:** 2D Action-Platformer / Micro-game Collection (Arcade)
  - **Engine:** 2D Rigid-body Physics Engine (e.g., Unity 2D, Godot 2D)
  - **Visual Style:** 16-bit retro pixel art.
  - **Core Loop:** Player enters a Hub World, triggers a random mini-game via a slot machine, completes a 5–15 second physics-based challenge, and returns to the Hub. Difficulty scales infinitely.

## **2. Finite State Machine (FSM) Architecture**

The global game manager must strictly adhere to this FSM. AI prompts should build discrete scripts for each state.

|  |  |  |
| :-: | :-: | :-: |
| \*\*State Name\*\* | \*\*Active Components & Logic\*\* | \*\*Exit Trigger\*\* |
| State\\\_Boot | Load global assets, initialize variables. | Automatic after 3.0s. |
| State\\\_Hub | Load Hub\\\_Scene. Enable PlayerController\\\_Platformer. Slot machine collider active. | Player overlaps slot trigger + presses 'A'. |
| State\\\_Spin | Freeze player. Instantiate UI\\\_SlotWheel. Randomly select Next\\\_Game\\\_ID. | Wheel animation finishes (2.5s). |
| State\\\_LoadGame | Load Mini-game scene. Freeze physics (Time.timeScale = 0). Show "READY" UI. | Wait 1.5s. |
| State\\\_Active | Time.timeScale = 1. Enable specific PlayerController\\\_Sport. Start Level\\\_Timer. | Win\\\_Condition == true OR Fail\\\_Condition == true OR Level\\\_Timer == 0. |
| State\\\_Result | Time.timeScale = 0. Instantiate "SUCCESS" or "FAIL" graphic. Update score. | Wait 2.0s. |
| State\\\_Transition | Apply Difficulty Multiplier. | Load State\\\_Hub OR load State\\\_LoadGame (if rapid-fire mode). |

## **3. Engine Architecture & Unified Inputs**

To allow for seamless mash-ups, all mini-games must share a unified physics and input wrapper.

  - **Physics:** Rigidbody2D for all dynamic objects. Hit-stop is utilized on major impacts (temporarily setting Time.timeScale = 0 for 0.05s).
  - **Inputs (Action Map):**
      
      - Axis\_Horizontal: D-Pad Left/Right (Movement/Aiming).
      - Axis\_Vertical: D-Pad Up/Down (Movement/Aiming).
      - Button\_South ('A'): Mobility / Defense (Jump, Dodge, Pump, Balance).
      - Button\_West ('X'): Action / Offense (Strike, Throw, Kick).

## **4. The Modular Mash-Up Logic (The "Slot Machine" System)**

For Stage 2 (Mash-ups), the AI must NOT write entirely new scripts. Instead, the architecture must separate **Player Controllers** (Verbs) from **Level Managers** (Rules).

When the slot machine rolls **Sport A + Sport B**:

1.  **Sport A dictates the Player Controller:** The player's inputs, animations, and active hitboxes come from Sport A.
2.  **Sport B dictates the Level Manager & Environment:** The win conditions, enemy AI, and physics hazards come from Sport B.

**Example: Baseball (Controller) + Soccer (Environment)**

  - **Load:** Controller\_Baseball (Player is static, presses 'X' to swing a bat with a 3-frame hitbox).
  - **Load:** LevelManager\_Soccer (Spawns a goal, a moving goalie AI, and fires a heavy soccer ball Rigidbody2D at the player).
  - **Resulting Gameplay:** The player must time their baseball swing to deflect the incoming soccer ball past the goalie into the net.

## **5. Mathematical Difficulty Scaling**

Upon successfully completing a loop of mini-games, the Global\_Difficulty\_Level (int) increments by 1. This drives a modifier float (Diff\_Mod).

  - **Formula:** Diff\_Mod = 1.0 + (Global\_Difficulty\_Level \* 0.15)
  - **Affected Variables (Passed to Level Managers at initialization):**
      
      - Enemy\_Speed = Base\_Enemy\_Speed \* Diff\_Mod
      - Level\_Timer = Base\_Level\_Timer / Diff\_Mod (Less time to complete).
      - Hitbox\_Scale = Vector2(Base.x / (1 + (Diff\_Mod \* 0.05)), Base.y / (1 + (Diff\_Mod \* 0.05))) (Player strike zones get slightly smaller).

## **6. Base Sport Component Library (For AI Generation)**

When prompting the AI to build the base games, use these exact component breakdowns.

### **Pickleball**

  - **Controller:** Controller\_Pickleball (D-pad moves X-axis. 'X' activates paddle BoxCollider2D for 0.2s).
  - **Level Manager:** Tracks volley count. Spawns Zone\_Kitchen trigger. Win = 3 volleys. Fail = Ball hits ground OR Player overlaps Zone\_Kitchen while BoxCollider2D is active.

### **Pro Wrestling**

  - **Controller:** Controller\_Wrestling (Static positioning. 'X' triggers grapple check. UI QTE prompt listener).
  - **Level Manager:** Shrinking UI ring logic. If grapple successful, wait for exact 4-button array input within 2.0s. Win = Correct array. Fail = Incorrect array or timeout.

### **Skateboarding**

  - **Controller:** Controller\_Skate (Auto X-axis force. 'A' held = pump/increase gravity scale. 'A' release = jump impulse. Airborne D-pad applies rotation torque).
  - **Level Manager:** Generates EdgeCollider2D halfpipe. Tracks Y-axis height variable. Win = Reach Height\_Target AND land with Player\_Z\_Rotation matching ground normal. Fail = Player\_Z\_Rotation \> 45 degrees off ground normal on impact.

## **7. Master Asset & UI Hierarchy Manifest**

### **Rendering & Assets**

  - **Grid Size:** 32x32 pixels per unit.
  - **Character Animation States Required (Per Character):** Idle, Run\_Cycle, Jump\_Rise, Jump\_Fall, Strike\_Forward, Strike\_Up, Hit\_Damage, Celebrate.
  - **Audio Triggers Required:** SFX\_UI\_Select, SFX\_Jump, SFX\_HeavyStrike, SFX\_Whiff, SFX\_Bail\_Crash, SFX\_Win\_Cheer, SFX\_Lose\_Buzzer.

### **UI Canvas Hierarchy (Z-Index)**

  - **Layer 0:** Background\_Canvas (Parallax scrolling layers).
  - **Layer 1:** Gameplay\_Layer (Sprites, colliders, particle effects).
  - **Layer 2:** Local\_UI (Meters, QTE prompts, or balance needles physically parented above the player sprite).
  - **Layer 3:** Global\_UI (Top-center Level\_Timer, Top-left Score, Top-right Difficulty\_Multiplier).
  - **Layer 4:** Overlay\_UI (Slot machine animation, Screen-filling "SUCCESS/FAIL" graphics, Pause menu).

  
  

Here is the complete, expanded Base Sport Component Library covering all 23 sports we have designed. This provides the exact architectural blueprints needed for an AI to generate the PlayerController and LevelManager scripts for every game in Stage 1.

### **6.1 Stadium & Court Classics**

**Pickleball**

  - **Controller:** Controller\_Pickleball (D-pad controls X-axis movement. 'X' activates paddle BoxCollider2D for 0.2s).
  - **Level Manager:** Tracks volley count. Spawns Zone\_Kitchen floor trigger. Win = 3 successful returns. Fail = Ball hits ground OR Player overlaps Zone\_Kitchen while BoxCollider2D is active.

**Basketball**

  - **Controller:** Controller\_Basketball (D-pad controls X/Y movement. Hold 'X' locks X-axis momentum and scales a UI power meter. Release 'X' applies a parabolic force vector to the ball).
  - **Level Manager:** Spawns Hoop\_Trigger and global timer. Win = Ball enters Hoop\_Trigger on a downward Y-velocity before timer expires. Fail = Timer reaches zero.

**American Football**

  - **Controller:** Controller\_Football (D-pad controls Y-axis movement to dodge. 'X' locks an automated aiming raycast and fires the ball as a high-velocity projectile).
  - **Level Manager:** Auto-scrolls X-axis. Spawns Enemy\_Tackler colliders and Receiver\_Target trigger. Win = Ball projectile intersects Receiver\_Target. Fail = Player capsule or ball intersects an Enemy\_Tackler.

**Soccer**

  - **Controller:** Controller\_Soccer (Player is static. D-pad adjusts a UI trajectory line. Hold 'X' fills a power slider; release applies force to the ball rigid body).
  - **Level Manager:** Spawns Goal\_Trigger and a Goalie\_Block hitbox moving on an oscillating Y-axis. Win = Ball enters Goal\_Trigger. Fail = Goalie\_Block overlaps ball, or time expires.

**Track & Field**

  - **Controller:** Controller\_Track (Rapidly alternating D-pad Left/Right increments an X-axis velocity float. 'A' applies a fixed Y-axis jump impulse).
  - **Level Manager:** Spawns static Hurdle colliders (which set player X-velocity to 0 on impact) and a Finish\_Line trigger. Win = Player capsule overlaps Finish\_Line before timer expires.

**Baseball**

  - **Controller:** Controller\_Baseball (Player is static. 'X' activates a swing animation with a 3-frame BoxCollider2D active window).
  - **Level Manager:** Spawns StrikeZone\_Trigger. Fires a Ball\_Projectile with Z-axis scaling to simulate depth. Win = Swing collider overlaps Ball\_Projectile exactly inside the StrikeZone\_Trigger. Fail = Whiff, or hit outside the zone.

**Boxing**

  - **Controller:** Controller\_Boxing ('A' + Up/Down shifts the player's Y-axis hurtbox and grants 0.2s of invincibility frames. 'X' fires a strike raycast).
  - **Level Manager:** Enemy AI telegraphed animations (High/Low). Win = Player successfully dodges (iframes absorb enemy strike) and lands 'X' raycast on exposed enemy hurtbox. Fail = Player hit by enemy strike.

**Bowling**

  - **Controller:** Controller\_Bowling (Player is static. 'X' stops a horizontally oscillating UI cursor to set position; pressing 'X' again stops a rapidly filling power bar and fires the ball).
  - **Level Manager:** Spawns 10 Pin\_Rigidbody objects. Win = All pins exceed an 80-degree Z-rotation (knocked over). Fail = Any pin remains under 80-degree rotation after 3 seconds of impact.

### **6.2 Extreme & Outdoors**

**Rock Climbing**

  - **Controller:** Controller\_Climbing (Hold 'A' locks player to a node and drains a stamina float. D-pad aims a dashed trajectory line. Release 'A' applies an impulse toward the line).
  - **Level Manager:** Spawns Grip\_Node point effectors and Summit\_Trigger. Win = Player intersects Summit\_Trigger. Fail = Stamina float reaches 0 (triggers ragdoll fall).

**Alpine Skiing**

  - **Controller:** Controller\_Skiing (Auto negative Y-axis force. D-pad Left/Right applies X-axis directional force and minor Y-axis drag. 'A' applies a small jump impulse).
  - **Level Manager:** Spawns Tree\_Collider hazards and Gate\_Trigger checkpoints. Win = Pass through 5 consecutive Gate\_Triggers. Fail = Overlap a Tree\_Collider or bypass a gate.

**Paddleboarding**

  - **Controller:** Controller\_Paddleboard (Player parented to board. D-pad Left/Right applies torque to a UI balance needle. 'A' applies forward X-axis impulse but temporarily halves D-pad torque influence).
  - **Level Manager:** Board Y-position driven by a Mathf.Sin wave equation. Win = Global timer reaches zero while needle is within the safe zone. Fail = Needle hits UI limits.

**Trail Hiking**

  - **Controller:** Controller\_Hiking (D-pad moves, 'A' jumps. Moving X-axis increments a HeartRate float. If HeartRate \>= 100, speed multiplier drops to 0.2. Idle drops HeartRate).
  - **Level Manager:** Spawns rolling Boulder\_Rigidbody hazards and a Summit\_Trigger. Win = Overlap Summit\_Trigger. Fail = Hit by boulder or time expires.

**Weightlifting**

  - **Controller:** Controller\_Weightlifting (Rapid 'X' presses apply upward Y-axis force to a barbell object. Once barbell reaches Max Y, D-pad Left/Right applies counter-torque to keep the barbell balanced).
  - **Level Manager:** Treats barbell as an inverted pendulum. Win = Keep Barbell Z-rotation \< 15 degrees for 3.0 seconds. Fail = Rotation exceeds 15 degrees.

**Surfing**

  - **Controller:** Controller\_Surfing (D-pad Down adds X-axis velocity multiplier. D-pad Up reduces X-axis velocity but moves player Y-axis to dodge).
  - **Level Manager:** Spawns an expanding Kill\_Wall from the left edge and Obstacle\_Colliders from the right edge. Win = Overlap End\_Trigger. Fail = Overlap Kill\_Wall or Obstacle\_Colliders.

**Skateboarding**

  - **Controller:** Controller\_Skate (Auto X-axis force. Hold 'A' to pump/increase gravity scale. Release 'A' at ramp lip applies jump impulse. Airborne D-pad applies rotation torque).
  - **Level Manager:** Generates EdgeCollider2D halfpipe. Tracks max Y-axis height. Win = Reach Height\_Target AND land with player Z-rotation matching the ground normal. Fail = Z-rotation \> 45 degrees off ground normal on impact.

### **6.3 Leisure, Racing, & Performance**

**Dodgeball**

  - **Controller:** Controller\_Dodgeball (D-pad controls X/Y movement. 'A' applies dash impulse. 'X' enables a Catch\_BoxCollider2D for exactly 4 frames).
  - **Level Manager:** Enemy AI fires targeted projectiles. Win = Catch\_BoxCollider2D overlaps projectile, followed by player pressing 'X' to fire it back into the Enemy hurtbox. Fail = Projectile hits player hurtbox.

**Volleyball**

  - **Controller:** Controller\_Volleyball (D-pad moves. 'A' applies jump impulse. 'X' at the apex of the jump enables a Spike\_BoxCollider2D).
  - **Level Manager:** Ball tracks a shadow sprite on the X-axis floor. Win = Spike hits ball, sending it into the Enemy\_Floor\_Trigger. Fail = Ball enters the Player\_Floor\_Trigger.

**Table Tennis**

  - **Controller:** Controller\_PingPong ('A' enables a Red/Top-spin hitbox; 'X' enables a Blue/Back-spin hitbox).
  - **Level Manager:** Ball projectile randomly swaps between Red and Blue states. Win = Match player hitbox color to ball state 5 consecutive times. Fail = Color mismatch or completely miss the ball.

**Kart Racing**

  - **Controller:** Controller\_Kart (Auto forward velocity. D-pad Left/Right rotates sprite. Hold 'A' charges a Drift float and allows tighter rotation. Release 'A' applies Drift float as a forward impulse).
  - **Level Manager:** Spawns Track\_Bounds and Finish\_Line. Enemy AI moves on a pre-calculated spline. Win = Cross Finish\_Line before AI. Fail = Hit Track\_Bounds or AI crosses first.

**Archery**

  - **Controller:** Controller\_Archery (UI crosshair drifts automatically based on a global Wind\_Vector. Hold 'X' reduces drift magnitude but drains stamina float. Release 'X' fires raycast).
  - **Level Manager:** Generates random Wind\_Vector. Spawns Bullseye\_Target and Outer\_Target. Win = Raycast intersects Bullseye\_Target. Fail = Stamina \<= 0 or raycast misses bullseye.

**Cornhole**

  - **Controller:** Controller\_Cornhole (D-pad Up/Down sets launch angle arc. Hold 'X' fills power float, release fires the bag object).
  - **Level Manager:** Spawns Hole\_Trigger and a pre-placed Enemy\_Bag\_Rigidbody near the hole. Win = Player bag enters Hole\_Trigger. Fail = Player bag misses or physics interaction knocks Enemy\_Bag\_Rigidbody into the hole.

**Dancing**

  - **Controller:** Controller\_Dance (D-pad inputs are checked against UI target zones).
  - **Level Manager:** Spawns Arrow\_Sprites moving on a Y-axis. Checks Vector2.Distance between arrow and target zone upon player input. Win = Accuracy \> 80% at end of sequence. Fail = Accuracy \< 80%.

**Pro Wrestling**

  - **Controller:** Controller\_Wrestling (Static positioning. 'X' triggers grapple check. Listens for 4-button QTE array).
  - **Level Manager:** Controls shrinking UI ring. If grapple check succeeds, prompts a random 4-button array. Win = Input correct array within 2.0s to trigger finisher. Fail = Incorrect input or timer expires.

Now that we have the entire foundation of all 23 base sports locked and mapped to exact components, the next step is the true core hook of the game: **Stage 2: The Mash-Up Engine Logic.**

To make the AI coding process smooth, we need to establish the global rules for how these components merge when the slot machine lands on two different sports. We can't write custom code for every possible combination (that would be hundreds of scripts\!). Instead, we need a modular system.

Here is the blueprint for how the Mash-Up Engine works.

## **The Mash-Up Inheritance Rule**

When the State\_Spin (Slot Machine) selects two sports, it assigns them distinct roles:

1.  **Sport A (The Verb):** Provides the PlayerController script. This defines the player's inputs, animations, and how they apply force to objects or themselves.
2.  **Sport B (The Arena):** Provides the LevelManager script. This defines the environment, physics hazards, enemy AI, and the Win/Fail triggers.

Here is how you document these modular mash-ups for the AI to generate the logic, using three wild examples:

### **Mash-Up Example 1: Foot-Bowl (Soccer + Bowling)**

  - **The Vibe:** Kicking a soccer ball down an oiled lane to smash giant pins.
  - **Inheritance:**
      
      - **Controller:** Controller\_Soccer (Player is static. D-pad adjusts trajectory line. 'X' fills power slider and applies force to the ball).
      - **Level Manager:** LevelManager\_Bowling (Spawns 10 Pin\_Rigidbody objects at the end of a long X-axis plane. Win = All pins exceed 80-degree rotation. Fail = Time expires).
  - **Engine Interaction:** The AI simply drops the Controller\_Soccer prefab into the LevelManager\_Bowling scene. The soccer kick logic applies a physics force to the ball, which then interacts with the bowling pin rigid bodies via standard 2D collision.

### **Mash-Up Example 2: Vert-Sniper (Skateboarding + Archery)**

  - **The Vibe:** Launching off a halfpipe and shooting a bullseye in mid-air.
  - **Inheritance:**
      
      - **Controller:** Controller\_Skate (Auto X-axis force. 'A' pumps on ramp. Release 'A' at lip to jump. Airborne D-pad rotates).
      - *Modified Action:* While airborne, 'X' inherits the Archery raycast fire.
      - **Level Manager:** LevelManager\_Archery + LevelManager\_Skate hybrid. Generates the EdgeCollider2D halfpipe, but spawns a floating Bullseye\_Target high in the Y-axis. Applies a global Wind\_Vector.
  - **Engine Interaction:** The player must use the skate physics to gain enough Y-axis height, rotate their sprite to compensate for the Wind\_Vector, and fire the 'X' raycast to hit the bullseye before gravity pulls them down.

### **Mash-Up Example 3: Hurdle-Hoops (Track & Field + Basketball)**

  - **The Vibe:** Sprinting and jumping over hurdles, but every jump must perfectly arc a basketball into a moving hoop.
  - **Inheritance:**
      
      - **Controller:** Controller\_Track (Mash D-pad Left/Right for X-velocity. 'A' to jump).
      - *Modified Action:* 'A' jump impulse simultaneously acts as the Controller\_Basketball 'X' release (fires a ball object on a parabolic arc).
      - **Level Manager:** LevelManager\_Track (Spawns Hurdle colliders and Finish\_Line). Spawns a Hoop\_Trigger suspended above each hurdle.
  - **Engine Interaction:** If the player jumps too early or too late, they might clear the hurdle, but the ball's parabolic arc will miss the Hoop\_Trigger, causing a fail state.

## **What this means for development**

By defining the inheritance rule this way, the AI doesn't have to invent new physics for Stage 2. It just has to learn how to wire the output of Controller\_A to the input expectations of LevelManager\_B.

  

Designing a 3-sport mash-up without overwhelming the player or breaking our strict 2-button control scheme requires a very specific architectural rule. If we just throw three random scripts together, it will be unplayable chaos.

To make this work for an AI coder, we introduce the **Stage 3: Trinity Rule**.

In a Stage 3 Boss Battle, the three sports are separated by their functional role in the physics engine:

1.  **The Chassis (Sport A):** Dictates how the player *moves* and survives.
2.  **The Weapon (Sport B):** Dictates how the player *attacks* or defends.
3.  **The Target (Sport C):** Dictates the *arena hazards* and Athleticus’s vulnerability (How the boss takes damage).

Here is the specification for three epic, multi-stage boss fights against Athleticus using the Trinity Rule.

### **Boss Battle 1: The Strikeout Juggernaut**

**Mash-Up:** Track & Field (Chassis) + Baseball (Weapon) + Bowling (Target)

**The Setting:** A cosmic bowling alley. Athleticus floats at the far end of the lane, encased in a shield made of giant bowling pins.

  - **1. The Chassis (**Controller\_Track**):** The lane is essentially a giant treadmill moving backward. The player must rapidly alternate D-pad Left/Right to maintain their X-axis position. If they stop, they fall off the screen and take damage.
  - **2. The Weapon (**Controller\_Baseball**):** The player is equipped with the glowing baseball bat. Pressing 'X' triggers the 3-frame active swing collider.
  - **3. The Target (**LevelManager\_Bowling**):** Athleticus chucks heavy Bowling\_Ball\_Rigidbody objects down the lane at the player.
  - **The Engine Loop:** The player must mash the D-pad to run *forward* against the treadmill, close the gap, and time their 'X' swing perfectly to bat the heavy bowling balls back at Athleticus. The batted balls must hit the Pin\_Rigidbody objects guarding him to deal damage.

### **Boss Battle 2: The Deep-Water Brawl**

**Mash-Up:** Paddleboarding (Chassis) + Pro Wrestling (Weapon) + Soccer (Target)

**The Setting:** A stormy, pixelated ocean. Athleticus rides a massive, mythological sea-chariot.

  - **1. The Chassis (**Controller\_Paddleboard**):** The player is locked onto a paddleboard. The ocean is generating massive sine-wave swells. The player must use D-pad Left/Right to manage the UI balance needle, or they fall in and take damage.
  - **2. The Weapon (**Controller\_Wrestling**):** Athleticus's chariot sweeps past, and he lunges at the player. A shrinking UI ring appears. The player must press 'X' at the exact moment to trigger a Grapple State and input a 4-button QTE combo to counter his attack.
  - **3. The Target (**LevelManager\_Soccer**):** Successfully completing the Wrestling QTE stuns Athleticus and drops a glowing energy ball onto the paddleboard. The player then has 3 seconds to use the Soccer mechanic (D-pad to aim trajectory, hold 'X' for power) to blast the ball into a specific target zone on Athleticus's chariot before the balance meter completely destabilizes.

### **Boss Battle 3: The Olympic Apex (The Final Boss)**

**Mash-Up:** Alpine Skiing (Chassis) + Boxing (Weapon) + Basketball (Target)

**The Setting:** Plunging vertically down the side of Mount Olympus. Athleticus is a massive, screen-filling background sprite chasing the player.

  - **1. The Chassis (**Controller\_Skiing**):** The level is a high-speed, downward-scrolling auto-runner. The player uses D-pad Left/Right to steer through the snow and avoid marble pillars (Tree\_Collider equivalents).
  - **2. The Weapon (**Controller\_Boxing**):** Athleticus throws massive, glowing fists down at the slope. The player cannot steer out of the way; they must use the Boxing mechanic ('A' + Up/Down) to trigger invincibility frames (iframes) and weave *through* the fists.
  - **3. The Target (**LevelManager\_Basketball**):** Dodging a fist perfectly leaves behind a "Stardust Orb." Passing over it automatically picks it up. Once held, the player must hold 'X' to lock their X-axis movement (highly dangerous while skiing\!), charge a power meter, and release it to shoot the orb in a parabolic arc directly into Athleticus's open mouth (the Hoop\_Trigger).

## **Technical AI Prompting Notes for Boss AI**

When we hand this to the AI, we need to specify a **State Machine for Athleticus** so he doesn't just spam attacks randomly.

**Athleticus FSM (Finite State Machine):**

  - State\_Taunt: Boss is idle, invulnerable. Triggers a voice line/text box. (2.0s duration).
  - State\_Attack: Boss executes the hazard script (throws bowling ball / lunges / punches).
  - State\_Vulnerable: Boss shield is down or weak point is exposed. Collider tag changes from Untagged to Boss\_Damage\_Node. (Lasts until hit or 4.0s timeout).
  - State\_Hit\_Reaction: Boss takes damage. Triggers screen shake, hit-stop (0.1s), and red sprite flash. Boss HP float drops by 1.

  

This is where the game's personality really shines. The Hub World isn't just a menu; it's a breather between the chaos and the narrative anchor for the entire game.

Here is the specification for the connective tissue, structured for both world-building and UI/UX implementation.

## **1. The Hub World: "The Locker Room at the End of Time"**

**Visual Style & Setting:**

A 16-bit, single-screen 2D environment floating in a starry, neon-purple cosmic void. It looks like a classic high school locker room ripped out of space and time. Rows of glowing blue lockers line the back wall, a celestial whiteboard is covered in incomprehensible X's and O's, and the floor is a polished hardwood court that reflects the galaxy below.

**Interactable Zones (Node-Based Movement):**

The player doesn't have free platforming movement here. They use the D-pad to snap between three interaction nodes:

  - **Node 1: The Trophy Case (Left).** A glowing glass cabinet. This acts as the **Progression UI**. As the player wins micro-games, their collected "Soul Shards" (golden medals) physically populate the shelves.
  - **Node 2: The Wheel of Fates (Center).** A massive, divine slot machine crackling with energy. This is the **Level Select Trigger**. Pressing 'X' here initiates the State\_Spin FSM transition.
  - **Node 3: The Workbench (Right).** This is where Coach Hermes resides. To keep the Wheel of Fates powered, he is constantly scavenging and repairing random junk sucked in from the mortal realm. You'll frequently catch idle animations of him fighting to replace the spool on a tangled 40V string trimmer or banging a wrench against a seized, waterlogged pool vacuum motor to keep the cosmic generators running.

## **2. The Guide: Coach Hermes**

**Visual Design:**

He wears classic 1980s gym teacher attire: tragically short coaching shorts, high white tube socks, a tight polo shirt, and a glowing whistle around his neck. The only hints of his divine origin are his iconic winged sneakers, which hover slightly off the ground, and a clipboard that glows like a tablet.

**Personality & Voice:**

He is a grizzled, cynical veteran who is absolutely exhausted by Athleticus's ego. He speaks exclusively in a blend of grizzled sports cliches and Greek mythological dread.

**Dialogue Tree & Tutorial Flow (UI Text Box Overlay):**

  - **First Boot (Tutorial):**
      
      - *Hermes:* "Look at you. Soul scattered to the cosmic winds just because you were stealing the golden boy's thunder. Take a lap, kid. Then get over here."
      - *(Player moves to Workbench)*
      - *Hermes:* "Athleticus thinks he's the whole playbook. He’s twisting the rules of the mortal games to keep you trapped. We’re gonna run a trick play. Spin that wheel, figure out the mechanics, and don't trip over your own pixels."
  - **Pre-Boss Warning:**
      
      - *Hermes:* "Heads up. The big guy upstairs is throwing a tantrum. He's mixing three realms at once. Keep your head on a swivel and stick to the fundamentals\!"
  - **Post-Fail (Game Over Screen):**
      
      - *Hermes:* "You're telegraphing your swings\! The space-time continuum is reading your pitches\! Shake it off, hydrate, and spin again."
  - **Idle Chatter (Workbench):**
      
      - *Hermes:* "I swear by the River Styx, if this vacuum motor is seized again, I'm throwing it into the sun..."

## **3. Global UI & UX Flow**

To ensure the AI understands how the user navigates the game, we need to map the exact canvas hierarchy and transition screens.

### **The UI Canvas Hierarchy**

  - **Layer 0 (**UI\_Background**):** Solid colors, animated cosmic void grids.
  - **Layer 1 (**UI\_GameHUD**):**
      
      - *Top Left:* Score\_Text (Current Soul Shard count).
      - *Top Center:* Timer\_Graphic (A classic digital scoreboard clock, flashes red at 3 seconds).
      - *Top Right:* Combo\_Icons (Two 32x32 pixel sprites representing the current mash-up, e.g., a Soccer Ball + a Baseball Bat).
  - **Layer 2 (**UI\_Menus**):** The Hub World dialogue boxes (bottom third of screen) and pause menus.
  - **Layer 3 (**UI\_Transitions**):** The screen-wipes and slot machine overlay.

### **The Scene Transition Flow (The "Juice")**

The transition between the Hub and the Mini-game needs to feel incredibly fast and satisfying to keep the arcade energy high.

1.  **The Trigger:** Player presses 'X' at the Wheel of Fates.
2.  **The Spin (1.5 seconds):** A giant UI\_Transitions overlay of the slot machine slams down over the screen. Two reels spin wildly. Mechanical *clack-clack-clack* sound effects play.
3.  **The Lock (0.5 seconds):** Reel 1 locks on an icon (e.g., Tennis Racket). Reel 2 locks on an icon (e.g., Bowling Pin). A heavy bass *BOOM* plays.
4.  **The Flash:** The screen flashes completely white.
5.  **The Reveal (1.0 second):** The white fades instantly into the loaded Mini-game scene. The game is paused. Giant pixel text screams **"READY?"** in the center of the screen.
6.  **Action:** "READY?" shatters into particles, the timer starts ticking, and player controls are unlocked.

By cleanly separating the Hub World (which acts as the main menu and narrative delivery system) from the rapid-fire Mini-game states, you create a game loop that is easy to code, modular, and instantly addictive.

  

This is a fantastic choice. The roguelite progression model (Option B) is incredibly popular right now because it removes the frustration of "losing everything" and replaces it with the addictive "just one more run" mentality. Even a terrible run still feels productive because you are gathering resources.

Here is the technical specification for how the Roguelite Macro-Progression system operates in the engine.

## **1. The Run Loop & State Transitions**

The FSM (Finite State Machine) needs to be updated to handle the persistent economy between the Hub and the Mini-Games.

  - **The "Run" Variable Set:** When the player leaves the Hub to spin the wheel, a temporary variable set is created: Current\_Lives (default: 3) and Run\_Shards (default: 0).
  - **Taking Damage:** If a player fails a mini-game, Current\_Lives decreases by 1. The game immediately loops to the next slot spin.
  - **The End of a Run:** When Current\_Lives hits 0, the State\_GameOver triggers.
  - **The "Bank" Transfer:** During the Game Over sequence, the temporary Run\_Shards are permanently added to the global Banked\_Shards integer save file. The player is then respawned in the Hub World.

## **2. The Arcade Economy (Earning Shards)**

To keep the AI coding logic simple, Soul Shards are calculated using a strict multiplier system rather than complex physics triggers.

  - **Base Payout:** Completing a Stage 1 (Single Sport) mini-game = **10 Shards**.
  - **Mash-Up Modifier:** Completing a Stage 2 (2-Sport Mash-up) = **25 Shards**.
  - **Boss Modifier:** Defeating Athleticus in a Stage 3 (Boss Battle) = **100 Shards**.
  - **The Speed Bonus (The "Clutch" Mechanic):** If the player wins the mini-game with more than 50% of the timer remaining, a 1.5x multiplier is applied to that game's payout. This rewards risky, aggressive play.

## **3. The Workbench (The Permanent Upgrade Tree)**

Coach Hermes doesn't have divine gold to work with; he is scavenging mortal junk that falls through the cosmic rifts and enchanting it to help you survive.

At Node 3 in the Hub, the player opens the "Workbench Menu" to spend their Banked\_Shards. For the AI, these upgrades are simply global float modifiers that are injected into the Player Controllers at the start of a run.

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| \*\*Upgrade Name\*\* | \*\*Cost Scaling\*\* | \*\*Engine Effect (What the AI codes)\*\* | \*\*Narrative Flavor\*\* |
| \*\*Biometric Tracker\*\* | Tier 1-3 (100, 300, 600) | Decreases the fill rate of the HeartRate and Stamina float variables by 10% per tier. | A glowing, high-tech smart ring Hermes reprogrammed. It optimizes your exertion so you don't burn out during mountain scrambles or cliff hangs. |
| \*\*Heavy-Duty Spool\*\* | Tier 1-3 (150, 400, 800) | Adds +0.1s, +0.2s, +0.3s to the active window of BoxCollider2D strike hitboxes (Baseball, Tennis). | Hermes unspooled the line from a busted 40V string trimmer and used it to reinforce the netting and grips of your equipment. |
| \*\*Refurbished Motor\*\* | Single Purchase (1,500) | If Current\\\_Lives reaches 0, it resets to 1, and the boolean Has\\\_Revived switches to true. | A heavy, waterproof motor pulled from a seized pool cleaner. Hermes got it spinning again to act as a cosmic defibrillator for your soul. |
| \*\*The "Kitchen" Pass\*\* | Tier 1-2 (200, 500) | Shrinks the X-axis bounds of environmental hazard triggers (like the Pickleball non-volley zone or Skiing tree hitboxes) by 5%. | A forged hall-pass that makes the Chaos Leagues' referees slightly blind to your footwork. |
| \*\*Extra Sweatbands\*\* | Tier 1-3 (500, 1000, 2500) | Increases the starting Current\\\_Lives integer from 3, to 4, 5, and finally 6. | Literal neon sweatbands. The more you wear, the more divine punishment your 8-bit body can absorb. |
| \*\*The Mulligan\*\* | Single Purchase (1,000) | Allows the player to press 'A' during State\\\_Spin to reroll the slot machine once per run. | A cracked, weighted die that lets you cheat the Wheel of Fates if it lands on a mash-up you hate. |

## **4. Why This Works Perfectly for an AI Build**

Notice how every upgrade in the table is tied to a specific, easily definable variable: Stamina drain rate, BoxCollider2D duration, Trigger scale, or Current\_Lives.

If you tell an AI to "make the game easier as you play," it won't know what to do. If you tell an AI: *"Create a Shop UI that subtracts Banked\_Shards and permanently increases the starting value of Current\_Lives by 1,"* it will write flawless C\# or Python code in seconds.

  
  

To successfully build a game with an AI coding assistant, you have to act less like a traditional programmer and more like a Chief Architect. If you paste the entire Game Design Document into an AI and say "build this," the context window will collapse, and the code will be a tangled mess of broken physics.

You must build from the ground up, isolating each system. You won't even mention the narrative or the mash-ups to the AI until Sprint 3.

Here is the exact Development Roadmap to build *Olympian Overdrive*, broken down into highly focused, AI-friendly Sprints.

## **Phase 1: The Vertical Slice (Sprints 1-3)**

The goal of Phase 1 is to create a fully playable, infinitely looping game using only two sports. This proves your physics, your UI, and your FSM (Finite State Machine) work before you scale.

### **Sprint 1: The Core Engine & FSM**

**The Goal:** Establish the global rules, the camera, and the state manager.

  - **Step 1:** Prompt the AI to build the GameManager script with the exact FSM states we defined (State\_Boot, State\_Hub, State\_Active, etc.).
  - **Step 2:** Set up the unified Input Manager mapping the D-pad, 'A', and 'X' to generic function calls (OnActionPress, OnDodgePress).
  - **Step 3:** Implement the Global Timer UI and a placeholder Score integer.
  - **AI Prompting Tip:** Tell the AI: *"Do not build any gameplay. Only build a State Machine that logs to the console when transitioning between Hub, Active, and Result states based on a 5-second timer."*

### **Sprint 2: The Two-Sport MVP**

**The Goal:** Build the controllers and level managers for Baseball and Soccer.

  - **Step 1:** Prompt the AI to build Controller\_Baseball and LevelManager\_Baseball. Test until the bat hitbox accurately detects the ball collider.
  - **Step 2:** Prompt the AI to build Controller\_Soccer and LevelManager\_Soccer. Test until the ball physics and goal trigger work flawlessly.
  - **Step 3:** Hook these two scenes into the FSM. The game should now randomly load Baseball or Soccer, play for 10 seconds, and transition to a Result screen.

### **Sprint 3: The Mash-Up Architecture**

**The Goal:** Prove the Inheritance Rule works.

  - **Step 1:** Create a new scene called Mashup\_FootBat.
  - **Step 2:** Prompt the AI to load the LevelManager\_Soccer (the moving goalie and the net), but assign the player the Controller\_Baseball script.
  - **Step 3:** Debug the physics interactions. *Does the bat push the heavy soccer ball? Does the goalie block the batted ball?*
  - **AI Prompting Tip:** You are testing collision layers here. Make sure the AI sets up physical collision matrixes so "Player Weapons" always interact with "Environment Hazards."

## **Phase 2: The Connective Tissue (Sprints 4-5)**

With the core loop proven, you build the wrapper that turns the prototype into an actual game.

### **Sprint 4: The Hub World & UI Flow**

**The Goal:** Build "The Locker Room at the End of Time."

  - **Step 1:** Create the static 2D Hub scene.
  - **Step 2:** Implement the 3 interactable nodes.
  - **Step 3:** Build the Slot Machine animation overlay and wire it to randomly select the next level.
  - **Step 4:** Build the "Screen Flash / READY?" transition UI.

### **Sprint 5: The Roguelite Economy**

**The Goal:** Implement Soul Shards, Lives, and the Workbench.

  - **Step 1:** Prompt the AI to build a PersistentDataManager that doesn't reset when scenes change.
  - **Step 2:** Code the logic: Win = +10 Shards. Lose = -1 Life.
  - **Step 3:** Build the Workbench UI menu.
  - **Step 4:** Wire the first upgrade (e.g., "Extra Sweatbands"). Ensure purchasing it permanently alters the starting Current\_Lives variable in the PersistentDataManager.

## **Phase 3: Scale and Polish (Sprints 6-8)**

This is where the game explodes in size. Because you built a modular foundation in Phase 1, adding new sports here is incredibly fast.

### **Sprint 6: Content Expansion (The Base Roster)**

**The Goal:** Churn through the remaining 21 base sports.

  - **The Process:** You will tackle these in batches of three. Since the FSM and inputs are locked, you simply hand the AI the exact specs from our Component Library for each sport (e.g., Ping Pong, Rock Climbing, Kart Racing).
  - **Testing:** Test each sport strictly in isolation before allowing the slot machine to mash them up.

### **Sprint 7: The Stage 3 Boss Battles**

**The Goal:** Implement the Trinity Rule for the Athleticus encounters.

  - **Step 1:** Build the Athleticus AI State Machine (Taunt, Attack, Vulnerable, Hit).
  - **Step 2:** Assemble Boss 1 (Track + Baseball + Bowling) using the existing modular scripts.
  - **Step 3:** Wire the Boss trigger logic (e.g., spawns every 10 successful slot spins).

### **Sprint 8: Game Feel & "Juice"**

**The Goal:** Make the game addictive through sensory feedback.

  - **Step 1:** Implement "Hit-Stop" (freezing the frame for 0.05s on heavy impacts like spikes or home runs).
  - **Step 2:** Hook up the particle emission systems (confetti, sparks, dust trails).
  - **Step 3:** Implement camera shake on failures and heavy impacts.
  - **Step 4:** Add the audio triggers for the chiptune soundtrack and Hermes's dialogue barks.

By treating the AI strictly as an engineer and feeding it one highly detailed Sprint at a time, you will keep the code clean, modular, and easy to debug. You have the complete blueprint—it is time to open up your engine and start building Sprint 1.

  