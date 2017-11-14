// Test files for Encrypted Media Extensions
var gEMETests = [
  {
    name:"video-only with 2 keys",
    tracks: [
      {
        name:"video",
        type:"video/mp4; codecs=\"avc1.64000d\"",
        fragments:[ "bipbop-cenc-videoinit.mp4",
                    "bipbop-cenc-video1.m4s",
                    "bipbop-cenc-video2.m4s",
                  ]
      }
    ],
    keys: {
      // "keyid" : "key"
      "7e571d037e571d037e571d037e571d03" : "7e5733337e5733337e5733337e573333",
      "7e571d047e571d047e571d047e571d04" : "7e5744447e5744447e5744447e574444",
    },
    sessionType:"temporary",
    sessionCount:1,
    duration:1.60,
  },
];

function once(target, name, cb) {
  var p = new Promise(function(resolve, reject) {
    target.addEventListener(name, function() {
      resolve();
    }, {once: true});
  });
  if (cb) {
    p.then(cb);
  }
  return p;
}

function TimeStamp(token) {
  function pad(x) {
    return (x < 10) ? "0" + x : x;
  }
  var now = new Date();
  var ms = now.getMilliseconds();
  var time = "[" +
             pad(now.getHours()) + ":" +
             pad(now.getMinutes()) + ":" +
             pad(now.getSeconds()) + "." +
             ms +
             "]" +
             (ms < 10 ? "  " : (ms < 100 ? " " : ""));
  return token ? (time + " " + token) : time;
}

function Log(token, msg) {
  info(TimeStamp(token) + " " + msg);
}

// Number of tests to run in parallel.
var PARALLEL_TESTS = 2;

// Prefs to set before running tests.  Use this to improve coverage of
// conditions that might not otherwise be encountered on the test data.
var gTestPrefs = [
  ['media.recorder.max_memory', 1024],
  ['media.audio-max-decode-error', 0],
  ['media.video-max-decode-error', 0],
];

function dumpDebugInfo() {
  for (var v of document.getElementsByTagName("video")) {
    v.mozDumpDebugInfo();
  }
  for (var a of document.getElementsByTagName("audio")) {
    a.mozDumpDebugInfo();
  }
}
