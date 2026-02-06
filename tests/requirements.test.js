const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('style.css', 'utf8');
const js = fs.readFileSync('app.js', 'utf8');

assert(html.includes('<h1>Nilay Flag App</h1>'), 'Header copy should be updated');
assert(html.includes('<p class="subtitle">Flag Quiz Game</p>'), 'Subtitle should be updated');
assert(!html.includes('colorful edition'), 'Colorful edition suffix should be removed');
assert(!html.includes('Flag Asset Sources'), 'Flag Asset Sources should be removed from UI');

assert(css.includes('#start-screen {') && css.includes('text-align: center;'), 'Difficulty section should be centered');
assert(css.includes('#start-screen .difficulty-buttons') && css.includes('justify-content: center;'), 'Difficulty buttons should be centered');

assert(js.includes('const QUESTION_TIME = 6;'), 'Question timer should be 6 seconds');
assert(js.includes('const timerEl = document.getElementById("timer");'), 'Timer should be visible in UI');
assert(js.includes('function startTimer()'), 'Timer start logic should exist');
assert(js.includes('function handleTimeout()'), 'Timeout handler should exist');
assert(js.includes('qState.timedOut = true;'), 'Timeout should mark question as timed out/incorrect');
assert(js.includes('clearQuestionTimer();'), 'Timer should be cleared when needed');
assert(js.includes('state.autoAdvanceId = setTimeout(() => {\n    goNext();'), 'Timeout should auto-advance using reveal-next flow');
assert(js.includes('finalScore.textContent = `Congrats! You got ${state.score}/${QUESTION_COUNT}. Uncle Bayram is proud of you!`;'), 'Result copy should match required text');

console.log('All requirement checks passed.');
