<template>
  <div class="upload-container">
    <h2>Upload a Short Video</h2>

    <form @submit.prevent="handleUpload">
      <div>
        <label for="video">Choose Video:</label>
        <input type="file" id="video" @change="onFileChange" accept="video/*" required />
      </div>

      <div>
        <label for="caption">Caption:</label>
        <input type="text" v-model="caption" id="caption" placeholder="Enter caption" />
      </div>

      <div>
        <label for="username">Username:</label>
        <input type="text" v-model="username" id="username" placeholder="Your name" />
      </div>

      <button type="submit">Upload</button>
    </form>

    <div v-if="uploadStatus" class="status">{{ uploadStatus }}</div>
  </div>
</template>

<script>
export default {
  name: "VideoUploader",
  data() {
    return {
      videoFile: null,
      caption: "",
      username: "",
      uploadStatus: "",
    };
  },
  methods: {
    onFileChange(event) {
      const file = event.target.files[0];
      if (file && file.type.startsWith("video/")) {
        this.videoFile = file;
      } else {
        this.uploadStatus = "Please select a valid video file.";
      }
    },
    async handleUpload() {
      if (!this.videoFile) {
        this.uploadStatus = "No video selected.";
        return;
      }

      const formData = new FormData();
      formData.append("video", this.videoFile);
      formData.append("caption", this.caption || "Untitled Short");
      formData.append("userId", "test-user-123"); // Replace with real user ID if available
      formData.append("username", this.username || "Anonymous User");

      this.uploadStatus = "Uploading...";

      try {
        const res = await fetch("https://yupitis.vercel.app/api/video", {
          method: "POST",
          body: formData,
        });

        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.message || "Upload failed");
        }

        this.uploadStatus = `Success! Video uploaded with key: ${result.key}`;
      } catch (error) {
        this.uploadStatus = `Error: ${error.message}`;
      }
    },
  },
};
</script>

<style scoped>
.upload-container {
  max-width: 580px;
  width: 100%;
  margin: 0 auto;
  padding: 22px 26px 28px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  background: linear-gradient(145deg, #11171d, #141e26 60%, #17232c);
  box-shadow: 0 4px 18px -6px rgba(0, 0, 0, 0.55);
  color: #e6edf3;
  font-size: 14px;
  line-height: 1.35;
  box-sizing: border-box;
}
.upload-container h2 {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.4px;
}
form > div {
  margin-bottom: 14px;
}
label {
  display: block;
  font-weight: 600;
  margin: 0 0 6px;
  font-size: 13px;
  letter-spacing: 0.3px;
}
input[type="file"],
input[type="text"] {
  width: 100%;
  display: block;
  box-sizing: border-box;
  font-size: 13px;
  padding: 10px 12px;
  background: #0f151b;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  border-radius: 8px;
}
input[type="text"]::placeholder {
  color: #6d7a85;
}
input[type="file"] {
  padding: 6px 10px;
}
button {
  margin-top: 4px;
  padding: 10px 18px;
  background: linear-gradient(135deg, #1d8cf8, #8751ff);
  border: none;
  border-radius: 24px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 3px 10px -4px rgba(0, 0, 0, 0.6);
  transition: 0.3s;
}
button:hover {
  filter: brightness(1.12);
}
.status {
  margin-top: 16px;
  font-weight: 600;
  font-size: 13px;
}
@media (max-width: 700px) {
  .upload-container {
    max-width: 100%;
    border-radius: 0;
  }
}
</style>

