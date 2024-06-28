// Listen for the DOMContentLoaded event to ensure the DOM is fully loaded before executing the script
document.addEventListener('DOMContentLoaded', (event) => {
    // Get the canvas element and its 2D rendering context
    const canvas = document.getElementById('mapCanvas');
    const ctx = canvas.getContext('2d');

    // Variables to manage drawing modes and coordinates
    let drawMode = 'line'; // Default drawing mode
    let startX, startY, isDrawing = false; // Variables to track drawing state
    let drawings = []; // Array to store drawings
    let controlPoints = []; // Array to store control points for quadratic curves
    const maxControlPoints = 2; // Number of control points for a quadratic curve
    let isEditing = false; // Flag to indicate if in editing mode
    let selectedDrawing = null; // Currently selected drawing for editing
    let offsetX, offsetY; // Offset for moving drawings

    // Function to draw a line
    function drawLine(startX, startY, endX, endY) {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }

    // Function to draw a semicircle (half-arc)
    function drawSemiCircle(centerX, centerY, radius, startAngle, endAngle) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.stroke();
    }

    // Function to draw a quadratic curve
    function drawQuadraticCurve(startX, startY, controlX, controlY, endX, endY) {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(controlX, controlY, endX, endY);
        ctx.stroke();
    }

    // Function to clear the canvas
    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Function to redraw all saved drawings
    function redrawAllDrawings() {
        drawings.forEach(drawing => {
            if (drawing.type === 'line') {
                drawLine(drawing.startX, drawing.startY, drawing.endX, drawing.endY);
            } else if (drawing.type === 'semi-circle') {
                drawSemiCircle(drawing.centerX, drawing.centerY, drawing.radius, drawing.startAngle, drawing.endAngle);
            } else if (drawing.type === 'quadratic-curve') {
                drawQuadraticCurve(drawing.startX, drawing.startY, drawing.controlX, drawing.controlY, drawing.endX, drawing.endY);
            }
        });
    }

    // Function to check if a point is near a line
    function isPointNearLine(px, py, x1, y1, x2, y2, tolerance = 5) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        const param = len_sq !== 0 ? dot / len_sq : -1;

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return (dx * dx + dy * dy) <= tolerance * tolerance;
    }

    // Function to select a drawing
    function selectDrawing(x, y) {
        for (let i = 0; i < drawings.length; i++) {
            const drawing = drawings[i];
            if (drawing.type === 'line' && isPointNearLine(x, y, drawing.startX, drawing.startY, drawing.endX, drawing.endY)) {
                return drawing;
            }else if(drawing.type === 'quadratic-curve' && isPointNearLine(x, y, drawing.startX, drawing.startY, drawing.endX, drawing.endY)){
                return drawing;
            }
            // Additional selection logic for other shapes can be added here
        }
        return null;
    }

    // Update the draw mode based on user selection
    document.querySelectorAll('input[name="drawMode"]').forEach((input) => {
        input.addEventListener('change', (event) => {
            drawMode = event.target.value;
            controlPoints = []; // Reset control points when changing draw mode
            isEditing = false;  // Exit edit mode when changing draw mode
        });
    });

    // Handle edit mode button click
    document.getElementById('editModeButton').addEventListener('click', () => {
        drawMode = 'edit';
        isEditing = false; // Ensure editing is false until a shape is selected
    });

    // Handle mouse down event
    canvas.addEventListener('mousedown', (event) => {
        const x = event.offsetX;
        const y = event.offsetY;

        if (drawMode === 'edit') {
            // Check if clicking on a drawing to edit
            const drawing = selectDrawing(x, y);
            if (drawing) {
                isEditing = true;
                selectedDrawing = drawing;
                offsetX = x;
                offsetY = y;
            }
        } else if (drawMode === 'quadratic-curve') {
            // Collect control points for quadratic curve
            controlPoints.push({ x, y });

            // Draw quadratic curve when enough control points are collected
            if (controlPoints.length === maxControlPoints + 1) {
                const [start, control, end] = controlPoints;
                drawings.push({ type: 'quadratic-curve', startX: start.x, startY: start.y, controlX: control.x, controlY: control.y, endX: end.x, endY: end.y });
                drawQuadraticCurve(start.x, start.y, control.x, control.y, end.x, end.y);
                controlPoints = []; // Reset control points after drawing
            }
        } else {
            // Start drawing a line or semi-circle
            startX = x;
            startY = y;
            isDrawing = true;
        }
    });

    // Handle mouse up event
    canvas.addEventListener('mouseup', (event) => {
        if (isDrawing) {
            const endX = event.offsetX;
            const endY = event.offsetY;

            if (drawMode === 'line') {
                drawings.push({ type: 'line', startX, startY, endX, endY });
                drawLine(startX, startY, endX, endY);
            } else if (drawMode === 'semi-circle') {
                const radius = Math.hypot(endX - startX, endY - startY);
                drawings.push({ type: 'semi-circle', centerX: startX, centerY: startY, radius, startAngle: 0, endAngle: Math.PI });
                drawSemiCircle(startX, startY, radius, 0, Math.PI);
            }

            isDrawing = false;
        } else if (isEditing) {
            // Stop editing mode
            isEditing = false;
            selectedDrawing = null;
        }
    });

    // Handle mouse move event for dynamic feedback and moving shapes
    canvas.addEventListener('mousemove', (event) => {
        const x = event.offsetX;
        const y = event.offsetY;

        if (isDrawing) {
            // Dynamic feedback for line or semi-circle drawing
            const endX = x;
            const endY = y;

            clearCanvas();
            redrawAllDrawings();
            if (drawMode === 'line') {
                drawLine(startX, startY, endX, endY);
            } else if (drawMode === 'semi-circle') {
                const radius = Math.hypot(endX - startX, endY - startY);
                drawSemiCircle(startX, startY, radius, 0, Math.PI);
            }
        } else if (drawMode === 'quadratic-curve' && controlPoints.length > 0) {
            // Dynamic feedback for quadratic curve drawing
            const currentX = x;
            const currentY = y;

            clearCanvas();
            redrawAllDrawings();
            const [start, control] = controlPoints;
            if (control) {
                drawQuadraticCurve(start.x, start.y, control.x, control.y, currentX, currentY);
            } else {
                drawLine(start.x, start.y, currentX, currentY);
            }
        } else if (isEditing && selectedDrawing) {
            // Move selected drawing
            const dx = x - offsetX;
            const dy = y - offsetY;

            offsetX = x;
            offsetY = y;

            if (selectedDrawing.type === 'line') {
                selectedDrawing.startX += dx;
                selectedDrawing.startY += dy;
                selectedDrawing.endX += dx;
                selectedDrawing.endY += dy;
            }
            // Additional logic for other shapes can be added here

            clearCanvas();
            redrawAllDrawings();
        }
    });

    // Handle clear canvas button click
    document.getElementById('clearCanvasButton').addEventListener('click', () => {
        clearCanvas();
        drawings = []; // Clear the drawings array
        controlPoints = []; // Clear control points
    });
});
