$(document).ready(function () {
  // Initialize the PubNub API connection.
  var pubnub = PUBNUB.init({
    publish_key: config.PUBNUB_pub,
    subscribe_key: config.PUBNUB_sub
  });
 
  // Grab references for all of our elements.
  var messageContent = $('#messageContent'),
      usernameContent = $('#usernameContent'),
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
  }

  function getSentiment(str) {
    $.post("https://gateway-a.watsonplatform.net/calls/text/TextGetEmotion?apikey=" + config.IBM + "&outputMode=json&text=" + encodeURI(str), function(response) {
      findHueAndChange(response.docEmotions);
      console.log(response.docEmotions);
    });
  }

    var emotionHueValues = {
      anger: "1000",
      fear: "9000",
      disgust: "22000",
      joy: "16500",
      sadness: "44920"
    };

  function findHueAndChange(emotions) {
    var primaryEmotionVal = 0.00;
    var primaryEmotion = "";
    var secondaryEmotionVal = 0.00;
    var secondaryEmotion = "";
    // determines primary emotion
    for (var key in emotions) {
      if (emotions[key] > primaryEmotionVal) {
        primaryEmotionVal = emotions[key];
        primaryEmotion = key;
      }
    }
    // determines secondary emotions
    for (var key2 in emotions) {
      if (emotions[key2] > secondaryEmotionVal && key2 !== primaryEmotion) {
        secondaryEmotionVal = emotions[key2];
        secondaryEmotion = key2;
      }
    }

    console.log("emotions", primaryEmotion, secondaryEmotion);

    $.ajax({type: "PUT",
            url: "http://192.168.10.108/api/" + config.HUE + "/lights/1/state",
            data: '{"hue":'+ emotionHueValues[primaryEmotion]+'}'
    });

    $.ajax({type: "PUT",
            url: "http://192.168.10.108/api/" + config.HUE + "/lights/2/state",
            data: '{"hue":'+ emotionHueValues[primaryEmotion]+'}'
    });

    $.ajax({type: "PUT",
            url: "http://192.168.10.108/api/" + config.HUE + "/lights/3/state",
            data: '{"hue":'+ emotionHueValues[secondaryEmotion]+'}'
    });
  }
 
  // Compose and send a message when the user clicks our send message button.
  sendMessageButton.click(function (event) {
    var message = messageContent.val();
    var username = usernameContent.val();
 
    if (message != '') {
      pubnub.publish({
        channel: 'chat',
        message: {
          username: username,
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
