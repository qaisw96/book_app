// load enviroment variables from .env file
require('dotenv').config();

// Extract packages 
const express = require('express')
const superagent = require('superagent')
// const express = require('express')


const app = express()

// set variables from .env
const PORT = process.env.PORT

// Application Middleware
app.use(express.urlencoded());
// to serve Css files static
app.use(express.static('./public'))
// Set the view engine for server-side templating
app.set('view engine', 'ejs');

// Just to test
app.get('/test', (req, res) => {
    res.render('pages/index');
})





app.get('/searches/new', displayForm)
app.post('/searches', showBooks)

function displayForm(req, res) {
    
    res.render('pages/searches/new') 
}


function showBooks(req, res) {
    let urlBooks = `https://www.googleapis.com/books/v1/volumes`

    const searchBy = req.body.searchBy
    const searchByVl = req.body.search

    const queryObj = {}
    if(searchBy === 'title') {
        queryObj['q'] = `+intitle:${searchByVl}`
     
    }else if(searchBy === 'author') {
        queryObj['q'] = `+inauthor:${searchByVl}`
    }

    superagent.get(urlBooks).query(queryObj).then(apiRes => {
        return apiRes.body.items.map(book => new Book(book.volumeInfo))
        
    }).then(results => {
        res.render('pages/searches/show',{ searchResults: results })
    }).catch((error) => {    
        res.status(500).render('pages/error');  
    });
}




function Book(book) {
    
    this.title = book.title;
    this.author = book.authors;
    this.description = book.description;
    // this.smallThumbnail = book.imageLinks.smallThumbnail || `https://i.imgur.com/J5LVHEL.jpg`;      

}





// Start Web server
app.listen(PORT, () => {
   console.log(`listening to PORT ${PORT}....`);
})

// To test the connection 
app.use('*', (req, res) => {
    res.send(`All fine, Nothing to see YET ...`)

})

