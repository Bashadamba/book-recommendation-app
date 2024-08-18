require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const nodemailer = require('nodemailer');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());


async function getBookRecommendations(query, genre, maxResults = 5) {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    
    // First, get details about the input book
    let initialUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1&key=${apiKey}`;
    const initialResponse = await fetch(initialUrl);
    const initialData = await initialResponse.json();
    
    if (!initialData.items || initialData.items.length === 0) {
        return [];
    }
    
    const inputBook = initialData.items[0].volumeInfo;
    const authors = inputBook.authors ? inputBook.authors.join(' ') : '';
    const categories = inputBook.categories ? inputBook.categories.join(' ') : '';
    
    // Now, use these details to find similar books
    let url = `https://www.googleapis.com/books/v1/volumes?q=`;
    if (authors) url += `inauthor:${encodeURIComponent(authors)}+`;
    if (categories) url += `subject:${encodeURIComponent(categories)}+`;
    if (genre) url += `subject:${encodeURIComponent(genre)}+`;
    url += `&maxResults=${maxResults}&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data.items ? data.items.map(book => ({
        title: book.volumeInfo.title,
        authors: book.volumeInfo.authors ? book.volumeInfo.authors.join(', ') : 'Unknown',
        description: book.volumeInfo.description ? book.volumeInfo.description.substring(0, 200) + '...' : 'No description available',
        imageUrl: book.volumeInfo.imageLinks ? book.volumeInfo.imageLinks.thumbnail : null
    })) : [];
}

const transporter = nodemailer.createTransport({
    service: 'gmail', // Or another email service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

app.post('/api/recommend', async (req, res) => {
    console.log('Received request to /api/recommend');
    console.log('Request body:', req.body);
    const { book, genre } = req.body;
    try {
        const recommendations = await getBookRecommendations(book, genre);
        console.log('Sending recommendations:', recommendations);
        res.json({ recommendations });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'An error occurred while fetching recommendations' });
    }
});

app.post('/api/send-feedback', (req, res) => {
    const { type, message } = req.body;
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'tuahirud@gmail.com', // Replace with your email
        subject: `New Feedback: ${type}`,
        text: message
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            res.status(500).json({ message: 'Error sending email' });
        } else {
            console.log('Email sent: ' + info.response);
            res.status(200).json({ message: 'Feedback sent successfully' });
        }
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});