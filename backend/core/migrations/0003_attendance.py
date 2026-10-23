import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('core', '0002_user_is_ephemeral')]
    operations = [migrations.CreateModel(
        name='Attendance',
        fields=[
            ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
            ('created_at', models.DateTimeField(auto_now_add=True)),
            ('event', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.event')),
            ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
        ],
        options={'constraints': [models.UniqueConstraint(fields=('user', 'event'), name='unique_attendance')]},
    )]
