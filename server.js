const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");

const app = express();
const PORT = 5000;

/* =========================
MIDDLEWARE
========================= */

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(__dirname));

/* =========================
UPLOADS FOLDER
========================= */

if (!fs.existsSync("uploads")) {
fs.mkdirSync("uploads");
}

app.use("/uploads", express.static("uploads"));

/* =========================
MONGODB
========================= */

mongoose.connect(
process.env.MONGO_URI || "mongodb+srv://zarakhan3860_db_user:nbwmGNUf390zFDOx@cluster0.audmffx.mongodb.net/"
)
.then(() => {
console.log("✅ MongoDB Connected");
})
.catch(err => {
console.log("MongoDB Error:", err);
});

/* =========================
BLOG SCHEMA
========================= */

const blogSchema = new mongoose.Schema({
title: {
type: String,
required: true
},

author: {
    type: String,
},

category: {
    type: String,
    enum: ["Blog", "Publication"],
    default: "Blog"
},

content: {
    type: String,
    required: true
},
slug: {
    type: String,
    unique: true,
    required: true
},

author: {
    type: String,
    
},

content: {
    type: String,
    required: true
},

image: {
    type: String,
    default: null
},

createdAt: {
    type: Date,
    default: Date.now
}


});

const Blog = mongoose.model("Blog", blogSchema);

/* =========================
MULTER
========================= */

const storage = multer.diskStorage({


destination: (req, file, cb) => {
    cb(null, "uploads/");
},

filename: (req, file, cb) => {

    const uniqueName =
        Date.now() +
        "-" +
        file.originalname.replace(/\s+/g, "-");

    cb(null, uniqueName);
}


});

const upload = multer({ storage });

/* =========================
HOME
========================= */

app.get("/", (req, res) => {
res.sendFile(
path.join(__dirname, "blog.html")
);
});

/* =========================
CREATE BLOG
========================= */

app.post(
"/create-blog",
upload.single("image"),
async (req, res) => {


    try {

        const slug = req.body.title
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9 ]/g, "")
            .replace(/\s+/g, "-");

        const existingBlog =
            await Blog.findOne({ slug });

        if (existingBlog) {

            return res.status(400).json({
                success: false,
                message: "Blog title already exists"
            });

        }

const blog = new Blog({
    title: req.body.title,
    slug,
    author: req.body.author,
    category: req.body.category,
    content: req.body.content,
    image: req.file
        ? req.file.filename
        : null
});

        await blog.save();

        res.json({
            success: true,
            message: "Blog Published Successfully",
            slug,
            blog
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }

}


);

/* =========================
ALL BLOGS
========================= */

app.get("/blogs", async (req, res) => {

    try {

        const filter = {};

        if (req.query.category) {
            filter.category = req.query.category;
        }

        const blogs = await Blog.find(filter)
            .sort({ createdAt: -1 });

        res.json(blogs);

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false
        });

    }

});

/* =========================
BLOG BY SLUG
========================= */

app.get("/blog/:slug", async (req, res) => {


try {

    const blog =
        await Blog.findOne({
            slug: req.params.slug
        });

    if (!blog) {

        return res.status(404).json({
            success: false,
            message: "Blog not found"
        });

    }

    res.json(blog);

} catch (err) {

    console.log(err);

    res.status(500).json({
        success: false
    });

}


});

/* =========================
BLOG BY ID
========================= */

app.get("/blog/id/:id", async (req, res) => {


try {

    const blog =
        await Blog.findById(
            req.params.id
        );

    if (!blog) {

        return res.status(404).json({
            success: false
        });

    }

    res.json(blog);

} catch (err) {

    console.log(err);

    res.status(500).json({
        success: false
    });

}


});

/* =========================
UPDATE BLOG
========================= */

app.put(
"/blog/:id",
upload.single("image"),
async (req, res) => {


    try {

        const blog =
            await Blog.findById(
                req.params.id
            );

        if (!blog) {

            return res.status(404).json({
                success: false,
                message: "Blog not found"
            });

        }

        const slug = req.body.title
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9 ]/g, "")
            .replace(/\s+/g, "-");

const updateData = {
    title: req.body.title,
    slug,
    author: req.body.author,
    category: req.body.category,
    content: req.body.content
};

        if (req.file) {

            if (blog.image) {

                const oldImage =
                    path.join(
                        __dirname,
                        "uploads",
                        blog.image
                    );

                if (
                    fs.existsSync(
                        oldImage
                    )
                ) {
                    fs.unlinkSync(
                        oldImage
                    );
                }

            }

            updateData.image =
                req.file.filename;

        }

        const updatedBlog =
            await Blog.findByIdAndUpdate(
                req.params.id,
                updateData,
                { new: true }
            );

        res.json({
            success: true,
            message:
                "Blog Updated Successfully",
            blog: updatedBlog
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }

}


);

/* =========================
DELETE BLOG
========================= */

app.delete(
"/blog/:id",
async (req, res) => {


    try {

        const blog =
            await Blog.findById(
                req.params.id
            );

        if (!blog) {

            return res.status(404).json({
                success: false,
                message: "Blog not found"
            });

        }

        if (blog.image) {

            const imagePath =
                path.join(
                    __dirname,
                    "uploads",
                    blog.image
                );

            if (
                fs.existsSync(
                    imagePath
                )
            ) {
                fs.unlinkSync(
                    imagePath
                );
            }

        }

        await Blog.findByIdAndDelete(
            req.params.id
        );

        res.json({
            success: true,
            message:
                "Blog Deleted Successfully"
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }

}


);

/* =========================
STATS
========================= */

app.get("/stats", async (req, res) => {


try {

const totalBlogs = await Blog.countDocuments({
    category: "Blog"
});

const totalPublications = await Blog.countDocuments({
    category: "Publication"
});

res.json({
    totalBlogs,
    totalPublications
});

} catch (err) {

    res.status(500).json({
        success: false
    });

}


});

/* =========================
SERVER
========================= */

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
