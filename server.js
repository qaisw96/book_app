// load enviroment variables from .env file
require('dotenv').config();

// Extract packages 
const express = require('express')
const superagent = require('superagent')
const pg = require('pg')
// const express = require('express')


const app = express()

// set variables from .env
const PORT = process.env.PORT
const DATABASE_URL = process.env.DATABASE_URL
const ENV = process.env.ENV || "DEP"


let client = '';
if (ENV === 'DEP') {
  client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  client = new pg.Client({
    connectionString: DATABASE_URL,
  });
}

// const client = new pg.Client(DATABASE_URL)


// Application Middleware
app.use(express.urlencoded());
// to serve Css files static
app.use(express.static('./public'))
// Set the view engine for server-side templating
app.set('view engine', 'ejs');



app.get('/', renderHomePageFromDb)
app.get('/books/:id', getOneBook)
app.post('/books', selectAndSaveBook)


app.get('/searches/new', displayForm)

app.post('/searches', showBooks)

// app.post('/searches', selectAndSaveBook)


function renderHomePageFromDb(req, res) {
    const sqlQuery = `SELECT * FROM books;`

    client.query(sqlQuery).then(result => {
        
        res.render('pages/index', { results: result.rows})

    }).catch(error => {
        handleError(error, res)
    })
}

function getOneBook(req, res) {
    const taskId =  req.params.id;

    const sqlQueryById = `SELECT * FROM books WHERE id=$1`
    const safeValues = [taskId]

    client.query(sqlQueryById, safeValues).then(results => {
        res.render('pages/books/detail.ejs', {result : results.rows})
    })

}

function selectAndSaveBook(req, res) {
    const book = req.body.book.split(",")
    // console.log(book)
    const inserData = `INSERT INTO books (auther, title, isbn, image_url, description) VALUES($1, $2, $3, $4, $5) RETURNING id;`
    const safeValues = [book[0], book[1], book[2], book[3], book[4]]

    client.query(inserData, safeValues).then((result) => {
        res.redirect(`/books/${result.rows[0].id}`)
    })

}

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
        handleError(error, res);  
    });
}




function Book(book) {
    
    this.title = book.title ? book.title : `No title exist`;
    this.author = book.authors ? book.authors[0] : `There is no author`
    this.description = book.description ? book.description : `There is no decribtion`;
    this.thumbnail = book.imageLinks.thumbnail || `https://i.imgur.com/J5LVHEL.jpg`;
    this.isbn = book.industryIdentifiers ? `ISBN_13 ${book.industryIdentifiers[0].identifier}` : 'No ISBN available';
      

}



function handleError(error, res) {
    res.render('pages/error', { error: error });
  }
    

// Start Web server
client.connect().then(() => {
    app.listen(PORT, () => {
       console.log(`listening to PORT ${PORT}....`);
       console.log(`Connected DATABASE`);
    })
})

// To test the connection 
app.use('*', (req, res) => {
    res.send(`All fine, Nothing to see YET ...`)

})

