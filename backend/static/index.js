function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function startRecording() {
  document.getElementById("start-recording-button").disabled = true;

  fetch("/start-recording")
    .then((response) => response.json())
    .then((data) => {
      console.log(data.message);
    })
    .catch((error) => {
      document.getElementById("start-recording-button").disabled = false;
      document.getElementById("stop-recording-button").disabled = true;
      document.getElementById("recording-status").textContent =
        "Status: Error while recording, please try again.";
      console.error("Error starting recording:", error);
    });

  document.getElementById("recording-status").textContent =
    "Status: Recording in 3";
  sleep(1000).then(() => {
    document.getElementById("recording-status").textContent =
      "Status: Recording in 2";
    sleep(1000).then(() => {
      document.getElementById("recording-status").textContent =
        "Status: Recording in 1";
      sleep(1000).then(() => {
        document.getElementById("recording-status").textContent =
          "Status: Recording...";
        document.getElementById("stop-recording-button").disabled = false;
      });
    });
  });
}

function stopRecording() {
  document.getElementById("start-recording-button").disabled = true;
  document.getElementById("stop-recording-button").disabled = true;
  document.getElementById("recording-status").textContent =
    "Status: Transcribing and translating...";
  fetch("/stop-recording")
    .then((response) => response.json())
    .then((data) => {
      console.log(data.message);
      document.getElementById("recording-status").textContent = "Status: Done, click record to start again.";
      document.getElementById("start-recording-button").disabled = false;
      document.getElementById("stop-recording-button").disabled = true;
      displayTranscript();
      whisperTranslation();
      console.log("Called Whisper")
  })
    .catch((error) => {
      document.getElementById("start-recording-button").disabled = false;
      document.getElementById("stop-recording-button").disabled = true;
      document.getElementById("recording-status").textContent =
        "Status: Error while transcribing or while translating, please try again.";
      console.error("Error stopping recording:", error);
    });
}
async function displayTranscript() {
  try {
    const response = await fetch("/test_output_transcript.txt");
    if (!response.ok) throw new Error("Network response was not ok");

    const transcript = await response.text();
    document.getElementById("transcript-content").textContent = transcript;
  } catch (error) {
    document.getElementById("transcript-content").textContent =
      "Failed to load transcript.";
    console.error("Error fetching the transcript:", error);
  }
}
async function englishTranslation() {
  const response = await fetch("/english-translation");
  const engTrans = await response.text();
  document.getElementById("english-translation").textContent = engTrans;
}
async function spanishTranslation() {
  const response = await fetch("/spanish-translation");
  const esTrans = await response.text();
  document.getElementById("spanish-translation").textContent = esTrans;
}
async function whisperTranslation(){
  const response = await fetch("/whisper-translation");
  const wsTrans = await response.text();
  console.log(wsTrans);
  document.getElementById("whisper-translation").textContent = wsTrans;
  englishTranslation();
  spanishTranslation();
  }

