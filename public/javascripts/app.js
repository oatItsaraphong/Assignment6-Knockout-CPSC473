/* jshint browser: true, jquery: true, camelcase: true, indent: 2, undef: true, quotmark: single, maxlen: 80, trailing: true, curly: true, eqeqeq: true, forin: true, immed: true, latedef: true, newcap: true, nonew: true, unused: true, strict: true */

var waitClick;
var addQuestionFunction;
var answerQuestionOne;
var getScore;
var getQuestionNew;
var USERNAME;
var enterUserName;
var globalScore;
var control = 0;
var socket = io();
//var myList = observableArray();

//score display
// use KnockOut to update everysocre element
var scoreUpdate = function(scoreObject){
  'use strict';
  console.log('update score');
  ko.cleanNode(document.getElementById('MainScoreBoard'));
  this.CorrectBind = ko.observable('Correct: ' + scoreObject.right);
  this.IncorrectBind = ko.observable('Wrong: ' + scoreObject.wrong);
  //this.GlobalScore = ko.observable('Correct: ' + scoreObject.value.right);
};//end ScoreUpdate


//dispay a new question
var adjustQuestion = function(questionObject){
  'use strict';
  if(control === 0){
    $('.oneQuestion').empty();
    $('.oneQuestion').append(
      '<h3>Player:</h3>' +
      '<label class="playerName" name="playerValue">' +
      USERNAME + '</label>' +
      '<div class="field NewQuestion">' +
      '<div id="NodeBind">' +
      '<label class="questionPlace">' +
      '<div id="QBind" data-bind="text: QuestionBind"><h3>' +
      questionObject.question +
      '</h3></div></label>' +
      '<lable class="idPlace">' +
      '<div id="idBind" data-bind="text: QuestionIdBind">' +
      questionObject.answerId +
      '</div></label>' +
      '<input type="text" class="answerClass" placeholder="answer">' +
      '</div>' +
      '</div>' +
      '<button class="ui button fluid teal large ToAnswer"' +
      'id="AnswerToThis" type="button">Answer</button>'
    );
    control = 0;
  }
  // ** possible add knockOut
  waitClick();
};//end AdjustQuestion

//wait for the user to enter their name and add in
function waitUser(){
  'use strict';
  $('.addInUser').click(function(){
    USERNAME = document.getElementsByName('NameOfUser')[0].value;
    socket.emit('IOName', USERNAME);
    console.log(USERNAME);
    getQuestionNew();
  });
}

//update when the playerlist have change
socket.on('IOName', function(msg, data1, data2){
  'use strict';

 $('#userList').append($('<li>').html(
   '<div class="item"><div class="content">' +
   '<div class="header">' +
   msg + '</div>' +
   '<i class="check green big circle icon"></i>' + data1 +
   '  - - - <i class="check red big remove circle icon"></i>:' + data2 +
   '</div></div>' +
   '<div class="ui divider"></div>'));

});

//empty the playerlist
socket.on('IONameEmpty', function(){
  'use strict';
  $('#userList').empty();
});

//print the score to the main score board in the buttom of the grid
//use KnockOut for score update
socket.on('AltScore', function(UserIn,scoreRightIn, scoreWrongIn){
  'use strict';
  if(UserIn === USERNAME){
    //var value = getScore();
    var tempScore = {'right': scoreRightIn,
                      'wrong': scoreWrongIn,
                    };
    console.log(tempScore);
    ko.applyBindings(new scoreUpdate(tempScore),
        document.getElementById('MainScoreBoard'));
    //scoreUpdate(tempScore);
  }
});

//get update when the user reach max number of questionLimit (10)
// use KnockOut for ScoreUpdata
// use DOM to one time print
socket.on('EndScore', function(UserIn,scoreRightIn, scoreWrongIn){
  'use strict';
  //update the score in the main scoreboard
  if(UserIn === USERNAME){
    var tempScore = {'right': scoreRightIn, 'wrong': scoreWrongIn};
    //scoreUpdate(tempScore);
    ko.applyBindings(new scoreUpdate(tempScore),
        document.getElementById('MainScoreBoard'));

    //print out the result
    // One time print
    $('.oneQuestion').empty();
    $('.oneQuestion').append(
      '<h2>Result:</h2>' +
      '<label class="playerName" name="playerValue"><h3>' +
      USERNAME + '\'s total score out of 10 questions is </h3></label>' +
      '<div><h3> Right: ' + scoreRightIn + '</h3></div>' +
      '<div><h3> Wrong: ' + scoreWrongIn + '</h3></div>' +
      '<a href="http://localhost:3000"' +
      'class="ui button fluid teal large FinRoung"' +
      'id="EndRound" type="button">' +
      'Begin Again</a>'+
      '<div>**Begin Again will delete everything include previour attemp</div>'
    );
  }
});

