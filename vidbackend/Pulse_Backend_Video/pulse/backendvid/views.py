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
import os
import json as pyjson

CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'config.json')
try:
    with open(CONFIG_PATH) as f:
        CONFIG = pyjson.load(f)
except Exception:
    CONFIG = {}


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
        if not video_id:
            return JsonResponse({'error': 'Missing video_id'}, status=400)
        from uuid import UUID
        from django.core.exceptions import ValidationError
        try:
            # Try UUID lookup first
            uuid_obj = UUID(video_id, version=4)
            video = VideoPost.objects.get(video_id=uuid_obj)
        except (ValueError, VideoPost.DoesNotExist, ValidationError):
            try:
                # Fallback to integer PK lookup
                video = VideoPost.objects.get(id=int(video_id))
            except (ValueError, VideoPost.DoesNotExist, ValidationError):
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

    if request.method == 'POST':
        # Allow unauthenticated test uploads only if config allows and test_upload=1
        is_test_upload = CONFIG.get('ALLOW_TEST_VIDEO_UPLOAD') and request.POST.get('test_upload') == '1'
        if is_test_upload:
            user = User.objects.first()  # Assign to first user or None
            if not user:
                # If no user exists, allow test upload with a dummy user
                class DummyUser:
                    username = 'testuser'
                    id = None
                user = DummyUser()
            caption = request.POST.get('caption', '')
            video_file = request.FILES.get('video')
            if not video_file:
                logging.warning("videopost TEST POST: No video file provided")
                return JsonResponse({'error': 'No video file provided'}, status=400)
            filename = default_storage.save(video_file.name, ContentFile(video_file.read()))
            video_url = default_storage.url(filename)
            if not video_url.startswith('/media/'):
                video_url = '/media/' + filename.lstrip('/')
            # Only create VideoPost if user is a real Django user
            if hasattr(user, 'id') and user.id is not None:
                VideoPost.objects.create(user=user, caption=caption, video_url=video_url)
            logging.warning(f"videopost TEST POST: Unauthenticated test upload by {user.username}: {filename}")
            return JsonResponse({'success': True, 'video_url': video_url, 'user': user.username, 'caption': caption, 'test_upload': True})
        # All other uploads require token authentication
        auth_header = request.headers.get('Authorization', '')
        logging.info("videopost POST: Authorization header=%s", auth_header)
        if not auth_header.startswith('Token '):
            logging.warning("videopost POST: Missing or invalid token header")
            return JsonResponse({'error': 'Missing or invalid token'}, status=401)
        token_key = auth_header.split(' ')[1]
        try:
            token = Token.objects.get(key=token_key)
            logging.info("videopost POST: Authenticated token for user=%s", token.user.username)
        except Token.DoesNotExist:
            logging.error("videopost POST: Invalid token %s", token_key)
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
        # Upload to IPFS
        from .ipfs_utils import upload_file_to_ipfs
        try:
            cid = upload_file_to_ipfs(video_file)
            video_url = f"ipfs://{cid}"
            logging.info(f"videopost POST: Uploaded to IPFS, CID={cid}")
        except Exception as e:
            logging.error(f"videopost POST: IPFS upload failed: {e}")
            return JsonResponse({'error': 'IPFS upload failed', 'detail': str(e)}, status=500)
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