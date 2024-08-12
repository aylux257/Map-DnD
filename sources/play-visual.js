// play-visual.js

function playVisual() {
    const newWindow = window.open("", "Play Visual", "width=1800,height=800");
    newWindow.document.write('<canvas id="playCanvas" width="1800" height="800"></canvas>');
    const playCanvas = newWindow.document.getElementById('playCanvas');
    const playCtx = playCanvas.getContext('2d');

    playCtx.drawImage(backgroundCanvas, 0, 0);
    tokens.forEach(token => {
        playCtx.save();
        playCtx.beginPath();
        playCtx.arc(token.x, token.y, token.radius, 0, 2 * Math.PI);
        playCtx.clip();
        playCtx.drawImage(token.img, token.x - token.radius, token.y - token.radius, token.radius * 2, token.radius * 2);
        playCtx.restore();
    });
}

// Function to communicate token movement to playVisual window
function notifyTokenMovement() {
    const playWindow = document.getElementById('playCanvas').contentWindow;
    if (playWindow) {
        playWindow.postMessage('updateFog', '*');
    }
}
