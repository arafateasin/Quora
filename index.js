const express = require('express');
const session = require('express-session'); // Import express-session
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // Import uuid for unique ID generation
const app = express();
const port = process.env.PORT || 8080;
const sessionSecret = process.env.SESSION_SECRET || 8080; // Default fallback if not set

app.use(session({
    secret: sessionSecret, // Use environment variable for session secret
    resave: false,
    saveUninitialized: true,
}));




app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Set up session middleware
app.use(session({
    secret: 'your-secret-key', // Change this to a strong secret
    resave: false,
    saveUninitialized: true,
}));

// Initialize posts with some default values
let posts = [
    {
        id: uuidv4(),
        username: "Arafat Easin",
        title: "What is Data Structures and Algorithms (DSA) in Java, and Why is It Important?",
        content: "Data Structures and Algorithms (DSA) are the foundation of problem-solving in programming. Java is a great choice for DSA due to its rich libraries and object-oriented features. By mastering concepts like arrays, trees, and sorting algorithms, you can write efficient code and ace technical interviews. Start practicing on platforms like LeetCode and HackerRank. Remember, consistent practice is the key to mastering DSA!",
        upvotes: 0,
        upvoters: [],
        comments: []
    },
    {
        id: uuidv4(),
        username: "Istiak Niloy",
        title: "Getting Started with Blockchain Development?",
        content: "Blockchain development is the backbone of decentralized applications (dApps) and cryptocurrencies like Bitcoin and Ethereum. It involves creating secure, transparent, and immutable systems using distributed ledger technology. Key skills include understanding smart contracts, blockchain platforms (e.g., Ethereum, Hyperledger), and programming languages like Solidity and Python. Dive into tools like Remix and frameworks like Truffle to start building your first blockchain application. With growing adoption, blockchain development offers immense career opportunities in industries like finance, healthcare, and supply chain!",
        upvotes: 0,
        upvoters: [],
        comments: []
    },
    {
        id: uuidv4(),
        username: "Fuad",
        title: "Exploring the World of Generative AI?",
        content: "Generative AI is a revolutionary field of artificial intelligence that creates new content like text, images, music, and even videos. It uses advanced models like GANs (Generative Adversarial Networks) and transformers (e.g., GPT) to generate realistic outputs. Applications range from creative industries to gaming, personalized marketing, and content creation. Tools like DALL·E and ChatGPT are prime examples of generative AI in action. As this technology evolves, it’s reshaping innovation and creativity across industries!",
        upvotes: 0,
        upvoters: [],
        comments: []
    }
];

// Load users from JSON file
function loadUsers() {
    const data = fs.readFileSync('users.json');
    return JSON.parse(data);
}

// Save users to JSON file
function saveUsers(users) {
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
}

// Render posts
app.get("/posts", (req, res) => {
    const loggedInUser  = req.session.user; // Get the logged-in user from the session
    res.render("index.ejs", { posts, user: loggedInUser  }); // Pass the user to the template
});

// Render new post form
app.get("/posts/new", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login"); // Redirect to login if not logged in
    }
    res.render("new.ejs");
});

// Handle new post submission
app.post("/posts", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login"); // Redirect to login if not logged in
    }

    let { title, content } = req.body;
    const username = req.session.user.username; // Get the username from the session
    const newPost = { id: uuidv4(), username, title, content, upvotes: 0, upvoters: [], comments: [] }; // Ensure upvoters is initialized
    posts.push(newPost); // Add the new post to the posts array
    res.redirect("/posts"); // Redirect to the posts page
});

// Render post details
app.get("/posts/:id", (req, res) => {
    const { id } = req.params;
    const post = posts.find(p => p.id === id); // Find the post by ID

    if (!post) {
        return res.status(404).send("Post not found");
    }

    res.render("postDetail.ejs", { post, user: req.session.user }); // Pass the post and user to the detail view
});

// Handle search requests
app.get("/search", (req, res) => {
    const query = req.query.query.toLowerCase(); // Get the search query and convert to lowercase
    const filteredPosts = posts.filter(post => 
        post.username.toLowerCase().includes(query) || 
        post.title.toLowerCase().includes(query)
    );

    res.render("index.ejs", { posts: filteredPosts, user: req.session.user }); // Render the index page with filtered posts
});

