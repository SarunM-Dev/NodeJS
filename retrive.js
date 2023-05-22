const fs = require("fs");
fs.readFile("./objectcreation.json", "utf-8", (err, data) => {
  if (err) {
    throw err;
  }
  console.log(data);
  const shirt = [];
  const pant = [];
  const dataArray = JSON.parse(data);
  for (var i = 0; i < dataArray.length; i++) {
    console.log(dataArray[i].Product);
    if (dataArray[i].Product == "Shirt") {
        shirt.push(dataArray[i]);
      } else if (dataArray[i].Product == "Pant") {
        pant.push(dataArray[i]);
      }
  }
  console.log(shirt);
  console.log(pant);
});
