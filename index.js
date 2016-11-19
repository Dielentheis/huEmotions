$(document).ready(function () {
  // Initialize the PubNub API connection.
  var pubnub = PUBNUB.init({
    publish_key: config.PUBNUB_pub,
    subscribe_key: config.PUBNUB_sub
  });
 
  // Grab references for all of our elements.
  var messageContent = $('#messageContent'),
      sendMessageButton = $('#sendMessageButton'),
      messageList = $('#messageList');
 
  // Handles all the messages coming in from pubnub.subscribe.
  function handleMessage(message) {
    var messageEl = $("<li class='message'>"
        + "<span class='username'>" + message.username + ": </span>"
        + message.text
        + "</li>");
    messageList.append(messageEl);
    getSentiment(message.text);
    messageList.listview('refresh');
 
    // Scroll to bottom of page
    $("html, body").animate({ scrollTop: $(document).height() - $(window).height() }, 'slow');
  };

  function getSentiment(str) {
    $.post("https://gateway-a.watsonplatform.net/calls/text/TextGetEmotion?apikey=" + config.IBM + "&outputMode=json&text=" + encodeURI(str), function(response) {
      // do things with response here!!!!!!!
  //       "docEmotions": {
  //   "anger": "0.163485",
  //   "disgust": "0.012672",
  //   "fear": "0.2507",
  //   "joy": "0.104535",
  //   "sadness": "0.546235"
  // }
      console.log(response);
    })




  }
 
  // Compose and send a message when the user clicks our send message button.
  sendMessageButton.click(function (event) {
    var message = messageContent.val();
 
    if (message != '') {
      pubnub.publish({
        channel: 'chat',
        message: {
          username: 'Liz',
          text: message
        }
      });
 
      messageContent.val("");
    }
  });
 
  // Also send a message when the user hits the enter button in the text area.
  messageContent.bind('keydown', function (event) {
    if((event.keyCode || event.charCode) !== 13) return true;
    sendMessageButton.click();
    return false;
  });
 
  // Subscribe to messages coming in from the channel.
  pubnub.subscribe({
    channel: 'chat',
    message: handleMessage
  });
});
