const socket = io("http://localhost:3000"); 

let fileInput = document.getElementById("fileInput");
let sendBtn = document.getElementById("sendBtn");
let fileNameDisplay = document.getElementById("fileName"); 
let status = document.getElementById("status");
let chooseFileBtn = document.getElementById("chooseFileBtn"); 

let peer = null;
let connectedPeer = null;
let fileBuffer = [];
let receiving = false;
let expectedFileName = "";


socket.emit("join");

socket.on("peer", id => {
  console.log("👋 New peer joined:", id);
  peer = createPeer(true, id); 
});

socket.on("signal", ({ from, signal }) => {
  console.log("📡 Signal received from:", from);
  if (!peer) {
    peer = createPeer(false, from); 
  }
  peer.signal(signal);
});

socket.on("peer-disconnected", peerId => {
  console.log(`❌ Peer ${peerId} disconnected`);
  if (connectedPeer && connectedPeer.id === peerId) {
    status.innerText += `\n❌ Peer ${peerId} disconnected.`;
    connectedPeer.destroy();
    connectedPeer = null;
    peer = null;
  }
});

// Create Peer Connection
function createPeer(initiator, remoteId) {
  const p = new SimplePeer({ initiator, trickle: false });

  p.on("signal", data => {
    socket.emit("signal", { to: remoteId, signal: data });
  });

  p.on("connect", () => {
    console.log("✅ Peer connected!");
    status.innerText = "✅ Connected to peer!";
    connectedPeer = p;
  });

  p.on("data", handleData);

  p.on("error", err => {
    console.error("⚠️ Peer error:", err);
    status.innerText += `\n⚠️ Peer error: ${err.message}`;
  });

  p.on("close", () => {
    console.warn("❌ Peer disconnected.");
    status.innerText += "\n❌ Peer disconnected.";
    connectedPeer = null;
    peer = null;
  });

  return p;
}

// Function to send file
const sendFile = async () => {
  if (!connectedPeer || !connectedPeer.connected) {
    alert("⚠️ Peer not connected yet.");
    return;
  }

  const file = fileInput.files[0];
  if (!file) {
    alert("📂 Please select a file first.");
    return;
  }

  const chunkSize = 1024 * 16; 
  const fileReader = new FileReader();
  let offset = 0;
  const fileLength = file.size;

  status.innerText = `📤 Sending "${file.name}"...\n`;

  
  const sendChunks = () => {
    if (offset >= fileLength) {
      const eofMessage = "EOF:" + file.name;
      connectedPeer.send(eofMessage);
      console.log("✅ Sent EOF:", eofMessage);
      status.innerText += `✅ File sent successfully.\n`;
      return;
    }

    const slice = file.slice(offset, offset + chunkSize);
    fileReader.readAsArrayBuffer(slice); 
  };

  
  fileReader.onload = function () {
    const chunk = new Uint8Array(fileReader.result); 
    connectedPeer.send(chunk); 
    console.log(`📤 Sent chunk of size: ${chunk.length}`);
    offset += chunk.length; 
    sendChunks(); 
  };

  sendChunks(); 
};


sendBtn.onclick = sendFile; 


chooseFileBtn.addEventListener("click", () => {
  fileInput.click();
});


fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];

  if (file) {
    
    fileNameDisplay.textContent = file.name;

    
    sendBtn.disabled = false;
  } else {
    
    fileNameDisplay.textContent = "No file chosen";
    sendBtn.disabled = true;
  }
});


function handleData(data) {
  console.log("📦 Raw data received:", data);

  
  if (typeof data === "string" && data.startsWith("EOF:")) {
    const filename = data.slice(4);
    console.log("🟢 EOF received for file:", filename);

    
    const blob = new Blob(fileBuffer);
    const url = URL.createObjectURL(blob);


    console.log("📥 File fully received, creating download button...");

    
    const downloadBtn = document.createElement("button");
    downloadBtn.textContent = `⬇️ Download ${filename}`;
    downloadBtn.style.marginTop = "10px";
    downloadBtn.style.padding = "10px";
    downloadBtn.style.fontSize = "1rem";
    downloadBtn.style.cursor = "pointer";
    downloadBtn.style.backgroundColor = "#4CAF50";
    downloadBtn.style.color = "#fff";
    downloadBtn.style.border = "none";
    downloadBtn.style.borderRadius = "5px";
    downloadBtn.style.width = "200px";  
    downloadBtn.style.textAlign = "center"; 

    
    downloadBtn.onclick = () => {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
    };

    
    status.appendChild(document.createElement("br"));
    status.appendChild(downloadBtn);

    
    fileBuffer = [];
    receiving = false;
    return;
  }

  
  if (data instanceof ArrayBuffer) {
    console.log("📥 Received ArrayBuffer, converting to Uint8Array");
    data = new Uint8Array(data);
  }

  
  if (data instanceof Uint8Array) {
    if (!receiving) {
      receiving = true;
      status.innerText += "📥 Receiving file...\n";
      console.log("📥 Started receiving file...");
    }

    console.log(`📥 Received binary chunk, size: ${data.byteLength}`);
    fileBuffer.push(data);
  } else {
    console.warn("⚠️ Unknown data type received:", data);
  }
}
