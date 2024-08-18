const canvas = document.querySelector('.background-effect');
const ctx = canvas.getContext('2d');

let width, height;

function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

class Hexagon {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.angle = 0;
        this.speed = Math.random() * 0.002 - 0.001;
        this.vx = Math.random() * 0.5 - 0.25;
        this.vy = Math.random() * 0.5 - 0.25;
    }

    draw() {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i + this.angle;
            const x = this.x + this.size * Math.cos(angle);
            const y = this.y + this.size * Math.sin(angle);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i + this.angle;
            const x = this.x + this.size * Math.cos(angle);
            const y = this.y + this.size * Math.sin(angle);
            const x2 = this.x + (this.size * 0.9) * Math.cos(angle);
            const y2 = this.y + (this.size * 0.9) * Math.sin(angle);
            ctx.moveTo(x, y);
            ctx.lineTo(x2, y2);
        }
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.stroke();

        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i + this.angle;
            const x = this.x + this.size * Math.cos(angle);
            const y = this.y + this.size * Math.sin(angle);
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fill();
        }
    }

    update() {
        this.angle += this.speed;
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < -this.size) this.x = width + this.size;
        if (this.x > width + this.size) this.x = -this.size;
        if (this.y < -this.size) this.y = height + this.size;
        if (this.y > height + this.size) this.y = -this.size;
    }
}

const hexagons = [];
for (let i = 0; i < 10; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 50 + 50;
    hexagons.push(new Hexagon(x, y, size));
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    hexagons.forEach(hexagon => {
        hexagon.update();
        hexagon.draw();
    });
    requestAnimationFrame(animate);
}

animate();

document.addEventListener('DOMContentLoaded', function() {
    const feedbackButton = document.getElementById('feedbackButton');
    const feedbackPopover = document.getElementById('feedbackPopover');
    const feedbackForm = document.getElementById('feedbackForm');

    feedbackButton.addEventListener('click', function(event) {
        event.stopPropagation();
        feedbackPopover.style.display = feedbackPopover.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', function(event) {
        if (!feedbackButton.contains(event.target) && !feedbackPopover.contains(event.target)) {
            feedbackPopover.style.display = 'none';
        }
    });

    feedbackForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const feedbackCategory = document.getElementById('feedbackCategory').value;
        const feedbackText = document.getElementById('feedbackText').value;
        
        try {
            const response = await fetch('/api/send-feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ category: feedbackCategory, message: feedbackText }),
            });

            if (response.ok) {
                alert('Thank you for your feedback!');
                feedbackForm.reset();
                feedbackPopover.style.display = 'none';
            } else {
                throw new Error('Failed to send feedback');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Sorry, there was an error sending your feedback. Please try again later.');
        }
    });
});

document.getElementById('recommendationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const bookInput = document.getElementById('bookInput').value;
    await getRecommendations(bookInput);
});

document.querySelectorAll('.categories .button').forEach(button => {
    button.addEventListener('click', async () => {
        const genre = button.dataset.genre;
        await getRecommendations('', genre);
    });
});

async function getRecommendations(book, genre) {
    try {
        console.log('Sending request to /api/recommend');
        console.log('Request body:', JSON.stringify({ book, genre }));
        
        const response = await fetch('/api/recommend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ book, genre }),
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response body:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        
        displayRecommendations(data.recommendations);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('recommendations').innerHTML = `<p>An error occurred while fetching recommendations: ${error.message}</p>`;
    }
}

function displayRecommendations(recommendations) {
    const recommendationsDiv = document.getElementById('recommendations');
    if (!recommendations || recommendations.length === 0) {
        recommendationsDiv.innerHTML = '<p>No recommendations found.</p>';
        return;
    }
    let html = '<h2>Recommendations:</h2>';
    recommendations.forEach(book => {
        html += `
            <div class="book">
                <div class="book-image-container">
                    <img src="${book.imageUrl || '/placeholder-book-cover.jpg'}" alt="${book.title}" class="book-image">
                </div>
                <div class="book-info">
                    <h3 class="book-title">${book.title}</h3>
                    <p class="book-author"><strong>Author(s):</strong> ${book.authors}</p>
                    <p class="book-description">${book.description}</p>
                </div>
            </div>
        `;
    });
    html += `
        <div class="action-buttons">
            <button id="clearButton" class="button">Clear Results</button>
            <button id="regenerateButton" class="button">Regenerate</button>
        </div>
    `;
    recommendationsDiv.innerHTML = html;

    document.getElementById('clearButton').addEventListener('click', clearResults);
    document.getElementById('regenerateButton').addEventListener('click', regenerateResults);
}

function clearResults() {
    document.getElementById('recommendations').innerHTML = '';
}

function regenerateResults() {
    const bookInput = document.getElementById('bookInput').value;
    const genreInput = document.querySelector('.categories .button[data-genre]:focus');
    const genre = genreInput ? genreInput.dataset.genre : '';
    getRecommendations(bookInput, genre);
}

document.getElementById('recommendationForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const bookInput = document.getElementById('bookInput').value;
    const genreInput = document.querySelector('.categories .button[data-genre]:focus');
    const genre = genreInput ? genreInput.dataset.genre : '';
    getRecommendations(bookInput, genre);
});