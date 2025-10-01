require("dotenv").config()
//to download nodejs go to nodejs.org and download the latest version
//do npm install express to install express
//do const express=require("express") to load express in
//do npm init -y to install default values which is ur package.json file
//to start server in terminal do node clean/clean.js 
//to automatically update your server  changes instead of turning the server on and off 
// on save do npm install nodemon and go 
// to your package.json go to scripts and make a new object and do "dev": "nodemon clean.js"
//get is retriving data post is sending data like submitting a form 
// after you created your nodemon object do npm run dev in terminal to actiavte nodemon
//do npm install ejs and you got to make a folder called views to store your ejs files
//in order to target css files in your ejs files you do myserverr.use(express.static("yourcssfile"))
//in order to grab submitted information you do myserverr.use(express.urlencoded({extended:false}))
//when you do that it makes it so now you can use req and res to grab information
//to download sql you do npm install better-sqlite3
//to download bcrypt do npm install bcrypt
//to download jsonwebtoken do npm install jsonwebtoken
//to create your JWTSECRET token create a file called .env (make sure its a accessible folder)

const jwt= require("jsonwebtoken")
const marked = require("marked")
const sanitizeHTML = require('sanitize-html')
const bcrypt = require("bcrypt")
const cookieParser =  require("cookie-parser")
const express=require("express")    
db=require("better-sqlite3")("ourServerr.db")
db.pragma("journal_mode = WAL")

const createTables= db.transaction(()=>{
    db.prepare(`
        CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY  KEY AUTOINCREMENT, 
        username STRING NOT NULL UNIQUE,
        password STRING NOT NULL 
        )`
    ).run()

    
    db.prepare(`CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        createdDate TEXT, 
        title STRING NOT NULL,
        body TEXT NOT NULL,
        authorid INTEGER,
        FOREIGN KEY (authorid) REFERENCES users (id)
        )`).run()
})

createTables()




const myserverr=express()


myserverr.set("view engine", "ejs")
myserverr.use(express.urlencoded({extended: false}))
myserverr.use(express.static("public"))
myserverr.use(cookieParser())



myserverr.use(function (req, res, next ){
    res.locals.errors = []
// make our markdown function avalable

    res.locals.filterUserMessages= function(content){
        return sanitizeHTML(marked.parse(content), {
            allowedTags:["p", "br", "ul", "ul", "li", "i"],
            allowwedAttributs:{}
        })
    }
    try{
        const decoded = jwt.verify(req.cookies.ourSimpleServerr, process.env.JWTSECRET)
        req.user = decoded
    } catch (err){
        req.user = false
    }

    res.locals.user = req.user 
    console.log(req.user)
    next()
})


myserverr.get("/",(req, res)=>{
if(req.user) {
    const postsStatement = db.prepare("SELECT * FROM posts WHERE authorid = ? ORDER BY createdDate DESC")
    const posts = postsStatement.all(req.user.userid)
  return  res.render ("dashboard", {posts})
}

res.render("homeee")
})


myserverr.get("/", (req, res)=>{
    res.render("homeee")
})

myserverr.get("/login", (req, res)=>{
    res.render("login")
})


myserverr.get("logout",(req,res)=>{
    res.render("login")
})


myserverr.get("/logout",(req,res)=>{
    res.clearCookie("ourSimpleServerr")
    res.redirect("/")
})

myserverr.post("/login",(req,res)=>{
    let errors= []
    
    if(typeof req.body.username !== "string") req.body.username = ""
    if(typeof req.body.password !== "string") req.body.password = ""

    if (req.body.username.trim() =="") errors=[("Invalid usernmae/password")]
    if (req.body.password    == "") errors= [("Invalid username / password")]

        if(errors.length){
            return res.render ("login", {errors})
        }


  const userInQuestionStatement = db.prepare("SELECT * FROM users WHERE USERNAME = ?")
  const userInQuestion = userInQuestionStatement.get(req.body.username)

  if(!userInQuestion ){
    errors= ["Invalid username/password"]
   return res.render("login", {errors}) 
  }

  const matchOrNot = bcrypt.compareSync(req.body.password, userInQuestion.password)
  if(!matchOrNot){

      errors= ["Invalid username/password"]
   return res.render("login", {errors })
  }


const ourTokenValue = jwt.sign({exp: Math.floor(Date.now()/1000) + 60 * 60 * 22, skyColor: "blue", userid: userInQuestion.id, username: userInQuestion.username},
 process.env.JWTSECRET)


res.cookie ("ourSimpleServerr", ourTokenValue, {
    httpOnly:true,
    secure:true,
    sameSite:"strict",
    maxAge: 1000 * 60 * 60 * 1

})
res.redirect("/")

})

function mustBeLoggedIn(req, res,next){
if (req.user){
    return next()
}
return res.redirect("/")
}


myserverr.get("/create-post", mustBeLoggedIn, (req, res)=>{


res.render("create-post")
})

