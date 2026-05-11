# Tilt

## Credits
Game created by [WEICHEN SUN].

Background image: GPT Image Generation

Sound: GPT Audio Generation

Built using Phaser 4.


## Game Description

**Tilt** is a 2D physics-based maze game made in Phaser. The player does not directly control the ball. Instead, the player rotates the maze and uses gravity to guide the ball toward the exit.

The goal of each level is to reach the green exit as fast as possible. The player is scored based on time, and later levels add hazards such as spikes, checkpoints, and moving platforms.

## Play the Game

Play the deployed game here:

**https://wsun0301.itch.io/tilt**

## How to Play

- Press **SPACE** to start a level.
- Hold **A** or **LEFT ARROW** to rotate the maze left.
- Hold **D** or **RIGHT ARROW** to rotate the maze right.
- Guide the blue ball into the green exit.
- Complete the maze as fast as possible.
- Avoid spikes in later levels.
- In Level 3, collect the checkpoint before reaching the exit.

## Controls

| Input | Action |
|---|---|
| SPACE | Start level / continue |
| A | Tilt maze left |
| LEFT ARROW | Tilt maze left |
| D | Tilt maze right |
| RIGHT ARROW | Tilt maze right |
| ESC | Return to intro from outro |

## Gameplay / Experience Requirements

### Continuous and Discrete Inputs

The game uses both continuous and discrete player inputs.

Continuous input is used when the player holds **A/D** or the **left/right arrow keys** to rotate the maze over time. The longer the player holds the key, the more the maze tilts and the more gravity changes direction.

Discrete input is used when the player presses **SPACE** to start a level, continue from summary screens, or replay the game.

### Indirect Goal Achievement

The player cannot directly move the ball. The player’s goal can only be achieved indirectly by rotating the maze and allowing the physics engine to move the ball through gravity, collisions, and momentum.

This satisfies the requirement that the goal is achieved indirectly through physics-based object movement.

### 3+ Physics-Based Gameplay Scenes

The game contains three physics-based gameplay levels:

1. **Level 1**  
   A basic maze that introduces the main tilting mechanic. The player rotates the maze to move the ball from the starting area to the exit.

2. **Level 2**  
   A harder maze that adds spikes. If the player touches a spike, the ball resets and the spike hit counter increases.

3. **Level 3**  
   The hardest level. It adds moving platforms and a checkpoint. The player must collect the checkpoint before the exit will work.

Each level uses Phaser Arcade Physics for ball movement, wall collision, gravity, and overlap detection.

### Other Scenes

The game also uses non-gameplay scenes to separate and contextualize the gameplay scenes:

- **PreloadScene**  
  Loads game assets before the game begins.

- **IntroScene**  
  Introduces the game and teaches the player the basic controls.

- **Level1SummaryScene**  
  Shows the player’s Level 1 time and score.

- **Level2SummaryScene**  
  Shows the player’s Level 2 time, spikes hit, penalty, and score.

- **Level3SummaryScene**  
  Shows the player’s Level 3 time, spikes hit, penalty, and score.

- **OutroScene**  
  Thanks the player for playing, resets game variables, and allows the player to replay.

## Level Summaries

### Intro Scene

The intro scene introduces the title **Tilt** and explains the core mechanic. The player learns that they do not control the ball directly. Instead, they rotate the maze and use gravity to guide the ball.

### Level 1: First Maze

Level 1 is the first full gameplay level. It gives the player a simple maze with walls and an exit. The timer starts when the player presses **SPACE**. The player must rotate the maze and guide the ball to the exit as quickly as possible.

### Level 2: Spikes

Level 2 increases the difficulty by adding spike hazards. If the ball touches a spike, the ball resets to the starting position and the spike counter increases. The summary screen shows both the time and the number of spikes hit.

### Level 3: Checkpoint and Moving Platform

Level 3 adds more advanced mechanics. The player must collect a yellow checkpoint before reaching the exit. The level also includes a moving platform that creates a more dynamic maze challenge.

### Outro Scene

The outro scene thanks the player for playing and lets them replay the game. It also resets important variables such as level times, spike hits, total time, and checkpoint status.

## Scoring

The player is mainly scored based on time.

Lower time means a better score.

For levels with spikes, spike hits add a time penalty:

```js
finalScoreTime = levelTime + spikesHit * 5;
