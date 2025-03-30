const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const Usersf = require("./models/user");
require("dotenv").config();
const flash = require("connect-flash");
const session = require("express-session");
const { generateToken, verifyToken } = require("./middleware/isloggedin.js");
const cookieParser = require("cookie-parser");

const LoanApplication = require('./models/loan_application');

const admindata = require("./models/admindata");
const app = express();
app.use(cors());
app.use(cookieParser());

// ✅ Setup session middleware before flash()
app.use(
    session({
        secret: "your_secret_key",
        resave: false,
        saveUninitialized: true
    })
);
app.use(flash());

// ✅ Pass flash messages to every route
app.use((req, res, next) => {
    res.locals.messages = req.flash();
    next();
});

// ✅ Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/Usersf", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.log("MongoDB Connection Error:", err));

// ✅ Set up middleware
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // ✅ Needed for JSON body parsing

// ✅ Render Homepage (Verify Token)
app.get("/help",verifyToken,  (req, res) => {
    const user = req.user;
    if(user){
        res.render("post_help", { user: req.user });
    }
    else{
        res.render("help");
    }
});
app.get("/user/upload",verifyToken, (req, res) => {
    const user = req.user;
    if(user){
        res.render("post_upload", { user: req.user });
    }
    else{
        res.render("login")
    }
});
app.get("/login", (req, res) => res.render("login"));
app.get("/about",verifyToken, (req, res) => {
    const user = req.user;
    if(user){
        res.render("post_about", { user: req.user });
    }
    else{
        res.render("about")
    }
});
//app.get("/logout", (req,res) => res.redirect("/login"));

app.get("/", verifyToken,(req, res) => {
    const user = req.user;
    if(user){
        res.render("post_index",{user:req.user});
    }
    else{
        res.render("index");
    }
});
app.get("/logout", (req, res) => {
    res.clearCookie("token"); // ✅ Remove JWT Cookie
    req.session.destroy((err) => { // ✅ Destroy session (if any)
        if (err) {
            console.error("Session destruction error:", err);
            return res.redirect("/");
        }
        res.redirect("/login"); // ✅ Redirect to login page after logout
    });
});

// ✅ Register Route (Create & Send JWT Token)
app.post("/register", async (req, res) => {
    try {
        const { username, email, password, age, gender } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new Usersf({ username, email, password: hashedPassword, age, gender });
        await newUser.save();

        const token = generateToken(newUser);

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // ✅ Secure in production
            maxAge: 2 * 60 * 60 * 1000, // ✅ 2 hours expiry
        });

        req.flash("welcome", "Welcome to the site!");
        //res.json({ message: "User registered successfully", token }); // ✅ Send JWT to frontend
        res.render("post_index",{user:newUser});

    } catch (error) {
        res.status(500).json({ error: "Error registering user" });
    }
});

// ✅ Login Route (Authenticate & Send JWT Token)
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await Usersf.findOne({ email });

        if (!user) {
            req.flash("error", "User not found");
            return res.status(401).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            req.flash("error", "Invalid credentials");
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // ✅ Generate JWT Token
        const token = generateToken(user);

        // ✅ Set the token as a cookie (HTTP-only for security)
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // ✅ Secure in production
            maxAge: 2 * 60 * 60 * 1000, // ✅ 2 hours expiry
        });

        req.flash("welcome", `Welcome back, ${user.username}!`);
        res.redirect("/"); // ✅ Redirect without `{ token }`
    } catch (error) {
        res.status(500).json({ error: "Error logging in" });
    }
});



app.post('/submit-loan', async (req, res) => {
    try {
        const { userName, email, loanAmount, installment, annualIncome, panCard, homeOwnership, loanPurpose } = req.body;
        
        // Store borrower details in MongoDB
        const newApplication = new LoanApplication({
            userName,
            email,
            loanAmount,
            installment,
            annualIncome,
            panCard,
            homeOwnership,
            loanPurpose
        });

        await newApplication.save();
        res.redirect('/');  // Redirect to success page

    } catch (error) {
        console.error('Error submitting loan application:', error);
        res.status(500).send('Server Error');
    }
});




app.get('/admin/1122', async (req, res) => {
    try {
        // Fetch all loan applications from the database
        const applications = await LoanApplication.find();
        console.log("Fetched Applications:", applications);

        // Render the admin panel and pass required data
        res.render('adminPanel', { 
            applications: applications || [], 
            user: req.session && req.session.user ? req.session.user : null 
        });

    } catch (error) {
        console.error('Error fetching loan applications:', error);
        res.status(500).send('Internal Server Error');
    }
});





app.post("/adminsubmit", async (req, res) => {
    try {
      
        console.log(req.body);
        req.body.loanTerm = parseInt(req.body.loanTerm);
        const newAdminEntry = new admindata(req.body);
        console.log(newAdminEntry);
        await newAdminEntry.save();
        const applications = await LoanApplication.find();
        console.log("Fetched Applications:", applications);

        // Render the admin panel and pass required data
        res.render('adminPanel', { 
            applications: applications || [], 
            user: req.session && req.session.user ? req.session.user : null 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



// ✅ Start Server
app.listen(3000, () => console.log("App is listening on port 3000"));
