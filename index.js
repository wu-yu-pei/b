const express = require("express")
const mysql = require('mysql2');
const cors = require("cors")
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 465,
  secure: true,
  auth: {
    user: '495174699@qq.com',
    pass: "vilfljggjgoccbef",
  }
})

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
  connection.query("SELECT * FROM books ORDER BY level DESC", (err, result) => {
    const ip = getClientIp(req)
    console.log('post---', ip);
    res.send({ code: 200, data: result })
    if (err) {
      res.send({ code: 500, data: err })
    }
  })
})

app.post("/submit", (req, res) => {
  const { book_id, phone } = req.body
  const ip = getClientIp(req)
  console.log('get---', ip);
  connection.execute("INSERT INTO users (phone, book_id, create_date, update_date) VALUES (?, ?, ?, ?)", [phone, book_id, new Date(), new Date()], (err, result) => {
    res.send({ code: 200, success: 200 })

    const receiverone = {
      // 发件人 邮箱  '昵称<发件人邮箱>'
      from: `495174699@qq.com`,
      // 主题
      subject: '通知',
      // 收件人 的邮箱 可以是其他邮箱 不一定是qq邮箱
      to: '495174699@qq.com',
      // 可以使用html标签
      html: `ip:${ip},掘金小册bookId：${book_id},联系方式：${phone}，请尽快处理.`
    }

    const receivertwo = {
      // 发件人 邮箱  '昵称<发件人邮箱>'
      from: `495174699@qq.com`,
      // 主题
      subject: '通知',
      // 收件人 的邮箱 可以是其他邮箱 不一定是qq邮箱
      to: '2456635159@qq.com',
      // 可以使用html标签
      html: `ip:${ip},掘金小册bookId：${book_id},联系方式：${phone}，请尽快处理.`
    }

    transporter.sendMail(receiverone, (error, info) => {
      transporter.close()
    })

    transporter.sendMail(receivertwo, (error, info) => {
      transporter.close()
    })

  })
})

app.listen(7899, () => {
  console.log('server is runing at 7899')
})

function getClientIp(req) {
  return req.headers['x-forwarded-for'] ||
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress ||
    '';
}
