const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');  //for names with smallcase or uppercase
//const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb://localhost/todoListDB');

//created Schema and then a mongoose model based on this schema
const listSchema = mongoose.Schema({
   name: String
});

//creating new schema
const itemsSchema = mongoose.Schema({
  name: String,
  items: [listSchema]   //array of listSchema associated with it (array of objects)
})

const Item = mongoose.model('Item',listSchema); //for listSchema
const List = mongoose.model('List',itemsSchema); //for itemSchema

const item1 = new Item({
  name: "Welcome to our todo list"
});
const item2 = new Item({
  name: "Hit the + button to add a new item"
});
const item3 = new Item({
  name: "<-- Hit this to delete an item"
});
const defaultItems = [item1, item2, item3];

/*
const buyFood = new Task({
  name: "Buy Food"
});
const cookFood = new Task({
  name: "Cook Food"
});
const eatFood = new Task({
  name: "Eat Food"
});
*/

app.get("/", function(req, res) {

//const day = date.getDate();
  Item.find({},function(err, foundItems){
    if(foundItems.length === 0){
      Item.insertMany(defaultItems, function(err){
        if(err) console.log(err);
        else console.log("Successfully added");
      });
      //if they're added, then display them
      res.redirect('/');
    }
    else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  })
});

//app.get('/home') or app.get('/home')
app.get('/:customListName',function(req,res){
  const customListName= _.capitalize(req.params.customListName);
  
  //findOne gives an object back- returns only 1 document if found
  List.findOne({ name: customListName},function(err,foundList){
    //foundList is not an array, so check if it's exist or not (object)
    if(!foundList){
      //console.log('Does not Exist');

      /* Create a new list */
      const list = new List({
        name: customListName,
        items: defaultItems
      })
      list.save();
      res.redirect('/'+customListName);
    }
    else{
      //console.log('Exist');

      /* Show an existing list, tap into name and items property of foundList */
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
  });

})

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });
  
  if(listName === "Today"){
    item.save();
    //to show the updated task
    res.redirect('/');
  }

  //if custom list
  else{
    //find custom list and then add item in the items array
    List.findOne({ name: listName},function(err,foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect('/'+listName);
    })
  }
  
});

app.post('/delete',function(req,res){
  const checkedItemName= req.body.checked;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.deleteOne({_id:checkedItemName},function(err){
      if(err){
        console.log(err);
      }
      else{
        console.log("Sucessfully deleted");
        res.redirect('/');
      }
    })
  }
  else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemName}}}, function(err,foundList){
      if(!err){
        res.redirect('/'+listName);
      }
    })
  }
  
});

/*
app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});
*/

app.get("/about", function(req, res){
  res.render(about);
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
