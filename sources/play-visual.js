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

    // Implement fog of war
    function drawFogOfWar() {
        playCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        playCtx.fillRect(0, 0, playCanvas.width, playCanvas.height);

        tokens.forEach(token => {
            playCtx.save();
            playCtx.globalCompositeOperation = 'destination-out';
            playCtx.beginPath();
            playCtx.arc(token.x, token.y, 100, 0, 2 * Math.PI); // Adjust the radius as needed
            playCtx.fill();
            playCtx.restore();
        });
    }

    drawFogOfWar();
}