//function that always listening
var main = function(){
  'use strict';
  //socket.emit('IOName', USERNAME);

  $('.addQuestion').form({
    fields: {
        addquestionholder: {
          identifier : 'addquestion-holder',
            rules: [
              {
                type   : 'empty',
                prompt : 'Please enter a question'
              }
            ]
          },
          addanswerholder: {
              identifier : 'addanswer-holder',
              rules: [
                {
                  type   : 'empty',
                  prompt : 'Please enter a answer'
                }
                ]
            }
        },
    onSuccess: function(event) {
      event.preventDefault();
      addQuestionFunction();
      $('.newQuestion').val('');
      $('.newAnswer').val('');
      //GetQuestionNew();
      console.log('form valid');
    }
  });
  enterUserName();

  //GetQuestionNew();
};//big loop

//callend to enter the user name at the start of the website
function enterUserName(){
  'use strict';
  $('.oneQuestion').append(
    '<label><h3>Enter Username To Begin the Game</h3></label>'+
    '<input type="text" class="userNameIO" name="NameOfUser">' +
    '<button class="ui button fluid teal large addInUser"' +
    'id="AnswerToThis" type="button">Start the Round</button>'
  );
  waitUser();
}//end EnterUserName

//ajax when answer the question
function answerQuestionOne(){
  'use strict';

  var aToSend = $('.answerClass').val();
  var idToSend = $('.idPlace').text();
  var jsonStr = JSON.stringify({
                  'answer': aToSend.toUpperCase(), 'answerId': idToSend});
  console.log(jsonStr);
  $.ajax({
          type: 'POST',
          data: jsonStr,
          dataType: 'json',
          contentType: 'application/json',
          url: 'http://localhost:3000/answer',
          success: function(data){
            console.log(data);
            if(data.correct === true){
              console.log('Correct');
                socket.emit('scoreUp',USERNAME, 1);
            }
            else{
              console.log('Wrong');
              socket.emit('scoreUp',USERNAME, 0);
            }
          }
  });

}//end AnswerQuestion

//ajax when the score need update
function getScore(){
  'use strict';
  console.log('retieve score');
  $.ajax({
          type: 'GET',
          dataType: 'json',
          contentType: 'application/json',
          url: 'http://localhost:3000/score',
          success: function(data){
            console.log(data);
            //return data;
            socket.emit('getScore', USERNAME);
            ko.applyBindings(new globalScore(data),
              document.getElementById('globalScoreUI'));
            //ore(data);
          }
  });
}//end GetScore

//KnockOut Bind
function globalScore(dataFile){
    'use strict';
    ko.cleanNode(document.getElementById('globalScoreUI'));
    this.GlobalScore = ko.observable('Correct5: ' + dataFile.right +
        ' = Wrong: ' + dataFile.wrong);
}

//ajax retive one question get it at randome by server
function getQuestionNew(){
  'use strict';
  console.log('retieve question');
  $.ajax({
          type: 'GET',
          dataType: 'json',
          contentType: 'application/json',
          url: 'http://localhost:3000/question',
          success: function(data){
            console.log('success retirve');
            console.log(data);

            if(data.answerId === 0)
            {
              $('.oneQuestion').empty();
              $('.oneQuestion').append('<h3>Add the question first</h3>' +
                '<div><button class="ui grey button"href="localhost:3000">' +
                'Click when question is added</button></div>'
              );
            }
            else{
              adjustQuestion(data);
              getScore();
            }
          }
    });

}//end GetQuestionNew

//ajax added question to the db
function addQuestionFunction(){
  'use strict';

  var qToSend = document.getElementsByName('addquestion-holder')[0].value;
  var aToSend = document.getElementsByName('addanswer-holder')[0].value;
  var jsonStr = JSON.stringify({'question': qToSend,
                                  'answer': aToSend.toUpperCase()});
  console.log('beforeSed' + jsonStr);

  $.ajax({
          type: 'POST',
          data: jsonStr,
          dataType: 'json',
          contentType: 'application/json',
          url: 'http://localhost:3000/question',
          success: function(){
            console.log('send quesition complete');
          }

  });

}//end AddQuestionFunction

//wait for user to answer
function waitClick(){
  'use strict';
  $('#AnswerToThis').click(function(){
    console.log('ToAnswer');
    answerQuestionOne();
    getQuestionNew();
  });
}

$(document).ready(main);


//--------------------------------
/*
  else{
    var q1 = questionObject.question;
    var i1 = questionObject.answerId;
    ko.applyBindings(new function(){
      ko.cleanNode(document.getElementById('QBind'));
      this.QuestionBind = ko.observable(q1);
    }, document.getElementById('QBind'));


    ko.applyBindings(new function(){
      ko.cleanNode(document.getElementById('idBind'));
      this.QuestionIdBind = ko.observable(i1);
    }, document.getElementById('idBind'));
    //ko.applyBindings(new adjustQuestionIdBind(questionObject.answerId),
    //    document.getElementById('idBind'));
    //$('.answerClass').empty();
  }


  var adjustQuestionBind = function(QuestionIn){
    'use strict';
    ko.cleanNode(document.getElementById('QBind'));
    this.QuestionBind = ko.observable(QuestionIn);
  };

  var adjustQuestionIdBind = function(QuestionIn){
    'use strict';
    ko.cleanNode(document.getElementById('idBind'));
    this.QuestiondDBind = ko.observable(QuestionIn);
  };
*/
