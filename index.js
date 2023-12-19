const express = require("express")
const mysql = require('mysql2');
const cors = require("cors")
const nodemailer = require('nodemailer')
const exec = require('child_process').exec

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

app.get("/books", async (req, res) => {
  const ip = getClientIp(req)

  // 拉黑处理
  const isBlack = await execQuery("select ip from black_list where ip = ?", [ip])

  if (isBlack.length) {
    res.send({ code: 200, msg: "您已被禁用" })
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
        const { prov, city, district, lat, lng } = await getPosition(toIpv4(ip))

        // 插入记录 发送通知
        connection.execute("INSERT INTO logs (ip, create_date, update_date) VALUES (?, ?, ?)", [ip, new Date(), new Date()], (err, result) => {
          const receiver = {
            from: `495174699@qq.com`,
            subject: '来访通知(可忽略)',
            to: '495174699@qq.com',
            html: `
            ip->${ip},来访!
            位置:
            prov:${prov}
            city:${city}
            district:${district}
            lng&lat:${lng},${lat}
            位置查询:http://jingweidu.757dy.com/
            `
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

app.get("/leave", (req, res) => {
  const { time = 0 } = req.query
  const ip = getClientIp(req)
  connection.execute("UPDATE logs SET time = ? WHERE ip = ?", [time + 's', ip])
  console.log(time)
  res.send({ code: 200, success: 'ok' })
})

app.post("/submit", (req, res) => {
  const { book_id, phone } = req.body
  const ip = getClientIp(req)
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

var base = new Base64();

function Base64() {
  _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  this.encode = function (c) {
    var a = "";
    var k, h, f, j, g, e, d;
    var b = 0;
    c = _utf8_encode(c);
    while (b < c.length) {
      k = c.charCodeAt(b++);
      h = c.charCodeAt(b++);
      f = c.charCodeAt(b++);
      j = k >> 2;
      g = ((k & 3) << 4) | (h >> 4);
      e = ((h & 15) << 2) | (f >> 6);
      d = f & 63;
      if (isNaN(h)) {
        e = d = 64;
      } else {
        if (isNaN(f)) {
          d = 64;
        }
      }
      a = a + _keyStr.charAt(j) + _keyStr.charAt(g) + _keyStr.charAt(e) + _keyStr.charAt(d);
    }
    return a;
  };
  this.decode = function (c) {
    var a = "";
    var k, h, f;
    var j, g, e, d;
    var b = 0;
    c = c.replace(/[^A-Za-z0-9\+\/\=]/g, "");
    while (b < c.length) {
      j = _keyStr.indexOf(c.charAt(b++));
      g = _keyStr.indexOf(c.charAt(b++));
      e = _keyStr.indexOf(c.charAt(b++));
      d = _keyStr.indexOf(c.charAt(b++));
      k = (j << 2) | (g >> 4);
      h = ((g & 15) << 4) | (e >> 2);
      f = ((e & 3) << 6) | d;
      a = a + String.fromCharCode(k);
      if (e != 64) {
        a = a + String.fromCharCode(h);
      }
      if (d != 64) {
        a = a + String.fromCharCode(f);
      }
    }
    a = _utf8_decode(a);
    return a;
  };
}

_utf8_encode = function (b) {
  b = b.replace(/\r\n/g, "\n");
  var a = "";
  for (var e = 0; e < b.length; e++) {
    var d = b.charCodeAt(e);
    if (d < 128) {
      a += String.fromCharCode(d);
    } else {
      if ((d > 127) && (d < 2048)) {
        a += String.fromCharCode((d >> 6) | 192);
        a += String.fromCharCode((d & 63) | 128);
      } else {
        a += String.fromCharCode((d >> 12) | 224);
        a += String.fromCharCode(((d >> 6) & 63) | 128);
        a += String.fromCharCode((d & 63) | 128);
      }
    }
  }
  return a;
};

_utf8_decode = function (a) {
  var b = "";
  var d = 0;
  var e = c1 = c2 = 0;
  while (d < a.length) {
    e = a.charCodeAt(d);
    if (e < 128) {
      b += String.fromCharCode(e);
      d++;
    } else {
      if ((e > 191) && (e < 224)) {
        c2 = a.charCodeAt(d + 1);
        b += String.fromCharCode(((e & 31) << 6) | (c2 & 63));
        d += 2;
      } else {
        c2 = a.charCodeAt(d + 1);
        c3 = a.charCodeAt(d + 2);
        b += String.fromCharCode(((e & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
        d += 3;
      }
    }
  }
  return b;
};

function getPosition(ip) {
  return new Promise((resolve, reject) => {
    // 计算位置
    exec(`curl -H "X-Forwarded-For:${ip}" https://chaipip.com/aiwen.html`, (error, stdout, stderr) => {
      if (error) [
        reject(error)
      ]

      const result = stdout.match(/级别\r\n(.*)\r\n"(.*)"\.slice\((\d*)\);/)
      const str = result[2]
      const len = result[3]
      const __res = JSON.parse('' + base.decode(str.slice(len)));
      resolve(__res[0])
    })
  })
}