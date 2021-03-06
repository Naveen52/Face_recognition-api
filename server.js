const { Require } = require("express");
const express = require("express");

const cors = require('cors');

const bcrypt = require('bcrypt-node');

const bodyParser = require("body-parser");

const app = express();

app.use(express.json());
app.use(cors());

const db = require('knex')({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        user: 'postgres',
        password: '',
        database: 'smart-brain'
    }
});

db.select('*').from('users');

const database = {
    users: [
        {
            id: "1",
            name: "John Doe",
            email: "JohnDoe@gmail.com",
            password: "John1",
            entries: 0,
            joined: new Date()
        },
        {
            id: "2",
            name: "peter",
            email: "peterDoe@gmail.com",
            password: "peter1",
            entries: 0,
            joined: new Date()
        }
    ]
}



app.get('/', (req, res) => {
    res.send(database.users)
})

// Sign In

app.post('/signIn', (req, res) => {
    db.select('email', 'hash').from('login')
        .where('email', '=', req.body.email)
        .then(data => {
            const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
            if (isValid) {
                return db.select('*').from('users')
                    .where('email', '=', req.body.email)
                    .then(user => {
                        res.json(user[0])
                    })
                    .catch(err => res.status(400).json('unable to get user'))
            } else {
                res.status(400).json('Wrong credentials')
            }
        })
        .catch(err => res.status(400).json('Wrong credentials'))
})

// Register

app.post('/register', (req, res) => {
    const { email, name, password } = req.body;
    const hash = bcrypt.hashSync(password);
    db.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email
        })
            .into('login')
            .returning('email')
            .then(loginEmail => {
                return trx('users')
                    .returning('*')
                    .insert({
                        email: loginEmail[0],
                        name: name,
                        joined: new Date()
                    })
                    .then(user => {
                        res.json(user[0])
                    })
            })
            .then(trx.commit)
            .catch(trx.rollback);
    })
        .catch(err => res.status(400).json(err))


})

app.get('/profile/:id', (req, res) => {
    const { id } = req.params;
    db.select('*').from('users').where({ id })
        .then(user => {
            if (user.length) {
                res.json(user[0])
            } else {
                res.status(400).json("Not found")
            }
        }).catch(err => res.status(400).json('Error logging In'))
})

app.put('/image', (req, res) => {
    const { id } = req.body;
    db('users').where('id', '=', id)
        .increment('entries', 1)
        .returning('entries')
        .then(entries => {
            res.json(entries[0]);
        })
        .catch(err => res.status(400).json('Unable to get entries'))

})

app.listen(3000, () => {
    console.log("hello this is working")
})

// what we have to made in this section 
// First we need a simple slash Route (get request)
// second we need a sign in Route(Post request)

// Third we need a register Route(Post request)
// finally we need a user profile route (Get request)