function sharedPostValidation(req){
const errors=[]

if(typeof req.body.title !== "string") req.body.title=""
if(typeof req.body.body !== "string") req.body.body=""

//trim sanitize or strip out html

req.body.title = sanitizeHTML(req.body.title.trim(),  {allowedTags: [], allowedAttributes: {}})
req.body.body = sanitizeHTML(req.body.body.trim(),  {allowedTags: [], allowedAttributes: {}})


if (!req.body.title) errors.push("you must provide a title")
if (!req.body.body) errors.push("you must provide content")
return errors
}

myserverr.get("/edit-post/:id", mustBeLoggedIn, (req,res)=>{
    //try to look up the post in question
    const statement = db.prepare("SELECT * FROM posts WHERE id = ?")
    const post = statement.get(req.params.id)

    if(!post){
        return res.redirect("/")
    }
    //if youre not the author redirect to home
    if(post.authorid !== req.user.userid){
        return redirect("/")
    }
    //otherwise render the edit post template
    res.render("edit-post", {post})
})





myserverr.post("/edit-post/:id", mustBeLoggedIn, (req, res)=>{

        //try to look up the post in question
    const statement = db.prepare("SELECT * FROM posts WHERE id = ?")
    const post = statement.get(req.params.id)

    if(!post){
        return res.redirect("/")
    }
    //if youre not the author redirect to home
    if(post.authorid !== req.user.userid){ 
    }
    const errors = sharedPostValidation(req)
    if(errors.length){
        return res.render("edit-post", {errors})
    }

    const updateStatement = db.prepare("UPDATE posts SET title = ?, body = ? WHERE id = ?")

    updateStatement.run(req.body.title, req.body.body, req.params.id)

    res.redirect(`/post/${req.params.id}`)
})

myserverr.post("/delete-post/:id",mustBeLoggedIn, (req, res)=>{

     //try to look up the post in question
    const statement = db.prepare("SELECT * FROM posts WHERE id = ?")
    const post = statement.get(req.params.id)

    if(!post){
        return res.redirect("/")
    }
    //if youre not the author redirect to home
    if(post.authorid !== req.user.userid){
        return redirect("/")
    }

    const deleteStatement = db.prepare("DELETE FROM posts WHERE id = ?")
    deleteStatement.run(req.params.id)

    res.redirect("/")
})


myserverr.get("/post/:id",(req, res)=>{
const statement=db.prepare("SELECT posts.*, users.username FROM posts INNER JOIN users ON posts.authorid = users.id WHERE posts.id = ?")
const post = statement.get(req.params.id)

if(!post){
    return res.redirect("/")
}

    const isAuthor = post.authorid === req.user.userid


res.render("single-post",  { post, isAuthor })

})



myserverr.post("/create-post", mustBeLoggedIn,(req,res)=>{
const errors=sharedPostValidation(req)


if(errors.length){
    return res.render("create-post", {errors})  
}


const ourStatement = db.prepare("INSERT INTO posts (title, body, authorid, createdDate) VALUES (?, ?, ?, ?)")
const result = ourStatement.run(req.body.title, req.body.body, req.user.userid, new Date().toISOString())


const getPostStatement = db.prepare("SELECT * FROM posts WHERE ROWID = ?")
const realPost = getPostStatement.get(result.lastInsertRowid)

res.redirect(`/post/${realPost.id}`)
})  



myserverr.post("/register",(req, res)=>{
const errors=[]


if (typeof req.body.username !== "string") req.body.username =""
if (typeof req.body.password !== "string") req.body.password =""

req.body.username = req.body.username.trim()

if (!req.body.username) errors.push("You must provide a username")
if (req.body.username && req.body.username.length < 3) errors.push("Username must be longer than three characters")
if (req.body.username && req.body.username.length > 30) errors.push("Username cannot exceed 10 characters")
if (req.body.username && !req.body.username.match(/^[a-zA-Z0-9]+$/)) errors.push("Username can only contain letters and numbers")

//check if username exists already

 const usernameStatement = db.prepare("SELECT * FROM users WHERE username = ?")
 const usernameCheck=usernameStatement.get(req.body.username)

 if(usernameCheck) errors.push("that username is already taken")

    if (!req.body.password) errors.push("You must provide a password")
if (req.body.password && req.body.password.length < 3) errors.push("password must be longer than three characters")
if (req.body.password && req.body.password.length > 30) errors.push("password cannot exceed 10 characters")
if (errors.length) {    
    return res.render("homeee", {errors})
} 
//saves newer users into database

const salt = bcrypt.genSaltSync(10)
req.body.password = bcrypt.hashSync(req.body.password, salt)


const ourStatement = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)")
const result = ourStatement.run(req.body.username, req.body.password)

const lookupStatement = db.prepare("SELECT * FROM users WHERE ROWID = ?")
const ourUser = lookupStatement.get(result.lastInsertRowid)

//log the user in by giving them a cookie
const ourTokenValue = jwt.sign({exp: Math.floor(Date.now()/1000) + 60 * 60 * 22, skyColor: "blue", userid: ourUser.id, username: ourUser.username},
 process.env.JWTSECRET)


res.cookie ("ourSimpleServerr", ourTokenValue, {
    httpOnly:true,
    secure:true,
    sameSite:"strict",
    maxAge: 1000 * 60 * 60 * 1

})
res.redirect("/")

})


const PORT = process.env.PORT || 1010
myserverr.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})