// Handle comment submission
app.post("/posts/:id/comment", (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    const post = posts.find(p => p.id === id);

    if (!post) {
        return res.status(404).send("Post not found");
    }

    // Add comment to the post
    post.comments.push({ username: req.session.user.username, content });
    res.redirect(`/posts/${id}`); // Redirect to the post details page
});

// Handle upvote
app.post("/posts/:id/upvote", (req, res) => {
    const { id } = req.params;
    const post = posts.find(p => p.id === id);

    if (!post) {
        return res.status(404).send("Post not found");
    }

    // Increment upvote count
    post.upvotes += 1;
    res.redirect(`/posts/${id}`); // Redirect to the post details page
});

// Render edit post form
app.get("/posts/:id/edit", (req, res) => {
    const { id } = req.params;
    const post = posts.find(p => p.id === id);

    // Check if the post exists and if the logged-in user is the owner
    if (!post || post.username !== req.session.user.username) {
        return res.status(403).send("You are not authorized to edit this post");
    }

    // Pass the post and user to the edit form
    res.render("editPost.ejs", { post, user: req.session.user });
});

// Handle post update
app.post("/posts/:id/edit", (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    const post = posts.find(p => p.id === id);

    // Check if the post exists and if the logged-in user is the owner
    if (!post || post.username !== req.session.user.username) {
        return res.status(403).send("You are not authorized to edit this post");
    }

    // Update the post details
    post.title = title;
    post.content = content;
    res.redirect(`/posts/${id}`); // Redirect to the post details page
});

// Handle post deletion
app.post("/posts/:id/delete", (req, res) => {
    const { id } = req.params;
    const postIndex = posts.findIndex(p => p.id === id);

    // Check if the post exists
    if (postIndex === -1) {
        return res.status(404).send("Post not found");
    }

    // Check if the logged-in user is the owner of the post
    if (posts[postIndex].username !== req.session.user.username) {
        return res.status(403).send("You are not authorized to delete this post");
    }

    // Remove the post from the array
    posts.splice(postIndex, 1);
    res.redirect("/posts"); // Redirect to the posts page after deletion
});

// Handle upvote
app.post("/posts/:id/upvote", (req, res) => {
    const { id } = req.params;
    const post = posts.find(p => p.id === id);
    const username = req.session.user.username; // Get the username from the session

    if (!post) {
        return res.status(404).send("Post not found");
    }

    // Check if the user has already upvoted
    if (post.upvoters.includes(username)) {
        return res.status(400).send("You have already upvoted this post");
    }

    // Increment upvote count and add user to upvoters
    post.upvotes += 1;
    post.upvoters.push(username); // Add the user to the upvoters array
    res.redirect(`/posts/${id}`); // Redirect to the post details page
});

// Render signup form
app.get("/signup", (req, res) => {
    res.render("signup.ejs");
});

// Handle signup form submission
app.post("/signup", (req, res) => {
    const { username, password } = req.body;
    const users = loadUsers();

    // Check if user already exists
    const userExists = users.find(user => user.username === username);
    if (userExists) {
        return res.status(400).send("User  already exists");
    }

    // Add new user with a unique ID
    const newUser  = { id: uuidv4(), username, password }; // Generate a unique ID
    users.push(newUser );
    saveUsers(users);
    res.redirect("/login");
});

// Render login form
app.get("/login", (req, res) => {
    res.render("login.ejs");
});

// Handle login form submission
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const users = loadUsers();

    // Check if user exists and password matches
    const user = users.find(user => user.username === username && user.password === password);
    if (user) {
        // Set user session
        req.session.user = user;
        return res.redirect("/posts");
    }

    res.status(401).send("Invalid username or password");
});

// User profile route
app.get("/users/:username", (req, res) => {
    const { username } = req.params;
    const userPosts = posts.filter(post => post.username === username); // Filter posts by username
    const loggedInUser  = req.session.user; // Get the logged-in user from the session
    res.render("userProfile.ejs", { username, userPosts, user: loggedInUser  }); // Pass the username, posts, and user to the template
});

// Logout route
app.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect("/posts");
        }
        res.redirect("/login");
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
