/**
 * PAC-MAN Arcade Game Constants & Configurations
 * Version: v1.0.0
 */

export const VERSION = 'v1.0.0';

export const TILE_SIZE = 20; // 20 pixels per tile
export const MAZE_COLS = 28;
export const MAZE_ROWS = 31;
export const HUD_BOTTOM_ROWS = 3;
export const TOTAL_ROWS = MAZE_ROWS + HUD_BOTTOM_ROWS; // 34 rows total
export const CANVAS_WIDTH = MAZE_COLS * TILE_SIZE; // 560px
export const CANVAS_HEIGHT = TOTAL_ROWS * TILE_SIZE; // 680px

// Directions
export const DIR = {
    NONE:  { x: 0,  y: 0,  name: 'NONE' },
    UP:    { x: 0,  y: -1, name: 'UP',    angle: 1.5 * Math.PI },
    DOWN:  { x: 0,  y: 1,  name: 'DOWN',  angle: 0.5 * Math.PI },
    LEFT:  { x: -1, y: 0,  name: 'LEFT',  angle: 1.0 * Math.PI },
    RIGHT: { x: 1,  y: 0,  name: 'RIGHT', angle: 0.0 }
};

// Game States
export const STATE = {
    READY: 'READY',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GHOST_EATEN_PAUSE: 'GHOST_EATEN_PAUSE',
    PACMAN_DYING: 'PACMAN_DYING',
    LEVEL_CLEAR: 'LEVEL_CLEAR',
    GAME_OVER: 'GAME_OVER'
};

// Ghost Modes
export const GHOST_MODE = {
    IN_HOUSE: 'IN_HOUSE',
    EXITING: 'EXITING',
    SCATTER: 'SCATTER',
    CHASE: 'CHASE',
    FRIGHTENED: 'FRIGHTENED',
    EATEN: 'EATEN'
};

// Colors
export const COLORS = {
    MAZE_WALL: '#2121ff',
    MAZE_WALL_INNER: '#000088',
    MAZE_DOOR: '#ffb8de',
    PELLET: '#ffb897',
    ENERGIZER: '#ffffff',
    PACMAN: '#ffff00',
    BLINKY: '#ff0000',
    PINKY: '#ffb8ff',
    INKY: '#00ffff',
    CLYDE: '#ffb852',
    FRIGHTENED_BLUE: '#0000bb',
    FRIGHTENED_WHITE: '#ffffff',
    EYE_WHITE: '#ffffff',
    EYE_PUPIL: '#0000ff'
};

// Fruit Types & Scoring by Level
export const FRUITS = [
    { name: 'Cherry',      points: 100,  color: '#e52521', stemColor: '#30b030', level: 1 },
    { name: 'Strawberry',  points: 300,  color: '#e52521', stemColor: '#30b030', level: 2 },
    { name: 'Orange',      points: 500,  color: '#ff9900', stemColor: '#30b030', level: 3 },
    { name: 'Apple',       points: 700,  color: '#e02020', stemColor: '#50c030', level: 5 },
    { name: 'Melon',       points: 1000, color: '#30d060', stemColor: '#208030', level: 7 },
    { name: 'Galaxian',    points: 2000, color: '#ffea00', stemColor: '#3388ff', level: 9 },
    { name: 'Bell',        points: 3000, color: '#ffea00', stemColor: '#3388ff', level: 11 },
    { name: 'Key',         points: 5000, color: '#00e5ff', stemColor: '#ffffff', level: 13 }
];

// Classic 28x31 Maze Map
// 'W': Wall
// '.': Pellet (10 pts)
// 'o': Energizer (50 pts)
// ' ': Empty space
// '-': Ghost House Door
// 'G': Ghost House interior
// 'T': Tunnel (slows ghosts, wraps across edges)
export const RAW_MAZE = [
    "WWWWWWWWWWWWWWWWWWWWWWWWWWWW", // 0
    "W............WW............W", // 1
    "W.WWWW.WWWWW.WW.WWWWW.WWWW.W", // 2
    "WoWWWW.WWWWW.WW.WWWWW.WWWWoW", // 3
    "W.WWWW.WWWWW.WW.WWWWW.WWWW.W", // 4
    "W..........................W", // 5
    "W.WWWW.WW.WWWWWWWW.WW.WWWW.W", // 6
    "W.WWWW.WW.WWWWWWWW.WW.WWWW.W", // 7
    "W......WW....WW....WW......W", // 8
    "WWWWWW.WWWWW WW WWWWW.WWWWWW", // 9
    "     W.WWWWW WW WWWWW.W     ", // 10
    "     W.WW          WW.W     ", // 11
    "     W.WW WWW--WWW WW.W     ", // 12
    "WWWWWW.WW W      W WW.WWWWWW", // 13
    "TTTTTT    W GGGG W    TTTTTT", // 14 (Tunnel)
    "WWWWWW.WW W      W WW.WWWWWW", // 15
    "     W.WW WWWWWWWW WW.W     ", // 16
    "     W.WW          WW.W     ", // 17
    "     W.WW WWWWWWWW WW.W     ", // 18
    "WWWWWW.WW WWWWWWWW WW.WWWWWW", // 19
    "W............WW............W", // 20
    "W.WWWW.WWWWW.WW.WWWWW.WWWW.W", // 21
    "W.WWWW.WWWWW.WW.WWWWW.WWWW.W", // 22
    "Wo..WW................WW..oW", // 23
    "WWW.WW.WW.WWWWWWWW.WW.WW.WWW", // 24
    "WWW.WW.WW.WWWWWWWW.WW.WW.WWW", // 25
    "W......WW....WW....WW......W", // 26
    "W.WWWWWWWWWW.WW.WWWWWWWWWW.W", // 27
    "W.WWWWWWWWWW.WW.WWWWWWWWWW.W", // 28
    "W..........................W", // 29
    "WWWWWWWWWWWWWWWWWWWWWWWWWWWW"  // 30
];
