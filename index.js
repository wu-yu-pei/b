const express = require("express")
const mysql = require('mysql2');
const cors = require("cors")
const nodemailer = require('nodemailer');
const { default: axios } = require("axios");


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
app.use(express.static('public'))

const connection = mysql.createConnection({
  host: '192.210.232.179',
  user: 'root',
  password: "19781209Fhl",
  database: 'juejin'
});

app.get("/books", async (req, res) => {
  const device = req.headers["user-agent"]
  const ip = toIpv4(getClientIp(req))
  // 拉黑处理
  const isBlack = await execQuery("select ip from black_list where ip = ?", [ip])

  if (isBlack.length) {
    res.send({ code: 401, msg: "您已被禁用" })
    return
  }

  connection.query("SELECT * FROM books where status = 1 ORDER BY level DESC", async (err, result) => {

    res.send({ code: 200, data: result })

    // 来访记录
    connection.query("SELECT * FROM logs WHERE ip = ?", [ip], async (err, result) => {
      if (result.length) {
        // 如果有 更新次数
        +new Date(result[0].update_date) < +new Date() - (1000 * 60 * 5) ? connection.execute("UPDATE logs SET count = ?, update_date = ? WHERE ip = ?", [result[0].count + 1, new Date(), ip]) : ""
        return;
      } else {

        // 位置信息
        const { data: { province, city } } = await getPosition(ip)

        // 插入记录 发送通知
        connection.execute("INSERT INTO logs (ip, create_date, update_date) VALUES (?, ?, ?)", [ip, new Date(), new Date()], (err, result) => {
          const receiver = {
            from: `495174699@qq.com`,
            subject: '来访通知(可忽略)',
            to: '495174699@qq.com',
            html: `
            ip->${ip},来访!
            device->${device}
            位置:prov:${province},city:${city}
            `
          }

          transporter.sendMail(receiver, (error, info) => {
            transporter.close()
          })

          const receiver2 = {
            from: `495174699@qq.com`,
            subject: '来访通知(可忽略)',
            to: '1376522644@qq.com',
            html: `
            ip->${ip},来访!
            device->${device}
            位置:prov:${province},city:${city}
            `
          }

          transporter.sendMail(receiver2, (error, info) => {
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

app.get("/leave", (req, res) => {
  const { time = 0 } = req.query
  const ip = toIpv4(getClientIp(req))
  connection.execute("UPDATE logs SET time = ? WHERE ip = ?", [time + 's', ip])
  console.log(time)
  res.send({ code: 200, success: 'ok' })
})

app.post("/submit", (req, res) => {
  const { book_id, phone } = req.body
  const ip = toIpv4(getClientIp(req))
  console.log('get---', ip);
  connection.execute("INSERT INTO users (phone, book_id, create_date, update_date) VALUES (?, ?, ?, ?)", [phone, book_id, new Date(), new Date()], (err, result) => {
    res.send({ code: 200, success: 200 })

    // update log user
    connection.execute("UPDATE logs SET user = ? WHERE ip = ?", [phone, ip])

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


function execQuery(sql, params) {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

// ipv4 或者 ipv6 转为 ipv4
function toIpv4(ip) {
  return ip.split(':').pop()
}

function getPosition(ip) {
  return axios.get(`https://restapi.amap.com/v3/ip?ip=${ip}&output=json&key=abfe7ea197193f191952ddc71eae19cb`)
}