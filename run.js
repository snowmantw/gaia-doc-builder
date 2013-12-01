var express = require("express");
var app = express();

state =
{ 'updateDocDone': function() {}
, 'pullDone': function() {}
, 'pushDocDone': function(){}
, 'commitDocDone': function(){}
, 'locked': false
}

action =
{
   makeMessage: function(commits)
  {
    var msg = "Update Gaia API documents for #" + commits[0].id + "\n"
            + "    " + commits[0].message + "\n"
    return msg
  }

  ,updateDoc: function()
  {
    var exec = require('child_process')
	.spawn('jsdoc', ['-r', '-l', '-d', 'gaiadoc', './gaia/apps/system'])
    exec.stdout.on('data', function(data)
    {
      //console.log(data.toString())
    })
    exec.stderr.on('data', function(data)
    {
      //console.log(data.toString())
    })
    exec.on('close', function(code) {
      console.log('JSDoc done with code' + code)
      state.updateDocDone(code)
    })
  }

  ,pullRepo: function()
  {
    var exec = require('child_process')
  	.spawn('git', ['pull', 'origin', 'master'], {'cwd': './gaia'})
    exec.stdout.on('data', function(data) {})
    exec.stderr.on('data', function(data)
    {
      //console.log(data.toString())
    })
    exec.on('close', function(code) {
      console.log('Pull done with code' + code)
      state.pullDone(code)
    })
  }

  ,pushDoc: function()
  {
    var exec = require('child_process')
  	.spawn('git', ['push', 'origin', 'gh-pages'], {'cwd': './gaiadoc'})
    exec.stdout.on('data', function(data) {})
    exec.stderr.on('data', function(data)
    {
      console.log(data.toString())
    })
    exec.on('close', function(code) {
      console.log('Push doc done with code' + code)
      state.pushDocDone(code)
    })
  }

  ,commitDoc : function(msg)
  {
    var exec = require('child_process')
  	.spawn('git', ['commit', '-am', msg], {'cwd': './gaiadoc'})
    exec.stdout.on('data', function(data) {})
    exec.stderr.on('data', function(data)
    {
      console.log(data.toString())
    })
    exec.on('close', function(code) {
      console.log('Add doc done with code' + code)
      state.commitDocDone(code)
    })
  }
}

app.use(express.bodyParser())
app.post('/update', function(req, res)
{
  if (state.locked)
    return
  var data = JSON.parse(req.body.payload)
  var msg = action.makeMessage(data.commits) 

  state.pullDone = function()
  {
    action.updateDoc()
  }
  state.updateDocDone = function()
  {
    action.commitDoc(msg)
  }
  state.commitDocDone = function()
  {
    action.pushDoc()
  }
  state.pushDocDone = function()
  {
    state.locked = false
    console.log('-- done --')
  }
  state.locked = true
  action.pullRepo()
})

app.listen(8000)
