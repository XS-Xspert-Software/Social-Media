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
  max-width: 400px;
  margin: auto;
  padding: 1em;
  border: 1px solid #ccc;
  border-radius: 5px;
}

label {
  display: block;
  margin-top: 1em;
}

input[type="file"],
input[type="text"] {
  width: 100%;
  margin-top: 0.5em;
}

button {
  margin-top: 1em;
  padding: 0.5em 1em;
}

.status {
  margin-top: 1em;
  font-weight: bold;
}
</style>

