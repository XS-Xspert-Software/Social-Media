from django.db import models
from django.contrib.auth.models import User
import uuid

class VideoWatch(models.Model):
    video_id = models.CharField(max_length=100)
    user_id = models.CharField(max_length=100, null=True, blank=True)  # For anonymous users, can be session ID
    watched_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    
    class Meta:
        db_table = 'video_watches'
        
    def __str__(self):
        return f"Video {self.video_id} watched at {self.watched_at}"

class VideoPost(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    caption = models.CharField(max_length=255, blank=True)
    video_url = models.URLField(max_length=500)
    video_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}: {self.caption[:30]}"