URL = window.URL || window.webkitURL;
var gumStream;
var rec;
var input;
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext

var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");
var submitButton = document.getElementById("submitButton");
var listBlobs = []

//add events to those 2 buttons
recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);
submitButton.addEventListener("click", UploadToServer);

function startRecording() {
	console.log("recordButton clicked");
    var constraints = { audio: true, video:false }
	recordButton.disabled = true;
	stopButton.disabled = false;

	navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
		audioContext = new AudioContext();
		//update the format 
		document.getElementById("formats").innerHTML="Format: 1 channel pcm @ "+audioContext.sampleRate/1000+"kHz"
		/*  assign to gumStream for later use  */
		gumStream = stream;
		/* use the stream */
		input = audioContext.createMediaStreamSource(stream);
		rec = new Recorder(input,{numChannels:1})
		//start the recording process
		rec.record()
		console.log("Recording started");
	}).catch(function(err) {
	  	//enable the record button if getUserMedia() fails
    	recordButton.disabled = false;
    	stopButton.disabled = true;
	});
}

function stopRecording() {
	console.log("stopButton clicked");
	//disable the stop button, enable the record too allow for new recordings
	stopButton.disabled = true;
	recordButton.disabled = false;
	//tell the recorder to stop the recording
	rec.stop();
	//stop microphone access
	gumStream.getAudioTracks()[0].stop();
	//create the wav blob and pass it on to createDownloadLink
	rec.exportWAV(createDownloadLink);
}

function createDownloadLink(blob) {
	var url = URL.createObjectURL(blob);
	var au = document.createElement('audio');
	var li = document.createElement('li');
	var link = document.createElement('a');
	//name of .wav file to use during upload and download (without extendion)
	var filename = new Date().toISOString();
	//add controls to the <audio> element
	au.controls = true;
	au.src = url;
	//save to disk link
	link.href = url;
	link.download = filename+".wav"; 
	link.innerHTML = "download sound?";
	//add the new audio element to li
	li.appendChild(au);
	//add the filename to the li
	li.appendChild(document.createTextNode(filename+".wav "))
	//add the save to disk link to li
	li.appendChild(link);
	//add the li element to the ol
	recordingsList.appendChild(li);
	//append to global list of records
	var name = "record " + listBlobs.length;
	listBlobs.push([blob, name]);
}


/* UPLOADING FILE TO THE SERVER, CHANGE THE SITE IN CASE */
// this function will send a list of records
function UploadToServer() {
	if (listBlobs.length==0){
		console.log("Audio list is empty");
		return
	}
	console.log(listBlobs);
    console.log("Trying upload to server...");
    var pn = document.querySelector('#inputNumber');
    var upload = document.createElement('a');
	upload.href="#";
	upload.innerHTML = "Upload";
	upload.addEventListener("click", function(event){
        var xhr=new XMLHttpRequest();
        xhr.onload=function(e) {
            if(this.readyState === 4) {
                console.log("Server returned: ",e.target.responseText);
            }
        };
        var fd = new FormData();
        fd.append("audio_data", listBlobs, "list of records");
        //post to the server site "server.php"
        xhr.open("POST","server.php",true);
        xhr.send(pn)
        xhr.send(fd);
	})
}
