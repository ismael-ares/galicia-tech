from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('core', '0001_initial')]
    operations = [migrations.AddField(model_name='user', name='is_ephemeral',
                                     field=models.BooleanField(default=False, db_index=True))]
