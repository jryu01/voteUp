function topicTohtml(topic){
    var body = "<li id='tid_"+ topic.tid +"' class='topicItem rtItem'>";
    body += "  <div class='topicContent rtContent'>";
    body += "      <div class='topicLink'><span>Link:</span><a href='http://" + topic.link + "'>" + topic.link +"</a></div>";
    body += "      <div class='textContent'><p class='topicText'>"+ topic.text +"</p></div>";
    body += "      <div class='voteNum topicVoteNum'>Vote: "+topic.votes+"</div>";
    body += "      <div class='showReplyButton button'>Show Reply</div>";
    body += "      <div class='replyButton button'>Add Reply</div>";
    body += "  </div>";
    body += "  <ul class='replyList'></ul>";
    body += "</li>";
    return body;
}
function replyTohtml(reply){
    var body = "<li id='rid_"+ reply.rid +"' class='replyItem rtItem'>";
    body += "  <div class='replyContent rtContent'>";
    body += "      <div class='textContent'><p class='replyText'>"+ reply.text +"</p></div>";
    body += "      <div class='voteNum replyVoteNum'>Vote: "+ reply.votes +"</div>";
    body += "      <div class='showReplyButton button'>Show Reply</div>";
    body += "      <div class='replyButton button'>Add Reply</div>";
    body += "      <div class='voteButton button'>Vote it!</div>";
    body += "  </div>";
    body += "<ul class='replyList'></ul>";
    body += "</li>";
    return body;
}

var replyForm = "<div class='replyForm addForm'>";
    replyForm += "  <textarea placeholder='Add Reply' name='replyText' rows='3' cols='60'></textarea><br>";
    replyForm += "  <div class='comment button'>Comment</div>";
    replyForm += "  <div class='cancel button'>Cancel</div>";
    replyForm += "</div>";

$(document).ready(function() {
  //When document ready, load topics
  $.ajax({
    type: 'GET',
    url: 'loadTopics',
    dataType: "json",
    success: function(data){
      var topicList = '';
      $.each(data, function(){
        topicList += topicTohtml(this);
      });
      $('#topicList').html(topicList);
    }, 
    error: function(jqXHR, textStatus, errorThrown) {
      alert('error ' + textStatus + " " + errorThrown);
    }
  });  
  //---For Topics-------------------
  $(document).on('click', '#refreshTopicButton', function(){
   $.ajax({
      type: 'GET',
      url: 'loadTopics',
      dataType: "json",
      success: function(data){
        var topicList = '';
        $.each(data, function(){
          topicList += topicTohtml(this);
        });
        $('#topicList').html(topicList);
      }, 
      error: function(jqXHR, textStatus, errorThrown) {
        alert('error ' + textStatus + " " + errorThrown);
      }
    });
  });
  //When add nwe post button clicked
  $(document).on('click', '#postTopicButton', function(){
      $('#topicForm').slideDown('fast');
  });
  $(document).on('click', '#cancelpostTopic', function(){
      $('#topicForm').slideUp('fast');
      $('#topicForm textarea').val('');
  });
  //In the post topic form
  $('#postTopic').click(function(){
      var link = $('textarea[name=link]').val();
      var topicContent = $('textarea[name=topic]').val();
      var topicLink = $('textarea[name=link]').val();
      console.log(topicLink.indexOf('a'));
      if(topicLink.indexOf('www.') >= 0 && topicLink.indexOf('www.') < 9) {
          topicLink = topicLink.substr(topicLink.indexOf('www.') + 4);
      }else if(topicLink.indexOf('://') >= 0) {
          topicLink = topicLink.substr(topicLink.indexOf('://') + 3);
      }
      if(topicContent === '' || link === ''){
          alert('Topic and Link must be provided');
      }else if(topicContent.length > 140) {
          alert('Topic must be less than 140 characters');
      }else {
          $.ajax({
              type: 'PUT',
              url: 'newTopic',
              data: "link=" + topicLink + "&text=" + topicContent,
              dataType: "json",
              success: function(data){
                  $('#topicForm').slideUp('fast');
                  $('#topicForm textarea').val('');
                  $('#topicList').prepend(topicTohtml(data));
              }, 
              error: function(jqXHR, textStatus, errorThrown) {
                alert('error ' + textStatus + " " + errorThrown);
              }
          }); 
      }
  });
  //--------For Replies------------
  //reply clicked, generate add reply form
  $(document).on('click', '.replyButton', function(){
      var rf = $(this).closest('.rtContent').children('.replyForm');
      if(rf.length === 0) {
          $(this).closest('.rtContent').append(replyForm);
          $(this).closest('.rtContent').next().slideDown('fast');
      }
  });
  //Vote Clicked, increment votes for this reply and its parent topic
  $(document).on('click', '.voteButton', function(){
      var $topicItem = $(this).closest('.topicItem');
      var $replyItem = $(this).closest('.replyItem');
      var $topicVotes = $topicItem.find('.topicVoteNum');
      var $thisVotes = $(this).siblings('.replyVoteNum');
      $.ajax({
          type: 'POST',
          url: 'vote',
          data: "tid=" + $topicItem.attr('id') + "&rid=" + $replyItem.attr('id'),
          dataType: "json",
          success: function(data){
              $topicVotes.text('Vote: ' + data.tvotes);
              $thisVotes.text('Vote: '+ data.rvotes);
          }, 
          error: function(jqXHR, textStatus, errorThrown) {
            alert('error ' + textStatus + " " + errorThrown);
          }
      });
  });
  //Hide Reply or Show reply clicked
  $(document).on('click', '.showReplyButton', function(){
      var buttonName = $(this).text();
      var $replyItem = $(this).closest('.rtItem');
      if(buttonName === 'Show Reply') {
          var $list =  $(this).closest('.rtContent').next();
          $(this).text('Hide Reply');
              var $replyList = $(this).closest('.rtContent').next();
              var replyList = '';
              $.ajax({
                  type: 'GET',
                  url: 'loadReplies',
                  data: "pid=" + $replyItem.attr('id'),
                  dataType: "json",
                  success: function(data){
                      $.each(data, function(){
                          replyList += replyTohtml(this);
                      });
                      $replyList.html(replyList);
                      $list.slideDown('fast');
                  }, 
                  error: function(jqXHR, textStatus, errorThrown) {
                    alert('error ' + textStatus + " " + errorThrown);
                  }
              });
      //If buttonName is Hide Reply
      } else {
          $(this).text('Show Reply');
          $(this).closest('.rtContent').next().slideUp('fast');
      }
  });
  
  //Inside Add Reply Form 
  //comment clicked, add reply
  $(document).on('click', '.comment', function(){
      var replyContent = $(this).siblings('textarea[name=replyText]').val();
      if(replyContent ==='') {
          alert('You must write anyting for comment!');
      } else {
          var $rtContent = $(this).closest('.rtContent');
          var $replyForm = $(this).closest('.replyForm');
          $.ajax({
              type: 'PUT',
              url: 'newReply',
              data: "pid=" + $(this).closest('.rtItem').attr('id') + "&text=" + replyContent,
              dataType: "json",
              success: function(data){
                  $rtContent.find('.showReplyButton').text('Hide Reply');
                  $rtContent.next().slideDown('fast');
                  $rtContent.next().prepend(replyTohtml(data)); //unordered list
                  $replyForm.remove();
              }, 
              error: function(jqXHR, textStatus, errorThrown) {
                alert('error ' + textStatus + " " + errorThrown);
              }
          });
      }
  });
  //cancel clicked, cancel writing reply
  $(document).on('click', '.cancel', function(){
      $(this).closest('.replyForm').remove();
  });
});
