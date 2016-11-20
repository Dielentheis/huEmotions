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

  var emotions = {};
  var score = 0;

  function getSentiment(str) {
    $.ajax({
      type: "POST",
      url: "https://gateway-a.watsonplatform.net/calls/text/TextGetEmotion?apikey=" + config.IBM + "&outputMode=json&text=" + encodeURI(str),
      success: function(response) {
        emotions = response.docEmotions;
        console.log(response.docEmotions);
        findScore(str);
      }
    });
  }

  function findScore(str) {
    $.ajax({
      type: "POST",
      url: "https://gateway-a.watsonplatform.net/calls/text/TextGetTextSentiment?apikey=" + config.IBM + "&outputMode=json&text=" + encodeURI(str),
      success: function(response) {
        score = response.docSentiment.score;
        console.log(response);
        findHueAndChange();
      }
    });
  }

  var emotionHueValues = {
    anger: "1000",
    fear: "9000",
    disgust: "22000",
    joy: "16500",
    sadness: "44920"
  };

  function findHueAndChange() {
    var primaryEmotionVal = 0.00;
    var primaryEmotion = "";
    var secondaryEmotionVal = 0.00;
    var secondaryEmotion = "";
    var satScore = score ? Math.floor(254 * Math.abs(score * 1.4)) : 220;
    if (satScore > 254) {
      satScore = 254;
    }
    // determines primary emotion
    for (var key in emotions) {
      if (emotions[key] > primaryEmotionVal) {
        primaryEmotionVal = emotions[key];
        primaryEmotion = key;
      }
    }

    if (primaryEmotionVal > .85) {
      secondaryEmotion = primaryEmotion;
    }
    else {
      // determines secondary emotions
      for (var key2 in emotions) {
        if (emotions[key2] > secondaryEmotionVal && key2 !== primaryEmotion) {
          secondaryEmotionVal = emotions[key2];
          secondaryEmotion = key2;
        }
      }
    }

    console.log("SATSCORE", satScore, '{"hue":'+ emotionHueValues[primaryEmotion]+', "sat":'+ satScore +'}');

    $.ajax({type: "PUT",
            url: "http://192.168.10.108/api/" + config.HUE + "/lights/1/state",
            data: '{"hue":'+ emotionHueValues[primaryEmotion]+', "sat":'+ satScore +'}'
    });

    $.ajax({type: "PUT",
            url: "http://192.168.10.108/api/" + config.HUE + "/lights/2/state",
            data: '{"hue":'+ emotionHueValues[primaryEmotion]+', "sat":'+ satScore +'}'
    });

    $.ajax({type: "PUT",
            url: "http://192.168.10.108/api/" + config.HUE + "/lights/3/state",
            data: '{"hue":'+ emotionHueValues[secondaryEmotion]+', "sat":'+ satScore +'}'
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
