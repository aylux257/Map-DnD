// token-management.js
let tokens = [];

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
                    radius: 20,
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
