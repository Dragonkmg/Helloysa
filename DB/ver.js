const db = require("./database");

db.all("PRAGMA table_info(produtos);", (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log(rows);
    }
});