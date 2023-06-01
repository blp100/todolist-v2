const functions = require("firebase-functions");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const port = process.env.port || 3000;

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

require('dotenv').config();

// Connect to MongoDB

const mongoUser = process.env.MONGODB_USER;
const mongoPW = process.env.MONGODB_PW;
const mongoDB = process.env.MONGODB_NAME;

//change strict query setting to close warning
mongoose.set('strictQuery', false);

mongoose.connect("mongodb+srv://" + mongoUser + ":" + mongoPW + "@cluster0.lwx4ahm.mongodb.net/" + mongoDB);
// mongoose.connect("mongodb://localhost:27017/todolistDB");



// Create New Scheme and Data
const itemsScheme = {
  name : String
};

const Item = mongoose.model("Item", itemsScheme);
const item1 = new Item({name: "Welcome to your todolist."});
const item2 = new Item({name: "Hit the + button to add a new item."});
const item3 = new Item({name: "<-- Hit this to delete an item."});
const defaultItems = [item1, item2 ,item3];

const listScheme = {
  name : String,
  items : [itemsScheme]
}

const List = mongoose.model("list", listScheme);

app.get("/", function(req, res) {
  const items = [];

   Item.find({}, (err, findItems) => {
    if (findItems.length === 0) {
      Item.insertMany(defaultItems, (err) =>{
        if(err){
          console.log(err);
        }else{
          console.log("Succesfully saved default items to database.")
        }
      });
      res.redirect("/");
    }else{
      findItems.forEach(element => {
        items.push(element);
      });  
      res.render("list", {listTitle: "Today", newListItems: items});
    }
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({name: itemName});

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, (err, foundList)=>{
      if(!err){
        foundList.items.push(item);
        foundList.save();
        res.redirect("/"+ listName);
      }
    });
  }
});

app.post("/delete", (req,res) =>{
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (checkedItemId){
    if(listName === "Today"){
      Item.findByIdAndRemove(checkedItemId, (err)=>{
        if(!err){
          console.log("Sucessfully removed item in database.");
          res.redirect("/");
        }
      });
    }else{
      List.findOneAndUpdate({name: listName}, {$pull:{items: {_id: checkedItemId}}}, (err, foundList)=>{
        if(!err){
          res.redirect("/"+listName);
        }
      })
    }
  }
});

// app.get("/work", function(req,res){
//   res.render("list", {listTitle: "work", newListItems: []});
// });

app.get("/about", function(req, res){
  res.render("about");
});

app.get("/:cutstomeListName", (req,res)=>{
  const cutstomeListName = _.capitalize(req.params.cutstomeListName);
  console.log("You are in the " + cutstomeListName + " page.");

  const list = new List();

  List.findOne({name : cutstomeListName} ,(err, foundList) =>{
    if(err){
      console.log(err);
    }else{
      if (foundList != null){
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }else{
        const list = List({
            name : cutstomeListName,
            items : defaultItems
        });

        list.save();
        res.redirect("/"+cutstomeListName);
      }
    }    
  });

});

// app.listen(port, function() {
//   console.log("Server started on port " + port);
// });
//don't listen the port, if you want to use firebase
exports.app = functions.https.onRequest(app);

// // Create and deploy your first functions
// // https://firebase.google.com/docs/functions/get-started
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });