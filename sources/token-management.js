// token-management.js
let tokens = [];
let isMovingToken = false;

function createToken() {
    const imagePicker = document.createElement('input');
    imagePicker.type = 'file';
    imagePicker.accept = 'image/*';
    imagePicker.style.display = 'none';
    imagePicker.onchange = handleTokenImageUpload;
    document.body.appendChild(imagePicker);
    imagePicker.click();
}

function handleTokenImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const token = {
                    id: Date.now(),
                    img: img,
                    x: 0,
                    y: 0,
                    radius: 25,
                    selected: false
                };
                tokens.push(token);
                placeTokenOnCanvas(token);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function placeTokenOnCanvas(token) {
    canvas.addEventListener('click', function placeToken(event) {
        const pos = getGridPosition(event);
        token.x = pos.x;
        token.y = pos.y;
        redrawTokens();
        canvas.removeEventListener('click', placeToken);
    });
}

function redrawTokens() {
    tokens.forEach(token => {
        ctx.save();
        ctx.translate(translateX, translateY);
        ctx.scale(scale, scale);
        ctx.beginPath();
        ctx.arc(token.x, token.y, token.radius, 0, 2 * Math.PI);
        ctx.clip();
        ctx.drawImage(token.img, token.x - token.radius, token.y - token.radius, token.radius * 2, token.radius * 2);
        ctx.restore();
    });
}
/*
// Implementing Drag and Drop for Tokens
tokens.forEach((token) => {
    console.log("token.forEach : " + token);
    token.dragging = false;

    canvas.addEventListener('mousedown', function(e) {
        const pos = getGridPosition(e);
        const distX = pos.x - token.x;
        const distY = pos.y - token.y;
        const distance = Math.sqrt(distX * distX + distY * distY);
        if (distance <= token.radius) {
            token.dragging = true;
            token.offsetX = distX;
            token.offsetY = distY;
        }
    });

    canvas.addEventListener('mousemove', function(e) {
        if (!token.dragging) return;
        const pos = getGridPosition(e);
        token.x = pos.x - token.offsetX;
        token.y = pos.y - token.offsetY;
        redrawTokens(); // Redraw tokens to reflect movement
    });

    canvas.addEventListener('mouseup', function(e) {
        token.dragging = false;
    });
});

canvas.addEventListener('mousemove', function(e) {
    if (isDrawing || tokens.some(token => token.dragging)) {
        console.log("updateFogOfWar()");
        //updateFogOfWar();
    }
});*/


// Add event listener for "Move token" button
document.getElementById('move-token-button').addEventListener('click', function() {
    console.log("isMovingToken : " + isMovingToken);
    isMovingToken = true;
    setTool = "blank";
    console.log("tool : " + tool);
});
  
// Modify event listeners for mouse down, move, and up
canvas.addEventListener('mousedown', function(e) {
    if (isMovingToken) {
        const pos = getGridPosition(e);
        const token = getTokenAtPosition(pos.x, pos.y);
        if (token) {
            token.dragging = true;
            token.offsetX = pos.x - token.x;
            token.offsetY = pos.y - token.y;
        }
    }
});
  
canvas.addEventListener('mousemove', function(e) {
    if (isMovingToken && tokens.some(token => token.dragging)) {
        const pos = getGridPosition(e);
        const token = getTokenAtPosition(pos.x, pos.y);
        if (token && token.dragging) {
            token.x = pos.x - token.offsetX;
            token.y = pos.y - token.offsetY;
            redrawTokens();
        }
    }
});
  
canvas.addEventListener('mouseup', function(e) {
    if (isMovingToken) {
        tokens.forEach(token => token.dragging = false);
    }
});
  
// Helper function to get token at position
function getTokenAtPosition(x, y) {
    return tokens.find(token => {
        const distance = Math.sqrt((x - token.x) ** 2 + (y - token.y) ** 2);
        console.log("distance : " + distance)
        return distance <= token.radius;
    });
}