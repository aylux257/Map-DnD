const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const backgroundCanvas = document.getElementById('backgroundCanvas');
const bgCtx = backgroundCanvas.getContext('2d');
let gridSize = 10;
let tool = 'line';
let startX, startY, isDrawing = false;
let shapes = [];
let shapesSecond = [];
let scale = 1;
const maxScale = 5;
const minScale = 1;
let imgElement = new Image();
let backgroundOpacity = 1.0;

// Variables to keep track of translation
let translateX = 0;
let translateY = 0;

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(translateX, translateY);
    ctx.scale(scale, scale);
    for (let x = 0; x <= canvas.width; x += gridSize) {
        for (let y = 0; y <= canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.rect(x, y, gridSize, gridSize);
            ctx.strokeStyle = '#ccc';
            ctx.stroke();
        }
    }
    ctx.restore();
}

function getGridPosition(e) {
    const rect = canvas.getBoundingClientRect();
    // Consider the current translation and scaling
    const mouseX = (e.clientX - rect.left - translateX) / scale;
    const mouseY = (e.clientY - rect.top - translateY) / scale;
    const gridX = Math.floor(mouseX / gridSize) * gridSize + gridSize / 2;
    const gridY = Math.floor(mouseY / gridSize) * gridSize + gridSize / 2;
    return { x: gridX, y: gridY };
}

function setTool(SelectedTools){
    tool = SelectedTools;
}

function toCanvasCoordinates(x, y) {
    return { x: x / scale, y: y / scale };
}

function toScaledCoordinates(x, y) {
    return { x: x * scale, y: y * scale };
}

canvas.addEventListener('mousedown', (e) => {
    const pos = getGridPosition(e);
    startX = pos.x;
    startY = pos.y;
    isDrawing = true;
});

canvas.addEventListener('mouseup', (e) => {
    if (!isDrawing) return;
    const pos = getGridPosition(e);
    const endX = pos.x;
    const endY = pos.y;
    isDrawing = false;

    shapes.push({
        tool,
        startX: startX / scale,
        startY: startY / scale,
        endX: endX / scale,
        endY: endY / scale
    });

    // Clear redo stack since new shape is drawn
    shapesSecond = [];
    
    redrawShapes();
});

canvas.addEventListener('mousemove', (e) => {
    const pos = getGridPosition(e);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    redrawShapes();
    if (isDrawing) {
        drawPreviewShape(startX, startY, pos.x, pos.y);
    } else {
        drawMouseHighlight(pos.x, pos.y);
    }
});

document.addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.key === 'z') {
      undo();
    }
});

function redrawShapes() {
    drawGrid();
    shapes.forEach(shape => {
        const { tool, startX, startY, endX, endY } = shape;
        const { x: sx, y: sy } = toScaledCoordinates(startX, startY);
        const { x: ex, y: ey } = toScaledCoordinates(endX, endY);
        ctx.save();
        ctx.translate(translateX, translateY);
        ctx.scale(scale, scale);
        switch (tool) {
            case 'line':
                drawLine(sx, sy, ex, ey);
                break;
            case 'rectangle':
                drawRectangle(sx, sy, ex, ey);
                break;
            case 'circle':
                drawCircle(sx, sy, ex, ey);
                break;
        }
        ctx.restore();
    });
}

function drawPreviewShape(x1, y1, x2, y2) {
    ctx.save();
    ctx.scale(scale, scale);
    switch (tool) {
        case 'line':
            drawLine(x1 , y1 , x2 , y2);
            break;
        case 'rectangle':
            drawRectangle(x1, y1, x2, y2);
            break;
        case 'circle':
            drawCircle(x1, y1, x2, y2);
            break;
    }
    ctx.restore();
}

function drawLine(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = 'black';
    ctx.stroke();
}

function drawRectangle(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.rect(x1, y1, x2 - x1, y2 - y1);
    ctx.strokeStyle = 'black';
    ctx.stroke();
}

function drawCircle(x1, y1, x2, y2) {
    const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    ctx.beginPath();
    ctx.arc(x1, y1, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'black';
    ctx.stroke();
}

function drawMouseHighlight(x, y) {
    ctx.save();
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.rect(x - gridSize / 2, y - gridSize / 2, gridSize, gridSize);
    ctx.strokeStyle = 'red';
    ctx.stroke();
    ctx.restore();
}

function openImagePicker() {
    document.getElementById('imagePicker').click();
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imgElement.onload = function() {
                drawBackgroundImage();
                redrawShapes();
            };
            imgElement.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function drawBackgroundImage() {
    if (imgElement.src) {
        const aspectRatio = imgElement.width / imgElement.height;
        const imgHeight = backgroundCanvas.height;
        const imgWidth = imgHeight * aspectRatio;

        // Calculate the position to center the image
        const x = (backgroundCanvas.width - imgWidth) / 2;
        const y = 0;

        bgCtx.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
        bgCtx.globalAlpha = backgroundOpacity;
        bgCtx.drawImage(imgElement, x, y, imgWidth, imgHeight);
        bgCtx.globalAlpha = 1.0; // Reset opacity
    }
}

function setOpacity(value) {
    backgroundOpacity = value;
    drawBackgroundImage();
    redrawShapes();
}

function undo() {
    if (shapes.length > 0) {
        shapesSecond.push(shapes.pop());
        redrawShapes();
    }
}

function redo() {
    if (shapesSecond.length > 0) {
        shapes.push(shapesSecond.pop());
        redrawShapes();
    }
}

// Initial draw
drawGrid();
