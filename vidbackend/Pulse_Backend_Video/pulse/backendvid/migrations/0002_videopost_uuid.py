from django.db import migrations, models
import uuid

class Migration(migrations.Migration):
    dependencies = [
        ('backendvid', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='videopost',
            name='video_id',
            field=models.UUIDField(default=uuid.uuid4, unique=True, editable=False),
        ),
    ]
