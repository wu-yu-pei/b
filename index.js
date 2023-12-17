const express = require("express")
const mysql = require('mysql2');
const cors = require("cors")

const app = express()
app.use(cors())
app.use(express.json({
  type: 'application/json'
}))

const connection = mysql.createConnection({
  host: '8.219.66.21',
  user: 'root',
  password: "19781209Wyp",
  database: 'juejin'
});

app.get("/books", (req, res) => {
  connection.query("SELECT * FROM books", (err, result) => {
    res.send({ code: 200, data: result })
    if (err) {
      res.send({ code: 500, data: err })
    }
  })
})

app.post("/submit", (req, res) => {
  const { book_id, phone } = req.body
  console.log('---');
  connection.execute("INSERT INTO users (phone, book_id, create_date, update_date) VALUES (?, ?, ?, ?)", [phone, book_id, new Date(), new Date()], (err, result) => {
    res.send({ code: 200, success: 200 })
  })
})

app.listen(7899, () => {
  console.log('server is runing at 7899')
})