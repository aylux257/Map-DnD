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
    let selectedControlPoint = null; // Currently selected control point for editing
    let offsetX, offsetY; // Offset for moving drawings
    const controlPointRadius = 5; // Radius of control points for hit detection

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

    // Function to draw a rectangle
    function drawRectangle(x, y, width, height) {
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.stroke();
    }

    // Function to draw a circle
    function drawCircle(centerX, centerY, radius) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();
    }

    // Function to draw control points
    function drawControlPoints(drawing) {
        if (drawing.type === 'line') {
            drawControlPoint(drawing.startX, drawing.startY);
            drawControlPoint(drawing.endX, drawing.endY);
        } else if (drawing.type === 'rectangle') {
            drawControlPoint(drawing.x, drawing.y);
            drawControlPoint(drawing.x + drawing.width, drawing.y);
            drawControlPoint(drawing.x, drawing.y + drawing.height);
            drawControlPoint(drawing.x + drawing.width, drawing.y + drawing.height);
        } else if (drawing.type === 'circle') {
            drawControlPoint(drawing.centerX - drawing.radius, drawing.centerY);
            drawControlPoint(drawing.centerX + drawing.radius, drawing.centerY);
            drawControlPoint(drawing.centerX, drawing.centerY - drawing.radius);
            drawControlPoint(drawing.centerX, drawing.centerY + drawing.radius);
        }
        // Additional control points for other shapes can be added here
    }

    // Function to draw a single control point
    function drawControlPoint(x, y) {
        ctx.beginPath();
        ctx.arc(x, y, controlPointRadius, 0, 2 * Math.PI);
        ctx.fill();
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
            } else if (drawing.type === 'rectangle') {
                drawRectangle(drawing.x, drawing.y, drawing.width, drawing.height);
            } else if (drawing.type === 'circle') {
                drawCircle(drawing.centerX, drawing.centerY, drawing.radius);
            }
        });

        // Draw control points if in editing mode
        if (isEditing && selectedDrawing) {
            drawControlPoints(selectedDrawing);
        }
    }

    // Function to check if a point is near a control point
    function isPointNearControlPoint(px, py, x, y, tolerance = controlPointRadius) {
        const dx = px - x;
        const dy = py - y;
        return (dx * dx + dy * dy) <= tolerance * tolerance;
    }

    // Function to select a control point
    function selectControlPoint(x, y) {
        if (selectedDrawing) {
            if (selectedDrawing.type === 'line') {
                if (isPointNearControlPoint(x, y, selectedDrawing.startX, selectedDrawing.startY)) {
                    return { type: 'line-start' };
                } else if (isPointNearControlPoint(x, y, selectedDrawing.endX, selectedDrawing.endY)) {
                    return { type: 'line-end' };
                }
            } else if (selectedDrawing.type === 'rectangle') {
                if (isPointNearControlPoint(x, y, selectedDrawing.x, selectedDrawing.y)) {
                    return { type: 'rectangle-top-left' };
                } else if (isPointNearControlPoint(x, y, selectedDrawing.x + selectedDrawing.width, selectedDrawing.y)) {
                    return { type: 'rectangle-top-right' };
                } else if (isPointNearControlPoint(x, y, selectedDrawing.x, selectedDrawing.y + selectedDrawing.height)) {
                    return { type: 'rectangle-bottom-left' };
                } else if (isPointNearControlPoint(x, y, selectedDrawing.x + selectedDrawing.width, selectedDrawing.y + selectedDrawing.height)) {
                    return { type: 'rectangle-bottom-right' };
                }
            } else if (selectedDrawing.type === 'circle') {
                if (isPointNearControlPoint(x, y, selectedDrawing.centerX - selectedDrawing.radius, selectedDrawing.centerY)) {
                    return { type: 'circle-left' };
                } else if (isPointNearControlPoint(x, y, selectedDrawing.centerX + selectedDrawing.radius, selectedDrawing.centerY)) {
                    return { type: 'circle-right' };
                } else if (isPointNearControlPoint(x, y, selectedDrawing.centerX, selectedDrawing.centerY - selectedDrawing.radius)) {
                    return { type: 'circle-top' };
                } else if (isPointNearControlPoint(x, y, selectedDrawing.centerX, selectedDrawing.centerY + selectedDrawing.radius)) {
                    return { type: 'circle-bottom' };
                }
            }
            // Additional control point selection logic for other shapes can be added here
        }
        return null;
    }

    // Function to select a drawing
    function selectDrawing(x, y) {
        for (let i = 0; i < drawings.length; i++) {
            const drawing = drawings[i];
            if (drawing.type === 'line' && isPointNearLine(x, y, drawing.startX, drawing.startY, drawing.endX, drawing.endY)) {
                return drawing;
            } else if (drawing.type === 'rectangle' && isPointInRectangle(x, y, drawing.x, drawing.y, drawing.width, drawing.height)) {
                return drawing;
            } else if (drawing.type === 'circle' && isPointInCircle(x, y, drawing.centerX, drawing.centerY, drawing.radius)) {
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
        isEditing = false; // Ensure editing is false initially
        selectedDrawing = null;
    });

    // Handle mouse down event for drawing or selecting shapes
    canvas.addEventListener('mousedown', (event) => {
        const x = event.offsetX;
        const y = event.offsetY;

        if (drawMode === 'edit') {
            // Toggle editing mode
            if (!isEditing) {
                selectedDrawing = selectDrawing(x, y);
                if (selectedDrawing) {
                    isEditing = true;
                    offsetX = x;
                    offsetY = y;
                }
            } else {
                selectedControlPoint = selectControlPoint(x, y);
                if (!selectedControlPoint) {
                    isEditing = false;
                    selectedDrawing = null;
                }
            }
        } else if (drawMode === 'quadratic-curve') {
            if (controlPoints.length < maxControlPoints) {
                controlPoints.push({ x, y });
            } else {
                const [start, control] = controlPoints;
                drawings.push({ type: 'quadratic-curve', startX: start.x, startY: start.y, controlX: control.x, controlY: control.y, endX: x, endY: y });
                drawQuadraticCurve(start.x, start.y, control.x, control.y, x, y);
                controlPoints = [];
            }
        } else {
            // Start drawing mode
            startX = x;
            startY = y;
            isDrawing = true;
        }
    });

    // Handle mouse up event for completing drawing or editing shapes
    canvas.addEventListener('mouseup', (event) => {
        const endX = event.offsetX;
        const endY = event.offsetY;

        if (isDrawing) {
            // Complete drawing mode
            if (drawMode === 'line') {
                drawings.push({ type: 'line', startX, startY, endX, endY });
                drawLine(startX, startY, endX, endY);
            } else if (drawMode === 'semi-circle') {
                const radius = Math.hypot(endX - startX, endY - startY);
                drawings.push({ type: 'semi-circle', centerX: startX, centerY: startY, radius, startAngle: 0, endAngle: Math.PI });
                drawSemiCircle(startX, startY, radius, 0, Math.PI);
            } else if (drawMode === 'rectangle') {
                const width = endX - startX;
                const height = endY - startY;
                drawings.push({ type: 'rectangle', x: startX, y: startY, width, height });
                drawRectangle(startX, startY, width, height);
            } else if (drawMode === 'circle') {
                const radius = Math.hypot(endX - startX, endY - startY);
                drawings.push({ type: 'circle', centerX: startX, centerY: startY, radius });
                drawCircle(startX, startY, radius);
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
            // Dynamic feedback for line, rectangle, circle, or semi-circle drawing
            const endX = x;
            const endY = y;

            clearCanvas();
            redrawAllDrawings();
            if (drawMode === 'line') {
                drawLine(startX, startY, endX, endY);
            } else if (drawMode === 'semi-circle') {
                const radius = Math.hypot(endX - startX, endY - startY);
                drawSemiCircle(startX, startY, radius, 0, Math.PI);
            } else if (drawMode === 'rectangle') {
                const width = endX - startX;
                const height = endY - startY;
                drawRectangle(startX, startY, width, height);
            } else if (drawMode === 'circle') {
                const radius = Math.hypot(endX - startX, endY - startY);
                drawCircle(startX, startY, radius);
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
            // Move or edit selected drawing
            const dx = x - offsetX;
            const dy = y - offsetY;

            offsetX = x;
            offsetY = y;

            if (selectedControlPoint) {
                // Editing control points
                if (selectedControlPoint.type === 'line-start') {
                    selectedDrawing.startX += dx;
                    selectedDrawing.startY += dy;
                } else if (selectedControlPoint.type === 'line-end') {
                    selectedDrawing.endX += dx;
                    selectedDrawing.endY += dy;
                } else if (selectedControlPoint.type === 'rectangle-top-left') {
                    selectedDrawing.x += dx;
                    selectedDrawing.y += dy;
                    selectedDrawing.width -= dx;
                    selectedDrawing.height -= dy;
                } else if (selectedControlPoint.type === 'rectangle-top-right') {
                    selectedDrawing.y += dy;
                    selectedDrawing.width += dx;
                    selectedDrawing.height -= dy;
                } else if (selectedControlPoint.type === 'rectangle-bottom-left') {
                    selectedDrawing.x += dx;
                    selectedDrawing.width -= dx;
                    selectedDrawing.height += dy;
                } else if (selectedControlPoint.type === 'rectangle-bottom-right') {
                    selectedDrawing.width += dx;
                    selectedDrawing.height += dy;
                } else if (selectedControlPoint.type === 'circle-left' || selectedControlPoint.type === 'circle-right') {
                    selectedDrawing.radius = Math.abs(selectedDrawing.centerX - x);
                } else if (selectedControlPoint.type === 'circle-top' || selectedControlPoint.type === 'circle-bottom') {
                    selectedDrawing.radius = Math.abs(selectedDrawing.centerY - y);
                }
                // Additional logic for other control points can be added here
            } else {
                // Moving the whole shape
                if (selectedDrawing.type === 'line') {
                    selectedDrawing.startX += dx;
                    selectedDrawing.startY += dy;
                    selectedDrawing.endX += dx;
                    selectedDrawing.endY += dy;
                } else if (selectedDrawing.type === 'rectangle') {
                    selectedDrawing.x += dx;
                    selectedDrawing.y += dy;
                } else if (selectedDrawing.type === 'circle') {
                    selectedDrawing.centerX += dx;
                    selectedDrawing.centerY += dy;
                }
                // Additional logic for other shapes can be added here
            }

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
