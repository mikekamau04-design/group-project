const multer = require("multer");
const path = require("path");

// Storage Configuration
const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, "uploads/products");
    },

    filename: function (req, file, cb) {

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1E9) +
            path.extname(file.originalname);

        cb(null, uniqueName);
    }

});

// File Filter
const fileFilter = (req, file, cb) => {

    const allowed = /jpg|jpeg|png|webp/;

    const extension = allowed.test(
        path.extname(file.originalname).toLowerCase()
    );

    const mime = allowed.test(file.mimetype);

    if (extension && mime) {
        cb(null, true);
    } else {
        cb(new Error("Only JPG, PNG and WEBP images are allowed."));
    }

};

// Upload Configuration
const upload = multer({

    storage,

    fileFilter,

    limits: {
        fileSize: 5 * 1024 * 1024
    }

});

module.exports = upload;