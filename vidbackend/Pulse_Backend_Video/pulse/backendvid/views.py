from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.authtoken.models import Token
from django.views.decorators.http import require_POST, require_GET
from django.contrib.auth.models import User
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.shortcuts import render
import json
import logging


@csrf_exempt
@require_POST
def custom_token_auth(request):
    try:
        data = json.loads(request.body.decode())
        username = data.get('username')
        password = data.get('password')
        logging.info(f"custom_token_auth: Attempt login for username={username}")
        if username == 'sync' and password == 'supersync96':
            token, _ = Token.objects.get_or_create(user_id=1)  # user_id=1 is usually the first superuser
            logging.info(f"custom_token_auth: Success for username={username}")
            return JsonResponse({'token': token.key})
        else:
            logging.warning(f"custom_token_auth: Invalid credentials for username={username}")
            return JsonResponse({'error': 'Invalid credentials'}, status=401)
    except Exception as e:
        logging.error(f"Error in custom_token_auth: {e}", exc_info=True)
        return JsonResponse({'error': 'An internal error has occurred'}, status=400)


@csrf_exempt
def videopost(request):
    from .models import VideoPost
    logging.info(f"videopost: {request.method} {request.path} user={request.user if request.user.is_authenticated else 'anon'}")
    if request.method == 'GET':
        video_id = request.GET.get('video_id')
        logging.info(f"videopost GET: video_id={video_id}")
        if not video_id:
            logging.warning("videopost GET: Missing video_id")
            return JsonResponse({'error': 'Missing video_id'}, status=400)
        try:
            video = VideoPost.objects.get(id=video_id)
            logging.info(f"videopost GET: Found video {video_id}")
        except VideoPost.DoesNotExist:
            logging.warning(f"videopost GET: Video not found {video_id}")
            return JsonResponse({'error': 'Video not found'}, status=404)
        # Serve the video file directly if possible
        from django.conf import settings
        import os
        video_path = video.video_url
        if video_path.startswith('/media/'):
            video_path = video_path[len('/media/'):]
        abs_path = os.path.join(settings.MEDIA_ROOT, video_path)
        if os.path.exists(abs_path):
            from django.http import FileResponse
            logging.info(f"videopost GET: Serving file {abs_path}")
            return FileResponse(open(abs_path, 'rb'), content_type='video/mp4')
        logging.warning(f"videopost GET: File not found, returning URL {video.video_url}")
        return JsonResponse({'video_url': video.video_url, 'caption': video.caption, 'user': video.user.username})

    # Token authentication
    auth_header = request.headers.get('Authorization', '')
    logging.info(f"videopost POST: Authorization header={auth_header}")
    if not auth_header.startswith('Token '):
        logging.warning("videopost POST: Missing or invalid token header")
        return JsonResponse({'error': 'Missing or invalid token'}, status=401)
    token_key = auth_header.split(' ')[1]
    try:
        token = Token.objects.get(key=token_key)
        logging.info(f"videopost POST: Authenticated token for user={token.user.username}")
    except Token.DoesNotExist:
        logging.error(f"videopost POST: Invalid token {token_key}")
        return JsonResponse({'error': 'Invalid token'}, status=401)

    # Get user from param or token
    user_param = request.POST.get('user')
    if user_param:
        try:
            user = User.objects.get(username=user_param)
            logging.info(f"videopost POST: Using user_param {user_param}")
        except User.DoesNotExist:
            logging.error(f"videopost POST: User not found {user_param}")
            return JsonResponse({'error': 'User not found'}, status=400)
    else:
        user = token.user
        logging.info(f"videopost POST: Using token user {user.username}")

    # Handle file upload
    video_file = request.FILES.get('video')
    if not video_file:
        logging.warning("videopost POST: No video file provided")
        return JsonResponse({'error': 'No video file provided'}, status=400)
    filename = default_storage.save(video_file.name, ContentFile(video_file.read()))
    video_url = default_storage.url(filename)
    logging.info(f"videopost POST: Saved video file {filename} url={video_url}")

    # Save VideoPost
    caption = request.POST.get('caption', '')
    VideoPost.objects.create(user=user, caption=caption, video_url=video_url)
    logging.info(f"videopost POST: Created VideoPost for user={user.username} caption={caption}")
    return JsonResponse({'success': True, 'video_url': video_url, 'user': user.username, 'caption': caption})


@csrf_exempt
@require_POST
def create_post(request):
    # Token authentication
    auth_header = request.headers.get('Authorization', '')
    logging.info(f"create_post: Authorization header={auth_header}")
    if not auth_header.startswith('Token '):
        logging.warning("create_post: Missing or invalid token header")
        return JsonResponse({
            'error': 'Missing or invalid token',
            'detail': 'You must provide a valid API token in the Authorization header as: Token <your_token>. Example: Authorization: Token 123abc...'
        }, status=401)
    token_key = auth_header.split(' ')[1]
    try:
        token = Token.objects.get(key=token_key)
        logging.info(f"create_post: Authenticated token for user={token.user.username}")
    except Token.DoesNotExist:
        logging.error(f"create_post: Invalid token {token_key}")
        return JsonResponse({
            'error': 'Invalid token',
            'detail': 'The provided token does not exist or is not valid. Please log in or obtain a valid token.'
        }, status=401)

    # Get user from param or token
    user_param = request.POST.get('user')
    if user_param:
        try:
            user = User.objects.get(username=user_param)
            logging.info(f"create_post: Using user_param {user_param}")
        except User.DoesNotExist:
            logging.error(f"create_post: User not found {user_param}")
            return JsonResponse({'error': 'User not found'}, status=400)
    else:
        user = token.user
        logging.info(f"create_post: Using token user {user.username}")

    # Get content
    content = request.POST.get('content', '')
    if not content:
        logging.warning("create_post: No content provided")
        return JsonResponse({'error': 'No content provided'}, status=400)

    # Save Post
    from .models import Post
    post = Post.objects.create(user=user, content=content)
    logging.info(f"create_post: Created Post id={post.id} user={user.username}")
    return JsonResponse({'success': True, 'post_id': post.id, 'user': user.username, 'content': content})


@csrf_exempt
def track_video_watch(request):
    logging.info(f"track_video_watch: {request.method} {request.path}")
    return JsonResponse({'status': 'ok'})


@csrf_exempt
@require_GET
def video_feed_json(request):
    from .models import VideoPost
    logging.info("video_feed_json: Fetching all videos")
    videos = VideoPost.objects.all().order_by('-created_at')
    data = [
        {
            'id': v.id,
            'user': v.user.username,
            'caption': v.caption,
            'video_url': v.video_url,
            'created_at': v.created_at.isoformat(),
        }
        for v in videos
    ]
    logging.info(f"video_feed_json: Returned {len(data)} videos")
    return JsonResponse({'videos': data})


@csrf_exempt
def feed(request):
    logging.info(f"feed: {request.method} {request.path}")
    return render(request, 'index.html')