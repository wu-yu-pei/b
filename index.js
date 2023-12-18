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
  const ip = getClientIp(req)

  connection.query("SELECT * FROM books ORDER BY level DESC", async (err, result) => {

    res.send({ code: 200, data: result })
    // 如果有 就不用插入数据库
    connection.query("SELECT * FROM logs WHERE ip = ?", [ip], (err, result) => {
      if (result.length) {
        return;
      } else {
        // 插入记录 发送通知
        connection.execute("INSERT INTO logs (ip, create_date, update_date) VALUES (?, ?, ?)", [ip, new Date(), new Date()], (err, result) => {
          const receiver = {
            from: `495174699@qq.com`,
            subject: '来访通知(可忽略)',
            to: '495174699@qq.com',
            html: `ip->${ip},来访`
          }

          transporter.sendMail(receiver, (error, info) => {
            transporter.close()
          })
        })
      }
    })

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
      from: `495174699@qq.com`,
      subject: '购买通知',
      to: '495174699@qq.com',
      html: `ip->${ip},掘金小册->${book_id},联系方式->${phone}，请尽快处理.`
    }

    const receivertwo = {
      from: `495174699@qq.com`,
      subject: '购买通知',
      to: '2456635159@qq.com',
      html: `ip->${ip},掘金小册->${book_id},联系方式->${phone}，请尽快处理.`
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
