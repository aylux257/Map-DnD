const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let gridSize = 10;
let tool = 'line';
let startX, startY, isDrawing = false;
const shapes = [];
let scale = 1;
const maxScale = 5;
const minScale = 1;

// Draw grid
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
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

function setTool(SelectedTools){
    tool = SelectedTools;
}

// Transform to canvas coordinates considering scale
function toCanvasCoordinates(x, y) {
    return { x: x / scale, y: y / scale };
}

// Transform to scaled coordinates
function toScaledCoordinates(x, y) {
    return { x: x * scale, y: y * scale };
}

// Get position in grid coordinates
function getGridPosition(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / scale;
    const mouseY = (e.clientY - rect.top) / scale;
    const gridX = Math.floor(mouseX / gridSize) * gridSize + gridSize / 2;
    const gridY = Math.floor(mouseY / gridSize) * gridSize + gridSize / 2;
    return { x: gridX, y: gridY };
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

    // Store the original coordinates relative to the grid (unscaled)
    shapes.push({
        tool,
        startX: startX / scale,
        startY: startY / scale,
        endX: endX / scale,
        endY: endY / scale
    });
    redrawShapes();
});

canvas.addEventListener('mousemove', (e) => {
    if (isDrawing) {
        const pos = getGridPosition(e);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();
        redrawShapes();
        drawPreviewShape(startX, startY, pos.x, pos.y);
    } else {
        const pos = getGridPosition(e);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();
        redrawShapes();
        drawMouseHighlight(pos.x, pos.y);
    }
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.deltaY < 0 && scale < maxScale) {
        scale += 0.1;
    } else if (e.deltaY > 0 && scale > minScale) {
        scale -= 0.1;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    redrawShapes();
});

function redrawShapes() {
    shapes.forEach(shape => {
        const { tool, startX, startY, endX, endY } = shape;
        // Scale coordinates back when drawing
        const { x: sx, y: sy } = toScaledCoordinates(startX, startY);
        const { x: ex, y: ey } = toScaledCoordinates(endX, endY);
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
    });
}

function drawPreviewShape(x1, y1, x2, y2) {
    // Draw with current scaling
    ctx.save();
    ctx.scale(scale, scale);
    switch (tool) {
        case 'line':
            drawLine(x1 , y1 , x2 , y2);
            break;
        case 'rectangle':
            drawRectangle(x1 * scale, y1 * scale, x2 * scale, y2 * scale);
            break;
        case 'circle':
            drawCircle(x1 * scale, y1 * scale, x2 * scale, y2 * scale);
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

// Initialize the canvas with the grid
drawGrid();